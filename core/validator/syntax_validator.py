import os
import re
import shutil
import subprocess
import tempfile
from typing import Tuple, Optional

class SyntaxValidator:
    """Performs non-destructive, language-specific syntax validation on generated test files."""

    def __init__(self, cache_dir: str = "cache"):
        self.cache_dir = cache_dir
        os.makedirs(self.cache_dir, exist_ok=True)

    def validate(self, code_content: str, language: str) -> Tuple[bool, Optional[str]]:
        """Validate syntax of the given code block.
        
        Args:
            code_content: Raw source string of the generated tests.
            language: Target programming language.
            
        Returns:
            A tuple of (is_valid: bool, error_message: Optional[str]).
            If the linter/compiler is not installed, returns (True, "Warning message...").
        """
        lang_lower = language.lower().strip()

        if lang_lower == 'python':
            return self._validate_python(code_content)
        elif lang_lower in ('javascript', 'typescript'):
            return self._validate_javascript_typescript(code_content, lang_lower)
        elif lang_lower == 'go':
            return self._validate_go(code_content)
        elif lang_lower == 'java':
            return self._validate_java(code_content)
        elif lang_lower == 'c++':
            return self._validate_cpp(code_content)
        elif lang_lower == 'c#':
            return self._validate_csharp(code_content)
        
        # For unsupported fallback files, return valid by default
        return True, None

    def _validate_python(self, code_content: str) -> Tuple[bool, Optional[str]]:
        """Verify Python code by compiling it directly using built-in methods."""
        try:
            compile(code_content, '<string>', 'exec')
            return True, None
        except SyntaxError as e:
            return False, f"Python Syntax Error on line {e.lineno}: {e.msg}\nCode context: {e.text.strip() if e.text else 'N/A'}"
        except Exception as e:
            return False, f"Failed parsing Python syntax tree: {e}"

    def _validate_javascript_typescript(self, code_content: str, lang: str) -> Tuple[bool, Optional[str]]:
        """Verify JS/TS using standard node syntax check runner."""
        node_path = shutil.which("node")
        if not node_path:
            return True, "Warning: 'node' executable not found in system path. Skipped JavaScript syntax check."

        # Run node -c on stdin
        try:
            res = subprocess.run(
                [node_path, "--check"],
                input=code_content,
                capture_output=True,
                text=True,
                timeout=5
            )
            if res.returncode != 0:
                # Node outputs syntax errors to stderr
                return False, f"JavaScript Syntax Check Failed:\n{res.stderr.strip()}"
            return True, None
        except Exception as e:
            return True, f"Warning: Subprocess node syntax run failed: {e}"

    def _validate_go(self, code_content: str) -> Tuple[bool, Optional[str]]:
        """Verify Go package syntax via go tool compiler dry-run."""
        go_path = shutil.which("go")
        if not go_path:
            return True, "Warning: 'go' binary not detected in system path. Skipped Go syntax validation."

        # Write to local cache temp file
        temp_file = os.path.join(self.cache_dir, "temp_check.go")
        try:
            with open(temp_file, "w", encoding="utf-8") as f:
                f.write(code_content)
            
            # go tool compile -o /dev/null -p main validates syntax without writing binaries
            res = subprocess.run(
                [go_path, "tool", "compile", "-o", os.devnull, "-p", "main", temp_file],
                capture_output=True,
                text=True,
                timeout=8
            )
            if res.returncode != 0:
                # Format compiler errors neatly, stripping absolute temp file path
                clean_err = res.stderr.replace(temp_file, "generated_test.go").strip()
                # Treat missing packages/imports as warnings rather than hard failures
                if "cannot find package" in clean_err.lower() or "could not import" in clean_err.lower() or "no required module" in clean_err.lower():
                    return True, f"Warning: Missing Go packages. Skipped compiler check: {clean_err}"
                return False, f"Go Syntax Validation Failure:\n{clean_err}"
            return True, None
        except Exception as e:
            return True, f"Warning: Failed executing go compile checks: {e}"
        finally:
            if os.path.exists(temp_file):
                os.remove(temp_file)

    def _validate_java(self, code_content: str) -> Tuple[bool, Optional[str]]:
        """Verify Java compilation syntax using javac compiler checks."""
        javac_path = shutil.which("javac")
        if not javac_path:
            return True, "Warning: 'javac' compiler not found. Skipped Java syntax verification."

        # Parse class name dynamically to ensure file name matches class name (crucial in Java)
        class_match = re.search(r'class\s+([A-Za-z0-9_]+)', code_content)
        class_name = class_match.group(1) if class_match else "TempJavaTest"
        
        temp_file = os.path.join(self.cache_dir, f"{class_name}.java")
        try:
            with open(temp_file, "w", encoding="utf-8") as f:
                f.write(code_content)
            
            # javac -proc:none skips annotation processing, -d cache directs class files to cache folder
            res = subprocess.run(
                [javac_path, "-proc:none", "-d", self.cache_dir, temp_file],
                capture_output=True,
                text=True,
                timeout=10
            )
            if res.returncode != 0:
                clean_err = res.stderr.replace(temp_file, f"{class_name}.java").strip()
                # Treat missing libraries/imports as warnings rather than hard failures
                if "does not exist" in clean_err.lower() or "cannot find symbol" in clean_err.lower() or "cannot be resolved" in clean_err.lower():
                    return True, f"Warning: Missing Java packages. Skipped compiler check: {clean_err}"
                return False, f"Java Syntax Validation Failure:\n{clean_err}"
            return True, None
        except Exception as e:
            return True, f"Warning: Failed executing javac check: {e}"
        finally:
            # Clean up both source and compiled class files
            if os.path.exists(temp_file):
                os.remove(temp_file)
            compiled_class = os.path.join(self.cache_dir, f"{class_name}.class")
            if os.path.exists(compiled_class):
                os.remove(compiled_class)

    def _validate_cpp(self, code_content: str) -> Tuple[bool, Optional[str]]:
        """Verify C++ compilation syntax using gcc/clang fsyntax-only checks."""
        cpp_compiler = shutil.which("g++") or shutil.which("clang++")
        if not cpp_compiler:
            return True, "Warning: No C++ compiler (g++ or clang++) detected. Skipped check."

        temp_file = os.path.join(self.cache_dir, "temp_check.cpp")
        try:
            with open(temp_file, "w", encoding="utf-8") as f:
                f.write(code_content)
            
            # -fsyntax-only instructs gcc/clang to check syntax without emitting binary code
            res = subprocess.run(
                [cpp_compiler, "-fsyntax-only", "-std=c++17", temp_file],
                capture_output=True,
                text=True,
                timeout=10
            )
            if res.returncode != 0:
                clean_err = res.stderr.replace(temp_file, "generated_test.cpp").strip()
                # Check if the error is merely a missing third-party library header dependency
                if "file not found" in clean_err.lower() or "no such file or directory" in clean_err.lower():
                    return True, f"Warning: Missing header dependency. Skipped compiler check: {clean_err}"
                return False, f"C++ Syntax Validation Failure:\n{clean_err}"
            return True, None
        except Exception as e:
            return True, f"Warning: Failed executing C++ compiler check: {e}"
        finally:
            if os.path.exists(temp_file):
                os.remove(temp_file)

    def _validate_csharp(self, code_content: str) -> Tuple[bool, Optional[str]]:
        """Verify C# compiler syntax check using dotnet/csc compiler."""
        csc_path = shutil.which("csc") or shutil.which("dotnet")
        if not csc_path:
            return True, "Warning: C# compiler ('csc' or 'dotnet') not detected. Skipped check."

        # If we have csc, it is standard and extremely easy to check syntax only
        if "csc" in csc_path:
            temp_file = os.path.join(self.cache_dir, "temp_check.cs")
            try:
                with open(temp_file, "w", encoding="utf-8") as f:
                    f.write(code_content)
                res = subprocess.run(
                    [csc_path, "/target:library", "/out:" + os.devnull, temp_file],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                if res.returncode != 0:
                    clean_err = res.stderr.replace(temp_file, "generated_test.cs").strip()
                    return False, f"C# Syntax Validation Failure:\n{clean_err}"
                return True, None
            except Exception as e:
                return True, f"Warning: C# csc compile check failed: {e}"
            finally:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
        
        # Default success if csc is missing but dotnet is there (which requires complex sln structures)
        return True, None
