import path from 'path';

export interface LanguageInfo {
  language: string;
  framework: string;
}

export class LanguageDetector {
  /**
   * Auto-detects target programming language and testing framework based on file extension.
   */
  detect(filePath: string): LanguageInfo {
    if (!filePath) {
      return { language: 'Unsupported', framework: 'Unknown' };
    }

    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.py':
        return { language: 'Python', framework: 'pytest' };
      case '.js':
      case '.jsx':
        return { language: 'JavaScript', framework: 'Jest' };
      case '.ts':
      case '.tsx':
        return { language: 'TypeScript', framework: 'Jest' };
      case '.java':
        return { language: 'Java', framework: 'JUnit 5' };
      case '.go':
        return { language: 'Go', framework: 'testing' };
      case '.cpp':
      case '.cc':
      case '.h':
      case '.hpp':
        return { language: 'C++', framework: 'Google Test' };
      case '.cs':
        return { language: 'C#', framework: 'xUnit' };
      default:
        return { language: 'Unsupported', framework: 'Unknown' };
    }
  }
}
