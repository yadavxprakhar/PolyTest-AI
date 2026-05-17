import os
from typing import Dict, Any, List
from core.analyzer.base_parser import ParserResult

class ContextBuilder:
    """Consolidates file analysis, code content, and project settings into a rich context payload."""

    def build_context(self, 
                      file_path: str, 
                      file_content: str, 
                      parser_result: ParserResult, 
                      target_framework: str) -> Dict[str, Any]:
        """Combine all static analysis variables into a comprehensive context dict.
        
        Args:
            file_path: Path of the target file.
            file_content: Raw source code string.
            parser_result: ParserResult object with classes, methods, imports, exports, etc.
            target_framework: Target test framework to generate tests for (e.g. pytest, jest).
            
        Returns:
            A context dictionary with keys: file_name, language, framework, structure, content, etc.
        """
        file_name = os.path.basename(file_path)
        
        # Categorize the file structure based on features
        component_type = self._determine_component_type(parser_result, file_name)

        return {
            "file_name": file_name,
            "file_path": file_path,
            "language": parser_result.language,
            "framework": target_framework,
            "component_type": component_type,
            "complexity": parser_result.estimated_complexity,
            "lines_of_code": parser_result.lines_of_code,
            "imports": parser_result.imports,
            "exports": parser_result.exports,
            "structure": parser_result.model_dump(),
            "content": file_content
        }

    def _determine_component_type(self, parser_result: ParserResult, file_name: str) -> str:
        """Heuristic to guess if this is a Model, Controller, Service, Utility, or standard Component."""
        name_lower = file_name.lower()
        
        if "controller" in name_lower:
            return "Controller"
        elif "service" in name_lower:
            return "Service"
        elif "model" in name_lower or "entity" in name_lower:
            return "Model"
        elif "util" in name_lower or "helper" in name_lower:
            return "Utility"
        elif "config" in name_lower or "setting" in name_lower:
            return "Config"
        elif "test" in name_lower:
            return "Test"
            
        # Fallback analysis based on parser structural features
        if parser_result.classes:
            # If classes have mostly getters/setters or properties, it's likely a Model/Data class
            class_methods_count = sum(len(c.methods) for c in parser_result.classes)
            if class_methods_count == 0:
                return "Model"
            return "Service/Logic Class"
            
        if parser_result.functions:
            return "Functional/Utility Module"
            
        return "Generic Module"
