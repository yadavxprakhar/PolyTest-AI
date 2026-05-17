from abc import ABC, abstractmethod

class BaseLLMProvider(ABC):
    """Abstract Base Class for all LLM service providers."""
    
    @abstractmethod
    def generate(self, prompt: str, system_instruction: str = "") -> str:
        """Query LLM and return the generated text response."""
        pass
