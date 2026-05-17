import re
from typing import List, Dict, Any, Optional
from core.analyzer.base_parser import BaseParser, ParserResult, ClassInfo, MethodInfo, FunctionInfo, MethodParameter

class GoParser(BaseParser):
    """Parses Go source files to extract package name, imports, structs, methods, and functions."""

    def parse(self, file_content: str, file_path: str) -> ParserResult:
        clean_code = self._remove_comments(file_content)

        # 1. Extract Package and Imports
        package = self._extract_package(clean_code)
        imports = self._extract_imports(clean_code)
        if package:
            imports.insert(0, f"package {package}")

        # 2. Extract Structs (classes) and Methods
        structs = self._extract_structs(clean_code)
        
        # We need to bind methods to the correct structs
        struct_map = {s.name: s for s in structs}
        
        # Extract receiver methods, e.g. func (u *User) GetEmail() string
        methods = self._extract_receiver_methods(clean_code)
        for struct_name, method_info in methods:
            if struct_name in struct_map:
                struct_map[struct_name].methods.append(method_info)
            else:
                # If struct isn't explicitly defined in this file, we can auto-create a mock class info
                new_struct = ClassInfo(
                    name=struct_name,
                    base_classes=[],
                    methods=[method_info],
                    properties=[]
                )
                structs.append(new_struct)
                struct_map[struct_name] = new_struct

        # 3. Extract General Functions
        functions = self._extract_functions(clean_code)

        # LOC
        lines = file_content.splitlines()
        loc = len([l for l in lines if l.strip() and not l.strip().startswith(('//', '/*', '*'))])

        return ParserResult(
            language="Go",
            classes=structs,
            functions=functions,
            imports=imports,
            exports=self._extract_exports(structs, functions),
            estimated_complexity=self.estimate_complexity(file_content),
            lines_of_code=loc
        )

    def _remove_comments(self, code: str) -> str:
        # Multi-line
        code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
        # Single-line
        code = re.sub(r'//.*?\n', '\n', code)
        return code

    def _extract_package(self, code: str) -> Optional[str]:
        match = re.search(r'package\s+([A-Za-z0-9_$]+)', code)
        return match.group(1) if match else None

    def _extract_imports(self, code: str) -> List[str]:
        imports = []
        
        # 1. Single line imports: import "fmt"
        single_pattern = re.compile(r'import\s+["\']([^"\']+)["\']', re.MULTILINE)
        for match in single_pattern.finditer(code):
            imports.append(match.group(1))

        # 2. Block imports: import ( ... )
        block_pattern = re.compile(r'import\s*\(\s*([^)]+)\)', re.MULTILINE)
        for match in block_pattern.finditer(code):
            block_content = match.group(1)
            # Find all double quoted strings in block
            quoted_pattern = re.compile(r'["\']([^"\']+)["\']')
            for quote_match in quoted_pattern.finditer(block_content):
                imports.append(quote_match.group(1))

        return list(set(imports))

    def _extract_structs(self, code: str) -> List[ClassInfo]:
        structs = []
        # Match type StructName struct {
        pattern = re.compile(r'type\s+([A-Za-z0-9_$]+)\s+struct\s*\{', re.MULTILINE)
        
        for match in pattern.finditer(code):
            struct_name = match.group(1)
            
            # Extract fields/properties inside struct
            start_idx = match.end() - 1
            struct_body = self._extract_matching_block(code, start_idx)
            
            properties = []
            for line in struct_body.splitlines():
                line = line.strip()
                if not line:
                    continue
                parts = line.split()
                if len(parts) >= 2:
                    field_name = parts[0]
                    field_type = parts[1]
                    properties.append({"name": field_name, "type": field_type})

            structs.append(ClassInfo(
                name=struct_name,
                base_classes=[],
                methods=[],
                properties=properties,
                docstring=None
            ))
            
        return structs

    def _extract_matching_block(self, code: str, start_index: int) -> str:
        brace_count = 0
        end_index = start_index
        for i in range(start_index, len(code)):
            char = code[i]
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_index = i
                    break
        return code[start_index+1:end_index]

    def _extract_receiver_methods(self, code: str) -> List[tuple[str, MethodInfo]]:
        methods = []
        # Match func (r Receiver) MethodName(params) (returns) {
        # Handles pointers and value receivers, e.g. func (u *User) GetEmail() string {
        pattern = re.compile(
            r'func\s*\(\s*(?:[A-Za-z0-9_$]+\s+)?\*?([A-Za-z0-9_$]+)\s*\)\s*([A-Za-z0-9_$]+)\s*\(([^)]*)\)(?:\s*([^{]+))?\s*\{',
            re.MULTILINE
        )

        for match in pattern.finditer(code):
            struct_name, method_name, params_str, return_str = match.groups()
            
            parameters = self._parse_parameters(params_str)
            return_type = return_str.strip() if return_str else "void"
            
            method_info = MethodInfo(
                name=method_name,
                parameters=parameters,
                return_type=return_type,
                is_async=False,
                is_static=False,
                docstring=None
            )
            methods.append((struct_name, method_info))

        return methods

    def _extract_functions(self, code: str) -> List[FunctionInfo]:
        functions = []
        # Match standard functions: func FunctionName(params) (returns) {
        # Make sure not to match receiver methods
        pattern = re.compile(
            r'^func\s+([A-Za-z0-9_$]+)\s*\(([^)]*)\)(?:\s*([^{]+))?\s*\{',
            re.MULTILINE
        )

        for match in pattern.finditer(code):
            func_name, params_str, return_str = match.groups()
            
            if func_name == "main":
                continue  # skip main function as test target
                
            parameters = self._parse_parameters(params_str)
            return_type = return_str.strip() if return_str else "void"

            functions.append(FunctionInfo(
                name=func_name,
                parameters=parameters,
                return_type=return_type,
                is_async=False,
                docstring=None
            ))

        return functions

    def _parse_parameters(self, params_str: str) -> List[MethodParameter]:
        parameters = []
        if not params_str or not params_str.strip():
            return parameters

        # In Go, parameters can be: x int, y string or x, y int
        # Split by comma
        raw_params = params_str.split(',')
        
        # We need to resolve type assignment. Go allows grouping: a, b int
        pending_names = []
        for rp in raw_params:
            rp = rp.strip()
            if not rp:
                continue
            
            parts = rp.split()
            if len(parts) == 1:
                # This could be part of a grouped parameter, e.g. "a" in "a, b int"
                pending_names.append(parts[0])
            elif len(parts) >= 2:
                # E.g. "b int"
                param_type = parts[-1]
                param_names = parts[:-1]
                
                # If we had pending names, they all share this parameter type
                for name in pending_names:
                    parameters.append(MethodParameter(name=name, type_annotation=param_type))
                pending_names = []

                for name in param_names:
                    # Remove pointers & references
                    name = name.replace('*', '').replace('&', '')
                    parameters.append(MethodParameter(name=name, type_annotation=param_type))
            
        # Fallback if any lingering pending names (usually means the last element was just a type)
        for name in pending_names:
            parameters.append(MethodParameter(name=name, type_annotation="Any"))

        return parameters

    def _extract_exports(self, structs: List[ClassInfo], functions: List[FunctionInfo]) -> List[str]:
        # In Go, capital letters denote exports
        exports = []
        for s in structs:
            if s.name and s.name[0].isupper():
                exports.append(s.name)
        for f in functions:
            if f.name and f.name[0].isupper():
                exports.append(f.name)
        return exports
