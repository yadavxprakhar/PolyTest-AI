from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class MethodParameter(BaseModel):
    name: str
    type_annotation: Optional[str] = None
    default_value: Optional[str] = None

class MethodInfo(BaseModel):
    name: str
    parameters: List[MethodParameter] = Field(default_factory=list)
    return_type: Optional[str] = None
    is_async: bool = False
    is_static: bool = False
    docstring: Optional[str] = None

class ClassInfo(BaseModel):
    name: str
    base_classes: List[str] = Field(default_factory=list)
    methods: List[MethodInfo] = Field(default_factory=list)
    properties: List[Dict[str, Any]] = Field(default_factory=list)
    docstring: Optional[str] = None

class FunctionInfo(BaseModel):
    name: str
    parameters: List[MethodParameter] = Field(default_factory=list)
    return_type: Optional[str] = None
    is_async: bool = False
    docstring: Optional[str] = None

class ParserResult(BaseModel):
    language: str
    classes: List[ClassInfo] = Field(default_factory=list)
    functions: List[FunctionInfo] = Field(default_factory=list)
    imports: List[str] = Field(default_factory=list)
    exports: List[str] = Field(default_factory=list)
    estimated_complexity: str = "low"  # low, medium, high
    lines_of_code: int = 0

class BaseParser(ABC):
    """Abstract Base Class for all language-specific parsers."""
    
    @abstractmethod
    def parse(self, file_content: str, file_path: str) -> ParserResult:
        """Parse source code file and extract structural information.
        
        Args:
            file_content: Raw string content of the source code file.
            file_path: The absolute or relative path to the file.
            
        Returns:
            A ParserResult object containing structured code metadata.
        """
        pass

    def estimate_complexity(self, file_content: str) -> str:
        """A simple, language-agnostic heuristic to estimate code complexity."""
        lines = file_content.splitlines()
        loc = len([l for l in lines if l.strip() and not l.strip().startswith(('#', '//', '/*', '*'))])
        
        # Count decision points
        decision_keywords = ['if ', 'elif ', 'else if', 'switch', 'for ', 'while ', 'catch', 'except']
        decision_points = sum(file_content.count(keyword) for keyword in decision_keywords)
        
        if loc > 200 or decision_points > 15:
            return "high"
        elif loc > 50 or decision_points > 5:
            return "medium"
        return "low"
