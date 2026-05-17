import os
import json
import re
from typing import Optional
from pydantic import BaseModel

class LanguageInfo(BaseModel):
    language: str
    extension: str
    framework: str
    framework_options: list[str] = []
    version: Optional[str] = None
    project_root: Optional[str] = None

class LanguageDetector:
    """Detects programming language and the appropriate testing framework for a source file."""

    LANGUAGE_MAP = {
        '.py': 'Python',
        '.js': 'JavaScript',
        '.jsx': 'JavaScript',
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript',
        '.cpp': 'C++',
        '.cc': 'C++',
        '.cxx': 'C++',
        '.h': 'C++',
        '.hpp': 'C++',
        '.java': 'Java',
        '.cs': 'C#',
        '.go': 'Go',
        '.rb': 'Ruby',
        '.php': 'PHP',
        '.rs': 'Rust',
        '.kt': 'Kotlin',
        '.swift': 'Swift'
    }

    DEFAULT_FRAMEWORKS = {
        'Python': 'pytest',
        'JavaScript': 'Jest',
        'TypeScript': 'Jest',
        'C++': 'Google Test',
        'Java': 'JUnit 5',
        'C#': 'xUnit',
        'Go': 'testing',
        'Ruby': 'RSpec',
        'PHP': 'PHPUnit',
        'Rust': 'built-in',
        'Kotlin': 'JUnit 5',
        'Swift': 'XCTest'
    }

    FRAMEWORK_OPTIONS = {
        'Python': ['pytest', 'unittest', 'nose2'],
        'JavaScript': ['Jest', 'Mocha', 'Jasmine', 'Vitest'],
        'TypeScript': ['Jest', 'Vitest', 'Mocha'],
        'C++': ['Google Test', 'Catch2', 'Boost.Test'],
        'Java': ['JUnit 5', 'JUnit 4', 'TestNG'],
        'C#': ['xUnit', 'NUnit', 'MSTest'],
        'Go': ['testing', 'testify']
    }

    def detect(self, file_path: str) -> LanguageInfo:
        """Analyze file path and contents to determine language and framework info."""
        _, ext = os.path.splitext(file_path.lower())
        
        # 1. Basic Extension Detection
        language = self.LANGUAGE_MAP.get(ext)
        
        # 2. Content-based fallback if no extension or unknown
        if not language:
            language = self._detect_by_content(file_path)
            if not language:
                # Default fallback
                language = "Unknown"
                ext = ext or ".txt"

        # 3. Find project root & scan for framework clues
        project_root = self._find_project_root(file_path)
        framework = self._detect_framework(language, project_root)

        return LanguageInfo(
            language=language,
            extension=ext,
            framework=framework,
            framework_options=self.FRAMEWORK_OPTIONS.get(language, [self.DEFAULT_FRAMEWORKS.get(language, 'Unknown')]),
            project_root=project_root
        )

    def _detect_by_content(self, file_path: str) -> Optional[str]:
        """Detect language using shebangs or prominent keywords in file content."""
        if not os.path.isfile(file_path):
            return None
            
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                first_lines = [f.readline() for _ in range(5)]
                content_sample = "".join(first_lines)
                
                # Check shebangs
                if "#!/usr/bin/env python" in content_sample or "#!/usr/bin/python" in content_sample:
                    return "Python"
                if "#!/usr/bin/env node" in content_sample or "#!/usr/bin/node" in content_sample:
                    return "JavaScript"
                if "package main" in content_sample and "import" in content_sample:
                    return "Go"
                if "using System;" in content_sample or "namespace " in content_sample:
                    return "C#"
                if "public class " in content_sample and "static void main" in content_sample:
                    return "Java"
                if "#include <iostream>" in content_sample or "using namespace std;" in content_sample:
                    return "C++"
        except Exception:
            pass
        return None

    def _find_project_root(self, file_path: str) -> str:
        """Traverse upwards to find standard project files signifying root directory."""
        dir_path = os.path.abspath(os.path.dirname(file_path))
        root_indicators = [
            'package.json', 'pyproject.toml', 'requirements.txt', 
            'go.mod', 'CMakeLists.txt', '.git', 'pom.xml', 'build.gradle'
        ]
        
        while True:
            if any(os.path.exists(os.path.join(dir_path, indicator)) for indicator in root_indicators):
                return dir_path
            
            parent = os.path.dirname(dir_path)
            if parent == dir_path:  # Reached file system root
                break
            dir_path = parent
            
        return os.path.abspath(os.path.dirname(file_path))

    def _detect_framework(self, language: str, project_root: str) -> str:
        """Scan manifest files for specific framework dependencies."""
        default_fw = self.DEFAULT_FRAMEWORKS.get(language, 'Unknown')
        if not project_root or not os.path.isdir(project_root):
            return default_fw

        # JavaScript/TypeScript scanning
        if language in ['JavaScript', 'TypeScript']:
            pkg_json_path = os.path.join(project_root, 'package.json')
            if os.path.exists(pkg_json_path):
                try:
                    with open(pkg_json_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        deps = {**data.get('dependencies', {}), **data.get('devDependencies', {})}
                        scripts = data.get('scripts', {})
                        
                        if 'vitest' in deps or any('vitest' in str(v) for v in scripts.values()):
                            return 'Vitest'
                        if 'jest' in deps or any('jest' in str(v) for v in scripts.values()):
                            return 'Jest'
                        if 'mocha' in deps or any('mocha' in str(v) for v in scripts.values()):
                            return 'Mocha'
                        if 'jasmine' in deps or any('jasmine' in str(v) for v in scripts.values()):
                            return 'Jasmine'
                except Exception:
                    pass

        # Python scanning
        elif language == 'Python':
            # Check requirements.txt, pyproject.toml, setup.py
            req_path = os.path.join(project_root, 'requirements.txt')
            pyproj_path = os.path.join(project_root, 'pyproject.toml')
            
            if os.path.exists(req_path):
                try:
                    with open(req_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if 'pytest' in content:
                            return 'pytest'
                        if 'nose2' in content:
                            return 'nose2'
                except Exception:
                    pass
            if os.path.exists(pyproj_path):
                try:
                    with open(pyproj_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if 'pytest' in content:
                            return 'pytest'
                except Exception:
                    pass

        # Go scanning
        elif language == 'Go':
            go_mod_path = os.path.join(project_root, 'go.mod')
            if os.path.exists(go_mod_path):
                try:
                    with open(go_mod_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if 'github.com/stretchr/testify' in content:
                            return 'testify'
                except Exception:
                    pass

        # C++ scanning
        elif language == 'C++':
            # Look inside CMakeLists.txt
            cmake_path = os.path.join(project_root, 'CMakeLists.txt')
            if os.path.exists(cmake_path):
                try:
                    with open(cmake_path, 'r', encoding='utf-8') as f:
                        content = f.read().lower()
                        if 'gtest' in content or 'googletest' in content:
                            return 'Google Test'
                        if 'catch2' in content:
                            return 'Catch2'
                        if 'boost' in content and 'test' in content:
                            return 'Boost.Test'
                except Exception:
                    pass

        return default_fw
