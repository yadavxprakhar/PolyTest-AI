import os
import shutil
from typing import Dict, Any, Optional
from core.analyzer.detector import LanguageDetector, LanguageInfo
from core.analyzer.parser_factory import ParserFactory
from core.context.context_builder import ContextBuilder
from core.llm.llm_client import LLMClient
from core.llm.prompt_builder import PromptBuilder
from core.llm.response_parser import ResponseParser

class TestGenerator:
    """Orchestrates the entire language-detection, code-parsing, prompt-building, and test-generation pipeline."""

    def __init__(self, 
                 provider: str = "mock", 
                 model: Optional[str] = None, 
                 endpoint: Optional[str] = None,
                 cache_dir: Optional[str] = "cache"):
        self.provider_name = provider
        self.model_name = model
        self.endpoint = endpoint
        self.cache_dir = cache_dir
        
        self.detector = LanguageDetector()
        self.context_builder = ContextBuilder()
        self.prompt_builder = PromptBuilder()
        self.response_parser = ResponseParser()
        
        if self.cache_dir:
            os.makedirs(self.cache_dir, exist_ok=True)

    def generate_test(self, 
                      source_file_path: str, 
                      output_dir: str, 
                      forced_framework: Optional[str] = None, 
                      use_cache: bool = True) -> Dict[str, Any]:
        """Generate a complete test suite for a single source code file.
        
        Args:
            source_file_path: Absolute or relative path to the target source file.
            output_dir: Directory where the generated test file should be saved.
            forced_framework: Force a testing framework instead of auto-detecting it.
            use_cache: Whether to cache LLM responses locally to save cost.
            
        Returns:
            A results dictionary with status, file path, language, framework, and metrics.
        """
        if not os.path.isfile(source_file_path):
            return {
                "status": "failed",
                "error": f"Source file does not exist: {source_file_path}"
            }

        # 1. Detect language & framework
        lang_info = self.detector.detect(source_file_path)
        target_framework = forced_framework or lang_info.framework
        
        # 2. Read source file
        try:
            with open(source_file_path, 'r', encoding='utf-8') as f:
                source_content = f.read()
        except Exception as e:
            return {
                "status": "failed",
                "error": f"Failed to read source file: {e}"
            }

        # 3. Parse file structure
        parser = ParserFactory.get_parser(lang_info.language)
        parser_result = parser.parse(source_content, source_file_path)

        # 4. Build rich context
        context = self.context_builder.build_context(
            file_path=source_file_path,
            file_content=source_content,
            parser_result=parser_result,
            target_framework=target_framework
        )

        # 5. Determine cached log path
        file_name = os.path.basename(source_file_path)
        cache_log_path = None
        if self.cache_dir:
            cache_log_path = os.path.join(self.cache_dir, f"{file_name}.log")

        llm_response = None
        loaded_from_cache = False

        # 6. Check cache first
        if use_cache and cache_log_path and os.path.exists(cache_log_path):
            try:
                with open(cache_log_path, 'r', encoding='utf-8') as cf:
                    llm_response = cf.read()
                loaded_from_cache = True
            except Exception:
                pass

        # 7. Query LLM if not cached
        if not llm_response:
            # Build prompt
            system_instruction = self.prompt_builder.build_system_instruction(context)
            user_prompt = self.prompt_builder.build_user_prompt(context)
            
            # Fetch client provider
            provider_client = LLMClient.get_provider(
                provider_name=self.provider_name,
                model=self.model_name,
                endpoint=self.endpoint
            )
            
            # Generate
            llm_response = provider_client.generate(user_prompt, system_instruction=system_instruction)
            
            # Save cache
            if use_cache and cache_log_path and llm_response and "Error" not in llm_response:
                try:
                    with open(cache_log_path, 'w', encoding='utf-8') as cf:
                        cf.write(llm_response)
                except Exception:
                    pass

        if not llm_response:
            return {
                "status": "failed",
                "error": "Empty or failed response from the LLM Provider."
            }

        # 8. Parse the code response
        generated_test_code = self.response_parser.extract_code(llm_response)

        # 9. Format output test file name
        test_file_name = self._format_test_filename(file_name, lang_info.language, target_framework)
        os.makedirs(output_dir, exist_ok=True)
        test_file_path = os.path.join(output_dir, test_file_name)

        # 10. Write the test suite
        try:
            with open(test_file_path, 'w', encoding='utf-8') as tf:
                tf.write(generated_test_code)
        except Exception as e:
            return {
                "status": "failed",
                "error": f"Failed to write generated test file: {e}"
            }

        return {
            "status": "success",
            "source_file": source_file_path,
            "test_file": test_file_path,
            "language": lang_info.language,
            "framework": target_framework,
            "complexity": parser_result.estimated_complexity,
            "lines_of_code": parser_result.lines_of_code,
            "classes_found": len(parser_result.classes),
            "functions_found": len(parser_result.functions),
            "cached": loaded_from_cache
        }

    def _format_test_filename(self, source_filename: str, language: str, framework: str) -> str:
        """Format the output test file name according to language and framework standards."""
        name_no_ext, ext = os.path.splitext(source_filename)
        lang_lower = language.lower()
        
        if lang_lower == 'python':
            # test_*.py
            if source_filename.startswith('test_'):
                return source_filename
            return f"test_{name_no_ext}{ext}"
            
        elif lang_lower in ('javascript', 'typescript'):
            # *.test.js or *.test.ts
            if '.test.' in source_filename or '.spec.' in source_filename:
                return source_filename
            return f"{name_no_ext}.test{ext}"
            
        elif lang_lower == 'c++':
            # *_test.cpp or test_*.cpp
            if '_test' in name_no_ext or 'test_' in name_no_ext:
                return source_filename
            return f"{name_no_ext}_test{ext}"
            
        elif lang_lower == 'java':
            # *Test.java
            if name_no_ext.endswith('Test'):
                return source_filename
            return f"{name_no_ext}Test{ext}"
            
        elif lang_lower == 'go':
            # *_test.go
            if name_no_ext.endswith('_test'):
                return source_filename
            return f"{name_no_ext}_test{ext}"
            
        elif lang_lower == 'c#':
            # *Tests.cs or *Test.cs
            if name_no_ext.endswith('Tests') or name_no_ext.endswith('Test'):
                return source_filename
            return f"{name_no_ext}Tests{ext}"
            
        else:
            return f"test_{source_filename}"
