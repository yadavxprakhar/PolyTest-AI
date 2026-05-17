import os
import requests
import json
from core.llm.providers import BaseLLMProvider

class GeminiProvider(BaseLLMProvider):
    """Direct HTTP request client for Google Gemini Developer API."""

    def __init__(self, model: str = "gemini-1.5-flash"):
        self.model = model
        self.api_key = os.getenv("GEMINI_API_KEY")

    def generate(self, prompt: str, system_instruction: str = "") -> str:
        if not self.api_key:
            return "Error: GEMINI_API_KEY environment variable is not set. Please set it or use another provider."

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        headers = {
            "Content-Type": "application/json"
        }
        
        contents = {
            "parts": [{"text": prompt}]
        }
        
        data = {
            "contents": [contents],
            "generationConfig": {
                "temperature": 0.2
            }
        }
        
        if system_instruction:
            data["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        try:
            response = requests.post(url, headers=headers, json=data, timeout=60)
            response.raise_for_status()
            response_json = response.json()
            # Extract content text
            return response_json["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            return f"Error communicating with Gemini API: {e}"
