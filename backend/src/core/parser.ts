import fs from 'fs';

export interface ClassInfo {
  name: string;
  methods: string[];
}

export interface ParseResult {
  classes: ClassInfo[];
  functions: string[];
  imports: string[];
  complexity: string;
}

export class SourceParser {
  /**
   * Statically parses code constructs and dependencies using regular expressions.
   */
  parse(filePath: string, language: string): ParseResult {
    let content = '';
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch {
      return { classes: [], functions: [], imports: [], complexity: 'Unknown' };
    }

    const langLower = language.toLowerCase().trim();

    switch (langLower) {
      case 'python':
        return this.parsePython(content);
      case 'javascript':
      case 'typescript':
        return this.parseJavaScriptTypeScript(content);
      case 'go':
        return this.parseGo(content);
      case 'java':
        return this.parseJava(content);
      case 'c++':
        return this.parseCpp(content);
      case 'c#':
        return this.parseCSharp(content);
      default:
        return this.parseFallback(content);
    }
  }

  private parsePython(content: string): ParseResult {
    const classes: ClassInfo[] = [];
    const functions: string[] = [];
    const imports: string[] = [];

    const importPattern = /^(?:import\s+([A-Za-z0-9_.,\s]+)|from\s+([A-Za-z0-9_.]+)\s+import)/gm;
    const funcPattern = /^def\s+([A-Za-z0-9_]+)\s*\(/gm;
    const classPattern = /^class\s+([A-Za-z0-9_]+)/gm;
    const defPattern = /^\s+def\s+([A-Za-z0-9_]+)\s*\(/gm;

    // Extract imports
    let match;
    while ((match = importPattern.exec(content)) !== null) {
      if (match[1]) imports.push(match[1].trim());
      else if (match[2]) imports.push(match[2].trim());
    }

    // Extract standalone functions
    while ((match = funcPattern.exec(content)) !== null) {
      functions.push(match[1]);
    }

    // Extract classes & methods
    const lines = content.split(/\r?\n/);
    let currentClassName: string | null = null;
    let currentMethods: string[] = [];

    for (const line of lines) {
      const classMatch = /^class\s+([A-Za-z0-9_]+)/.exec(line);
      if (classMatch) {
        if (currentClassName) {
          classes.push({ name: currentClassName, methods: currentMethods });
        }
        currentClassName = classMatch[1];
        currentMethods = [];
        continue;
      }

      if (currentClassName) {
        const methodMatch = /^\s+def\s+([A-Za-z0-9_]+)\s*\(/.exec(line);
        if (methodMatch) {
          currentMethods.push(methodMatch[1]);
        }
      }
    }
    if (currentClassName) {
      classes.push({ name: currentClassName, methods: currentMethods });
    }

    return { classes, functions, imports, complexity: this.estimateComplexity(content) };
  }

  private parseJavaScriptTypeScript(content: string): ParseResult {
    const classes: ClassInfo[] = [];
    const functions: string[] = [];
    const imports: string[] = [];

    const importPattern = /(?:import\s+.*?from\s+['"](.*?)['"]|require\s*\(['"](.*?)['"]\))/g;
    const funcPattern = /(?:function\s+([A-Za-z0-9_$]+)|const\s+([A-Za-z0-9_$]+)\s*=\s*\([^)]*\)\s*=>)/g;
    const classPattern = /class\s+([A-Za-z0-9_$]+)/;
    const methodPattern = /^\s*(?:async\s+)?([A-Za-z0-9_$]+)\s*\([^)]*\)\s*\{/;

    let match;
    while ((match = importPattern.exec(content)) !== null) {
      imports.push(match[1] || match[2]);
    }

    while ((match = funcPattern.exec(content)) !== null) {
      const name = match[1] || match[2];
      if (name) functions.push(name);
    }

    const lines = content.split(/\r?\n/);
    let currentClassName: string | null = null;
    let currentMethods: string[] = [];

    for (const line of lines) {
      const classMatch = classPattern.exec(line);
      if (classMatch) {
        if (currentClassName) {
          classes.push({ name: currentClassName, methods: currentMethods });
        }
        currentClassName = classMatch[1];
        currentMethods = [];
        continue;
      }

      if (currentClassName) {
        const methodMatch = methodPattern.exec(line);
        if (methodMatch) {
          const mName = methodMatch[1];
          if (!['constructor', 'if', 'for', 'while', 'switch'].includes(mName)) {
            currentMethods.push(mName);
          }
        }
      }
    }
    if (currentClassName) {
      classes.push({ name: currentClassName, methods: currentMethods });
    }

    return { classes, functions, imports, complexity: this.estimateComplexity(content) };
  }

  private parseGo(content: string): ParseResult {
    const classes: ClassInfo[] = [];
    const functions: string[] = [];
    const imports: string[] = [];

    const structPattern = /type\s+([A-Za-z0-9_]+)\s+struct/g;
    const funcPattern = /func\s+([A-Za-z0-9_]+)\s*\(/g;
    const methodPattern = /func\s*\(\s*[A-Za-z0-9_\s*]+\s+([A-Za-z0-9_]+)\s*\)\s*([A-Za-z0-9_]+)\s*\(/g;
    const singleImportPattern = /import\s+['"](.*?)['"]/g;
    const blockImportPattern = /import\s+\(\s*([\s\S]*?)\s*\)/g;

    let match;
    while ((match = singleImportPattern.exec(content)) !== null) {
      imports.push(match[1]);
    }

    while ((match = blockImportPattern.exec(content)) !== null) {
      const lines = match[1].split(/\r?\n/);
      for (const line of lines) {
        const clean = line.replace(/['"]/g, '').trim();
        if (clean) imports.push(clean);
      }
    }

    const structMethods = new Map<string, string[]>();
    while ((match = structPattern.exec(content)) !== null) {
      structMethods.set(match[1], []);
    }

    while ((match = methodPattern.exec(content)) !== null) {
      const structName = match[1].replace(/[*]/g, '').trim();
      const methodName = match[2];
      if (structMethods.has(structName)) {
        structMethods.get(structName)!.push(methodName);
      }
    }

    while ((match = funcPattern.exec(content)) !== null) {
      functions.push(match[1]);
    }

    structMethods.forEach((val, key) => {
      classes.push({ name: key, methods: val });
    });

    return { classes, functions, imports, complexity: this.estimateComplexity(content) };
  }

  private parseJava(content: string): ParseResult {
    const classes: ClassInfo[] = [];
    const functions: string[] = [];
    const imports: string[] = [];

    const importPattern = /import\s+([A-Za-z0-9_.*\s]+);/g;
    const classPattern = /(?:class|interface|record)\s+([A-Za-z0-9_]+)/;
    const methodPattern = /(?:public|protected|private|static|\s)+\s+[A-Za-z0-9_<>[\]]+\s+([A-Za-z0-9_]+)\s*\(/;

    let match;
    while ((match = importPattern.exec(content)) !== null) {
      imports.push(match[1].trim());
    }

    const lines = content.split(/\r?\n/);
    let currentClassName: string | null = null;
    let currentMethods: string[] = [];

    for (const line of lines) {
      const cleanLine = line.trim();
      if (cleanLine.startsWith('//') || cleanLine.startsWith('*') || cleanLine.startsWith('/*')) {
        continue;
      }

      const classMatch = classPattern.exec(line);
      if (classMatch) {
        if (currentClassName) {
          classes.push({ name: currentClassName, methods: currentMethods });
        }
        currentClassName = classMatch[1];
        currentMethods = [];
        continue;
      }

      if (currentClassName) {
        const methodMatch = methodPattern.exec(line);
        if (methodMatch) {
          const mName = methodMatch[1];
          if (!['if', 'for', 'while', 'switch', currentClassName].includes(mName)) {
            currentMethods.push(mName);
          }
        }
      }
    }
    if (currentClassName) {
      classes.push({ name: currentClassName, methods: currentMethods });
    }

    return { classes, functions, imports, complexity: this.estimateComplexity(content) };
  }

  private parseCpp(content: string): ParseResult {
    const classes: ClassInfo[] = [];
    const functions: string[] = [];
    const imports: string[] = [];

    const importPattern = /#include\s*[<"](.*?)[>"]/g;
    const classPattern = /class\s+([A-Za-z0-9_]+)/;
    const methodPattern = /^\s*(?:[A-Za-z0-9_&*:<>\s]+)?\s*([A-Za-z0-9_]+)\s*\([^)]*\)\s*(?:const)?\s*(?:\{|;|\b)/;

    let match;
    while ((match = importPattern.exec(content)) !== null) {
      imports.push(match[1]);
    }

    const lines = content.split(/\r?\n/);
    let currentClassName: string | null = null;
    let currentMethods: string[] = [];

    for (const line of lines) {
      const classMatch = classPattern.exec(line);
      if (classMatch) {
        if (currentClassName) {
          classes.push({ name: currentClassName, methods: currentMethods });
        }
        currentClassName = classMatch[1];
        currentMethods = [];
        continue;
      }

      if (currentClassName) {
        const methodMatch = methodPattern.exec(line);
        if (methodMatch) {
          const mName = methodMatch[1];
          if (!['if', 'for', 'while', 'switch', currentClassName].includes(mName)) {
            currentMethods.push(mName);
          }
        }
      }
    }
    if (currentClassName) {
      classes.push({ name: currentClassName, methods: currentMethods });
    }

    return { classes, functions, imports, complexity: this.estimateComplexity(content) };
  }

  private parseCSharp(content: string): ParseResult {
    return this.parseJava(content);
  }

  private parseFallback(content: string): ParseResult {
    const functions: string[] = [];
    const funcPattern = /(?:def|function|func)\s+([A-Za-z0-9_]+)/g;

    let match;
    while ((match = funcPattern.exec(content)) !== null) {
      functions.push(match[1]);
    }

    return { classes: [], functions, imports: [], complexity: 'Low' };
  }

  private estimateComplexity(content: string): string {
    let branchDensity = 0;
    const keywords = ['if', 'for', 'while', 'switch', 'catch', 'async', '\\|\\|', '&&'];

    for (const word of keywords) {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) {
        branchDensity += matches.length;
      }
    }

    if (branchDensity > 15) {
      return 'High (O(N Log N) / O(N^2))';
    } else if (branchDensity > 5) {
      return 'Medium (O(N))';
    } else {
      return 'Low (O(1))';
    }
  }
}
