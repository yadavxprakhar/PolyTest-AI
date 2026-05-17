import re
from typing import List, Dict, Any, Optional
from core.analyzer.base_parser import BaseParser, ParserResult, ClassInfo, MethodInfo, FunctionInfo, MethodParameter

class JavaParser(BaseParser):
    """Parses Java files to extract class definitions, methods, and annotation structures."""

    def parse(self, file_content: str, file_path: str) -> ParserResult:
        clean_code = self._remove_comments(file_content)

        # 1. Package name & Imports
        package = self._extract_package(clean_code)
        imports = self._extract_imports(clean_code)
        if package:
            imports.insert(0, f"package {package}")

        # 2. Classes
        classes = self._extract_classes(clean_code)

        # LOC
        lines = file_content.splitlines()
        loc = len([l for l in lines if l.strip() and not l.strip().startswith(('//', '/*', '*'))])

        return ParserResult(
            language="Java",
            classes=classes,
            functions=[],  # Java doesn't have top-level functions (always inside classes/interfaces)
            imports=imports,
            exports=[c.name for c in classes],
            estimated_complexity=self.estimate_complexity(file_content),
            lines_of_code=loc
        )

    def _remove_comments(self, code: str) -> str:
        code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
        code = re.sub(r'//.*?\n', '\n', code)
        return code

    def _extract_package(self, code: str) -> Optional[str]:
        match = re.search(r'package\s+([A-Za-z0-9._$]+)\s*;', code)
        return match.group(1) if match else None

    def _extract_imports(self, code: str) -> List[str]:
        imports = []
        pattern = re.compile(r'import\s+([A-Za-z0-9._$*]+)\s*;', re.MULTILINE)
        for match in pattern.finditer(code):
            imports.append(match.group(1))
        return imports

    def _extract_classes(self, code: str) -> List[ClassInfo]:
        classes = []
        # Match public/private/protected final class/interface ClassName [extends Parent] [implements I1, I2] {
        pattern = re.compile(
            r'(?:public|protected|private)?\s*(?:static\s+)?(?:final\s+)?(?:class|interface|enum)\s+([A-Za-z0-9_$]+)(?:\s+extends\s+([A-Za-z0-9_$.<>]+))?(?:\s+implements\s+([A-Za-z0-9_$,.<>\s]+))?\s*\{',
            re.MULTILINE
        )

        for match in pattern.finditer(code):
            class_name = match.group(1)
            extends_class = match.group(2)
            implements_interfaces = match.group(3)
            
            base_classes = []
            if extends_class:
                base_classes.append(extends_class)
            if implements_interfaces:
                base_classes.extend([i.strip() for i in implements_interfaces.split(',')])

            # Extract class body matching brackets
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
        
        # Match methods: public static void myMethod(int x, String y) throws Exception {
        # Check annotations as well (e.g. @Override, @Test)
        # Regex captures: optional modifiers, return type, name, params
        pattern = re.compile(
            r'(?:@([A-Za-z0-9_$]+)(?:\([^)]*\))?\s+)*(?:public|protected|private)?\s*(?:static\s+)?(?:final\s+)?(?:synchronized\s+)?(?:<[A-Z\s,]+>\s+)?([A-Za-z0-9_$.<>\[\]]+)\s+([A-Za-z0-9_$]+)\s*\(([^)]*)\)(?:\s*throws\s+[A-Za-z0-9_$,\s]+)?\s*\{',
            re.MULTILINE
        )

        for match in pattern.finditer(class_body):
            # Parse annotations if matched
            # re.findall above could capture annotations. For simplicity, let's parse basic components
            # Group index mapping: annotation is in the regex but we can focus on:
            # return type, name, params
            # Wait, let's adjust regex or group index. Since annotations are inside a non-capturing or repeating group,
            # let's extract them cleanly.
            
            # A simpler method matching regex that is extremely reliable:
            # Let's search for standard methods
            pass

        # Let's write a robust regex specifically for Java methods:
        method_regex = re.compile(
            r'(?:public|protected|private)?\s*(?:static\s+)?(?:final\s+)?(?:synchronized\s+)?(?:<[A-Za-z0-9_,\s<>]+>\s+)?([A-Za-z0-9_$.<>\[\]]+)\s+([A-Za-z0-9_$]+)\s*\(([^)]*)\)(?:\s*throws\s+[A-Za-z0-9_$,\s]+)?\s*\{',
            re.MULTILINE
        )

        for match in method_regex.finditer(class_body):
            return_type, name, params_str = match.groups()
            
            if name in ('if', 'for', 'while', 'switch', 'catch', 'synchronized', 'new'):
                continue
                
            parameters = self._parse_parameters(params_str)
            
            methods.append(MethodInfo(
                name=name,
                parameters=parameters,
                return_type=return_type,
                is_async=False,
                is_static='static' in match.group(0),
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

            # Standard parameter: final String name
            # Split by space
            parts = rp.split()
            # Remove modifiers like final or annotations like @Nullable
            cleaned_parts = [p for p in parts if not p.startswith('@') and p != 'final']
            
            if len(cleaned_parts) >= 2:
                name = cleaned_parts[-1]
                type_annotation = " ".join(cleaned_parts[:-1])
            else:
                name = cleaned_parts[0] if cleaned_parts else "arg"
                type_annotation = "Any"

            parameters.append(MethodParameter(
                name=name,
                type_annotation=type_annotation,
                default_value=None
            ))

        return parameters
