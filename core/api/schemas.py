from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# --- Initialization Schemas ---
class InitRequest(BaseModel):
    project_dir: Optional[str] = Field(None, description="Absolute path to the target project directory (defaults to current folder).")

class InitResponse(BaseModel):
    status: str = Field("success", description="Status code outcome of initialization.")
    message: str = Field(..., description="Details regarding config creation outcomes.")
    config_path: str = Field(..., description="Absolute path to the written polytest.yaml file.")

# --- Auto-Detection Schemas ---
class DetectRequest(BaseModel):
    project_dir: Optional[str] = Field(None, description="Folder path to recursively scan for files.")

class FileDetail(BaseModel):
    file_path: str
    language: str
    framework: str

class DetectResponse(BaseModel):
    status: str = Field("success")
    project_root: str = Field(..., description="Resolved root folder of the scanned project.")
    files_found: List[FileDetail] = Field(..., description="List of recognized and mapped files.")

# --- Parsing Analysis Schemas ---
class AnalyzeRequest(BaseModel):
    file_path: str = Field(..., description="Absolute path to the target source file.")

class AnalyzeResponse(BaseModel):
    status: str = Field("success")
    file_path: str
    language: str
    detected_framework: str
    structure: Dict[str, Any] = Field(..., description="Extracted classes, functions, complexity scores, and imports.")

# --- Code Generation Schemas ---
class GenerateRequest(BaseModel):
    path: str = Field(..., description="Absolute target path of a source file or directory of source files.")
    provider: Optional[str] = Field(None, description="Override default LLM provider (openai, gemini, anthropic, ollama, mock).")
    model: Optional[str] = Field(None, description="Override LLM model name (e.g. gpt-4o, gemini-1.5-flash).")
    framework: Optional[str] = Field(None, description="Override default auto-detected testing framework (e.g. pytest, Jest).")
    output_dir: Optional[str] = Field(None, description="Target destination folder to write the test files.")
    mock: bool = Field(False, description="Execute generation completely offline using the Mock stubs engine.")
    no_cache: bool = Field(False, description="Bypass local caching layer and force query LLM API.")
    run: bool = Field(False, description="Automatically execute the test runner immediately after generating the tests.")

class RunResultSchema(BaseModel):
    status: str
    passed_count: int
    failed_count: int
    duration_seconds: float
    raw_output: str

class GenerateResultSchema(BaseModel):
    status: str = Field(..., description="success or failed")
    source_file: str = Field(..., description="Target source path analyzed.")
    test_file: Optional[str] = Field(None, description="Destination test suite file written.")
    framework: Optional[str] = Field(None, description="Framework mapped to the tests.")
    cached: Optional[bool] = Field(None, description="True if retrieved from Cache first-lookup.")
    error: Optional[str] = Field(None, description="Error message trace if generation failed.")
    run_result: Optional[RunResultSchema] = Field(None, description="Subprocess test execution stats (if run is enabled).")

class GenerateResponse(BaseModel):
    status: str = Field("success")
    results: List[GenerateResultSchema] = Field(..., description="Aggregation list of processed generation files.")

# --- Test Runner Schemas ---
class RunRequest(BaseModel):
    test_file_path: str = Field(..., description="Absolute path to the generated test suite file.")
    language: str = Field(..., description="Target programming language.")
    framework: str = Field(..., description="Framework runner name (e.g. pytest, Jest).")
    source_file_path: Optional[str] = Field(None, description="Optional path to companion source file (required for C++/Go compilations).")

class RunResponse(BaseModel):
    status: str = Field(..., description="passed, failed, or error")
    passed_count: int = Field(..., description="Count of passed test cases.")
    failed_count: int = Field(..., description="Count of failed test cases.")
    duration_seconds: float = Field(..., description="Run speed time in seconds.")
    raw_output: str = Field(..., description="Raw stdin/stderr output log from the subprocess runner.")
