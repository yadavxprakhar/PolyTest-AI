from core.llm.providers import BaseLLMProvider
from core.llm.providers.mock_provider import MockProvider
from core.llm.providers.openai_provider import OpenAIProvider
from core.llm.providers.gemini_provider import GeminiProvider
from core.llm.providers.anthropic_provider import AnthropicProvider
from core.llm.providers.ollama_provider import OllamaProvider

class LLMClient:
    """Manager/Orchestrator to fetch and interact with the configured LLM Provider."""

    @staticmethod
    def get_provider(provider_name: str, model: str = None, endpoint: str = None) -> BaseLLMProvider:
        """Instantiate and return the selected BaseLLMProvider."""
        provider_clean = provider_name.lower().strip()
        
        if provider_clean == 'mock':
            return MockProvider()
        elif provider_clean == 'openai':
            return OpenAIProvider(model=model or "gpt-4o")
        elif provider_clean == 'gemini':
            return GeminiProvider(model=model or "gemini-1.5-flash")
        elif provider_clean == 'anthropic':
            return AnthropicProvider(model=model or "claude-3-5-sonnet-20241022")
        elif provider_clean == 'ollama':
            model_name = model or "codellama:7b"
            api_endpoint = endpoint or "http://localhost:11434/api/generate"
            return OllamaProvider(endpoint=api_endpoint, model=model_name)
        else:
            print(f"Warning: Unknown provider '{provider_name}'. Falling back to offline 'mock' mode.")
            return MockProvider()
