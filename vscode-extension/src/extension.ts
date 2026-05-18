import * as vscode from 'vscode';
import path from 'path';

// Import our TypeScript backend core classes directly
import { TestGenerator } from '../../backend/src/core/generator';
import { SourceParser } from '../../backend/src/core/parser';
import { LanguageDetector } from '../../backend/src/core/detector';

export function activate(context: vscode.ExtensionContext) {
  console.log('⚡ PolyTest AI VS Code Extension is now active!');

  // Register command: Generate unit test suite
  let generateDisposable = vscode.commands.registerCommand('polytest.generate', async () => {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      vscode.window.showErrorMessage('PolyTest AI: Please open a source file to generate tests.');
      return;
    }

    const filePath = activeEditor.document.fileName;
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const projectRoot = workspaceFolders ? workspaceFolders[0].uri.fsPath : path.dirname(filePath);

    // Dynamic output test directory
    const outputDir = path.join(projectRoot, 'tests');

    // Trigger glowing progress notification panel
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'PolyTest AI',
      cancellable: false
    }, async (progress) => {
      progress.report({ message: 'Analyzing source file AST structure...' });
      
      const detector = new LanguageDetector();
      const info = detector.detect(filePath);

      if (info.language === 'Unsupported') {
        throw new Error(`File type or extension is unsupported: ${path.basename(filePath)}`);
      }

      progress.report({ message: `Generating ${info.framework} tests using AI provider...` });

      // Instantiate core generator (uses cache-lookups & offline fallback mock engines)
      const generator = new TestGenerator('mock');
      const res = await generator.generateTest(filePath, outputDir, undefined, true);

      if (res.status === 'success' && res.testFile) {
        vscode.window.showInformationMessage(`🎉 PolyTest AI: Successfully generated test suite inside: ${path.basename(res.testFile)}`);
        
        // Auto-open the newly generated test file inside a new editor tab
        const doc = await vscode.workspace.openTextDocument(res.testFile);
        await vscode.window.showTextDocument(doc, { preview: false });
      } else {
        vscode.window.showErrorMessage(`❌ PolyTest AI Generation Failed: ${res.error}`);
      }
    }).then(undefined, (err) => {
      vscode.window.showErrorMessage(`❌ PolyTest AI Error: ${err.message}`);
    });
  });

  // Register command: Analyze code structure
  let analyzeDisposable = vscode.commands.registerCommand('polytest.analyze', async () => {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      vscode.window.showErrorMessage('PolyTest AI: Please open a source file to inspect its structure.');
      return;
    }

    const filePath = activeEditor.document.fileName;
    const detector = new LanguageDetector();
    const info = detector.detect(filePath);

    if (info.language === 'Unsupported') {
      vscode.window.showErrorMessage(`PolyTest AI: Unsupported file extension ${path.basename(filePath)}`);
      return;
    }

    const parser = new SourceParser();
    const parseRes = parser.parse(filePath, info.language);

    const detailMsg = `Parsed Structure for ${path.basename(filePath)} (${info.language}):\n` +
      `- Classes detected: ${parseRes.classes.length} (${parseRes.classes.map(c => c.name).join(', ')})\n` +
      `- Standalone Functions: ${parseRes.functions.length}\n` +
      `- Logic Complexity Score: ${parseRes.complexity}`;

    vscode.window.showInformationMessage(detailMsg, { modal: true });
  });

  context.subscriptions.push(generateDisposable, analyzeDisposable);
}

export function deactivate() {}
