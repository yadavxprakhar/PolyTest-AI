import re
from typing import List, Dict, Any, Optional
from core.analyzer.base_parser import BaseParser, ParserResult, ClassInfo, MethodInfo, FunctionInfo, MethodParameter

class CppParser(BaseParser):
    """Parses C++ header and source files to extract structural and semantic metadata."""

    def parse(self, file_content: str, file_path: str) -> ParserResult:
        # Remove single and multi-line comments
        clean_code = self._remove_comments(file_content)

        # 1. Extract Includes
        includes = self._extract_includes(clean_code)

        # 2. Extract Classes
        classes = self._extract_classes(clean_code)

        # 3. Extract Global Functions
        class_bodies_combined = "".join(self._extract_class_bodies(clean_code))
        functions = self._extract_global_functions(clean_code, class_bodies_combined)

        # LOC calculation
        lines = file_content.splitlines()
        loc = len([l for l in lines if l.strip() and not l.strip().startswith(('//', '/*', '*'))])

        return ParserResult(
            language="C++",
            classes=classes,
            functions=functions,
            imports=includes,
            exports=[c.name for c in classes] + [f.name for f in functions],
            estimated_complexity=self.estimate_complexity(file_content),
            lines_of_code=loc
        )

    def _remove_comments(self, code: str) -> str:
        # Multi-line
        code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
        # Single-line
        code = re.sub(r'//.*?\n', '\n', code)
        return code

    def _extract_includes(self, code: str) -> List[str]:
        includes = []
        # Match #include <header> or #include "header"
        pattern = re.compile(r'#include\s*[<"]([^>"]+)[>"]', re.MULTILINE)
        for match in pattern.finditer(code):
            includes.append(match.group(1))
        return includes

    def _extract_classes(self, code: str) -> List[ClassInfo]:
        classes = []
        # Match class ClassName or struct ClassName
        # E.g. class ClassName : public BaseClass {
        pattern = re.compile(
            r'(?:class|struct)\s+([A-Za-z0-9_$]+)(?:\s*:\s*(?:public|protected|private)?\s*([A-Za-z0-9_$]+))?\s*\{', 
            re.MULTILINE
        )

        for match in pattern.finditer(code):
            class_name = match.group(1)
            base_class = match.group(2)
            base_classes = [base_class] if base_class else []

            # Find matching braces
            start_idx = match.end() - 1
            class_body = self._extract_matching_block(code, start_idx)

            methods = self._extract_methods(class_body, class_name)

            classes.append(ClassInfo(
                name=class_name,
                base_classes=base_classes,
                methods=methods,
                properties=[],
                docstring=None
            ))

        return classes

    def _extract_class_bodies(self, code: str) -> List[str]:
        bodies = []
        pattern = re.compile(r'(?:class|struct)\s+[A-Za-z0-9_$]+(?:\s*:\s*(?:public|protected|private)?\s*[A-Za-z0-9_$]+)?\s*\{', re.MULTILINE)
        for match in pattern.finditer(code):
            start_idx = match.end() - 1
            bodies.append(self._extract_matching_block(code, start_idx))
        return bodies

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

    def _extract_methods(self, class_body: str, class_name: str) -> List[MethodInfo]:
        methods = []
        
        # Match standard methods: returnType methodName(params) const override;
        # And constructors/destructors: ClassName(...) or ~ClassName(...)
        # Regex captures: virtual, static, return type, name, params
        pattern = re.compile(
            r'(?:(virtual|static)\s+)?(?:([A-Za-z0-9_$<>&*:]+)\s+)?([A-Za-z0-9_$~]+)\s*\(([^)]*)\)(?:\s*const)?(?:\s*override)?(?:\s*=\s*(?:0|default|delete))?\s*;',
            re.MULTILINE
        )

        for match in pattern.finditer(class_body):
            modifiers, return_type, name, params_str = match.groups()
            
            # Skip control keywords if mistakenly matched
            if name in ('if', 'for', 'while', 'switch', 'return'):
                continue
                
            is_static = modifiers == 'static'
            is_virtual = modifiers == 'virtual'
            
            # If no return type is matched and name matches constructor or destructor
            if not return_type:
                if name == class_name or name == f"~{class_name}":
                    return_type = "void" if name.startswith('~') else class_name

            if not return_type:
                return_type = "void"  # default fallback

            parameters = self._parse_parameters(params_str)
            methods.append(MethodInfo(
                name=name,
                parameters=parameters,
                return_type=return_type,
                is_async=False,
                is_static=is_static,
                docstring=f"Virtual: {is_virtual}" if is_virtual else None
            ))

        return methods

    def _extract_global_functions(self, code: str, class_bodies: str) -> List[FunctionInfo]:
        functions = []
        
        # Match functions outside of classes (global functions)
        # E.g. int calculate(int x, double y) {
        pattern = re.compile(
            r'(?:(static)\s+)?([A-Za-z0-9_$<>&*:]+)\s+([A-Za-z0-9_$]+)\s*\(([^)]*)\)\s*\{',
            re.MULTILINE
        )

        for match in pattern.finditer(code):
            static_mod, return_type, name, params_str = match.groups()
            
            if name in ('if', 'for', 'while', 'switch', 'catch', 'main'):
                continue
                
            # Ensure function isn't inside class bodies
            if name and name not in class_bodies:
                parameters = self._parse_parameters(params_str)
                functions.append(FunctionInfo(
                    name=name,
                    parameters=parameters,
                    return_type=return_type,
                    is_async=False,
                    docstring=None
                ))

        return functions

    def _parse_parameters(self, params_str: str) -> List[MethodParameter]:
        parameters = []
        if not params_str or not params_str.strip() or params_str.strip() == "void":
            return parameters

        raw_params = params_str.split(',')
        for rp in raw_params:
            rp = rp.strip()
            if not rp:
                continue

            # Parse parameter declaration like: const std::string& name = ""
            # Find default values
            default_value = None
            if '=' in rp:
                rp, default = rp.split('=', 1)
                default_value = default.strip()

            # Separate type and variable name (typically the last word is the name)
            parts = rp.split()
            if len(parts) >= 2:
                name = parts[-1].replace('&', '').replace('*', '').strip()
                # If parameter name starts with const, it's just a type without parameter name (e.g. func(const int))
                if name == "const":
                    name = "arg"
                    type_annotation = rp
                else:
                    type_annotation = " ".join(parts[:-1]).strip()
            else:
                name = parts[0] if parts else "arg"
                type_annotation = "Any"

            # Clean name from references/pointers in C++
            name = name.lstrip('*&')
            if name:
                parameters.append(MethodParameter(
                    name=name,
                    type_annotation=type_annotation,
                    default_value=default_value
                ))

        return parameters
