package com.polytest.core;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ConfigManager {

    private final String configPath;
    private final Map<String, String> configMap = new HashMap<>();

    public ConfigManager() {
        this.configPath = "polytest.yaml";
    }

    public ConfigManager(String configPath) {
        this.configPath = configPath;
    }

    /**
     * Read the local YAML configuration file and map properties cleanly.
     */
    public void loadConfig() {
        Path path = Paths.get(configPath);
        if (!Files.exists(path)) {
            saveDefaultConfig();
            return;
        }

        try {
            List<String> lines = Files.readAllLines(path);
            String currentSection = "";

            for (String line : lines) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                    continue;
                }

                // Basic YAML section mapping: e.g. "llm:"
                if (trimmed.endsWith(":") && !trimmed.contains(" ")) {
                    currentSection = trimmed.substring(0, trimmed.length() - 1) + ".";
                    continue;
                }

                int colonIdx = trimmed.indexOf(':');
                if (colonIdx != -1) {
                    String key = trimmed.substring(0, colonIdx).trim();
                    String val = trimmed.substring(colonIdx + 1).trim();

                    // Strip optional enclosing quotes
                    if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.substring(1, val.length() - 1);
                    }

                    // Format keys as section.key
                    String fullKey = key;
                    if (!currentSection.isEmpty() && !key.contains(".")) {
                        fullKey = currentSection + key;
                    }

                    configMap.put(fullKey, val);
                }
            }
        } catch (IOException e) {
            // Fallback gracefully to default map keys
        }
    }

    public void saveConfig() {
        saveDefaultConfig();
    }

    private void saveDefaultConfig() {
        String defaultConfig = """
            # PolyTest AI Configuration File
            # Generated automatically by PolyTest AI Java Platform
            
            llm:
              provider: mock
              model: gemini-1.5-flash
            
            generator:
              output_dir: tests
              use_cache: true
            """;
        try {
            Files.writeString(Paths.get(configPath), defaultConfig);
        } catch (IOException e) {
            // Ignore write errors
        }
    }

    public String get(String key, String defaultVal) {
        return configMap.getOrDefault(key, defaultVal);
    }
}
