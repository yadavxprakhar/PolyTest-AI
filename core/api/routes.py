import os
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Dict, Any

from core.api.schemas import (
    InitRequest, InitResponse,
    DetectRequest, DetectResponse, FileDetail,
    AnalyzeRequest, AnalyzeResponse,
    GenerateRequest, GenerateResponse, GenerateResultSchema, RunResultSchema,
    RunRequest, RunResponse
)

# Core imports
from core.config.config_manager import ConfigManager
from core.analyzer.detector import LanguageDetector
from core.analyzer.parser_factory import ParserFactory
from core.generator.test_generator import TestGenerator
from core.runner.test_runner import TestRunner

router = APIRouter(prefix="/api/v1")

@router.post("/init", response_model=InitResponse)
def init_config(payload: InitRequest):
    """Initialize a default polytest.yaml config file in the target directory."""
    project_dir = payload.project_dir or os.getcwd()
    config_path = os.path.join(project_dir, "polytest.yaml")
    
    try:
        manager = ConfigManager(config_path=config_path)
        manager.save_config()  # Write default config
        return InitResponse(
            status="success",
            message="Successfully initialized local polytest.yaml settings.",
            config_path=os.path.abspath(config_path)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize configuration: {e}")

@router.post("/detect", response_model=DetectResponse)
def detect_files(payload: DetectRequest):
    """Scan directory recursively to identify target source files and test frameworks."""
    project_dir = payload.project_dir or os.getcwd()
    abs_root = os.path.abspath(project_dir)
    
    if not os.path.exists(abs_root):
        raise HTTPException(status_code=404, detail=f"Scanned directory path does not exist: {project_dir}")
        
    try:
        detector = LanguageDetector(project_root=abs_root)
        files_found: List[FileDetail] = []
        
        # Traverse folder excluding cache/virtualenvs
        for root, dirs, files in os.walk(abs_root):
            # Prune directories in-place
            dirs[:] = [d for d in dirs if d not in (".venv", "cache", ".git", "tests", "__pycache__")]
            
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in (".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".cpp", ".cc", ".h", ".go", ".cs"):
                    file_path = os.path.join(root, file)
                    lang_info = detector.detect(file_path)
                    
                    if lang_info.language != "Unsupported":
                        files_found.append(FileDetail(
                            file_path=os.path.abspath(file_path),
                            language=lang_info.language,
                            framework=lang_info.framework
                        ))
                        
        return DetectResponse(
            status="success",
            project_root=abs_root,
            files_found=files_found
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auto-detection scan encountered an error: {e}")

@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_file(payload: AnalyzeRequest):
    """Perform local static structural analysis on a single source file."""
    abs_path = os.path.abspath(payload.file_path)
    if not os.path.exists(abs_path):
        raise HTTPException(status_code=404, detail=f"Target source file not found: {payload.file_path}")
        
    try:
        detector = LanguageDetector()
        lang_info = detector.detect(abs_path)
        
        if lang_info.language == "Unsupported":
            raise HTTPException(status_code=400, detail=f"File extension or structure is unsupported: {payload.file_path}")
            
        parser = ParserFactory.create_parser(lang_info.language)
        result = parser.parse(abs_path)
        
        return AnalyzeResponse(
            status="success",
            file_path=abs_path,
            language=lang_info.language,
            detected_framework=lang_info.framework,
            structure=result.dict()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Static code parsing failed: {e}")

@router.post("/generate", response_model=GenerateResponse)
def generate_tests(payload: GenerateRequest):
    """Generate unit test suites, validate syntax, and optionally run subprocess execution."""
    abs_path = os.path.abspath(payload.path)
    if not os.path.exists(abs_path):
        raise HTTPException(status_code=404, detail=f"Target source path not found: {payload.path}")

    # 1. Resolve files list
    files_to_process = []
    if os.path.isfile(abs_path):
        files_to_process.append(abs_path)
    elif os.path.isdir(abs_path):
        for root, dirs, files in os.walk(abs_path):
            dirs[:] = [d for d in dirs if d not in (".venv", "cache", ".git", "tests", "__pycache__")]
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in (".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".cpp", ".cc", ".h", ".go", ".cs"):
                    files_to_process.append(os.path.join(root, file))

    if not files_to_process:
        raise HTTPException(status_code=400, detail=f"No supportable code source files located under: {payload.path}")

    # 2. Instantiate generator engine
    try:
        # Load API keys from default file config if none provided as overrides
        manager = ConfigManager()
        manager.load_config()
        
        # Override default configuration parameters if payload overrides exist
        provider = payload.provider or manager.get("llm.provider", "mock")
        model = payload.model or manager.get("llm.model", "gemini-1.5-flash")
        
        # If payload specifically sets mock=True, route it offline
        if payload.mock:
            provider = "mock"
            
        generator = TestGenerator(provider_override=provider, model_override=model)
        output_dir = payload.output_dir or manager.get("generator.output_dir", "tests")
        
        results: List[GenerateResultSchema] = []
        detector = LanguageDetector()
        
        for file in files_to_process:
            lang_info = detector.detect(file)
            framework = payload.framework or lang_info.framework
            
            res = generator.generate_test(
                source_file_path=file,
                output_dir=output_dir,
                forced_framework=framework,
                use_cache=not payload.no_cache
            )
            
            run_schema = None
            # Execute dynamic test runner if successfully generated and requested
            if payload.run and res.get("status") == "success":
                runner = TestRunner()
                run_res = runner.run(
                    test_file_path=res["test_file"],
                    language=res.get("language") or lang_info.language,
                    framework=res["framework"],
                    source_file_path=file
                )
                run_schema = RunResultSchema(
                    status=run_res["status"],
                    passed_count=run_res["passed_count"],
                    failed_count=run_res["failed_count"],
                    duration_seconds=run_res["duration_seconds"],
                    raw_output=run_res["raw_output"]
                )

            results.append(GenerateResultSchema(
                status=res["status"],
                source_file=file,
                test_file=res.get("test_file"),
                framework=res.get("framework"),
                cached=res.get("cached"),
                error=res.get("error"),
                run_result=run_schema
            ))
            
        return GenerateResponse(status="success", results=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation process crashed: {e}")

@router.post("/run", response_model=RunResponse)
def execute_tests(payload: RunRequest):
    """Execute a target test suite using subprocess commands and parse outcomes."""
    abs_test_path = os.path.abspath(payload.test_file_path)
    if not os.path.exists(abs_test_path):
        raise HTTPException(status_code=404, detail=f"Test suite file not found: {payload.test_file_path}")

    abs_src_path = None
    if payload.source_file_path:
        abs_src_path = os.path.abspath(payload.source_file_path)
        if not os.path.exists(abs_src_path):
            raise HTTPException(status_code=404, detail=f"Companion source file companion not found: {payload.source_file_path}")

    try:
        runner = TestRunner()
        run_res = runner.run(
            test_file_path=abs_test_path,
            language=payload.language,
            framework=payload.framework,
            source_file_path=abs_src_path
        )
        
        return RunResponse(
            status=run_res["status"],
            passed_count=run_res["passed_count"],
            failed_count=run_res["failed_count"],
            duration_seconds=run_res["duration_seconds"],
            raw_output=run_res["raw_output"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Subprocess runner failed to launch tests: {e}")
