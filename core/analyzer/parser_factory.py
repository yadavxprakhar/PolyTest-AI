from core.analyzer.base_parser import BaseParser, ParserResult
from core.analyzer.parsers.python_parser import PythonParser
from core.analyzer.parsers.javascript_parser import JavascriptParser
from core.analyzer.parsers.cpp_parser import CppParser
from core.analyzer.parsers.java_parser import JavaParser
from core.analyzer.parsers.go_parser import GoParser
from core.analyzer.parsers.csharp_parser import CSharpParser

class FallbackParser(BaseParser):
    """Fallback parser that parses any file format gracefully without cracking."""
    
    def parse(self, file_content: str, file_path: str) -> ParserResult:
        lines = file_content.splitlines()
        loc = len([l for l in lines if l.strip()])
        return ParserResult(
            language="Unknown",
            classes=[],
            functions=[],
            imports=[],
            exports=[],
            estimated_complexity="low",
            lines_of_code=loc
        )

class ParserFactory:
    """Factory class to create and retrieve the appropriate parser based on language."""

    @staticmethod
    def get_parser(language: str) -> BaseParser:
        """Returns the appropriate BaseParser implementation for the specified language."""
        lang_lower = language.lower().strip()
        
        if lang_lower == 'python':
            return PythonParser()
        elif lang_lower in ('javascript', 'typescript'):
            return JavascriptParser()
        elif lang_lower in ('c++', 'cpp', 'cplusplus'):
            return CppParser()
        elif lang_lower == 'java':
            return JavaParser()
        elif lang_lower == 'go':
            return GoParser()
        elif lang_lower in ('c#', 'csharp'):
            return CSharpParser()
        else:
            return FallbackParser()
