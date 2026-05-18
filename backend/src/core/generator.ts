import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { LanguageDetector } from './detector';
import { SourceParser, ParseResult } from './parser';
import { SyntaxValidator } from './validator';
import { ConfigManager } from './config';
import { TestRunner, RunnerResult } from './runner';

export interface GenerationResponse {
  status: string;
  sourceFile: string;
  testFile: string | null;
  framework: string | null;
  cached: boolean;
  error: string | null;
  runResult?: RunnerResult;
}

export class TestGenerator {
  private provider: string;
  private model: string;
  private config: ConfigManager;
  private validator: SyntaxValidator;
  private cacheDir: string;

  constructor(providerOverride?: string, modelOverride?: string) {
    this.config = new ConfigManager();
    this.config.loadConfig();
    this.provider = providerOverride || this.config.get('llm.provider', 'mock');
    this.model = modelOverride || this.config.get('llm.model', 'gemini-1.5-flash');
    this.validator = new SyntaxValidator();
    this.cacheDir = path.resolve('cache');
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Generates a unit test suite, executes validator verification, and writes to disk.
   */
  async generateTest(
    sourceFilePath: string,
    outputDir: string,
    forcedFramework?: string,
    useCache = true
  ): Promise<GenerationResponse> {
    const absSrc = path.resolve(sourceFilePath);
    if (!fs.existsSync(absSrc)) {
      return { status: 'failed', sourceFile: sourceFilePath, testFile: null, framework: null, cached: false, error: `Source file not found: ${sourceFilePath}` };
    }

    // 1. Detect language & framework
    const detector = new LanguageDetector();
    const langInfo = detector.detect(absSrc);

    if (langInfo.language === 'Unsupported') {
      return { status: 'failed', sourceFile: sourceFilePath, testFile: null, framework: null, cached: false, error: `Extension or structure not supported: ${sourceFilePath}` };
    }

    const framework = forcedFramework || langInfo.framework;

    // 2. Parse code structure
    const parser = new SourceParser();
    const parseRes = parser.parse(absSrc, langInfo.language);

    // 3. Assemble prompt cache hash
    const prompt = this.buildPrompt(path.basename(absSrc), langInfo.language, framework, parseRes);
    const promptHash = crypto.createHash('md5').update(prompt).digest('hex');
    const cachePath = path.join(this.cacheDir, `${promptHash}.log`);

    // 4. Query caching layer
    if (useCache && fs.existsSync(cachePath)) {
      try {
        const cachedCode = fs.readFileSync(cachePath, 'utf-8');
        const testDest = this.writeTestFile(path.basename(absSrc), cachedCode, outputDir, langInfo.language);
        return { status: 'success', sourceFile: sourceFilePath, testFile: testDest, framework, cached: true, error: null };
      } catch {
        // Fallback to query
      }
    }

    // 5. Query LLM provider
    let generatedCode = '';
    try {
      if (this.provider.toLowerCase() === 'mock') {
        generatedCode = this.generateMockStub(path.basename(absSrc), langInfo.language, framework, parseRes);
      } else {
        generatedCode = await this.queryLLMApi(prompt);
      }
    } catch (err: any) {
      return { status: 'failed', sourceFile: sourceFilePath, testFile: null, framework, cached: false, error: `LLM query error: ${err.message}` };
    }

    // Clean markdown enclosures
    generatedCode = this.cleanMarkdownDecorators(generatedCode);

    // 6. Run syntax compiler linter check
    const valRes = this.validator.validate(generatedCode, langInfo.language);
    if (!valRes.isValid) {
      return { status: 'failed', sourceFile: sourceFilePath, testFile: null, framework, cached: false, error: `Linter validation failed: ${valRes.errorLog}` };
    }

    // 7. Save successful code block to cache
    try {
      fs.writeFileSync(cachePath, generatedCode, 'utf-8');
    } catch {
      // Ignore cache writes errors
    }

    // 8. Write code to target folder path
    try {
      const testDest = this.writeTestFile(path.basename(absSrc), generatedCode, outputDir, langInfo.language);
      return { status: 'success', sourceFile: sourceFilePath, testFile: testDest, framework, cached: false, error: null };
    } catch (err: any) {
      return { status: 'failed', sourceFile: sourceFilePath, testFile: null, framework, cached: false, error: `Failed to write test file: ${err.message}` };
    }
  }

  private buildPrompt(fileName: string, language: string, framework: string, parseRes: ParseResult): string {
    let sb = '';
    sb += 'You are PolyTest AI, an advanced multi-language test generator.\n';
    sb += `Generate a highly comprehensive, fully functional unit test suite in ${language} using the framework ${framework} for the file: '${fileName}'.\n\n`;
    sb += 'Analyzed code structure:\n';

    for (const cls of parseRes.classes) {
      sb += `- Class: ${cls.name} with methods: [${cls.methods.join(', ')}]\n`;
    }
    if (parseRes.functions.length > 0) {
      sb += `- Standalone functions: [${parseRes.functions.join(', ')}]\n`;
    }
    sb += `- Imports: [${parseRes.imports.join(', ')}]\n\n`;
    sb += 'Ensure you import the core class/functions perfectly. Return ONLY the written valid code without markdown wrapping blocks.';
    return sb;
  }

  private generateMockStub(fileName: string, language: string, framework: string, parseRes: ParseResult): string {
    const dotIdx = fileName.lastIndexOf('.');
    const baseName = dotIdx !== -1 ? fileName.substring(0, dotIdx) : fileName;
    const className = parseRes.classes.length === 0 ? 'SourceModule' : parseRes.classes[0].name;

    switch (language.toLowerCase()) {
      case 'python':
        return `# Generated automatically by PolyTest AI mock engine for ${fileName}
import pytest
from ${baseName} import ${className}

def test_initial_sanity():
    # Basic assertion checks
    assert True

def test_dynamic_mock_cases():
    # Mocking methods logic checks
    assert 1 == 1
`;
      case 'javascript':
      case 'typescript':
        return `// Generated automatically by PolyTest AI mock engine for ${fileName}
const { ${className} } = require('./${baseName}');

describe('Sanity Mock Test Suite', () => {
  test('should verify basic assertions', () => {
    expect(true).toBe(true);
  });
});
`;
      case 'go':
        return `package main
// Generated automatically by PolyTest AI mock engine for ${fileName}
import "testing"

func TestSanityCheck(t *testing.T) {
  if false {
    t.Errorf("Error during validation assertion")
  }
}
`;
      case 'java':
        return `package tests;
// Generated automatically by PolyTest AI mock engine for ${fileName}
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class ${className}Test {
  @Test
  public void testSanity() {
    assertTrue(true);
  }
}
`;
      case 'c++':
        return `// Generated automatically by PolyTest AI mock engine for ${fileName}
#include <gtest/gtest.h>
#include "${fileName}"

TEST(MockSanitySuite, TestTrue) {
  EXPECT_TRUE(true);
}
`;
      default:
        return `// Generated mock for: ${fileName}`;
    }
  }

  private async queryLLMApi(prompt: string): Promise<string> {
    let apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) apiKey = this.config.get('llm.api_key', '');

    if (!apiKey) {
      throw new Error(`API key not configured in process.env or polytest.yaml for provider ${this.provider}`);
    }

    let endpoint = '';
    let bodyData: any = {};

    if (this.provider.toLowerCase() === 'gemini') {
      endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`;
      bodyData = { contents: [{ parts: [{ text: prompt }] }] };
    } else if (this.provider.toLowerCase() === 'openai') {
      endpoint = 'https://api.openai.com/v1/chat/completions';
      bodyData = { model: this.model, messages: [{ role: 'user', content: prompt }] };
    } else {
      throw new Error(`Provider integration not supported in typescript port: ${this.provider}`);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`HTTP API response code ${response.status}:\n${errBody}`);
    }

    const data: any = await response.json();
    return this.parseLLMResponse(data);
  }

  private parseLLMResponse(data: any): string {
    if (this.provider.toLowerCase() === 'gemini') {
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (this.provider.toLowerCase() === 'openai') {
      return data?.choices?.[0]?.message?.content || '';
    }
    return JSON.stringify(data);
  }

  private writeTestFile(srcFileName: string, code: string, outputDir: string, language: string): string {
    const absDir = path.resolve(outputDir);
    if (!fs.existsSync(absDir)) {
      fs.mkdirSync(absDir, { recursive: true });
    }

    const dotIdx = srcFileName.lastIndexOf('.');
    const baseName = dotIdx !== -1 ? srcFileName.substring(0, dotIdx) : srcFileName;
    const ext = this.getExtension(language);
    let testFileName = '';

    if (language.toLowerCase() === 'python') {
      testFileName = `test_${baseName}${ext}`;
    } else if (language.toLowerCase() === 'javascript' || language.toLowerCase() === 'typescript') {
      testFileName = `${baseName}.test${ext}`;
    } else if (language.toLowerCase() === 'go') {
      testFileName = `${baseName}_test${ext}`;
    } else {
      testFileName = `${baseName}Test${ext}`;
    }

    const dest = path.join(absDir, testFileName);
    fs.writeFileSync(dest, code, 'utf-8');
    return dest;
  }

  private cleanMarkdownDecorators(code: string): string {
    return code.replace(/```[a-zA-Z]*\s*/g, '').replace(/```/g, '').trim();
  }

  private getExtension(language: string): string {
    switch (language.toLowerCase()) {
      case 'python': return '.py';
      case 'javascript': return '.js';
      case 'typescript': return '.ts';
      case 'go': return '.go';
      case 'java': return '.java';
      case 'c++': return '.cpp';
      case 'c#': return '.cs';
      default: return '.txt';
    }
  }
}
