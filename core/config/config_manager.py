import os
import yaml
from typing import List, Optional
from pydantic import BaseModel, Field

class PolytestConfig(BaseModel):
    provider: str = Field(default="mock", description="LLM Provider: mock, openai, gemini, anthropic, ollama")
    model: str = Field(default="gemini-1.5-flash", description="Model identifier to query")
    endpoint: Optional[str] = Field(default="http://localhost:11434/api/generate", description="Local server endpoint (for Ollama)")
    cache_dir: str = Field(default="cache", description="Local folder to cache LLM logs")
    output_dir: str = Field(default="tests", description="Default directory where tests are generated")
    exclude_dirs: List[str] = Field(
        default_factory=lambda: [
            "node_modules", ".venv", "venv", "env", "bin", "obj", 
            "build", "dist", "third_party", ".git", "__pycache__"
        ],
        description="Folder patterns to skip during scans"
    )

class ConfigManager:
    """Manages reading, writing, and applying local PolyTest AI yaml configuration files."""

    def __init__(self, project_root: str):
        self.project_root = project_root
        self.config_paths = [
            os.path.join(project_root, "polytest.yaml"),
            os.path.join(project_root, "polytest.yml")
        ]

    def load_config(self) -> PolytestConfig:
        """Find and parse the local YAML config file, returning a valid PolytestConfig."""
        for path in self.config_paths:
            if os.path.exists(path):
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        data = yaml.safe_load(f) or {}
                    return PolytestConfig(**data)
                except Exception as e:
                    print(f"Warning: Failed to load config from {path}: {e}. Using defaults.")
                    
        return PolytestConfig()

    def save_config(self, config: PolytestConfig) -> str:
        """Serialize and save the current configuration to 'polytest.yaml' in the project root."""
        target_path = self.config_paths[0]
        try:
            with open(target_path, 'w', encoding='utf-8') as f:
                # Dump Pydantic model to dict and output nicely formatted YAML
                yaml.dump(
                    config.model_dump(), 
                    f, 
                    sort_keys=False, 
                    default_flow_style=False, 
                    indent=2
                )
            return target_path
        except Exception as e:
            raise IOError(f"Failed to write config file to {target_path}: {e}")

    def initialize_default_config(self) -> str:
        """Create a default configuration file in the project root if none exists."""
        target_path = self.config_paths[0]
        if os.path.exists(target_path) or os.path.exists(self.config_paths[1]):
            return "Configuration already exists."
            
        config = PolytestConfig()
        self.save_config(config)
        return target_path
