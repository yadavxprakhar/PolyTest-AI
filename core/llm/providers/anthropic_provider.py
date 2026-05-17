import os
import requests
import json
from core.llm.providers import BaseLLMProvider

class AnthropicProvider(BaseLLMProvider):
    """Direct HTTP request client for Anthropic Messages API."""

    def __init__(self, model: str = "claude-3-5-sonnet-20241022"):
        self.model = model
        self.api_key = os.getenv("ANTHROPIC_API_KEY")

    def generate(self, prompt: str, system_instruction: str = "") -> str:
        if not self.api_key:
            return "Error: ANTHROPIC_API_KEY environment variable is not set. Please set it or use another provider."

        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01"
        }
        
        data = {
            "model": self.model,
            "max_tokens": 4096,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2
        }
        
        if system_instruction:
            data["system"] = system_instruction

        try:
            response = requests.post(url, headers=headers, json=data, timeout=60)
            response.raise_for_status()
            response_json = response.json()
            return response_json["content"][0]["text"]
        except Exception as e:
            return f"Error communicating with Anthropic API: {e}"
