import requests
import json
from core.llm.providers import BaseLLMProvider

class OllamaProvider(BaseLLMProvider):
    """Local Ollama client utilizing direct generation API endpoints."""

    def __init__(self, endpoint: str = "http://localhost:11434/api/generate", model: str = "codellama:7b"):
        self.endpoint = endpoint
        self.model = model

    def generate(self, prompt: str, system_instruction: str = "") -> str:
        # We can format prompt with system instruction
        combined_prompt = prompt
        if system_instruction:
            combined_prompt = f"System Instruction: {system_instruction}\n\nUser Request:\n{prompt}"

        data = {
            "model": self.model,
            "prompt": combined_prompt,
            "stream": False,
            "options": {
                "temperature": 0.2
            }
        }

        try:
            response = requests.post(self.endpoint, json=data, timeout=120)
            response.raise_for_status()
            response_json = response.json()
            return response_json.get("response", "")
        except Exception as e:
            return f"Error communicating with local Ollama API: {e}. Ensure Ollama is running (`ollama serve`)."
