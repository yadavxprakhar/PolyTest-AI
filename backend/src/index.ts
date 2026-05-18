import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { LanguageDetector } from './core/detector';
import { SourceParser } from './core/parser';
import { ConfigManager } from './core/config';
import { TestGenerator, GenerationResponse } from './core/generator';
import { TestRunner } from './core/runner';

const app = express();
const PORT = 8000;
const VERSION = '1.0.0';

// Middlewares
app.use(cors());
app.use(express.json());

// --- Core Routes ---

app.get('/', (req: Request, res: Response) => {
  res.json({
    app: 'PolyTest AI REST Engine (Node.js TypeScript Port)',
    status: 'online',
    version: VERSION,
    documentation: '/docs',
    paradigms: ['Static Analysis', 'AI Generation', 'Syntax Validation', 'Subprocess Execution']
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    platform: os.type(),
    node_version: process.version,
    binaries_detected: {
      node: isBinaryPresent('node'),
      javac: isBinaryPresent('javac'),
      gpp: isBinaryPresent('g++'),
      go: isBinaryPresent('go'),
      dotnet: isBinaryPresent('dotnet')
    }
  });
});

app.post('/api/v1/init', (req: Request, res: Response) => {
  const { project_dir } = req.body;
  const projectRoot = project_dir || process.cwd();

  try {
    const configPath = path.join(projectRoot, 'polytest.yaml');
    const manager = new ConfigManager(configPath);
    manager.saveConfig();

    res.json({
      status: 'success',
      message: 'Successfully initialized local polytest.yaml settings in Node.js backend.',
      config_path: configPath
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', detail: err.message });
  }
});

app.post('/api/v1/detect', (req: Request, res: Response) => {
  const { project_dir } = req.body;
  const projectRoot = project_dir || process.cwd();

  if (!fs.existsSync(projectRoot)) {
    res.status(404).json({ status: 'error', detail: `Target directory does not exist: ${projectRoot}` });
    return;
  }

  try {
    const detector = new LanguageDetector();
    const filesFound: Array<{ file_path: string; language: string; framework: string }> = [];
    scanDirectory(projectRoot, detector, filesFound);

    res.json({
      status: 'success',
      project_root: path.resolve(projectRoot),
      files_found: filesFound
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', detail: err.message });
  }
});

app.post('/api/v1/analyze', (req: Request, res: Response) => {
  const { file_path } = req.body;

  if (!file_path) {
    res.status(400).json({ status: 'error', detail: 'Missing parameter: file_path' });
    return;
  }

  const absPath = path.resolve(file_path);
  if (!fs.existsSync(absPath)) {
    res.status(404).json({ status: 'error', detail: `Target source file not found: ${file_path}` });
    return;
  }

  try {
    const detector = new LanguageDetector();
    const info = detector.detect(absPath);

    if (info.language === 'Unsupported') {
      res.status(400).json({ status: 'error', detail: `File extension or structure is unsupported: ${file_path}` });
      return;
    }

    const parser = new SourceParser();
    const structure = parser.parse(absPath, info.language);

    res.json({
      status: 'success',
      file_path: absPath,
      language: info.language,
      detected_framework: info.framework,
      structure
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', detail: err.message });
  }
});

app.post('/api/v1/generate', async (req: Request, res: Response) => {
  const { path: targetPath, provider, model, framework: forcedFramework, output_dir, mock, no_cache, run } = req.body;

  if (!targetPath) {
    res.status(400).json({ status: 'error', detail: 'Missing parameter: path' });
    return;
  }

  const absTarget = path.resolve(targetPath);
  if (!fs.existsSync(absTarget)) {
    res.status(404).json({ status: 'error', detail: `Target path not found: ${targetPath}` });
    return;
  }

  const selectedProvider = mock ? 'mock' : provider;
  const outputDir = output_dir || 'tests';

  try {
    const generator = new TestGenerator(selectedProvider, model);
    const results: GenerationResponse[] = [];
    const filesToProcess: string[] = [];

    const stats = fs.statSync(absTarget);
    if (stats.isFile()) {
      filesToProcess.push(absTarget);
    } else {
      collectFiles(absTarget, filesToProcess);
    }

    if (filesToProcess.length === 0) {
      res.status(400).json({ status: 'error', detail: `No supportable source files located under: ${targetPath}` });
      return;
    }

    for (const file of filesToProcess) {
      const genRes = await generator.generateTest(
        file,
        outputDir,
        forcedFramework,
        !no_cache
      );

      const responseMap: any = {
        status: genRes.status,
        source_file: genRes.sourceFile,
        test_file: genRes.testFile,
        framework: genRes.framework,
        cached: genRes.cached,
        error: genRes.error
      };

      // Unified execution: generate + run immediately
      if (run && genRes.status === 'success' && genRes.testFile) {
        const runner = new TestRunner();
        const detector = new LanguageDetector();
        const info = detector.detect(file);

        const runRes = runner.run(
          genRes.testFile,
          info.language,
          genRes.framework || info.framework,
          file
        );

        responseMap.run_result = runRes;
      }

      results.push(responseMap);
    }

    res.json({ status: 'success', results });
  } catch (err: any) {
    res.status(500).json({ status: 'error', detail: err.message });
  }
});

app.post('/api/v1/run', (req: Request, res: Response) => {
  const { test_file_path, language, framework, source_file_path } = req.body;

  if (!test_file_path || !language || !framework) {
    res.status(400).json({ status: 'error', detail: 'Missing parameters: test_file_path, language, and framework are required.' });
    return;
  }

  try {
    const runner = new TestRunner();
    const runRes = runner.run(test_file_path, language, framework, source_file_path);

    res.json({
      status: runRes.status,
      passed_count: runRes.passedCount,
      failed_count: runRes.failedCount,
      duration_seconds: runRes.durationSeconds,
      raw_output: runRes.rawOutput
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', detail: err.message });
  }
});

// --- Helper Functions ---

function scanDirectory(dir: string, detector: LanguageDetector, filesFound: Array<{ file_path: string; language: string; framework: string }>) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file.startsWith('.') || ['node_modules', 'cache', 'tests', 'dist'].includes(file)) {
      continue;
    }

    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      scanDirectory(fullPath, detector, filesFound);
    } else {
      const info = detector.detect(fullPath);
      if (info.language !== 'Unsupported') {
        filesFound.push({
          file_path: fullPath,
          language: info.language,
          framework: info.framework
        });
      }
    }
  }
}

function collectFiles(dir: string, collected: string[]) {
  const files = fs.readdirSync(dir);
  const detector = new LanguageDetector();
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file.startsWith('.') || ['node_modules', 'cache', 'tests', 'dist'].includes(file)) {
      continue;
    }

    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      collectFiles(fullPath, collected);
    } else {
      const info = detector.detect(fullPath);
      if (info.language !== 'Unsupported') {
        collected.push(fullPath);
      }
    }
  }
}

function isBinaryPresent(name: string): boolean {
  const isWin = os.platform() === 'win32';
  const lookup = isWin ? 'where' : 'which';
  const res = spawnSync(lookup, [name]);
  return res.status === 0;
}

import { spawnSync } from 'child_process';

app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Booting PolyTest AI TypeScript REST Server...');
  console.log(`⚡ Live Server active at: http://127.0.0.1:${PORT}`);
});
