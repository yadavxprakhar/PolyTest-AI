import json
from typing import Dict, Any

class PromptBuilder:
    """Builds highly optimized, language and framework-aware prompt payloads for the LLM."""

    def build_system_instruction(self, context: Dict[str, Any]) -> str:
        language = context["language"]
        framework = context["framework"]
        
        instruction = f"""You are a world-class principal software quality engineer specializing in test-driven development, static code analysis, and writing robust, comprehensive unit tests.

Your target is a {language} codebase, and you MUST generate tests using the **{framework}** framework.

Follow these CRITICAL testing paradigms:
1. **Isolation**: Unit tests must run in isolation. Mock all external dependencies, databases, API calls, and heavy network/disk I/O using framework-specific standard mocking practices (e.g. mock packages, dependency injection stubs).
2. **Coverage Dimensions**:
   - **Happy Path**: Test successful operations with valid inputs.
   - **Edge Cases**: Test empty arrays/lists, null/None/nil/undefined values, extreme boundaries (min/max values), overflow thresholds, special characters.
   - **Error Handling**: Test invalid inputs, exception throwing, and graceful failure recoveries.
   - **Async/Concurrent Operations**: If functions are async, implement proper async test structures.
3. **Idiomatic Style**: Write clean, modern, fully commented, and self-documenting test cases. Adhere to naming conventions (e.g., test methods should describe the expected outcome).
4. **Valid Code Only**: Output ONLY valid, compilable/runnable {language} test code. Wrap your final code block in standard markdown ```{language.lower()}...``` formatting. Do NOT include conversational explanations outside of the code block.
"""
        return instruction

    def build_user_prompt(self, context: Dict[str, Any]) -> str:
        # Simplify structural info for prompt context
        struct_summary = {
            "classes": [{"name": c["name"], "methods": [m["name"] for m in c["methods"]]} for c in context["structure"]["classes"]],
            "functions": [f["name"] for f in context["structure"]["functions"]],
            "imports": context["imports"]
        }
        
        prompt = f"""Generate a comprehensive test suite for the file: '{context["file_name"]}'
Language: {context["language"]}
Testing Framework: {context["framework"]}
Module Type: {context["component_type"]}
Heuristic Complexity: {context["complexity"]}

---------------- CODE STRUCTURE METADATA ----------------
Classes & Methods:
{json.dumps(struct_summary, indent=2)}

---------------- IMPLEMENTATION GUIDELINES ----------------
For this {context["language"]} file using {context["framework"]}, pay special attention to:
"""
        # Specific guidelines based on language
        lang_lower = context["language"].lower()
        if lang_lower == 'python':
            prompt += """- Use `pytest.fixture` for dependency setups and classes under test.
- Use `unittest.mock` (`Mock`, `patch`) for API mockups, I/O mockups, and database calls.
- Write tests in standard snake_case naming style.
"""
        elif lang_lower in ('javascript', 'typescript'):
            prompt += """- Use `describe` blocks to group tests per class/function.
- Use `beforeEach` to setup instances.
- Use `jest.mock()` or standard mock stubs for modules/API dependencies.
- Handle promises and async operations using `async/await` syntax.
"""
        elif lang_lower == 'c++':
            prompt += """- Use Google Test fixtures (`class TestFixture : public ::testing::Test`) where appropriate.
- Mock using Google Mock (`MOCK_METHOD`).
- Test edge conditions of pointers, buffers, or numeric variables.
"""
        elif lang_lower == 'java':
            prompt += """- Use JUnit 5 annotations (`@Test`, `@BeforeEach`, `@DisplayName`, `@ParameterizedTest`).
- Use Mockito (`@Mock`, `@InjectMocks`, `when().thenReturn()`) to mock external classes/interfaces.
- Follow camelCase test naming style.
"""
        elif lang_lower == 'go':
            prompt += """- Write standard Go testing methods: `func TestXxx(t *testing.T)`.
- Use the `github.com/stretchr/testify/assert` package for assertions.
- Leverage table-driven test patterns to handle parameterized test scenarios nicely.
"""
        elif lang_lower == 'c#':
            prompt += """- Write tests using xUnit `[Fact]` or `[Theory]` for parameterized cases.
- Use `Moq` library to mock interface dependencies.
- Adhere to clean C# PascalCase naming conventions.
"""

        prompt += f"""
---------------- SOURCE CODE ----------------
Here is the actual code to analyze and generate tests for:

```
{context["content"]}
```

Generate the full test suite code now. Wrap the generated code inside a single ```{context["language"].lower()} ... ``` code block.
"""
        return prompt
