import fs from 'fs';
import path from 'path';

export class ConfigManager {
  private configPath: string;
  private configMap: Map<string, string> = new Map();

  constructor(configPath?: string) {
    this.configPath = configPath || 'polytest.yaml';
  }

  /**
   * Reads and parses properties inside polytest.yaml.
   */
  loadConfig(): void {
    const target = path.resolve(this.configPath);
    if (!fs.existsSync(target)) {
      this.saveDefaultConfig();
      return;
    }

    try {
      const content = fs.readFileSync(target, 'utf-8');
      const lines = content.split(/\r?\n/);
      let currentSection = '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          continue;
        }

        // Basic YAML sections mapping: e.g. "llm:"
        if (trimmed.endsWith(':') && !trimmed.includes(' ')) {
          currentSection = trimmed.slice(0, -1) + '.';
          continue;
        }

        const colonIdx = trimmed.indexOf(':');
        if (colonIdx !== -1) {
          const key = trimmed.slice(0, colonIdx).trim();
          let val = trimmed.slice(colonIdx + 1).trim();

          // Strip optional enclosing quotes
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }

          // Format keys as section.key
          let fullKey = key;
          if (currentSection && !key.includes('.')) {
            fullKey = currentSection + key;
          }

          this.configMap.set(fullKey, val);
        }
      }
    } catch {
      // Fallback gracefully
    }
  }

  saveConfig(): void {
    this.saveDefaultConfig();
  }

  private saveDefaultConfig(): void {
    const defaultConfig = `# PolyTest AI Configuration File
# Generated automatically by PolyTest AI Node.js Platform

llm:
  provider: mock
  model: gemini-1.5-flash

generator:
  output_dir: tests
  use_cache: true
`;
    try {
      fs.writeFileSync(this.configPath, defaultConfig, 'utf-8');
    } catch {
      // Ignore write errors
    }
  }

  get(key: string, defaultVal: string): string {
    return this.configMap.get(key) ?? defaultVal;
  }
}
