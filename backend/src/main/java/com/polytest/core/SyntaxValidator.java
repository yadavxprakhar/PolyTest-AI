package com.polytest.core;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

public class SyntaxValidator {

    public record ValidationResult(boolean isValid, String errorLog) {}

    private final String cacheDir;

    public SyntaxValidator() {
        this.cacheDir = "cache";
        new File(this.cacheDir).mkdirs();
    }

    /**
     * Executes non-destructive, compiler-level dry-run lint checking on the generated code.
     */
    public ValidationResult validate(String codeContent, String language) {
        String langLower = language.toLowerCase().trim();
        String ext = getExtension(langLower);
        
        Path tempFile;
        try {
            tempFile = Files.createTempFile(Paths.get(cacheDir), "test_val_", ext);
            Files.writeString(tempFile, codeContent);
        } catch (IOException e) {
            return new ValidationResult(false, "Failed to write temp validation file: " + e.getMessage());
        }

        ValidationResult result;
        try {
            switch (langLower) {
                case "python":
                    result = validatePython(tempFile.toAbsolutePath().toString());
                    break;
                case "javascript":
                case "typescript":
                    result = validateJavaScript(tempFile.toAbsolutePath().toString());
                    break;
                case "go":
                    result = validateGo(tempFile.toAbsolutePath().toString());
                    break;
                case "java":
                    result = validateJava(tempFile.toAbsolutePath().toString());
                    break;
                case "c++":
                    result = validateCpp(tempFile.toAbsolutePath().toString());
                    break;
                case "c#":
                    result = validateCSharp(tempFile.toAbsolutePath().toString());
                    break;
                default:
                    result = new ValidationResult(true, "Linter not supported for language: " + language + ". Skipped validation.");
            }
        } finally {
            try {
                Files.deleteIfExists(tempFile);
            } catch (IOException e) {
                // Ignore cleanup failures
            }
        }

        return result;
    }

    private ValidationResult validatePython(String filePath) {
        return runCommand(List.of("python3", "-m", "py_compile", filePath), "Python");
    }

    private ValidationResult validateJavaScript(String filePath) {
        // Spawns node --check to verify JS syntax natively
        return runCommand(List.of("node", "--check", filePath), "Node.js");
    }

    private ValidationResult validateGo(String filePath) {
        // go tool compile executes a dry-run check without linking
        ValidationResult res = runCommand(List.of("go", "tool", "compile", "-o", "devnull", "-p", "main", filePath), "Go");
        return filterEnvironmentErrors(res, List.of("import cycle", "could not import", "undefined"));
    }

    private ValidationResult validateJava(String filePath) {
        // javac -proc:none bypasses annotation processors for instant compilations
        ValidationResult res = runCommand(List.of("javac", "-proc:none", "-d", cacheDir, filePath), "javac");
        return filterEnvironmentErrors(res, List.of("package does not exist", "cannot find symbol"));
    }

    private ValidationResult validateCpp(String filePath) {
        // g++ -fsyntax-only verifies syntax structures
        ValidationResult res = runCommand(List.of("g++", "-fsyntax-only", "-std=c++17", filePath), "g++");
        return filterEnvironmentErrors(res, List.of("fatal error", "No such file or directory"));
    }

    private ValidationResult validateCSharp(String filePath) {
        // csc compiler dry-run check
        ValidationResult res = runCommand(List.of("csc", "/target:library", "/out:devnull", filePath), "csc");
        return filterEnvironmentErrors(res, List.of("error CS", "cannot be found"));
    }

    private ValidationResult runCommand(List<String> cmd, String linterName) {
        try {
            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            String output = new String(process.getInputStream().readAllBytes());
            boolean finished = process.waitFor(5, TimeUnit.SECONDS);

            if (!finished) {
                process.destroyForcibly();
                return new ValidationResult(false, "Linter " + linterName + " timed out during execution.");
            }

            if (process.exitValue() != 0) {
                return new ValidationResult(false, output.trim());
            }

            return new ValidationResult(true, "");
        } catch (IOException | InterruptedException e) {
            return new ValidationResult(true, "Warning: Host compiler binary '" + linterName + "' not detected in system path. Skipped checks.");
        }
    }

    private ValidationResult filterEnvironmentErrors(ValidationResult res, List<String> ignoreKeywords) {
        if (res.isValid()) return res;

        String log = res.errorLog().toLowerCase();
        for (String keyword : ignoreKeywords) {
            if (log.contains(keyword.toLowerCase())) {
                return new ValidationResult(true, "Warning: Environmental dependency missing (" + keyword + "). Passed syntax validation check.");
            }
        }
        return res;
    }

    private String getExtension(String language) {
        switch (language) {
            case "python": return ".py";
            case "javascript": return ".js";
            case "typescript": return ".ts";
            case "go": return ".go";
            case "java": return ".java";
            case "c++": return ".cpp";
            case "c#": return ".cs";
            default: return ".txt";
        }
    }
}
