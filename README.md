# PolyTest AI 🚀
### *Universal Multi-Language AI Static Code Analyzer & Unit Test Generator*

**PolyTest AI** is an advanced, high-speed, and intelligent static analysis dashboard and CLI platform. It recursively parses code constructs, models abstract syntax trees (ASTs), executes non-destructive Drycompile syntax linting, streams sandboxed subprocess telemetry, and generates fully functional unit test suites through secure, offline prompt caching.

---

## ✨ Features & Capabilities

### 🌟 1. Holographic AST Class Parser
*   **Double-Column Code Explorer**: Spring-animated workspace displaying imports, nested classes, static variables, and standalone functions.
*   **Real-time Token Inspector**: Click on any class method to dynamically verify argument types, accessibility scopes (`PUBLIC`/`PRIVATE`), async/promise checks, and generate mock recommendations.

### 🛡️ 2. Drycompile Linter Workspace
*   **Isolated Compilation Dryruns**: Runs non-destructive syntax verification via host compilers (`node --check`, `javac -Xlint`, `gcc -fsyntax-only`).
*   **Warning & Advisory Registry**: Color-coded linter logs mapping target lines, severity levels, issue descriptions, and specific code **remedies**.

### ⏱️ 3. Cryptographic Prompt Cache (MD5)
*   **Instant Local Recovers**: Computes `MD5` checksum signatures derived from prompts and source files. If files are unchanged, it pulls from cache logs in **15ms**, avoiding duplicate LLM API tokens charges.
*   **Visual Status Indicators**: Watch the real-time cache toggle state transition from `DISABLED` to a glowing `ACTIVE (HIT)` displaying computed hash keys.

### 📊 4. Subprocess Subrunner Telemetry
*   **Real-time Process Tracking**: Streams sandboxed process IDs (PIDs), CPU cycle graphs, and memory load metrics.
*   **Segmented Output Channels**: Swap between **Execution Logs** (live standard streams), **Run Metrics** (model settings and dynamic coverage progress target bar), and **Diagnostics** lists.

### 📂 5. Interactive Explorer & Add File Wizard
*   **Custom Sandbox Registration**: A glassmorphic creation dialog let developers inject custom source files (`+ Add File`), choose languages, assign test frameworks, and verify AST parsing immediately in state.

---

## 📂 Directory Layout

```text
├── app/                  # Host desktop wrappers
├── backend/              # Node.js + TypeScript REST API Server
│   ├── src/index.ts      # Express server routes
│   └── src/core/         # Language detectors, parsers, test generators, runners
├── cache/                # Encrypted MD5 local cache logs
├── cli/                  # High-performance CLI dashboard (Python)
├── core/                 # Core analysis modules (Python backend)
├── frontend/             # Premium React + Vite Developer Dashboard
│   ├── src/App.tsx       # Core dashboard workspace component
│   └── src/index.css     # Premium styling layers
├── prompt/               # Custom system LLM prompt models
├── report/               # Coverage audit HTML dashboards
└── tests/                # Generated framework unit test files
```

---

## 🚀 Getting Started

### Tier 1: Running the Interactive Web Dashboard Console

#### 1. Start the REST API Engine (Node.js & TypeScript)
Configure parameters and launch the compilation server:
```bash
cd backend
npm install
npm run build
npm run dev
```
*API engine boots up at:* `http://localhost:8000`

#### 2. Launch the Developer Dashboard Frontend
Launch the premium web workspace:
```bash
cd ../frontend
npm install
npm run dev
```
*Dashboard console compiles and opens at:* `http://localhost:5173`

---

### Tier 2: Running the Python CLI Dashboard

#### 1. Setup Virtual Environment
```bash
source .venv/bin/activate
pip install -r requirements.txt
```

#### 2. Initialize YAML Configuration
```bash
python3 -m cli.main init
```

#### 3. Deep Static AST Analysis
```bash
python3 -m cli.main analyze src/calculator.py
```

#### 4. Sandbox Test Generation (Dryrun Offline)
```bash
python3 -m cli.main generate src/ --mock --no-cache
```

#### 5. Live AI API Suite compiles
```bash
export GEMINI_API_KEY="your_api_key_here"
python3 -m cli.main generate src/calculator.py --provider gemini --model gemini-1.5-flash
```

---

## 🧪 Supported Test Frameworks

| Language | Default Framework | Supported Frameworks | Linter Validator |
| :--- | :---: | :---: | :--- |
| **TypeScript** | `Jest` | `Jest`, `Mocha` | Node check (`node --check`) |
| **JavaScript** | `Jest` | `Jest`, `Mocha` | Node check (`node --check`) |
| **Python** | `pytest` | `pytest`, `unittest` | Python AST compilation |
| **Java** | `JUnit 5` | `JUnit 5`, `JUnit 4` | JDK compiler (`javac`) |
| **C++** | `Google Test` | `Google Test` | C++ compilation (`g++` / `clang++`) |
| **Go** | `testing` | `testing` | Go tool compiler |
| **C#** | `xUnit` | `xUnit` | Roslyn compiler (`csc`) |

---

## 📜 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
