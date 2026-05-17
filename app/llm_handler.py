import requests
import json
import yaml
from app.config import llmApiEndpoint, llmModelName

def load_instruction(filePath):
    with open(filePath, 'r') as instructionFile:
        return yaml.safe_load(instructionFile)

def generate_prompt(instructionData, sourceCode, fileName):
    formattedPrompt = instructionData['prompt_template'].replace('{file_name}', fileName)

    completePrompt = f"{formattedPrompt}\n\n```cpp\n{sourceCode}\n```"
    return completePrompt

def query_llm(promptText):
    print("    - Sending prompt to Ollama API...")

    try:
        apiResponse = requests.post(
            llmApiEndpoint,
            json={
                "model": llmModelName,
                "prompt": promptText,
                "stream": False
            }
        )
        apiResponse.raise_for_status()
        print("    - Response received successfully.")

        responseData = json.loads(apiResponse.text)
        return responseData.get("response", "")

    except requests.exceptions.RequestException as apiError:
        print(f"    - Error querying LLM: {apiError}")
        return None
