import os
import re
import shutil
import subprocess
from typing import Dict, Any, Optional

class TestRunner:
    """Orchestrates test execution by triggering framework commands and parsing outcomes."""

    def __init__(self, temp_dir: str = "cache"):
        self.temp_dir = temp_dir
        os.makedirs(self.temp_dir, exist_ok=True)

    def run(
        self,
        test_file_path: str,
        language: str,
        framework: str,
        source_file_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute a generated test suite and parse stats.
        
        Args:
            test_file_path: Absolute path to the generated test suite.
            language: Target language of the test code.
            framework: Test runner framework (e.g. pytest, Jest, etc.).
            source_file_path: Optional source code file path (required for Go/C++ compilations).
            
        Returns:
            A dictionary containing execution outcome statistics:
            {
                "status": "passed" | "failed" | "error",
                "passed_count": int,
                "failed_count": int,
                "duration_seconds": float,
                "raw_output": str
            }
        """
        if not os.path.exists(test_file_path):
            return {
                "status": "error",
                "passed_count": 0,
                "failed_count": 0,
                "duration_seconds": 0.0,
                "raw_output": f"Test suite file does not exist: {test_file_path}"
            }

        lang_lower = language.lower().strip()
        framework_lower = framework.lower().strip()

        # Route execution based on framework/language
        if lang_lower == 'python':
            return self._run_python(test_file_path, source_file_path)
        elif lang_lower in ('javascript', 'typescript'):
            return self._run_javascript_typescript(test_file_path)
        elif lang_lower == 'go':
            return self._run_go(test_file_path, source_file_path)
        elif lang_lower == 'c++':
            return self._run_cpp(test_file_path, source_file_path)
        elif lang_lower == 'java':
            return self._run_java(test_file_path)
        
        return {
            "status": "error",
            "passed_count": 0,
            "failed_count": 0,
            "duration_seconds": 0.0,
            "raw_output": f"Framework runner not implemented for: {language} ({framework})"
        }

    def _run_python(self, test_file_path: str, source_file_path: Optional[str] = None) -> Dict[str, Any]:
        """Execute Python tests using pytest."""
        pytest_path = shutil.which("pytest")
        python_path = shutil.which("python3") or shutil.which("python")

        if not pytest_path and not python_path:
            return self._make_missing_runner_result("pytest")

        # Fallback to python -m pytest if pytest binary is missing
        cmd = [pytest_path, "-v", test_file_path] if pytest_path else [python_path, "-m", "pytest", "-v", test_file_path]

        # Dynamic PYTHONPATH injection to resolve standard source imports
        env = os.environ.copy()
        if source_file_path:
            src_dir = os.path.abspath(os.path.dirname(source_file_path))
        else:
            src_dir = os.path.abspath("src")
        
        existing_path = env.get("PYTHONPATH", "")
        env["PYTHONPATH"] = f"{src_dir}{os.pathsep}{existing_path}" if existing_path else src_dir

        try:
            res = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=15)
            output = res.stdout + "\n" + res.stderr
            
            # Parse pytest summary line, e.g. "== 2 passed, 1 failed in 0.05s =="
            passed = 0
            failed = 0
            duration = 0.0

            # Match pytest duration
            duration_match = re.search(r'in\s+([\d.]+)\s*s', output)
            if duration_match:
                duration = float(duration_match.group(1))

            # Match passed tests
            passed_match = re.search(r'(\d+)\s+passed', output)
            if passed_match:
                passed = int(passed_match.group(1))

            # Match failed tests
            failed_match = re.search(r'(\d+)\s+failed', output)
            if failed_match:
                failed = int(failed_match.group(1))

            # If pytest reports errors outside regular failures (e.g. imports or collection errors)
            if "collected 0 items" in output or "errors during collection" in output or res.returncode == 4:
                return {
                    "status": "error",
                    "passed_count": 0,
                    "failed_count": 0,
                    "duration_seconds": duration,
                    "raw_output": output.strip()
                }

            status = "passed" if failed == 0 and passed > 0 else "failed"
            return {
                "status": status,
                "passed_count": passed,
                "failed_count": failed,
                "duration_seconds": duration,
                "raw_output": output.strip()
            }
        except subprocess.TimeoutExpired:
            return self._make_timeout_result("pytest")
        except Exception as e:
            return self._make_error_result("pytest", e)

    def _run_javascript_typescript(self, test_file_path: str) -> Dict[str, Any]:
        """Execute JS/TS tests using Jest."""
        npm_path = shutil.which("npm")
        npx_path = shutil.which("npx")

        if not npx_path:
            return self._make_missing_runner_result("Jest (npx)")

        # Execute test suite using npx jest
        cmd = [npx_path, "jest", test_file_path, "--colors=false"]
        
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
            output = res.stdout + "\n" + res.stderr
            
            passed = 0
            failed = 0
            duration = 0.0

            # Parse Jest test summary stats, e.g. "Tests:       1 failed, 1 passed, 2 total"
            test_summary_match = re.search(r'Tests:\s*(?:(\d+)\s+failed,\s*)?(\d+)\s+passed,\s*\d+\s+total', output)
            if test_summary_match:
                if test_summary_match.group(1):
                    failed = int(test_summary_match.group(1))
                passed = int(test_summary_match.group(2))
            else:
                # Alternate single stat check (e.g. all passed: "Tests:       2 passed, 2 total")
                all_passed_match = re.search(r'Tests:\s*(\d+)\s+passed,\s*\d+\s+total', output)
                if all_passed_match:
                    passed = int(all_passed_match.group(1))

                all_failed_match = re.search(r'Tests:\s*(\d+)\s+failed,\s*\d+\s+total', output)
                if all_failed_match:
                    failed = int(all_failed_match.group(1))

            # Match Jest runtime duration, e.g. "Time:        0.582 s" or "Time:        2 s"
            duration_match = re.search(r'Time:\s*([\d.]+)\s*s', output)
            if duration_match:
                duration = float(duration_match.group(1))

            # If return code is non-zero but no tests compiled/matched
            if "jest" in output.lower() and "no tests found" in output.lower():
                return {
                    "status": "error",
                    "passed_count": 0,
                    "failed_count": 0,
                    "duration_seconds": duration,
                    "raw_output": output.strip()
                }

            status = "passed" if failed == 0 and passed > 0 else "failed"
            return {
                "status": status,
                "passed_count": passed,
                "failed_count": failed,
                "duration_seconds": duration,
                "raw_output": output.strip()
            }
        except subprocess.TimeoutExpired:
            return self._make_timeout_result("Jest")
        except Exception as e:
            return self._make_error_result("Jest", e)

    def _run_go(self, test_file_path: str, source_file_path: Optional[str]) -> Dict[str, Any]:
        """Execute Go package test runner."""
        go_path = shutil.which("go")
        if not go_path:
            return self._make_missing_runner_result("Go toolchain")

        # Go tests require building the target file and the test file together
        if not source_file_path or not os.path.exists(source_file_path):
            return {
                "status": "error",
                "passed_count": 0,
                "failed_count": 0,
                "duration_seconds": 0.0,
                "raw_output": "Missing required source code file companion to execute Go test compilation."
            }

        cmd = [go_path, "test", "-v", source_file_path, test_file_path]
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            output = res.stdout + "\n" + res.stderr
            
            passed = len(re.findall(r'--- PASS:', output))
            failed = len(re.findall(r'--- FAIL:', output))
            duration = 0.0

            # Match final run result duration, e.g. "ok      command-line-arguments  0.005s"
            duration_match = re.search(r'([\d.]+)s\s*$', output.strip())
            if duration_match:
                duration = float(duration_match.group(1))

            status = "passed" if res.returncode == 0 and failed == 0 else "failed"
            if "compile" in output.lower() or "undefined" in output.lower():
                status = "error"

            return {
                "status": status,
                "passed_count": passed,
                "failed_count": failed,
                "duration_seconds": duration,
                "raw_output": output.strip()
            }
        except subprocess.TimeoutExpired:
            return self._make_timeout_result("go test")
        except Exception as e:
            return self._make_error_result("go test", e)

    def _run_cpp(self, test_file_path: str, source_file_path: Optional[str]) -> Dict[str, Any]:
        """Compile and execute C++ tests using Google Test."""
        compiler = shutil.which("g++") or shutil.which("clang++")
        if not compiler:
            return self._make_missing_runner_result("g++ or clang++")

        if not source_file_path or not os.path.exists(source_file_path):
            return {
                "status": "error",
                "passed_count": 0,
                "failed_count": 0,
                "duration_seconds": 0.0,
                "raw_output": "Missing required source code file to build C++ binary executable."
            }

        # Temp binary name
        binary_path = os.path.join(self.temp_dir, "temp_test_bin")
        
        # Compile source file together with test file using gtest libraries
        # -lgtest and -lgtest_main links google test binaries
        compile_cmd = [compiler, "-std=c++17", source_file_path, test_file_path, "-lgtest", "-lgtest_main", "-lpthread", "-o", binary_path]
        
        try:
            # Step 1: Compile
            comp_res = subprocess.run(compile_cmd, capture_output=True, text=True, timeout=12)
            if comp_res.returncode != 0:
                return {
                    "status": "error",
                    "passed_count": 0,
                    "failed_count": 0,
                    "duration_seconds": 0.0,
                    "raw_output": f"C++ test compilation failed:\n{comp_res.stderr.strip()}"
                }

            # Step 2: Execute compiled binary
            run_res = subprocess.run([binary_path], capture_output=True, text=True, timeout=10)
            output = run_res.stdout + "\n" + run_res.stderr

            passed = 0
            failed = 0
            duration = 0.0

            # Match gtest summary, e.g. "[  PASSED  ] 2 tests."
            passed_match = re.search(r'\[\s*PASSED\s*\]\s*(\d+)\s+test', output)
            if passed_match:
                passed = int(passed_match.group(1))

            # Match gtest failed, e.g. "[  FAILED  ] 1 test, listed below:"
            failed_match = re.search(r'\[\s*FAILED\s*\]\s*(\d+)\s+test', output)
            if failed_match:
                failed = int(failed_match.group(1))

            # Match duration, e.g. "(12 ms total)"
            duration_match = re.search(r'\(\s*(\d+)\s*ms\s+total\)', output)
            if duration_match:
                duration = float(duration_match.group(1)) / 1000.0

            status = "passed" if run_res.returncode == 0 and failed == 0 else "failed"
            return {
                "status": status,
                "passed_count": passed,
                "failed_count": failed,
                "duration_seconds": duration,
                "raw_output": output.strip()
            }
        except subprocess.TimeoutExpired:
            return self._make_timeout_result("Google Test")
        except Exception as e:
            return self._make_error_result("Google Test", e)
        finally:
            if os.path.exists(binary_path):
                try:
                    os.remove(binary_path)
                except Exception:
                    pass

    def _run_java(self, test_file_path: str) -> Dict[str, Any]:
        """Java Maven environment test runner."""
        mvn_path = shutil.which("mvn")
        
        # In multi-language contexts, we fallback to Maven test suite executions if pom.xml exists
        if not mvn_path or not os.path.exists("pom.xml"):
            return {
                "status": "error",
                "passed_count": 0,
                "failed_count": 0,
                "duration_seconds": 0.0,
                "raw_output": "JUnit runner requires Maven ('mvn') and a valid root 'pom.xml' file to build Java test classpaths."
            }

        # Parse test class name from path to run selectively, e.g. "mvn test -Dtest=MyClassTest"
        class_name = os.path.basename(test_file_path).replace(".java", "")
        cmd = [mvn_path, "test", f"-Dtest={class_name}"]

        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            output = res.stdout + "\n" + res.stderr

            passed = 0
            failed = 0
            duration = 0.0

            # Match Maven Surefire statistics report line:
            # "Tests run: 3, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 0.231 s - in com.polytest.generated.MyClassTest"
            report_match = re.search(r'Tests\s+run:\s*(\d+),\s*Failures:\s*(\d+),\s*Errors:\s*(\d+),\s*Skipped:\s*\d+,\s*Time\s+elapsed:\s*([\d.]+)\s*s', output)
            if report_match:
                total = int(report_match.group(1))
                failures = int(report_match.group(2))
                errors = int(report_match.group(3))
                duration = float(report_match.group(4))

                failed = failures + errors
                passed = max(0, total - failed)

            status = "passed" if res.returncode == 0 and failed == 0 else "failed"
            if "compilation failure" in output.lower() or "build failure" in output.lower() and passed == 0:
                status = "error"

            return {
                "status": status,
                "passed_count": passed,
                "failed_count": failed,
                "duration_seconds": duration,
                "raw_output": output.strip()
            }
        except subprocess.TimeoutExpired:
            return self._make_timeout_result("Maven JUnit")
        except Exception as e:
            return self._make_error_result("Maven JUnit", e)

    def _make_missing_runner_result(self, runner_name: str) -> Dict[str, Any]:
        return {
            "status": "error",
            "passed_count": 0,
            "failed_count": 0,
            "duration_seconds": 0.0,
            "raw_output": f"Warning: Host linter binary or testing runner environment '{runner_name}' not detected in system path. Skipped execution."
        }

    def _make_timeout_result(self, runner_name: str) -> Dict[str, Any]:
        return {
            "status": "error",
            "passed_count": 0,
            "failed_count": 0,
            "duration_seconds": 0.0,
            "raw_output": f"Error: Test execution timed out under {runner_name} (possible infinite loop or hang in test code)."
        }

    def _make_error_result(self, runner_name: str, exception: Exception) -> Dict[str, Any]:
        return {
            "status": "error",
            "passed_count": 0,
            "failed_count": 0,
            "duration_seconds": 0.0,
            "raw_output": f"Error executing {runner_name} subprocess runner: {exception}"
        }
