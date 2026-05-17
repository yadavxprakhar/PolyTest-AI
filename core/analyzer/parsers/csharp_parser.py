import re
from typing import List, Dict, Any, Optional
from core.analyzer.base_parser import BaseParser, ParserResult, ClassInfo, MethodInfo, FunctionInfo, MethodParameter

class CSharpParser(BaseParser):
    """Parses C# source files to extract namespaces, imports, classes, and method signatures."""

    def parse(self, file_content: str, file_path: str) -> ParserResult:
        clean_code = self._remove_comments(file_content)

        # 1. Namespaces and Usings
        namespace = self._extract_namespace(clean_code)
        usings = self._extract_usings(clean_code)
        if namespace:
            usings.insert(0, f"namespace {namespace}")

        # 2. Classes and Methods
        classes = self._extract_classes(clean_code)

        # LOC
        lines = file_content.splitlines()
        loc = len([l for l in lines if l.strip() and not l.strip().startswith(('//', '/*', '*'))])

        return ParserResult(
            language="C#",
            classes=classes,
            functions=[],  # C# doesn't have top-level global functions
            imports=usings,
            exports=[c.name for c in classes],
            estimated_complexity=self.estimate_complexity(file_content),
            lines_of_code=loc
        )

    def _remove_comments(self, code: str) -> str:
        code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
        code = re.sub(r'//.*?\n', '\n', code)
        return code

    def _extract_namespace(self, code: str) -> Optional[str]:
        # namespace MyProject.Services; or namespace MyProject.Services {
        match = re.search(r'namespace\s+([A-Za-z0-9._$]+)\s*[;{]', code)
        return match.group(1) if match else None

    def _extract_usings(self, code: str) -> List[str]:
        usings = []
        pattern = re.compile(r'using\s+([A-Za-z0-9._$]+)\s*;', re.MULTILINE)
        for match in pattern.finditer(code):
            usings.append(match.group(1))
        return usings

    def _extract_classes(self, code: str) -> List[ClassInfo]:
        classes = []
        # Match class ClassName [: ParentClass, IInterface] {
        pattern = re.compile(
            r'(?:public|private|protected|internal)?\s*(?:static|partial|sealed|abstract)?\s*class\s+([A-Za-z0-9_$]+)(?:\s*:\s*([A-Za-z0-9_$,\s<>]+))?\s*\{',
            re.MULTILINE
        )

        for match in pattern.finditer(code):
            class_name = match.group(1)
            bases_str = match.group(2)
            
            base_classes = []
            if bases_str:
                base_classes = [b.strip() for b in bases_str.split(',')]

            # Extract class body
            start_idx = match.end() - 1
            class_body = self._extract_matching_block(code, start_idx)

            methods = self._extract_methods(class_body)

            classes.append(ClassInfo(
                name=class_name,
                base_classes=base_classes,
                methods=methods,
                properties=[],
                docstring=None
            ))

        return classes

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

    def _extract_methods(self, class_body: str) -> List[MethodInfo]:
        methods = []
        
        # Match methods: public async Task<User> GetUserAsync(int id) {
        # Regex captures: modifiers, return type, name, params
        pattern = re.compile(
            r'(?:public|private|protected|internal)?\s*(?:static|async|override|virtual|abstract)?\s*([A-Za-z0-9_$.<>\[\]]+)\s+([A-Za-z0-9_$]+)\s*\(([^)]*)\)\s*(?:\{|=>)',
            re.MULTILINE
        )

        for match in pattern.finditer(class_body):
            return_type, name, params_str = match.groups()
            
            if name in ('if', 'for', 'while', 'switch', 'catch', 'using', 'get', 'set'):
                continue
                
            parameters = self._parse_parameters(params_str)
            
            # Check if static or async in modifiers
            method_decl = match.group(0)
            is_async = 'async' in method_decl
            is_static = 'static' in method_decl

            methods.append(MethodInfo(
                name=name,
                parameters=parameters,
                return_type=return_type,
                is_async=is_async,
                is_static=is_static,
                docstring=None
            ))

        return methods

    def _parse_parameters(self, params_str: str) -> List[MethodParameter]:
        parameters = []
        if not params_str or not params_str.strip():
            return parameters

        raw_params = params_str.split(',')
        for rp in raw_params:
            rp = rp.strip()
            if not rp:
                continue

            # Standard parameter: string name = "val"
            # Separate default value
            default_value = None
            if '=' in rp:
                rp, default = rp.split('=', 1)
                default_value = default.strip()

            parts = rp.split()
            # Remove annotations/modifiers like [FromBody] or out/ref/this
            cleaned_parts = [p for p in parts if not p.startswith('[') and p not in ('out', 'ref', 'this', 'params')]
            
            if len(cleaned_parts) >= 2:
                name = cleaned_parts[-1]
                type_annotation = " ".join(cleaned_parts[:-1])
            else:
                name = cleaned_parts[0] if cleaned_parts else "arg"
                type_annotation = "Any"

            parameters.append(MethodParameter(
                name=name,
                type_annotation=type_annotation,
                default_value=default_value
            ))

        return parameters
