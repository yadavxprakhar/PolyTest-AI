package com.polytest.core;

import java.io.File;

public class LanguageDetector {

    public record LanguageInfo(String language, String framework) {}

    /**
     * Identifies the programming language and default test framework based on file path extension.
     */
    public LanguageInfo detect(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return new LanguageInfo("Unsupported", "Unknown");
        }

        String fileName = new File(filePath).getName().toLowerCase();
        int dotIdx = fileName.lastIndexOf('.');
        if (dotIdx == -1) {
            return new LanguageInfo("Unsupported", "Unknown");
        }

        String ext = fileName.substring(dotIdx);

        switch (ext) {
            case ".py":
                return new LanguageInfo("Python", "pytest");
            case ".js":
            case ".jsx":
                return new LanguageInfo("JavaScript", "Jest");
            case ".ts":
            case ".tsx":
                return new LanguageInfo("TypeScript", "Jest");
            case ".java":
                return new LanguageInfo("Java", "JUnit 5");
            case ".go":
                return new LanguageInfo("Go", "testing");
            case ".cpp":
            case ".cc":
            case ".h":
            case ".hpp":
                return new LanguageInfo("C++", "Google Test");
            case ".cs":
                return new LanguageInfo("C#", "xUnit");
            default:
                return new LanguageInfo("Unsupported", "Unknown");
        }
    }
}
