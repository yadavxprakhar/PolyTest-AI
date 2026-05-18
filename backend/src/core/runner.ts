import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface RunnerResult {
  status: string;
  passedCount: number;
  failedCount: number;
  durationSeconds: number;
  rawOutput: string;
}

export class TestRunner {
  private tempDir: string;

  constructor() {
    this.tempDir = path.resolve('cache');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Spawns sandboxed subprocess runner frameworks and returns structured metrics.
   */
  run(testFilePath: string, language: string, framework: string, sourceFilePath?: string): RunnerResult {
    const absTest = path.resolve(testFilePath);
    if (!fs.existsSync(absTest)) {
      return { status: 'error', passedCount: 0, failedCount: 0, durationSeconds: 0, rawOutput: `Test file not found: ${testFilePath}` };
    }

    const langLower = language.toLowerCase().trim();

    switch (langLower) {
      case 'python':
        return this.runPython(absTest, sourceFilePath);
      case 'javascript':
      case 'typescript':
        return this.runJavaScript(absTest);
      case 'go':
        return this.runGo(absTest, sourceFilePath);
      case 'c++':
        return this.runCpp(absTest, sourceFilePath);
      case 'java':
        return this.runJava(absTest);
      default:
        return { status: 'error', passedCount: 0, failedCount: 0, durationSeconds: 0, rawOutput: `Subprocess runner not implemented in Node.js for: ${language}` };
    }
  }

  private runPython(testFilePath: string, sourceFilePath?: string): RunnerResult {
    const binary = this.findExecutable('pytest') ? 'pytest' : 'python3';
    const args = binary === 'pytest' ? ['-v', testFilePath] : ['-m', 'pytest', '-v', testFilePath];

    // Dynamic PYTHONPATH injection
    const envOverrides: Record<string, string> = { ...process.env } as Record<string, string>;
    if (sourceFilePath && fs.existsSync(sourceFilePath)) {
      const srcDir = path.dirname(path.resolve(sourceFilePath));
      envOverrides['PYTHONPATH'] = srcDir;
    }

    const res = this.executeSubprocess(binary, args, envOverrides, 15, 'pytest');
    if (res.status === 'error') return res;

    const log = res.rawOutput;
    let passed = 0;
    let failed = 0;
    let duration = 0.0;

    const durationMatch = /in\s+([\d.]+)\s*s/.exec(log);
    if (durationMatch) duration = parseFloat(durationMatch[1]);

    const passedMatch = /(\d+)\s+passed/.exec(log);
    if (passedMatch) passed = parseInt(passedMatch[1], 10);

    const failedMatch = /(\d+)\s+failed/.exec(log);
    if (failedMatch) failed = parseInt(failedMatch[1], 10);

    if (log.includes('collected 0 items') || log.includes('errors during collection')) {
      return { status: 'error', passedCount: 0, failedCount: 0, durationSeconds: duration, rawOutput: log };
    }

    const status = (failed === 0 && passed > 0) ? 'passed' : 'failed';
    return { status, passedCount: passed, failedCount: failed, durationSeconds: duration, rawOutput: log };
  }

  private runJavaScript(testFilePath: string): RunnerResult {
    const binary = this.findExecutable('npx') ? 'npx' : 'jest';
    const args = binary === 'npx' ? ['jest', testFilePath, '--colors=false'] : [testFilePath, '--colors=false'];

    const res = this.executeSubprocess(binary, args, undefined, 20, 'Jest');
    if (res.status === 'error') return res;

    const log = res.rawOutput;
    let passed = 0;
    let failed = 0;
    let duration = 0.0;

    const summaryMatch = /Tests:\s*(?:(\d+)\s+failed,\s*)?(\d+)\s+passed,\s*\d+\s+total/.exec(log);
    if (summaryMatch) {
      if (summaryMatch[1]) failed = parseInt(summaryMatch[1], 10);
      passed = parseInt(summaryMatch[2], 10);
    } else {
      const allPassed = /Tests:\s*(\d+)\s+passed,\s*\d+\s+total/.exec(log);
      if (allPassed) passed = parseInt(allPassed[1], 10);

      const allFailed = /Tests:\s*(\d+)\s+failed,\s*\d+\s+total/.exec(log);
      if (allFailed) failed = parseInt(allFailed[1], 10);
    }

    const durationMatch = /Time:\s*([\d.]+)\s*s/.exec(log);
    if (durationMatch) duration = parseFloat(durationMatch[1]);

    if (log.toLowerCase().includes('jest') && log.toLowerCase().includes('no tests found')) {
      return { status: 'error', passedCount: 0, failedCount: 0, durationSeconds: duration, rawOutput: log };
    }

    const status = (failed === 0 && passed > 0) ? 'passed' : 'failed';
    return { status, passedCount: passed, failedCount: failed, durationSeconds: duration, rawOutput: log };
  }

  private runGo(testFilePath: string, sourceFilePath?: string): RunnerResult {
    if (!this.findExecutable('go')) {
      return this.makeMissingRunnerResult('Go toolchain');
    }

    if (!sourceFilePath || !fs.existsSync(sourceFilePath)) {
      return { status: 'error', passedCount: 0, failedCount: 0, durationSeconds: 0, rawOutput: 'Go runner requires companion source code file to compile test suites.' };
    }

    const res = this.executeSubprocess('go', ['test', '-v', sourceFilePath, testFilePath], undefined, 15, 'go test');
    if (res.status === 'error') return res;

    const log = res.rawOutput;
    const passed = (log.match(/--- PASS:/g) || []).length;
    const failed = (log.match(/--- FAIL:/g) || []).length;
    let duration = 0.0;

    const durationMatch = /([\d.]+)s\s*$/.exec(log.trim());
    if (durationMatch) duration = parseFloat(durationMatch[1]);

    let status = (failed === 0 && !log.includes('compile') && !log.includes('undefined')) ? 'passed' : 'failed';
    if (log.includes('compile') || log.includes('undefined')) {
      status = 'error';
    }

    return { status, passedCount: passed, failedCount: failed, durationSeconds: duration, rawOutput: log };
  }

  private runCpp(testFilePath: string, sourceFilePath?: string): RunnerResult {
    const compiler = this.findExecutable('g++') ? 'g++' : (this.findExecutable('clang++') ? 'clang++' : null);
    if (!compiler) {
      return this.makeMissingRunnerResult('g++ or clang++ compiler');
    }

    if (!sourceFilePath || !fs.existsSync(sourceFilePath)) {
      return { status: 'error', passedCount: 0, failedCount: 0, durationSeconds: 0, rawOutput: 'C++ runner requires companion source file to build executable binary.' };
    }

    const binaryPath = path.join(this.tempDir, 'temp_test_bin_node');
    const compRes = this.executeSubprocess(compiler, ['-std=c++17', sourceFilePath, testFilePath, '-lgtest', '-lgtest_main', '-lpthread', '-o', binaryPath], undefined, 12, 'C++ Compiler');

    if (compRes.status !== 'passed') {
      return { status: 'error', passedCount: 0, failedCount: 0, durationSeconds: 0, rawOutput: `C++ Compilation Failed:\n${compRes.rawOutput}` };
    }

    try {
      const runRes = this.executeSubprocess(binaryPath, [], undefined, 10, 'Google Test Execution');
      if (runRes.status === 'error') return runRes;

      const log = runRes.rawOutput;
      let passed = 0;
      let failed = 0;
      let duration = 0.0;

      const passedMatch = /\[\s*PASSED\s*\]\s*(\d+)\s+test/.exec(log);
      if (passedMatch) passed = parseInt(passedMatch[1], 10);

      const failedMatch = /\[\s*FAILED\s*\]\s*(\d+)\s+test/.exec(log);
      if (failedMatch) failed = parseInt(failedMatch[1], 10);

      const durationMatch = /\(\s*(\d+)\s*ms\s+total\)/.exec(log);
      if (durationMatch) duration = parseFloat(durationMatch[1]) / 1000.0;

      const status = (failed === 0 && passed > 0) ? 'passed' : 'failed';
      return { status, passedCount: passed, failedCount: failed, durationSeconds: duration, rawOutput: log };
    } finally {
      try {
        if (fs.existsSync(binaryPath)) fs.unlinkSync(binaryPath);
      } catch {
        // Ignore binary deletion fail
      }
    }
  }

  private runJava(testFilePath: string): RunnerResult {
    if (!this.findExecutable('mvn') || !fs.existsSync('pom.xml')) {
      return { status: 'error', passedCount: 0, failedCount: 0, durationSeconds: 0, rawOutput: "JUnit runner requires Maven ('mvn') and a valid root pom.xml in workspace." };
    }

    const className = path.basename(testFilePath, '.java');
    const res = this.executeSubprocess('mvn', ['test', `-Dtest=${className}`], undefined, 30, 'Maven JUnit');
    if (res.status === 'error') return res;

    const log = res.rawOutput;
    let passed = 0;
    let failed = 0;
    let duration = 0.0;

    const reportMatch = /Tests\s+run:\s*(\d+),\s*Failures:\\s*(\d+),\s*Errors:\\s*(\d+),\s*Skipped:\\s*\d+,\s*Time\s+elapsed:\s*([\d.]+)\s*s/.exec(log);
    if (reportMatch) {
      const total = parseInt(reportMatch[1], 10);
      const failures = parseInt(reportMatch[2], 10);
      const errors = parseInt(reportMatch[3], 10);
      duration = parseFloat(reportMatch[4]);

      failed = failures + errors;
      passed = Math.max(0, total - failed);
    }

    let status = (failed === 0 && passed > 0) ? 'passed' : 'failed';
    if (log.toLowerCase().includes('compilation failure') || log.toLowerCase().includes('build failure') && passed === 0) {
      status = 'error';
    }

    return { status, passedCount: passed, failedCount: failed, durationSeconds: duration, rawOutput: log };
  }

  private executeSubprocess(binary: string, args: string[], envOverrides?: Record<string, string>, timeoutSeconds = 15, label = 'Process'): RunnerResult {
    const environment = envOverrides ? envOverrides : process.env;
    const res = spawnSync(binary, args, {
      env: environment,
      timeout: timeoutSeconds * 1000,
      encoding: 'utf-8'
    });

    if (res.error) {
      return { status: 'error', passedCount: 0, failedCount: 0, durationSeconds: 0, rawOutput: `Exception starting ${label} subprocess: ${res.error.message}` };
    }

    const status = (res.status === 0) ? 'passed' : 'failed';
    return { status, passedCount: 0, failedCount: 0, durationSeconds: 0, rawOutput: (res.stdout || res.stderr || '').trim() };
  }

  private findExecutable(name: string): boolean {
    const isWin = os.platform() === 'win32';
    const lookup = isWin ? 'where' : 'which';
    const res = spawnSync(lookup, [name], { encoding: 'utf-8' });
    return res.status === 0;
  }

  private makeMissingRunnerResult(runnerName: string): RunnerResult {
    return {
      status: 'error',
      passedCount: 0,
      failedCount: 0,
      durationSeconds: 0,
      rawOutput: `Warning: Host environment binary or testing runner '${runnerName}' not detected in system path. Skipped execution.`
    };
  }
}
