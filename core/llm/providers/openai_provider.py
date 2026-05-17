import os
import requests
import json
from core.llm.providers import BaseLLMProvider

class OpenAIProvider(BaseLLMProvider):
    """Direct HTTP request client for OpenAI Chat Completion API."""

    def __init__(self, model: str = "gpt-4o"):
        self.model = model
        self.api_key = os.getenv("OPENAI_API_KEY")

    def generate(self, prompt: str, system_instruction: str = "") -> str:
        if not self.api_key:
            return "Error: OPENAI_API_KEY environment variable is not set. Please set it or use another provider."

        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        data = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.2
        }

        try:
            response = requests.post(url, headers=headers, json=data, timeout=60)
            response.raise_for_status()
            response_json = response.json()
            return response_json["choices"][0]["message"]["content"]
        except Exception as e:
            return f"Error communicating with OpenAI API: {e}"
