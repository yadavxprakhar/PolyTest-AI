package com.polytest.core;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.regex.*;

public class SourceParser {

    public record ClassInfo(String name, List<String> methods) {}
    public record ParseResult(List<ClassInfo> classes, List<String> functions, List<String> imports, String complexity) {}

    /**
     * Parses the code file statically and returns its logical classes, functions, and imports.
     */
    public ParseResult parse(String filePath, String language) {
        String content;
        try {
            content = Files.readString(Paths.get(filePath));
        } catch (IOException e) {
            return new ParseResult(new ArrayList<>(), new ArrayList<>(), new ArrayList<>(), "Unknown");
        }

        String langLower = language.toLowerCase().trim();
        switch (langLower) {
            case "python":
                return parsePython(content);
            case "javascript":
            case "typescript":
                return parseJavaScriptTypeScript(content);
            case "go":
                return parseGo(content);
            case "java":
                return parseJava(content);
            case "c++":
                return parseCpp(content);
            case "c#":
                return parseCSharp(content);
            default:
                return parseFallback(content);
        }
    }

    private ParseResult parsePython(String content) {
        List<ClassInfo> classes = new ArrayList<>();
        List<String> functions = new ArrayList<>();
        List<String> imports = new ArrayList<>();

        // Regex patterns matching Python constructs
        Pattern classPattern = Pattern.compile("^class\\s+([A-Za-z0-9_]+)", Pattern.MULTILINE);
        Pattern defPattern = Pattern.compile("^\\s+def\\s+([A-Za-z0-9_]+)\\s*\\(", Pattern.MULTILINE);
        Pattern funcPattern = Pattern.compile("^def\\s+([A-Za-z0-9_]+)\\s*\\(", Pattern.MULTILINE);
        Pattern importPattern = Pattern.compile("^(?:import\\s+([A-Za-z0-9_.,\\s]+)|from\\s+([A-Za-z0-9_.]+)\\s+import)", Pattern.MULTILINE);

        // Extract imports
        Matcher importMatcher = importPattern.matcher(content);
        while (importMatcher.find()) {
            if (importMatcher.group(1) != null) {
                imports.add(importMatcher.group(1).trim());
            } else if (importMatcher.group(2) != null) {
                imports.add(importMatcher.group(2).trim());
            }
        }

        // Extract standalone functions
        Matcher funcMatcher = funcPattern.matcher(content);
        while (funcMatcher.find()) {
            functions.add(funcMatcher.group(1));
        }

        // Extract classes & methods using basic indentation block analysis
        String[] lines = content.split("\\r?\\n");
        String currentClassName = null;
        List<String> currentMethods = new ArrayList<>();

        for (String line : lines) {
            Matcher classMatcher = classPattern.matcher(line);
            if (classMatcher.find()) {
                if (currentClassName != null) {
                    classes.add(new ClassInfo(currentClassName, currentMethods));
                }
                currentClassName = classMatcher.group(1);
                currentMethods = new ArrayList<>();
                continue;
            }

            if (currentClassName != null) {
                // If it's a method inside the class block (starts with whitespace + def)
                Matcher methodMatcher = defPattern.matcher(line);
                if (methodMatcher.find()) {
                    currentMethods.add(methodMatcher.group(1));
                }
            }
        }
        if (currentClassName != null) {
            classes.add(new ClassInfo(currentClassName, currentMethods));
        }

        return new ParseResult(classes, functions, imports, estimateComplexity(content));
    }

    private ParseResult parseJavaScriptTypeScript(String content) {
        List<ClassInfo> classes = new ArrayList<>();
        List<String> functions = new ArrayList<>();
        List<String> imports = new ArrayList<>();

        Pattern classPattern = Pattern.compile("class\\s+([A-Za-z0-9_$]+)");
        Pattern methodPattern = Pattern.compile("^\\s*(?:async\\s+)?([A-Za-z0-9_$]+)\\s*\\([^)]*\\)\\s*\\{", Pattern.MULTILINE);
        Pattern funcPattern = Pattern.compile("(?:function\\s+([A-Za-z0-9_$]+)|const\\s+([A-Za-z0-9_$]+)\\s*=\\s*\\([^)]*\\)\\s*=>)");
        Pattern importPattern = Pattern.compile("(?:import\\s+.*?from\\s+['\"](.*?)['\"]|require\\s*\\(['\"](.*?)['\"]\\))");

        // Extract imports
        Matcher importMatcher = importPattern.matcher(content);
        while (importMatcher.find()) {
            if (importMatcher.group(1) != null) {
                imports.add(importMatcher.group(1));
            } else if (importMatcher.group(2) != null) {
                imports.add(importMatcher.group(2));
            }
        }

        // Extract standalone functions
        Matcher funcMatcher = funcPattern.matcher(content);
        while (funcMatcher.find()) {
            String name = funcMatcher.group(1) != null ? funcMatcher.group(1) : funcMatcher.group(2);
            if (name != null) functions.add(name);
        }

        // Extract classes & methods
        String[] lines = content.split("\\r?\\n");
        String currentClassName = null;
        List<String> currentMethods = new ArrayList<>();

        for (String line : lines) {
            Matcher classMatcher = classPattern.matcher(line);
            if (classMatcher.find()) {
                if (currentClassName != null) {
                    classes.add(new ClassInfo(currentClassName, currentMethods));
                }
                currentClassName = classMatcher.group(1);
                currentMethods = new ArrayList<>();
                continue;
            }

            if (currentClassName != null) {
                Matcher methodMatcher = methodPattern.matcher(line);
                if (methodMatcher.find()) {
                    String methodName = methodMatcher.group(1);
                    if (!methodName.equals("constructor") && !methodName.equals("if") && !methodName.equals("for") && !methodName.equals("while")) {
                        currentMethods.add(methodName);
                    }
                }
            }
        }
        if (currentClassName != null) {
            classes.add(new ClassInfo(currentClassName, currentMethods));
        }

        return new ParseResult(classes, functions, imports, estimateComplexity(content));
    }

    private ParseResult parseGo(String content) {
        List<ClassInfo> classes = new ArrayList<>();
        List<String> functions = new ArrayList<>();
        List<String> imports = new ArrayList<>();

        // Struct declarations map to classes
        Pattern structPattern = Pattern.compile("type\\s+([A-Za-z0-9_]+)\\s+struct");
        Pattern funcPattern = Pattern.compile("func\\s+([A-Za-z0-9_]+)\\s*\\(");
        // Struct method: func (r *Receiver) MethodName()
        Pattern methodPattern = Pattern.compile("func\\s*\\(\\s*[A-Za-z0-9_\\s*]+\\s+([A-Za-z0-9_]+)\\s*\\)\\s*([A-Za-z0-9_]+)\\s*\\(");
        Pattern importPattern = Pattern.compile("import\\s+\\(\\s*(.*?)\\s*\\)", Pattern.DOTALL);
        Pattern singleImportPattern = Pattern.compile("import\\s+['\"](.*?)['\"]");

        // Parse single imports
        Matcher singleMatcher = singleImportPattern.matcher(content);
        while (singleMatcher.find()) {
            imports.add(singleMatcher.group(1));
        }

        // Parse block imports
        Matcher blockMatcher = importPattern.matcher(content);
        if (blockMatcher.find()) {
            String[] lines = blockMatcher.group(1).split("\\r?\\n");
            for (String line : lines) {
                String clean = line.replace("\"", "").replace("'", "").trim();
                if (!clean.isEmpty()) imports.add(clean);
            }
        }

        // Extract structs & standalone functions
        Map<String, List<String>> structMethods = new HashMap<>();
        
        Matcher structMatcher = structPattern.matcher(content);
        while (structMatcher.find()) {
            structMethods.put(structMatcher.group(1), new ArrayList<>());
        }

        Matcher methodMatcher = methodPattern.matcher(content);
        while (methodMatcher.find()) {
            String structName = methodMatcher.group(1).replace("*", "").trim();
            String methodName = methodMatcher.group(2);
            if (structMethods.containsKey(structName)) {
                structMethods.get(structName).add(methodName);
            }
        }

        Matcher funcMatcher = funcPattern.matcher(content);
        while (funcMatcher.find()) {
            String fName = funcMatcher.group(1);
            functions.add(fName);
        }

        for (Map.Entry<String, List<String>> entry : structMethods.entrySet()) {
            classes.add(new ClassInfo(entry.getKey(), entry.getValue()));
        }

        return new ParseResult(classes, functions, imports, estimateComplexity(content));
    }

    private ParseResult parseJava(String content) {
        List<ClassInfo> classes = new ArrayList<>();
        List<String> functions = new ArrayList<>();
        List<String> imports = new ArrayList<>();

        Pattern classPattern = Pattern.compile("(?:class|interface|record)\\s+([A-Za-z0-9_]+)");
        Pattern methodPattern = Pattern.compile("(?:public|protected|private|static|\\s)+\\s+[A-Za-z0-9_<>\\[\\]]+\\s+([A-Za-z0-9_]+)\\s*\\(");
        Pattern importPattern = Pattern.compile("import\\s+([A-Za-z0-9_.*\\s]+);");

        Matcher importMatcher = importPattern.matcher(content);
        while (importMatcher.find()) {
            imports.add(importMatcher.group(1).trim());
        }

        String[] lines = content.split("\\r?\\n");
        String currentClassName = null;
        List<String> currentMethods = new ArrayList<>();

        for (String line : lines) {
            if (line.trim().startsWith("//") || line.trim().startsWith("*") || line.trim().startsWith("/*")) {
                continue;
            }

            Matcher classMatcher = classPattern.matcher(line);
            if (classMatcher.find()) {
                if (currentClassName != null) {
                    classes.add(new ClassInfo(currentClassName, currentMethods));
                }
                currentClassName = classMatcher.group(1);
                currentMethods = new ArrayList<>();
                continue;
            }

            if (currentClassName != null) {
                Matcher methodMatcher = methodPattern.matcher(line);
                if (methodMatcher.find()) {
                    String mName = methodMatcher.group(1);
                    if (!mName.equals("if") && !mName.equals("for") && !mName.equals("while") && !mName.equals("switch") && !mName.equals(currentClassName)) {
                        currentMethods.add(mName);
                    }
                }
            }
        }
        if (currentClassName != null) {
            classes.add(new ClassInfo(currentClassName, currentMethods));
        }

        return new ParseResult(classes, functions, imports, estimateComplexity(content));
    }

    private ParseResult parseCpp(String content) {
        List<ClassInfo> classes = new ArrayList<>();
        List<String> functions = new ArrayList<>();
        List<String> imports = new ArrayList<>();

        Pattern classPattern = Pattern.compile("class\\s+([A-Za-z0-9_]+)");
        Pattern methodPattern = Pattern.compile("^\\s*(?:[A-Za-z0-9_&*:<>\\s]+)?\\s*([A-Za-z0-9_]+)\\s*\\([^)]*\\)\\s*(?:const)?\\s*(?:\\{|;|\\b)");
        Pattern importPattern = Pattern.compile("#include\\s*[<\"](.*?)[>\"]");

        Matcher importMatcher = importPattern.matcher(content);
        while (importMatcher.find()) {
            imports.add(importMatcher.group(1));
        }

        String[] lines = content.split("\\r?\\n");
        String currentClassName = null;
        List<String> currentMethods = new ArrayList<>();

        for (String line : lines) {
            Matcher classMatcher = classPattern.matcher(line);
            if (classMatcher.find()) {
                if (currentClassName != null) {
                    classes.add(new ClassInfo(currentClassName, currentMethods));
                }
                currentClassName = classMatcher.group(1);
                currentMethods = new ArrayList<>();
                continue;
            }

            if (currentClassName != null) {
                Matcher methodMatcher = methodPattern.matcher(line);
                if (methodMatcher.find()) {
                    String mName = methodMatcher.group(1);
                    if (!mName.equals("if") && !mName.equals("for") && !mName.equals("while") && !mName.equals("switch") && !mName.equals(currentClassName)) {
                        currentMethods.add(mName);
                    }
                }
            }
        }
        if (currentClassName != null) {
            classes.add(new ClassInfo(currentClassName, currentMethods));
        }

        return new ParseResult(classes, functions, imports, estimateComplexity(content));
    }

    private ParseResult parseCSharp(String content) {
        return parseJava(content); // C# syntax structures share identical signatures under regex compilation
    }

    private ParseResult parseFallback(String content) {
        List<ClassInfo> classes = new ArrayList<>();
        List<String> functions = new ArrayList<>();
        List<String> imports = new ArrayList<>();

        // Generic function signatures
        Pattern funcPattern = Pattern.compile("(?:def|function|func)\\s+([A-Za-z0-9_]+)");
        Matcher matcher = funcPattern.matcher(content);
        while (matcher.find()) {
            functions.add(matcher.group(1));
        }

        return new ParseResult(classes, functions, imports, "Low");
    }

    private String estimateComplexity(String content) {
        // High density count heuristic
        int branchDensity = 0;
        String[] keywords = {"if", "for", "while", "switch", "catch", "async", "||", "&&"};
        for (String word : keywords) {
            int index = 0;
            while ((index = content.indexOf(word, index)) != -1) {
                branchDensity++;
                index += word.length();
            }
        }

        if (branchDensity > 15) {
            return "High (O(N Log N) / O(N^2))";
        } else if (branchDensity > 5) {
            return "Medium (O(N))";
        } else {
            return "Low (O(1))";
        }
    }
}
