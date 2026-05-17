import re
import os
from typing import List, Dict, Any, Optional
from core.analyzer.base_parser import BaseParser, ParserResult, ClassInfo, MethodInfo, FunctionInfo, MethodParameter

class JavascriptParser(BaseParser):
    """Parses JavaScript and TypeScript source files using robust regex heuristics."""

    def parse(self, file_content: str, file_path: str) -> ParserResult:
        # Remove comments to avoid false matches
        clean_code = self._remove_comments(file_content)
        
        # 1. Parse Imports
        imports = self._extract_imports(clean_code)
        
        # 2. Parse Classes
        classes = self._extract_classes(clean_code)
        
        # 3. Parse Top-level Functions (that are not inside class definitions)
        # We can find all functions and filter out those that belong to classes
        class_bodies_combined = "".join(self._extract_class_bodies(clean_code))
        top_level_functions = self._extract_functions(clean_code, class_bodies_combined)
        
        # 4. Parse Exports
        exports = self._extract_exports(clean_code)
        
        # LOC
        lines = file_content.splitlines()
        loc = len([l for l in lines if l.strip() and not l.strip().startswith(('//', '/*', '*'))])

        return ParserResult(
            language="TypeScript" if file_path.endswith(('.ts', '.tsx')) else "JavaScript",
            classes=classes,
            functions=top_level_functions,
            imports=list(set(imports)),
            exports=list(set(exports)),
            estimated_complexity=self.estimate_complexity(file_content),
            lines_of_code=loc
        )

    def _remove_comments(self, code: str) -> str:
        # Multi-line comments
        code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
        # Single-line comments
        code = re.sub(r'//.*?\n', '\n', code)
        return code

    def _extract_imports(self, code: str) -> List[str]:
        imports = []
        # ES6 Imports: import { x } from 'y' or import y from 'y'
        es6_pattern = re.compile(r'import\s+.*?\s+from\s+[\'"]([^\'"]+)[\'"]', re.MULTILINE)
        for match in es6_pattern.finditer(code):
            imports.append(match.group(1))
            
        # CommonJS: const x = require('y')
        cjs_pattern = re.compile(r'require\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)', re.MULTILINE)
        for match in cjs_pattern.finditer(code):
            imports.append(match.group(1))
            
        # Dynamic import('y')
        dynamic_pattern = re.compile(r'import\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)', re.MULTILINE)
        for match in dynamic_pattern.finditer(code):
            imports.append(match.group(1))
            
        return imports

    def _extract_classes(self, code: str) -> List[ClassInfo]:
        classes = []
        # Match: class ClassName [extends ParentClass] {
        class_pattern = re.compile(r'class\s+([A-Za-z0-9_$]+)(?:\s+extends\s+([A-Za-z0-9_$.<>]+))?\s*\{', re.MULTILINE)
        
        for match in class_pattern.finditer(code):
            class_name = match.group(1)
            extends_class = match.group(2)
            base_classes = [extends_class] if extends_class else []
            
            # Find class block (matching opening/closing brackets)
            class_start = match.end() - 1
            class_body = self._extract_matching_block(code, class_start)
            
            methods = self._extract_methods(class_body)
            
            classes.append(ClassInfo(
                name=class_name,
                base_classes=base_classes,
                methods=methods,
                properties=[],
                docstring=None  # Can be expanded to capture jsdoc above class
            ))
            
        return classes

    def _extract_class_bodies(self, code: str) -> List[str]:
        bodies = []
        class_pattern = re.compile(r'class\s+[A-Za-z0-9_$]+(?:\s+extends\s+[A-Za-z0-9_$.<>]+)?\s*\{', re.MULTILINE)
        for match in class_pattern.finditer(code):
            class_start = match.end() - 1
            bodies.append(self._extract_matching_block(code, class_start))
        return bodies

    def _extract_matching_block(self, code: str, start_index: int) -> str:
        """Extract code block matching the braces starting at start_index."""
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
        
        # 1. Standard methods: [async] [static] methodName(params) {
        # Avoid matching keywords like 'if', 'for', 'while', 'switch'
        method_pattern = re.compile(
            r'(?:(static)\s+)?(?:(async)\s+)?([A-Za-z0-9_$]+)\s*\(([^)]*)\)\s*\{', 
            re.MULTILINE
        )
        
        for match in method_pattern.finditer(class_body):
            is_static_str, is_async_str, name, params_str = match.groups()
            
            if name in ('if', 'for', 'while', 'switch', 'catch', 'constructor'):
                continue  # skip control flow
                
            parameters = self._parse_parameters(params_str)
            methods.append(MethodInfo(
                name=name,
                parameters=parameters,
                return_type=None,
                is_async=bool(is_async_str),
                is_static=bool(is_static_str),
                docstring=None
            ))
            
        # 2. Constructor
        constructor_pattern = re.compile(r'constructor\s*\(([^)]*)\)', re.MULTILINE)
        constructor_match = constructor_pattern.search(class_body)
        if constructor_match:
            methods.append(MethodInfo(
                name="constructor",
                parameters=self._parse_parameters(constructor_match.group(1)),
                return_type="this",
                is_async=False,
                is_static=False,
                docstring="Constructor function"
            ))

        return methods

    def _extract_functions(self, code: str, class_bodies: str) -> List[FunctionInfo]:
        functions = []
        
        # 1. Standard function: function fnName(params)
        fn_pattern = re.compile(
            r'(?:export\s+)?(?:default\s+)?(?:(async)\s+)?function\s+([A-Za-z0-9_$]+)\s*\(([^)]*)\)', 
            re.MULTILINE
        )
        for match in fn_pattern.finditer(code):
            is_async_str, name, params_str = match.groups()
            # Verify this function isn't inside any class body to keep it top-level
            if name and name not in class_bodies:
                functions.append(FunctionInfo(
                    name=name,
                    parameters=self._parse_parameters(params_str),
                    return_type=None,
                    is_async=bool(is_async_str),
                    docstring=None
                ))

        # 2. Arrow function variables: const fnName = (params) => {
        arrow_pattern = re.compile(
            r'(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:(async)\s*)?\(([^)]*)\)\s*=>', 
            re.MULTILINE
        )
        for match in arrow_pattern.finditer(code):
            name, is_async_str, params_str = match.groups()
            if name and name not in class_bodies:
                functions.append(FunctionInfo(
                    name=name,
                    parameters=self._parse_parameters(params_str),
                    return_type=None,
                    is_async=bool(is_async_str),
                    docstring=None
                ))

        return functions

    def _parse_parameters(self, params_str: str) -> List[MethodParameter]:
        parameters = []
        if not params_str or not params_str.strip():
            return parameters
            
        # Split params while respecting nested TS brackets/objects
        # Simple splitting by comma first, but cleaning TS type suffixes
        raw_params = params_str.split(',')
        for rp in raw_params:
            rp = rp.strip()
            if not rp:
                continue
            
            # Separate by TS colon if exists: name: type
            if ':' in rp:
                name_part, type_part = rp.split(':', 1)
                name = name_part.strip().replace('?', '')  # remove optional marker
                type_annotation = type_part.strip()
            else:
                name = rp
                type_annotation = None
                
            # Strip default values like name = 'value'
            if '=' in name:
                name, default = name.split('=', 1)
                name = name.strip()
                default_value = default.strip()
            else:
                default_value = None

            # Filter out destructured objects like { name, age }
            name = re.sub(r'[\{\}\[\]]', '', name).strip()
            if name:
                parameters.append(MethodParameter(
                    name=name,
                    type_annotation=type_annotation,
                    default_value=default_value
                ))
        return parameters

    def _extract_exports(self, code: str) -> List[str]:
        exports = []
        
        # 1. Inline exports: export class X, export const X, export function X
        inline_export_pattern = re.compile(
            r'export\s+(?:default\s+)?(?:class|const|let|var|function|async\s+function)\s+([A-Za-z0-9_$]+)', 
            re.MULTILINE
        )
        for match in inline_export_pattern.finditer(code):
            exports.append(match.group(1))

        # 2. Block exports: export { a, b, c }
        block_export_pattern = re.compile(r'export\s*\{([^}]+)\}', re.MULTILINE)
        for match in block_export_pattern.finditer(code):
            block_content = match.group(1)
            for item in block_content.split(','):
                item = item.strip()
                # Handle renaming like: a as b
                if ' as ' in item:
                    item = item.split(' as ')[1].strip()
                if item:
                    exports.append(item)

        # 3. CommonJS module.exports = X or module.exports = { a, b }
        cjs_pattern = re.compile(r'module\.exports\s*=\s*(?:\{([^}]+)\}|([A-Za-z0-9_$]+))', re.MULTILINE)
        for match in cjs_pattern.finditer(code):
            block, single = match.groups()
            if single:
                exports.append(single)
            elif block:
                for item in block.split(','):
                    item = item.strip().split(':')[0].strip()  # handle key: val
                    if item:
                        exports.append(item)

        return exports
