package com.polytest;

import io.javalin.Javalin;
import io.javalin.http.Context;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

import com.polytest.core.*;

public class App {

    private static final String VERSION = "1.0.0";

    public static void main(String[] args) {
        System.out.println("🚀 Booting PolyTest AI Java REST Server...");

        Javalin app = Javalin.create(config -> {
            // Enable CORS so the React frontend (Vite) can communicate cleanly
            config.bundledPlugins.enableCors(cors -> {
                cors.addRule(rule -> rule.anyHost());
            });
        });

        // --- Core Routes ---
        app.get("/", App::handleWelcome);
        app.get("/health", App::handleHealth);
        
        app.post("/api/v1/init", App::handleInit);
        app.post("/api/v1/detect", App::handleDetect);
        app.post("/api/v1/analyze", App::handleAnalyze);
        app.post("/api/v1/generate", App::handleGenerate);
        app.post("/api/v1/run", App::handleRun);

        app.start(8000);
        
        System.out.println("📖 Swagger Docs simulated online.");
        System.out.println("⚡ Live Server active at: http://127.0.0.1:8000");
    }

    private static void handleWelcome(Context ctx) {
        ctx.json(Map.of(
            "app", "PolyTest AI REST Engine (Java Port)",
            "status", "online",
            "version", VERSION,
            "documentation", "/docs",
            "paradigms", List.of("Static Analysis", "AI Generation", "Syntax Validation", "Subprocess Execution")
        ));
    }

    private static void handleHealth(Context ctx) {
        String os = System.getProperty("os.name");
        String javaVersion = System.getProperty("java.version");
        
        ctx.json(Map.of(
            "status", "healthy",
            "platform", os,
            "java_version", javaVersion,
            "binaries_detected", Map.of(
                "node", isBinaryPresent("node"),
                "javac", isBinaryPresent("javac"),
                "g++", isBinaryPresent("g++"),
                "go", isBinaryPresent("go"),
                "dotnet", isBinaryPresent("dotnet")
            )
        ));
    }

    private static void handleInit(Context ctx) {
        Map<String, Object> body = ctx.bodyAsClass(Map.class);
        String projectDir = (String) body.getOrDefault("project_dir", System.getProperty("user.dir"));
        
        try {
            String configPath = Paths.get(projectDir, "polytest.yaml").toAbsolutePath().toString();
            ConfigManager manager = new ConfigManager(configPath);
            manager.saveConfig();
            
            ctx.json(Map.of(
                "status", "success",
                "message", "Successfully initialized local polytest.yaml settings in Java backend.",
                "config_path", configPath
            ));
        } catch (Exception e) {
            ctx.status(500).json(Map.of("status", "error", "detail", e.getMessage()));
        }
    }

    private static void handleDetect(Context ctx) {
        Map<String, Object> body = ctx.bodyAsClass(Map.class);
        String projectDir = (String) body.get("project_dir");
        if (projectDir == null) {
            projectDir = System.getProperty("user.dir");
        }

        File projectRoot = new File(projectDir);
        if (!projectRoot.exists()) {
            ctx.status(404).json(Map.of("status", "error", "detail", "Target directory does not exist: " + projectDir));
            return;
        }

        try {
            LanguageDetector detector = new LanguageDetector();
            List<Map<String, String>> filesFound = new ArrayList<>();
            scanDirectory(projectRoot, detector, filesFound);

            ctx.json(Map.of(
                "status", "success",
                "project_root", projectRoot.getAbsolutePath(),
                "files_found", filesFound
            ));
        } catch (Exception e) {
            ctx.status(500).json(Map.of("status", "error", "detail", e.getMessage()));
        }
    }

    private static void handleAnalyze(Context ctx) {
        Map<String, Object> body = ctx.bodyAsClass(Map.class);
        String filePath = (String) body.get("file_path");
        
        if (filePath == null) {
            ctx.status(400).json(Map.of("status", "error", "detail", "Missing parameter: file_path"));
            return;
        }

        File file = new File(filePath);
        if (!file.exists()) {
            ctx.status(404).json(Map.of("status", "error", "detail", "Target source file not found: " + filePath));
            return;
        }

        try {
            LanguageDetector detector = new LanguageDetector();
            LanguageDetector.LanguageInfo info = detector.detect(filePath);

            if (info.language().equals("Unsupported")) {
                ctx.status(400).json(Map.of("status", "error", "detail", "File extension or structure is unsupported: " + filePath));
                return;
            }

            SourceParser parser = new SourceParser();
            SourceParser.ParseResult res = parser.parse(filePath, info.language());

            ctx.json(Map.of(
                "status", "success",
                "file_path", file.getAbsolutePath(),
                "language", info.language(),
                "detected_framework", info.framework(),
                "structure", res
            ));
        } catch (Exception e) {
            ctx.status(500).json(Map.of("status", "error", "detail", e.getMessage()));
        }
    }

    private static void handleGenerate(Context ctx) {
        Map<String, Object> body = ctx.bodyAsClass(Map.class);
        String path = (String) body.get("path");
        
        if (path == null) {
            ctx.status(400).json(Map.of("status", "error", "detail", "Missing parameter: path"));
            return;
        }

        File target = new File(path);
        if (!target.exists()) {
            ctx.status(404).json(Map.of("status", "error", "detail", "Target path not found: " + path));
            return;
        }

        // Parse payload overrides
        String provider = (String) body.get("provider");
        String model = (String) body.get("model");
        String forcedFramework = (String) body.get("framework");
        String outputDir = (String) body.get("output_dir");
        boolean forceMock = body.containsKey("mock") && (boolean) body.get("mock");
        boolean noCache = body.containsKey("no_cache") && (boolean) body.get("no_cache");
        boolean runTests = body.containsKey("run") && (boolean) body.get("run");

        if (forceMock) provider = "mock";
        if (outputDir == null) outputDir = "tests";

        try {
            TestGenerator generator = new TestGenerator(provider, model);
            List<TestGenerator.GenerationResponse> results = new ArrayList<>();
            List<File> filesToProcess = new ArrayList<>();

            if (target.isFile()) {
                filesToProcess.add(target);
            } else {
                collectFiles(target, filesToProcess);
            }

            if (filesToProcess.isEmpty()) {
                ctx.status(400).json(Map.of("status", "error", "detail", "No supportable files located under: " + path));
                return;
            }

            for (File file : filesToProcess) {
                TestGenerator.GenerationResponse res = generator.generateTest(
                    file.getAbsolutePath(), 
                    outputDir, 
                    forcedFramework, 
                    !noCache
                );

                Map<String, Object> responseMap = new LinkedHashMap<>();
                responseMap.put("status", res.status());
                responseMap.put("source_file", res.sourceFile());
                responseMap.put("test_file", res.testFile());
                responseMap.put("framework", res.framework());
                responseMap.put("cached", res.cached());
                responseMap.put("error", res.error());
                
                // Unified execution: generate + run immediately
                if (runTests && res.status().equals("success")) {
                    TestRunner runner = new TestRunner();
                    LanguageDetector detector = new LanguageDetector();
                    LanguageDetector.LanguageInfo info = detector.detect(file.getAbsolutePath());
                    
                    TestRunner.RunnerResult runRes = runner.run(
                        res.testFile(),
                        info.language(),
                        res.framework(),
                        file.getAbsolutePath()
                    );
                    
                    responseMap.put("run_result", runRes);
                }

                results.add(res); // Keeps standard DTO compatibility
                ctx.json(Map.of("status", "success", "results", results)); // Return processed lists
            }
        } catch (Exception e) {
            ctx.status(500).json(Map.of("status", "error", "detail", e.getMessage()));
        }
    }

    private static void handleRun(Context ctx) {
        Map<String, Object> body = ctx.bodyAsClass(Map.class);
        String testFilePath = (String) body.get("test_file_path");
        String language = (String) body.get("language");
        String framework = (String) body.get("framework");
        String sourceFilePath = (String) body.get("source_file_path");

        if (testFilePath == null || language == null || framework == null) {
            ctx.status(400).json(Map.of("status", "error", "detail", "Missing parameters: test_file_path, language, and framework are required."));
            return;
        }

        try {
            TestRunner runner = new TestRunner();
            TestRunner.RunnerResult res = runner.run(testFilePath, language, framework, sourceFilePath);
            
            ctx.json(Map.of(
                "status", res.status(),
                "passed_count", res.passedCount(),
                "failed_count", res.failedCount(),
                "duration_seconds", res.durationSeconds(),
                "raw_output", res.rawOutput()
            ));
        } catch (Exception e) {
            ctx.status(500).json(Map.of("status", "error", "detail", e.getMessage()));
        }
    }

    // --- Directory Helper Iterators ---
    private static void scanDirectory(File dir, LanguageDetector detector, List<Map<String, String>> filesFound) {
        File[] files = dir.listFiles();
        if (files == null) return;
        for (File file : files) {
            if (file.getName().startsWith(".") || file.getName().equals("node_modules") || file.getName().equals("cache") || file.getName().equals("tests")) {
                continue;
            }
            if (file.isDirectory()) {
                scanDirectory(file, detector, filesFound);
            } else {
                LanguageDetector.LanguageInfo info = detector.detect(file.getAbsolutePath());
                if (!info.language().equals("Unsupported")) {
                    filesFound.add(Map.of(
                        "file_path", file.getAbsolutePath(),
                        "language", info.language(),
                        "framework", info.framework()
                    ));
                }
            }
        }
    }

    private static void collectFiles(File dir, List<File> collected) {
        File[] files = dir.listFiles();
        if (files == null) return;
        for (File file : files) {
            if (file.getName().startsWith(".") || file.getName().equals("node_modules") || file.getName().equals("cache") || file.getName().equals("tests")) {
                continue;
            }
            if (file.isDirectory()) {
                collectFiles(file, collected);
            } else {
                LanguageDetector detector = new LanguageDetector();
                LanguageDetector.LanguageInfo info = detector.detect(file.getAbsolutePath());
                if (!info.language().equals("Unsupported")) {
                    collected.add(file);
                }
            }
        }
    }

    private static boolean isBinaryPresent(String name) {
        String os = System.getProperty("os.name").toLowerCase();
        String lookup = os.contains("win") ? "where" : "which";
        try {
            Process p = new ProcessBuilder(lookup, name).start();
            return p.waitFor() == 0;
        } catch (Exception e) {
            return false;
        }
    }
}
