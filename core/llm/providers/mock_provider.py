import re
from core.llm.providers import BaseLLMProvider

class MockProvider(BaseLLMProvider):
    """Generates highly customized, syntactically correct mock test suites completely offline."""

    def generate(self, prompt: str, system_instruction: str = "") -> str:
        # Extract target file name, language, and framework from the prompt using regex
        file_name_match = re.search(r'file(?:\s+name)?:\s*[\'"`]?([^\n\r\'"`]+)[\'"`]?', prompt, re.IGNORECASE)
        language_match = re.search(r'language:\s*([^\n\r]+)', prompt, re.IGNORECASE)
        framework_match = re.search(r'framework:\s*([^\n\r]+)', prompt, re.IGNORECASE)

        file_name = file_name_match.group(1).strip() if file_name_match else "source_file"
        language = language_match.group(1).strip() if language_match else "Python"
        framework = framework_match.group(1).strip() if framework_match else "pytest"

        # Extract class names from the JSON structure inside the prompt
        class_names = []
        classes_block = re.search(r'"classes":\s*\[(.*?)\]', prompt, re.DOTALL)
        if classes_block:
            class_names = re.findall(r'"name":\s*"([A-Za-z0-9_$]+)"', classes_block.group(1))
            
        # Extract function names from the JSON structure inside the prompt
        func_names = []
        funcs_block = re.search(r'"functions":\s*\[(.*?)\]', prompt, re.DOTALL)
        if funcs_block:
            func_names = re.findall(r'"([A-Za-z0-9_$]+)"', funcs_block.group(1))

        # Fallbacks for standard text patterns
        if not class_names:
            class_names = re.findall(r'Class:\s*([A-Za-z0-9_$]+)', prompt)
        if not func_names:
            func_names = re.findall(r'Function:\s*([A-Za-z0-9_$]+)', prompt)

        class_names = list(set(class_names))
        func_names = list(set(func_names))
        
        # If absolutely nothing was detected, use absolute safe defaults
        if not class_names and not func_names:
            class_names = ["Calculator"]
            func_names = ["add", "divide"]

        # Generate response based on language and framework
        lang_lower = language.lower()
        
        if lang_lower == 'python':
            return self._mock_python(file_name, framework, class_names, func_names)
        elif lang_lower in ('javascript', 'typescript'):
            is_ts = lang_lower == 'typescript'
            return self._mock_javascript_typescript(file_name, framework, class_names, func_names, is_ts)
        elif lang_lower == 'c++':
            return self._mock_cpp(file_name, framework, class_names, func_names)
        elif lang_lower == 'java':
            return self._mock_java(file_name, framework, class_names, func_names)
        elif lang_lower == 'go':
            return self._mock_go(file_name, framework, class_names, func_names)
        elif lang_lower == 'c#':
            return self._mock_csharp(file_name, framework, class_names, func_names)
        else:
            return self._mock_generic(file_name, language, framework)

    def _mock_python(self, file_name: str, framework: str, classes: list[str], functions: list[str]) -> str:
        module_name = file_name.replace('.py', '')
        
        code = f"""# AI-Generated Mock Test Suite for {file_name} using {framework}
# Created by PolyTest AI (Offline Mock Mode)

import pytest
from unittest.mock import Mock, patch
from {module_name} import {", ".join(classes + functions)}

"""
        # Unit tests for functions
        for func in functions:
            code += f"""def test_{func}_happy_path():
    \"\"\"Test {func} with standard valid input variables.\"\"\"
    # Arrange
    # TODO: Add standard inputs
    
    # Act
    # result = {func}()
    
    # Assert
    # assert result is not None
    assert True

def test_{func}_edge_cases():
    \"\"\"Test {func} under extreme boundary inputs.\"\"\"
    # Arrange
    # Test with None, empty strings, or numeric boundaries
    
    # Assert
    assert True

def test_{func}_error_handling():
    \"\"\"Test {func} exception raising and clean recovery.\"\"\"
    with pytest.raises(Exception):
        # Act
        # {func}(None)
        raise ValueError("Simulated input validation failure")

"""
        # Unit tests for classes
        for cls in classes:
            code += f"""class Test{cls}:
    @pytest.fixture
    def mock_dependency(self):
        \"\"\"Set up mock dependencies for {cls}.\"\"\"
        return Mock()

    @pytest.fixture
    def target_instance(self, mock_dependency):
        \"\"\"Create instance of {cls} to test.\"\"\"
        return {cls}()

    def test_{cls.lower()}_initialization(self, target_instance):
        \"\"\"Verify standard object instantiation and properties.\"\"\"
        assert target_instance is not None

    def test_{cls.lower()}_business_logic_flow(self, target_instance):
        \"\"\"Verify core behavioral pathways for {cls}.\"\"\"
        # Arrange
        # Act
        # Assert
        assert True
"""
        return f"```python\n{code}\n```"

    def _mock_javascript_typescript(self, file_name: str, framework: str, classes: list[str], functions: list[str], is_ts: bool) -> str:
        module_name = file_name.replace('.tsx', '').replace('.ts', '').replace('.jsx', '').replace('.js', '')
        
        code = f"""// AI-Generated Mock Test Suite for {file_name} using {framework}
// Created by PolyTest AI (Offline Mock Mode)

"""
        if is_ts:
            code += f"import {{ {', '.join(classes + functions)} }} from './{module_name}';\n\n"
        else:
            code += f"const {{ {', '.join(classes + functions)} }} = require('./{module_name}');\n\n"

        for func in functions:
            code += f"""describe('{func}', () => {{
  test('should execute happy path successfully', () => {{
    // Arrange
    // Act
    // const result = {func}();
    // Assert
    expect(true).toBe(true);
  }});

  test('should handle edge cases and boundary parameters', () => {{
    // Arrange
    // Act
    expect(true).toBe(true);
  }});

  test('should reject malformed or invalid inputs', () => {{
    // Arrange
    expect(() => {{
      // {func}(null);
    }}).toThrow();
  }});
}});

"""

        for cls in classes:
            code += f"""describe('{cls}', () => {{
  let instance{cls};

  beforeEach(() => {{
    // Setup mock environment
    instance{cls} = new {cls}();
  }});

  test('should instantiate successfully with proper lifecycle', () => {{
    expect(instance{cls}).toBeDefined();
  }});

  test('should perform operations matching class rules', () => {{
    // Arrange
    // Act
    // Assert
    expect(true).toBe(true);
  }});
}});

"""
        return f"```javascript\n{code}\n```"

    def _mock_cpp(self, file_name: str, framework: str, classes: list[str], functions: list[str]) -> str:
        header_name = file_name.replace('.cpp', '.h').replace('.cc', '.h')
        
        code = f"""// AI-Generated Mock Test Suite for {file_name} using {framework}
// Created by PolyTest AI (Offline Mock Mode)

#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include "{header_name}"

using namespace testing;

"""
        for func in functions:
            code += f"""TEST({func}Test, HappyPath) {{
    // Arrange
    // Act
    // auto result = {func}();
    // Assert
    EXPECT_TRUE(true);
}}

TEST({func}Test, EdgeCases) {{
    // Verify boundaries, zeros, and overflows
    EXPECT_TRUE(true);
}}

"""

        for cls in classes:
            code += f"""class {cls}TestFixture : public Test {{
protected:
    void SetUp() override {{
        // Setup class under test
    }}

    void TearDown() override {{
        // Cleanup resources
    }}
}};

TEST_F({cls}TestFixture, VerifyInstantiationAndSetup) {{
    {cls} testInstance;
    EXPECT_NE(&testInstance, nullptr);
}}

TEST_F({cls}TestFixture, ExecutionLogicFlow) {{
    // Arrange
    // Act
    // Assert
    EXPECT_TRUE(true);
}}
"""
        return f"```cpp\n{code}\n```"

    def _mock_java(self, file_name: str, framework: str, classes: list[str], functions: list[str]) -> str:
        class_under_test = classes[0] if classes else "MyService"
        
        code = f"""// AI-Generated Mock Test Suite for {file_name} using {framework}
// Created by PolyTest AI (Offline Mock Mode)

package com.polytest.generated;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class {class_under_test}Test {{

    private {class_under_test} targetInstance;

    @BeforeEach
    void setUp() {{
        // Initialize mock contexts
        targetInstance = new {class_under_test}();
    }}

    @Test
    @DisplayName("Verify successful initialization and state")
    void testInitialization() {{
        assertNotNull(targetInstance);
    }}

    @Test
    @DisplayName("Verify core processing logic")
    void testCoreBusinessLogic() {{
        // Arrange
        // Act
        // Assert
        assertTrue(true);
    }}

    @Test
    @DisplayName("Verify error handling constraints")
    void testInvalidParameters() {{
        assertThrows(IllegalArgumentException.class, () -> {{
            // targetInstance.process(null);
            throw new IllegalArgumentException("Invalid state");
        }});
    }}
}}
"""
        return f"```java\n{code}\n```"

    def _mock_go(self, file_name: str, framework: str, classes: list[str], functions: list[str]) -> str:
        code = f"""// AI-Generated Mock Test Suite for {file_name} using {framework}
// Created by PolyTest AI (Offline Mock Mode)

package main_test

import (
\t"testing"
\t"github.com/stretchr/testify/assert"
)

"""
        for func in functions:
            code += f"""func Test{func}_HappyPath(t *testing.T) {{
\t// Arrange
\t
\t// Act
\t// result := {func}()
\t
\t// Assert
\tassert.True(t, true)
}}

func Test{func}_EdgeCases(t *testing.T) {{
\t// Test boundaries
\tassert.True(t, true)
}}
"""
        for cls in classes:
            code += f"""func Test{cls}_Lifecycle(t *testing.T) {{
\t// Arrange
\t// instance := &{cls}{{}}
\t
\t// Assert
\tassert.True(t, true)
}}
"""
        return f"```go\n{code}\n```"

    def _mock_csharp(self, file_name: str, framework: str, classes: list[str], functions: list[str]) -> str:
        class_under_test = classes[0] if classes else "MyService"
        
        code = f"""// AI-Generated Mock Test Suite for {file_name} using {framework}
// Created by PolyTest AI (Offline Mock Mode)

using Xunit;
using Moq;
using System;

namespace PolyTest.Generated.Tests
{{
    public class {class_under_test}Tests
    {{
        private readonly {class_under_test} _targetInstance;

        public {class_under_test}Tests()
        {{
            // Setup mock requirements
            _targetInstance = new {class_under_test}();
        }}

        [Fact]
        public void TestInitialization_Success()
        {{
            Assert.NotNull(_targetInstance);
        }}

        [Fact]
        public void TestCoreLogic_Success()
        {{
            // Arrange
            // Act
            // Assert
            Assert.True(true);
        }}
    }}
}}
"""
        return f"```csharp\n{code}\n```"

    def _mock_generic(self, file_name: str, language: str, framework: str) -> str:
        return f"""// Mock Test cases generated for {file_name} in {language}
// Using {framework} framework
// Add real testing structures here...
"""
