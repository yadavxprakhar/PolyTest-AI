# CppTestGenAI

CppTestGenAI is a smart, static analysis tool for C++ projects that uses AI to automatically generate test scenarios and predict code coverage—**without compiling or running any tests**. It’s designed for developers who want deep insights into their codebase using nothing but source files and a local LLM setup.

---

## 🔍 What It Does

CppTestGenAI analyzes your C++ codebase and:

- Scans all `.cpp`, `.cc`, and `.h` files in the `src/` directory.
- Sends each file to an AI model (via Ollama using CodeLlama 7B) for expert-level static analysis.
- Predicts potential test cases and code coverage **without any runtime execution**.
- Stores and reuses analysis using a file-based caching system.
- Generates detailed test reports in Markdown, YAML, and terminal formats.

No compilers. No linkers. No build steps. Just smart analysis.

---

## 🧠 System Architecture

![System Architecture](screenshot/architecture.png)

The system follows a modular, efficient, and build-free pipeline:

1. **Initialization**
   Run `python -m app.main` to start the analysis workflow.

2. **Source Scanning**
   The tool looks inside the `src/` folder (excluding third-party libraries) to find all relevant C++ files.

3. **Cache-First Workflow**

   - If a file’s analysis exists in `cache/`, it’s reused.
   - Otherwise, the file is sent to the AI model with a structured YAML prompt (`generate_coverage_report.yaml`).

4. **AI Analysis**
   The LLM returns structured JSON containing predicted coverage and test suggestions, which gets cached immediately.

5. **Reporting**
   - A beautiful Markdown summary is created in `reports/`.
   - A machine-readable `coverage_report.yaml` is generated.
   - A terminal summary is printed with key stats.

---

## 📁 Project Structure

```

CppTestGenAI/
├── app/
│   ├── main.py           # Orchestrates everything
│   ├── config.py         # Configuration: paths, model, etc.
│   ├── llm\_handler.py    # Sends code & prompt to Ollama
│   ├── report\_generator.py # Builds human + machine reports
│   └── ...
├── instructions/
│   └── generate\_coverage\_report.yaml # Guides the AI analysis
├── src/                  # Your C++ source files go here
├── reports/              # AI-generated Markdown reports
├── cache/                # Cached responses per file
├── screenshots/          # Images for architecture/report
├── requirements.txt      # Python dependencies

```

---

## 🧪 Tested On

This tool was tested using [orgChartApi](https://github.com/keploy/orgChartApi), a real-world C++ project, to verify analysis accuracy and output quality.

## 📸 Screenshots

![Coverrage Report](screenshot/coverage_report.png)

---

## 📋 Features

- ⚡ **No Build Required** – Purely static analysis, no compilation or test execution.
- 🧠 **AI-Powered** – Uses `CodeLlama 7B` model via [Ollama](https://ollama.ai).
- 📁 **Per-File Caching** – Avoid reanalysis of unchanged files.
- 📊 **Multi-Format Reports** – Outputs Markdown, YAML, and terminal summaries.
- 🔧 **Configurable & Extensible** – Easy model swapping and modular design.

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/aarabii/CppTestGenAI.git
cd CppTestGenAI
```

### 2. Install Ollama & Pull the Model

- Download Ollama from [ollama.ai](https://ollama.ai)
- Then run:

```bash
ollama run codellama:7b
```

### 3. Install Python Requirements

```bash
pip install -r requirements.txt
```

---

## ⚙️ Configuration

Open `app/config.py` to change model settings:

```python
MODEL_NAME = "codellama:7b"
```

You can switch to another supported model here, assuming it's available in your Ollama setup.

---

## 🛠️ Usage

### Step-by-Step

1. **Place Your C++ Code** in the `src/` directory.

2. **(Optional) Clear Previous Outputs:**

```bash
rm -rf reports/*
rm -rf cache/*
```

3. **Run the Analyzer:**

```bash
python -m app.main
```

---

## 🧠 How It Works (Under the Hood)

1. **File Discovery**: Walks `src/` to collect C++ files.
2. **Prompt Formation**: Merges code with YAML-defined instructions.
3. **LLM Request**: Sends prompt to local Ollama server.
4. **Response Caching**: Saves `.log` file per source file in `cache/`.
5. **Report Aggregation**: Combines data into reports using `report_generator.py`.

---

## 📈 Performance Optimizations

- 🔁 **Incremental Analysis** – Only reprocesses changed files.
- 📦 **Granular Caching** – One cache file per source.
- 🧩 **Persistent Model Server** – Ollama stays running for quick reuse.

---

## ⚠️ Limitations

- 🧪 **No Actual Test Execution** – This is static analysis only.
- 🤖 **LLM Dependent** – Output quality may vary by model.
- 💾 **Large Files May Hit Token Limits** – Especially in LLM input context.

---

## 🧰 Troubleshooting

### Ollama Not Running?

```bash
ollama serve
```

### Model Not Found?

```bash
ollama pull codellama:7b
```

### File Write Issues?

```bash
chmod -R 755 reports cache
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a new branch
3. Submit a pull request with your changes

---

## 📜 License

MIT License – see the [LICENSE](LICENSE) file for full details.

---

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai) for local LLM infrastructure
- [CodeLlama](https://github.com/facebookresearch/codellama) by Meta AI
- [orgChartApi](https://github.com/keploy/orgChartApi) for test validation
