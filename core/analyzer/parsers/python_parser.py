import ast
import os
from typing import List, Dict, Any, Optional
from core.analyzer.base_parser import BaseParser, ParserResult, ClassInfo, MethodInfo, FunctionInfo, MethodParameter

class ASTVisitor(ast.NodeVisitor):
    def __init__(self):
        self.classes = []
        self.functions = []
        self.imports = []
        self.current_class = None

    def visit_Import(self, node):
        for alias in node.names:
            self.imports.append(alias.name)
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        module = node.module or ""
        for alias in node.names:
            self.imports.append(f"{module}.{alias.name}" if module else alias.name)
        self.generic_visit(node)

    def visit_ClassDef(self, node):
        prev_class = self.current_class
        base_classes = []
        for base in node.bases:
            if isinstance(base, ast.Name):
                base_classes.append(base.id)
            elif isinstance(base, ast.Attribute):
                base_classes.append(self._get_attribute_name(base))
        
        class_info = ClassInfo(
            name=node.name,
            base_classes=base_classes,
            methods=[],
            properties=[],
            docstring=ast.get_docstring(node)
        )
        self.current_class = class_info
        self.classes.append(class_info)
        
        self.generic_visit(node)
        self.current_class = prev_class

    def visit_FunctionDef(self, node):
        self._handle_function(node, is_async=False)

    def visit_AsyncFunctionDef(self, node):
        self._handle_function(node, is_async=True)

    def _handle_function(self, node, is_async: bool):
        parameters = []
        # Parse arguments
        for arg in node.args.args:
            type_annotation = None
            if arg.annotation:
                type_annotation = self._get_annotation_string(arg.annotation)
            
            parameters.append(MethodParameter(
                name=arg.arg,
                type_annotation=type_annotation
            ))
            
        return_type = None
        if node.returns:
            return_type = self._get_annotation_string(node.returns)

        # Check for decorators like @staticmethod or @classmethod
        is_static = False
        if hasattr(node, 'decorator_list'):
            for decorator in node.decorator_list:
                if isinstance(decorator, ast.Name) and decorator.id in ('staticmethod', 'classmethod'):
                    is_static = True

        docstring = ast.get_docstring(node)

        if self.current_class:
            method_info = MethodInfo(
                name=node.name,
                parameters=parameters,
                return_type=return_type,
                is_async=is_async,
                is_static=is_static,
                docstring=docstring
            )
            self.current_class.methods.append(method_info)
        else:
            func_info = FunctionInfo(
                name=node.name,
                parameters=parameters,
                return_type=return_type,
                is_async=is_async,
                docstring=docstring
            )
            self.functions.append(func_info)

    def _get_attribute_name(self, node: ast.Attribute) -> str:
        parts = []
        curr = node
        while isinstance(curr, ast.Attribute):
            parts.append(curr.attr)
            curr = curr.value
        if isinstance(curr, ast.Name):
            parts.append(curr.id)
        return ".".join(reversed(parts))

    def _get_annotation_string(self, node) -> str:
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Constant):
            return str(node.value)
        elif isinstance(node, ast.Attribute):
            return self._get_attribute_name(node)
        elif isinstance(node, ast.Subscript):
            value = self._get_annotation_string(node.value)
            slice_str = self._get_annotation_string(node.slice)
            return f"{value}[{slice_str}]"
        elif isinstance(node, ast.Tuple):
            return f"Tuple[{', '.join(self._get_annotation_string(elt) for elt in node.elts)}]"
        elif isinstance(node, ast.List):
            return f"List[{', '.join(self._get_annotation_string(elt) for elt in node.elts)}]"
        elif isinstance(node, ast.BinOp) and isinstance(node.op, ast.BitOr):
            return f"{self._get_annotation_string(node.left)} | {self._get_annotation_string(node.right)}"
        return "Any"

class PythonParser(BaseParser):
    """Accurately parses Python files using standard library `ast` module."""

    def parse(self, file_content: str, file_path: str) -> ParserResult:
        try:
            tree = ast.parse(file_content, filename=file_path)
            visitor = ASTVisitor()
            visitor.visit(tree)
            
            # Count lines of code
            lines = file_content.splitlines()
            loc = len([l for l in lines if l.strip() and not l.strip().startswith('#')])
            
            # Determine exports from __all__ or defined classes & functions
            exports = []
            for node in ast.iter_child_nodes(tree):
                if isinstance(node, ast.Assign):
                    for target in node.targets:
                        if isinstance(target, ast.Name) and target.id == '__all__' and isinstance(node.value, (ast.List, ast.Tuple)):
                            exports = [str(elt.value) for elt in node.value.elts if isinstance(elt, ast.Constant)]
            
            if not exports:
                exports = [c.name for c in visitor.classes] + [f.name for f in visitor.functions]

            return ParserResult(
                language="Python",
                classes=visitor.classes,
                functions=visitor.functions,
                imports=list(set(visitor.imports)),
                exports=exports,
                estimated_complexity=self.estimate_complexity(file_content),
                lines_of_code=loc
            )
        except SyntaxError as e:
            # Fallback in case of invalid Python code
            loc = len(file_content.splitlines())
            return ParserResult(
                language="Python",
                classes=[],
                functions=[],
                imports=[],
                exports=[],
                estimated_complexity="low",
                lines_of_code=loc
            )
