package com.polytest.core;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TestGenerator {

    public record GenerationResponse(String status, String sourceFile, String testFile, String framework, boolean cached, String error) {}

    private final String provider;
    private final String model;
    private final ConfigManager config;
    private final SyntaxValidator validator;
    private final String cacheDir = "cache";

    public TestGenerator(String providerOverride, String modelOverride) {
        this.config = new ConfigManager();
        this.config.loadConfig();
        this.provider = providerOverride != null ? providerOverride : config.get("llm.provider", "mock");
        this.model = modelOverride != null ? modelOverride : config.get("llm.model", "gemini-1.5-flash");
        this.validator = new SyntaxValidator();
        new File(cacheDir).mkdirs();
    }

    /**
     * Generates a unit test suite for the target source file, validates it, and writes it to disk.
     */
    public GenerationResponse generateTest(String sourceFilePath, String outputDir, String forcedFramework, boolean useCache) {
        File srcFile = new File(sourceFilePath);
        if (!srcFile.exists()) {
            return new GenerationResponse("failed", sourceFilePath, null, null, false, "Source file not found: " + sourceFilePath);
        }

        // 1. Detect language and target framework
        LanguageDetector detector = new LanguageDetector();
        LanguageDetector.LanguageInfo langInfo = detector.detect(sourceFilePath);
        
        if (langInfo.language().equals("Unsupported")) {
            return new GenerationResponse("failed", sourceFilePath, null, null, false, "Extension or structure not supported: " + sourceFilePath);
        }

        String framework = forcedFramework != null ? forcedFramework : langInfo.framework();

        // 2. Parse source structure
        SourceParser parser = new SourceParser();
        SourceParser.ParseResult parseRes = parser.parse(sourceFilePath, langInfo.language());

        // 3. Assemble LLM Prompt
        String prompt = buildPrompt(srcFile.getName(), langInfo.language(), framework, parseRes);
        String promptHash = getMd5Hash(prompt);
        Path cachePath = Paths.get(cacheDir, promptHash + ".log");

        // 4. Query caching layer
        if (useCache && Files.exists(cachePath)) {
            try {
                String cachedCode = Files.readString(cachePath);
                String testDest = writeTestFile(srcFile.getName(), cachedCode, outputDir, langInfo.language());
                return new GenerationResponse("success", sourceFilePath, testDest, framework, true, null);
            } catch (IOException e) {
                // Fail-over to API query
            }
        }

        // 5. Query LLM provider
        String generatedCode;
        try {
            if (provider.equalsIgnoreCase("mock")) {
                generatedCode = generateMockStub(srcFile.getName(), langInfo.language(), framework, parseRes);
            } else {
                generatedCode = queryLLMApi(prompt);
            }
        } catch (Exception e) {
            return new GenerationResponse("failed", sourceFilePath, null, framework, false, "LLM query error: " + e.getMessage());
        }

        // Clean generated markdown decorators
        generatedCode = cleanMarkdownDecorators(generatedCode);

        // 6. Run syntax linter check
        SyntaxValidator.ValidationResult valRes = validator.validate(generatedCode, langInfo.language());
        if (!valRes.isValid()) {
            return new GenerationResponse("failed", sourceFilePath, null, framework, false, "Linter validation failed: " + valRes.errorLog());
        }

        // 7. Write to cache
        try {
            Files.writeString(cachePath, generatedCode);
        } catch (IOException e) {
            // Ignore cache write errors
        }

        // 8. Write to target destination folder
        try {
            String testDest = writeTestFile(srcFile.getName(), generatedCode, outputDir, langInfo.language());
            return new GenerationResponse("success", sourceFilePath, testDest, framework, false, null);
        } catch (IOException e) {
            return new GenerationResponse("failed", sourceFilePath, null, framework, false, "Failed to write target test file: " + e.getMessage());
        }
    }

    private String buildPrompt(String fileName, String language, String framework, SourceParser.ParseResult parseRes) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are PolyTest AI, an advanced multi-language test generator.\n");
        sb.append("Generate a highly comprehensive, fully functional unit test suite in ").append(language);
        sb.append(" using the framework ").append(framework).append(" for the file: '").append(fileName).append("'.\n\n");
        
        sb.append("Analyzed code structure:\n");
        for (SourceParser.ClassInfo cls : parseRes.classes()) {
            sb.append("- Class: ").append(cls.name()).append(" with methods: ").append(cls.methods()).append("\n");
        }
        if (!parseRes.functions().isEmpty()) {
            sb.append("- Standalone functions: ").append(parseRes.functions()).append("\n");
        }
        sb.append("- Imports: ").append(parseRes.imports()).append("\n\n");
        
        sb.append("Ensure you import the core class/functions perfectly. Return ONLY the written valid code without markdown wrapping blocks.");
        return sb.toString();
    }

    private String generateMockStub(String fileName, String language, String framework, SourceParser.ParseResult parseRes) {
        String baseName = fileName.substring(0, fileName.lastIndexOf('.'));
        String className = parseRes.classes().isEmpty() ? "SourceModule" : parseRes.classes().get(0).name();
        
        switch (language.toLowerCase()) {
            case "python":
                return String.format("""
                    # Generated automatically by PolyTest AI mock engine for %s
                    import pytest
                    from %s import %s
                    
                    def test_initial_sanity():
                        # Basic assertion checks
                        assert True
                    
                    def test_dynamic_mock_cases():
                        # Mocking methods logic checks
                        assert 1 == 1
                    """, fileName, baseName, className);
            case "javascript":
            case "typescript":
                return String.format("""
                    // Generated automatically by PolyTest AI mock engine for %s
                    const { %s } = require('./%s');
                    
                    describe('Sanity Mock Test Suite', () => {
                        test('should verify basic assertions', () => {
                            expect(true).toBe(true);
                        });
                    });
                    """, fileName, className, baseName);
            case "go":
                return String.format("""
                    package main
                    // Generated automatically by PolyTest AI mock engine for %s
                    import "testing"
                    
                    func TestSanityCheck(t *testing.T) {
                        if false {
                            t.Errorf("Error during validation assertion")
                        }
                    }
                    """, fileName);
            case "java":
                return String.format("""
                    package tests;
                    // Generated automatically by PolyTest AI mock engine for %s
                    import org.junit.jupiter.api.Test;
                    import static org.junit.jupiter.api.Assertions.*;
                    
                    public class %sTest {
                        @Test
                        public void testSanity() {
                            assertTrue(true);
                        }
                    }
                    """, fileName, className);
            case "c++":
                return String.format("""
                    // Generated automatically by PolyTest AI mock engine for %s
                    #include <gtest/gtest.h>
                    #include "%s"
                    
                    TEST(MockSanitySuite, TestTrue) {
                        EXPECT_TRUE(true);
                    }
                    """, fileName, fileName);
            default:
                return "// Generated mock for: " + fileName;
        }
    }

    private String queryLLMApi(String prompt) throws Exception {
        // Native Java 11 HTTP client queries
        String apiKey = System.getenv("GEMINI_API_KEY");
        if (apiKey == null) apiKey = config.get("llm.api_key", "");
        
        if (apiKey.isEmpty()) {
            throw new IllegalStateException("API key not configured in environment or polytest.yaml for provider " + provider);
        }

        String endpoint = "";
        String jsonPayload = "";
        
        if (provider.equalsIgnoreCase("gemini")) {
            endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;
            jsonPayload = String.format("{\"contents\": [{\"parts\": [{\"text\": \"%s\"}]}]}", escapeJson(prompt));
        } else if (provider.equalsIgnoreCase("openai")) {
            endpoint = "https://api.openai.com/v1/chat/completions";
            jsonPayload = String.format("{\"model\": \"%s\", \"messages\": [{\"role\": \"user\", \"content\": \"%s\"}]}", model, escapeJson(prompt));
        } else {
            throw new IllegalArgumentException("Provider integrations not supported in java port: " + provider);
        }

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new IOException("HTTP API response code " + response.statusCode() + ":\n" + response.body());
        }

        return parseLLMResponse(response.body());
    }

    private String parseLLMResponse(String body) {
        // Safe, native parsing without heavy JSON parsers
        if (provider.equalsIgnoreCase("gemini")) {
            Matcher matcher = Pattern.compile("\"text\"\\s*:\\s*\"(.*?)\"").matcher(body);
            if (matcher.find()) {
                return unescapeJson(matcher.group(1));
            }
        } else if (provider.equalsIgnoreCase("openai")) {
            Matcher matcher = Pattern.compile("\"content\"\\s*:\\s*\"(.*?)\"").matcher(body);
            if (matcher.find()) {
                return unescapeJson(matcher.group(1));
            }
        }
        return body;
    }

    private String writeTestFile(String srcFileName, String code, String outputDir, String language) throws IOException {
        new File(outputDir).mkdirs();
        
        String baseName = srcFileName.substring(0, srcFileName.lastIndexOf('.'));
        String ext = getExtension(language);
        String testFileName;

        if (language.equalsIgnoreCase("python")) {
            testFileName = "test_" + baseName + ext;
        } else if (language.equalsIgnoreCase("javascript") || language.equalsIgnoreCase("typescript")) {
            testFileName = baseName + ".test" + ext;
        } else if (language.equalsIgnoreCase("go")) {
            testFileName = baseName + "_test" + ext;
        } else {
            testFileName = baseName + "Test" + ext;
        }

        Path dest = Paths.get(outputDir, testFileName);
        Files.writeString(dest, code);
        return dest.toAbsolutePath().toString();
    }

    private String cleanMarkdownDecorators(String code) {
        return code.replaceAll("(?s)```[a-zA-Z]*\\s*", "").replaceAll("```", "").trim();
    }

    private String escapeJson(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private String unescapeJson(String s) {
        return s.replace("\\n", "\n")
                .replace("\\r", "\r")
                .replace("\\\"", "\"")
                .replace("\\\\", "\\");
    }

    private String getMd5Hash(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hashBytes = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return String.valueOf(input.hashCode());
        }
    }

    private String getExtension(String language) {
        switch (language.toLowerCase()) {
            case "python": return ".py";
            case "javascript": return ".js";
            case "typescript": return ".ts";
            case "go": return ".go";
            case "java": return ".java";
            case "c++": return ".cpp";
            case "c#": return ".cs";
            default: return ".txt";
        }
    }
}
