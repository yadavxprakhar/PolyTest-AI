package com.polytest.core;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TestRunner {

    public record RunnerResult(String status, int passedCount, int failedCount, double durationSeconds, String rawOutput) {}

    private final String tempDir;

    public TestRunner() {
        this.tempDir = "cache";
        new File(this.tempDir).mkdirs();
    }

    /**
     * Executes the target test suite file inside a sandboxed subprocess and aggregates outcomes.
     */
    public RunnerResult run(String testFilePath, String language, String framework, String sourceFilePath) {
        if (!new File(testFilePath).exists()) {
            return new RunnerResult("error", 0, 0, 0.0, "Test suite file does not exist: " + testFilePath);
        }

        String langLower = language.toLowerCase().trim();
        switch (langLower) {
            case "python":
                return runPython(testFilePath, sourceFilePath);
            case "javascript":
            case "typescript":
                return runJavaScript(testFilePath);
            case "go":
                return runGo(testFilePath, sourceFilePath);
            case "c++":
                return runCpp(testFilePath, sourceFilePath);
            case "java":
                return runJava(testFilePath);
            default:
                return new RunnerResult("error", 0, 0, 0.0, "Subprocess runner not implemented for: " + language);
        }
    }

    private RunnerResult runPython(String testFilePath, String sourceFilePath) {
        // Fallback checks to discover pytest executable
        String pytestPath = findExecutable("pytest");
        List<String> cmd = new ArrayList<>();
        if (pytestPath != null) {
            cmd.addAll(List.of(pytestPath, "-v", testFilePath));
        } else {
            cmd.addAll(List.of("python3", "-m", "pytest", "-v", testFilePath));
        }

        // Dynamic PYTHONPATH prepending
        Map<String, String> envOverrides = null;
        if (sourceFilePath != null && new File(sourceFilePath).exists()) {
            String srcDir = new File(sourceFilePath).getAbsoluteFile().getParent();
            envOverrides = Map.of("PYTHONPATH", srcDir);
        }

        RunnerResult res = executeSubprocess(cmd, envOverrides, 15, "pytest");
        if (res.status().equals("error")) return res;

        String log = res.rawOutput();
        int passed = 0;
        int failed = 0;
        double duration = 0.0;

        // Parse pytest execution duration
        Matcher durationMatcher = Pattern.compile("in\\s+([\\d.]+)\\s*s").matcher(log);
        if (durationMatcher.find()) {
            duration = Double.parseDouble(durationMatcher.group(1));
        }

        // Parse passed totals
        Matcher passedMatcher = Pattern.compile("(\\d+)\\s+passed").matcher(log);
        if (passedMatcher.find()) {
            passed = Integer.parseInt(passedMatcher.group(1));
        }

        // Parse failed totals
        Matcher failedMatcher = Pattern.compile("(\\d+)\\s+failed").matcher(log);
        if (failedMatcher.find()) {
            failed = Integer.parseInt(failedMatcher.group(1));
        }

        if (log.contains("collected 0 items") || log.contains("errors during collection")) {
            return new RunnerResult("error", 0, 0, duration, log);
        }

        String status = (failed == 0 && passed > 0) ? "passed" : "failed";
        return new RunnerResult(status, passed, failed, duration, log);
    }

    private RunnerResult runJavaScript(String testFilePath) {
        String npxPath = findExecutable("npx");
        if (npxPath == null) {
            return makeMissingRunnerResult("Jest (npx)");
        }

        List<String> cmd = List.of(npxPath, "jest", testFilePath, "--colors=false");
        RunnerResult res = executeSubprocess(cmd, null, 20, "Jest");
        if (res.status().equals("error")) return res;

        String log = res.rawOutput();
        int passed = 0;
        int failed = 0;
        double duration = 0.0;

        // Parse Jest summary block
        Matcher summaryMatcher = Pattern.compile("Tests:\\s*(?:(\\d+)\\s+failed,\\s*)?(\\d+)\\s+passed,\\s*\\d+\\s+total").matcher(log);
        if (summaryMatcher.find()) {
            if (summaryMatcher.group(1) != null) {
                failed = Integer.parseInt(summaryMatcher.group(1));
            }
            passed = Integer.parseInt(summaryMatcher.group(2));
        } else {
            Matcher allPassedMatcher = Pattern.compile("Tests:\\s*(\\d+)\\s+passed,\\s*\\d+\\s+total").matcher(log);
            if (allPassedMatcher.find()) {
                passed = Integer.parseInt(allPassedMatcher.group(1));
            }
            Matcher allFailedMatcher = Pattern.compile("Tests:\\s*(\\d+)\\s+failed,\\s*\\d+\\s+total").matcher(log);
            if (allFailedMatcher.find()) {
                failed = Integer.parseInt(allFailedMatcher.group(1));
            }
        }

        Matcher durationMatcher = Pattern.compile("Time:\\s*([\\d.]+)\\s*s").matcher(log);
        if (durationMatcher.find()) {
            duration = Double.parseDouble(durationMatcher.group(1));
        }

        if (log.toLowerCase().contains("jest") && log.toLowerCase().contains("no tests found")) {
            return new RunnerResult("error", 0, 0, duration, log);
        }

        String status = (failed == 0 && passed > 0) ? "passed" : "failed";
        return new RunnerResult(status, passed, failed, duration, log);
    }

    private RunnerResult runGo(String testFilePath, String sourceFilePath) {
        String goPath = findExecutable("go");
        if (goPath == null) {
            return makeMissingRunnerResult("Go toolchain");
        }

        if (sourceFilePath == null || !new File(sourceFilePath).exists()) {
            return new RunnerResult("error", 0, 0, 0.0, "Missing required companion Go source code file to compile tests.");
        }

        List<String> cmd = List.of(goPath, "test", "-v", sourceFilePath, testFilePath);
        RunnerResult res = executeSubprocess(cmd, null, 15, "go test");
        if (res.status().equals("error")) return res;

        String log = res.rawOutput();
        int passed = countMatches(log, "--- PASS:");
        int failed = countMatches(log, "--- FAIL:");
        double duration = 0.0;

        Matcher durationMatcher = Pattern.compile("([\\d.]+)s\\s*$").matcher(log.trim());
        if (durationMatcher.find()) {
            duration = Double.parseDouble(durationMatcher.group(1));
        }

        String status = (failed == 0 && !log.contains("compile") && !log.contains("undefined")) ? "passed" : "failed";
        if (log.contains("compile") || log.contains("undefined")) {
            status = "error";
        }

        return new RunnerResult(status, passed, failed, duration, log);
    }

    private RunnerResult runCpp(String testFilePath, String sourceFilePath) {
        String compiler = findExecutable("g++");
        if (compiler == null) compiler = findExecutable("clang++");

        if (compiler == null) {
            return makeMissingRunnerResult("g++ or clang++ compiler");
        }

        if (sourceFilePath == null || !new File(sourceFilePath).exists()) {
            return new RunnerResult("error", 0, 0, 0.0, "Missing required companion C++ source code file to build executable.");
        }

        String binaryPath = Paths.get(tempDir, "temp_test_bin_java").toAbsolutePath().toString();
        List<String> compileCmd = List.of(compiler, "-std=c++17", sourceFilePath, testFilePath, "-lgtest", "-lgtest_main", "-lpthread", "-o", binaryPath);

        try {
            // Compilation subprocess
            RunnerResult compRes = executeSubprocess(compileCmd, null, 12, "C++ Compiler");
            if (!compRes.status().equals("passed")) {
                return new RunnerResult("error", 0, 0, 0.0, "C++ Compilation Failed:\n" + compRes.rawOutput());
            }

            // Execution subprocess
            RunnerResult runRes = executeSubprocess(List.of(binaryPath), null, 10, "Google Test Execution");
            if (runRes.status().equals("error")) return runRes;

            String log = runRes.rawOutput();
            int passed = 0;
            int failed = 0;
            double duration = 0.0;

            Matcher passedMatcher = Pattern.compile("\\[\\s*PASSED\\s*\\]\\s*(\\d+)\\s+test").matcher(log);
            if (passedMatcher.find()) {
                passed = Integer.parseInt(passedMatcher.group(1));
            }

            Matcher failedMatcher = Pattern.compile("\\[\\s*FAILED\\s*\\]\\s*(\\d+)\\s+test").matcher(log);
            if (failedMatcher.find()) {
                failed = Integer.parseInt(failedMatcher.group(1));
            }

            Matcher durationMatcher = Pattern.compile("\\(\\s*(\\d+)\\s*ms\\s+total\\)").matcher(log);
            if (durationMatcher.find()) {
                duration = Double.parseDouble(durationMatcher.group(1)) / 1000.0;
            }

            String status = (failed == 0 && passed > 0) ? "passed" : "failed";
            return new RunnerResult(status, passed, failed, duration, log);
        } finally {
            new File(binaryPath).delete();
        }
    }

    private RunnerResult runJava(String testFilePath) {
        String mvnPath = findExecutable("mvn");
        if (mvnPath == null || !new File("pom.xml").exists()) {
            return new RunnerResult("error", 0, 0, 0.0, "JUnit runner requires Maven ('mvn') and a valid root pom.xml to execute tests.");
        }

        String className = new File(testFilePath).getName().replace(".java", "");
        List<String> cmd = List.of(mvnPath, "test", "-Dtest=" + className);

        RunnerResult res = executeSubprocess(cmd, null, 30, "Maven JUnit");
        if (res.status().equals("error")) return res;

        String log = res.rawOutput();
        int passed = 0;
        int failed = 0;
        double duration = 0.0;

        Matcher reportMatcher = Pattern.compile("Tests\\s+run:\\s*(\\d+),\\s*Failures:\\s*(\\d+),\\s*Errors:\\s*(\\d+),\\s*Skipped:\\s*\\d+,\\s*Time\\s+elapsed:\\s*([\\d.]+)\\s*s").matcher(log);
        if (reportMatcher.find()) {
            int total = Integer.parseInt(reportMatcher.group(1));
            int failures = Integer.parseInt(reportMatcher.group(2));
            int errors = Integer.parseInt(reportMatcher.group(3));
            duration = Double.parseDouble(reportMatcher.group(4));

            failed = failures + errors;
            passed = Math.max(0, total - failed);
        }

        String status = (failed == 0 && passed > 0) ? "passed" : "failed";
        if (log.toLowerCase().contains("compilation failure") || log.toLowerCase().contains("build failure") && passed == 0) {
            status = "error";
        }

        return new RunnerResult(status, passed, failed, duration, log);
    }

    private RunnerResult executeSubprocess(List<String> cmd, Map<String, String> envOverrides, int timeoutSeconds, String label) {
        try {
            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.redirectErrorStream(true);

            if (envOverrides != null) {
                pb.environment().putAll(envOverrides);
            }

            Process p = pb.start();
            String output = new String(p.getInputStream().readAllBytes());

            boolean finished = p.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            if (!finished) {
                p.destroyForcibly();
                return new RunnerResult("error", 0, 0, 0.0, "Error: Test execution timed out under " + label);
            }

            String status = (p.exitValue() == 0) ? "passed" : "failed";
            return new RunnerResult(status, 0, 0, 0.0, output.trim());
        } catch (IOException | InterruptedException e) {
            return new RunnerResult("error", 0, 0, 0.0, "Exception starting " + label + " process: " + e.getMessage());
        }
    }

    private String findExecutable(String name) {
        // Safe cross-platform shell executable path lookup
        String os = System.getProperty("os.name").toLowerCase();
        String lookupCmd = os.contains("win") ? "where" : "which";
        try {
            Process p = new ProcessBuilder(lookupCmd, name).start();
            String output = new String(p.getInputStream().readAllBytes()).trim();
            if (p.waitFor() == 0 && !output.isEmpty()) {
                return output;
            }
        } catch (Exception e) {
            // Ignore
        }
        return null;
    }

    private int countMatches(String text, String substring) {
        int count = 0;
        int idx = 0;
        while ((idx = text.indexOf(substring, idx)) != -1) {
            count++;
            idx += substring.length();
        }
        return count;
    }

    private RunnerResult makeMissingRunnerResult(String runnerName) {
        return new RunnerResult("error", 0, 0, 0.0, 
            "Warning: Host environment binary or testing runner '" + runnerName + "' not detected in system path. Skipped execution."
        );
    }
}
