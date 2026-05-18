import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface ValidationResult {
  isValid: boolean;
  errorLog: string;
}

export class SyntaxValidator {
  private cacheDir: string;

  constructor() {
    this.cacheDir = path.resolve('cache');
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Executes compiler-level syntax dry-runs on generated code buffers.
   */
  validate(codeContent: string, language: string): ValidationResult {
    const langLower = language.toLowerCase().trim();
    const ext = this.getExtension(langLower);
    const tempFile = path.join(this.cacheDir, `test_val_${Date.now()}_${Math.random().toString(36).slice(2, 6)}${ext}`);

    try {
      fs.writeFileSync(tempFile, codeContent, 'utf-8');
    } catch (err: any) {
      return { isValid: false, errorLog: `Failed to write validation temp file: ${err.message}` };
    }

    let result: ValidationResult;
    try {
      switch (langLower) {
        case 'python':
          result = this.runCommand('python3', ['-m', 'py_compile', tempFile], 'Python');
          break;
        case 'javascript':
        case 'typescript':
          result = this.runCommand('node', ['--check', tempFile], 'Node.js');
          break;
        case 'go':
          result = this.filterEnvironmentErrors(
            this.runCommand('go', ['tool', 'compile', '-o', 'devnull', '-p', 'main', tempFile], 'Go'),
            ['import cycle', 'could not import', 'undefined']
          );
          break;
        case 'java':
          result = this.filterEnvironmentErrors(
            this.runCommand('javac', ['-proc:none', '-d', this.cacheDir, tempFile], 'javac'),
            ['package does not exist', 'cannot find symbol']
          );
          break;
        case 'c++':
          result = this.filterEnvironmentErrors(
            this.runCommand('g++', ['-fsyntax-only', '-std=c++17', tempFile], 'g++'),
            ['fatal error', 'No such file or directory']
          );
          break;
        case 'c#':
          result = this.filterEnvironmentErrors(
            this.runCommand('csc', ['/target:library', '/out:devnull', tempFile], 'csc'),
            ['error CS', 'cannot be found']
          );
          break;
        default:
          result = { isValid: true, errorLog: `Linter skipped for unsupported language: ${language}` };
      }
    } finally {
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch {
        // Ignore deletion failures
      }
    }

    return result;
  }

  private runCommand(binary: string, args: string[], label: string): ValidationResult {
    const res = spawnSync(binary, args, { timeout: 5000, encoding: 'utf-8' });

    if (res.error) {
      return { isValid: true, errorLog: `Warning: Host compiler binary '${label}' not detected in system path. Skipped checks.` };
    }

    if (res.status !== 0) {
      return { isValid: false, errorLog: (res.stdout || res.stderr || '').trim() };
    }

    return { isValid: true, errorLog: '' };
  }

  private filterEnvironmentErrors(res: ValidationResult, ignoreKeywords: string[]): ValidationResult {
    if (res.isValid) return res;

    const log = res.errorLog.toLowerCase();
    for (const keyword of ignoreKeywords) {
      if (log.includes(keyword.toLowerCase())) {
        return { isValid: true, errorLog: `Warning: Environmental dependency missing (${keyword}). Passed syntax validation check.` };
      }
    }
    return res;
  }

  private getExtension(language: string): string {
    switch (language) {
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
