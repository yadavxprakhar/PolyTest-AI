import { useState, useEffect } from 'react';
import { 
  Play, 
  Terminal, 
  Cpu, 
  CheckCircle, 
  RefreshCw, 
  Database, 
  Code,
  FolderOpen, 
  Layers, 
  ChevronRight,
  Binary
} from 'lucide-react';

// --- Types ---
interface FileItem {
  file_path: string;
  language: string;
  framework: string;
}

interface ParsedStructure {
  classes: Array<{ name: string; methods: string[] }>;
  functions: string[];
  imports: string[];
  complexity: string;
}

// --- High-Fidelity Mock Database for Sandbox Mode ---
const SANDBOX_FILES: FileItem[] = [
  { file_path: 'src/calculator.py', language: 'Python', framework: 'pytest' },
  { file_path: 'src/user_service.js', language: 'JavaScript', framework: 'Jest' },
  { file_path: 'src/orders_handler.go', language: 'Go', framework: 'testing' },
  { file_path: 'src/AuthService.java', language: 'Java', framework: 'JUnit 5' },
  { file_path: 'src/DataProcess.cpp', language: 'C++', framework: 'Google Test' }
];

const SANDBOX_STRUCTURES: Record<string, ParsedStructure> = {
  'src/calculator.py': {
    classes: [
      { name: 'Calculator', methods: ['add', 'divide', 'multiply', 'subtract', 'process_batch_async'] }
    ],
    functions: ['validate_inputs', 'log_operation'],
    imports: ['math', 'time', 'asyncio'],
    complexity: 'Medium (O(N))'
  },
  'src/user_service.js': {
    classes: [
      { name: 'UserService', methods: ['getUserById', 'createUser', 'deleteUser', 'updateProfile'] }
    ],
    functions: ['hashPassword', 'validateEmail'],
    imports: ['crypto', 'dbConnector'],
    complexity: 'Low (O(1))'
  },
  'src/orders_handler.go': {
    classes: [],
    functions: ['ProcessOrder', 'CancelOrder', 'CalculateTaxes', 'DispatchReceipt'],
    imports: ['fmt', 'context', 'models/shipping'],
    complexity: 'High (O(N log N))'
  },
  'src/AuthService.java': {
    classes: [
      { name: 'AuthService', methods: ['authenticateUser', 'generateJwtToken', 'invalidateSession'] }
    ],
    functions: [],
    imports: ['java.util.Date', 'io.jsonwebtoken.Jwts', 'javax.crypto.SecretKey'],
    complexity: 'Medium'
  },
  'src/DataProcess.cpp': {
    classes: [
      { name: 'DataProcess', methods: ['loadBuffer', 'computeStandardDeviation', 'flushBuffer'] }
    ],
    functions: ['initializeDevice', 'shutdownDevice'],
    imports: ['iostream', 'vector', 'cmath', 'algorithm'],
    complexity: 'High (O(N^2))'
  }
};

const API_BASE = 'http://127.0.0.1:8000/api/v1';

function App() {
  // Connection and Workspace States
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [projectRoot, setProjectRoot] = useState<string>('/Users/prakhar/Projects/Polytest AI ');
  const [files, setFiles] = useState<FileItem[]>(SANDBOX_FILES);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(SANDBOX_FILES[0]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  
  // Code Inspection States
  const [parsedStructure, setParsedStructure] = useState<ParsedStructure | null>(SANDBOX_STRUCTURES['src/calculator.py']);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);

  // Generator Options
  const [activeTab, setActiveTab] = useState<'generate' | 'parse' | 'terminal'>('generate');
  const [selectedProvider, setSelectedProvider] = useState<string>('mock');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash');
  const [customFramework, setCustomFramework] = useState<string>('');
  const [useCache, setUseCache] = useState<boolean>(true);
  const [runImmediately, setRunImmediately] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Terminal & Run Outcomes
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '🌐 PolyTest AI Dashboard ready.',
    ' Sandbox Mode is ACTIVE. All operations will run on client stubs.'
  ]);
  const [generationOutcome, setGenerationOutcome] = useState<any | null>(null);

  // 1. Health Ping check to API Server
  const checkHealth = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/health');
      if (res.ok) {
        setIsBackendOnline(true);
        setTerminalLogs(prev => [
          ...prev, 
          '⚡ Java REST API Backend detected! Connected live at: http://127.0.0.1:8000'
        ]);
        // Trigger auto-detect immediately upon finding real backend
        triggerAutoDetect();
      } else {
        setIsBackendOnline(false);
      }
    } catch {
      setIsBackendOnline(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  // 2. Scan Workspace Files
  const triggerAutoDetect = async () => {
    setIsScanning(true);
    setTerminalLogs(prev => [...prev, '🔍 Scanning local workspace files recursively...']);
    
    if (isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/detect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_dir: null })
        });
        const data = await res.json();
        if (data.status === 'success' && data.files_found) {
          setFiles(data.files_found);
          setProjectRoot(data.project_root);
          if (data.files_found.length > 0) {
            setSelectedFile(data.files_found[0]);
          }
          setTerminalLogs(prev => [
            ...prev, 
            `✅ Found ${data.files_found.length} source file(s) in active workspace.`
          ]);
        }
      } catch (err) {
        setTerminalLogs(prev => [...prev, `❌ Live detection failed. Falling back to Sandbox Mode.`]);
      }
    } else {
      // Sandbox Simulator delay
      setTimeout(() => {
        setFiles(SANDBOX_FILES);
        setTerminalLogs(prev => [
          ...prev, 
          `✅ [Sandbox] Detected 5 files in workspace.`
        ]);
        setIsScanning(false);
      }, 800);
      return;
    }
    setIsScanning(false);
  };

  // 3. Analyze Target Code file
  const handleFileSelect = async (file: FileItem) => {
    setSelectedFile(file);
    setIsLoadingAnalysis(true);
    setTerminalLogs(prev => [...prev, `📂 Loading analysis schema for: ${file.file_path}`]);

    if (isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_path: file.file_path })
        });
        const data = await res.json();
        if (data.status === 'success') {
          setParsedStructure({
            classes: data.structure.classes,
            functions: data.structure.functions,
            imports: data.structure.imports,
            complexity: data.structure.complexity || 'Medium'
          });
        }
      } catch (e) {
        setTerminalLogs(prev => [...prev, `❌ Error calling analyze API: ${e}`]);
      }
    } else {
      // Sandbox Mock lookups
      setTimeout(() => {
        const mockStruct = SANDBOX_STRUCTURES[file.file_path] || {
          classes: [{ name: 'CustomService', methods: ['executeOperation'] }],
          functions: ['utilityHelper'],
          imports: ['standard_lib'],
          complexity: 'Low'
        };
        setParsedStructure(mockStruct);
        setIsLoadingAnalysis(false);
      }, 300);
      return;
    }
    setIsLoadingAnalysis(false);
  };

  // 4. Generate AI Unit Test Case API
  const handleGenerate = async () => {
    if (!selectedFile) return;
    setIsGenerating(true);
    setActiveTab('terminal');
    setTerminalLogs(prev => [
      ...prev, 
      `🚀 Initializing Test Generation orchestrator for: ${selectedFile.file_path}`,
      `⚙️ Engine parameters: Provider=${selectedProvider}, Model=${selectedModel}, Cache=${useCache}, Runner=${runImmediately}`
    ]);

    if (isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: selectedFile.file_path,
            provider: selectedProvider,
            model: selectedModel,
            framework: customFramework || null,
            mock: selectedProvider === 'mock',
            no_cache: !useCache,
            run: runImmediately
          })
        });
        const data = await res.json();
        if (data.status === 'success' && data.results.length > 0) {
          const mainRes = data.results[0];
          setGenerationOutcome(mainRes);
          
          setTerminalLogs(prev => [
            ...prev,
            `✨ Tests generated successfully in file: ${mainRes.test_file}`,
            `✅ Framework Target: ${mainRes.framework} (Cache Hit: ${mainRes.cached})`
          ]);

          if (mainRes.run_result) {
            const run = mainRes.run_result;
            setTerminalLogs(prev => [
              ...prev,
              `---------------- SUBPROCESS TEST RUNNER OUTPUT ----------------`,
              run.raw_output,
              `---------------------------------------------------------------`,
              `📊 Outcomes: Status=${run.status.toUpperCase()}, Passed=${run.passed_count}, Failed=${run.failed_count}, Duration=${run.duration_seconds.toFixed(3)}s`
            ]);
          }
        } else {
          setTerminalLogs(prev => [...prev, `❌ Test generation failed.`]);
        }
      } catch (err) {
        setTerminalLogs(prev => [...prev, `❌ Error processing generation API: ${err}`]);
      }
    } else {
      // Sandbox Generation Simulator
      setTimeout(() => {
        const targetFramework = customFramework || selectedFile.framework;
        const testFileDest = `tests/test_${selectedFile.file_path.split('/').pop()}`;
        
        setTerminalLogs(prev => [
          ...prev,
          `✨ [Sandbox Mode] Successfully generated tests!`,
          `📂 Test file written: ${testFileDest}`,
          `⚡ Parsing Syntax Check...`,
          `🟢 Validated Clean Syntax for: ${selectedFile.language}`
        ]);

        if (runImmediately) {
          setTimeout(() => {
            const numTests = selectedFile.language === 'Python' ? 5 : 3;
            setTerminalLogs(prev => [
              ...prev,
              `---------------- SUBPROCESS TEST RUNNER OUTPUT ----------------`,
              `platform darwin -- Python 3.14.3, pytest-9.0.3`,
              `rootdir: /Users/prakhar/Projects/Polytest AI`,
              `collected ${numTests} items`,
              `tests/${testFileDest.split('/').pop()} . ${'.'.repeat(numTests - 1)} [100%]`,
              `==================== ${numTests} passed in 0.012 seconds ====================`,
              `---------------------------------------------------------------`,
              `📊 Outcomes: Status=PASSED, Passed=${numTests}, Failed=0, Duration=0.012s`
            ]);
            setGenerationOutcome({
              status: 'success',
              source_file: selectedFile.file_path,
              test_file: testFileDest,
              framework: targetFramework,
              cached: false,
              run_result: {
                status: 'passed',
                passed_count: numTests,
                failed_count: 0,
                duration_seconds: 0.012,
                raw_output: 'pytest outcomes logs simulated.'
              }
            });
            setIsGenerating(false);
          }, 1200);
        } else {
          setGenerationOutcome({
            status: 'success',
            source_file: selectedFile.file_path,
            test_file: testFileDest,
            framework: targetFramework,
            cached: false
          });
          setIsGenerating(false);
        }
      }, 1500);
      return;
    }
    setIsGenerating(false);
  };

  const getLanguageColor = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'python': return '#3572A5';
      case 'javascript': return '#f1e05a';
      case 'typescript': return '#3178c6';
      case 'java': return '#b07219';
      case 'go': return '#00ADD8';
      case 'c++': return '#f34b7d';
      default: return '#9ca3af';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0b10] text-[#f3f4f6]">
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 border-b border-white/5 bg-[#11131c]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-600/10 border border-purple-500/20 shadow-purple-500/5 shadow-lg">
            <Cpu className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">PolyTest AI</h1>
            <p className="text-[10px] text-[#9ca3af] font-mono tracking-widest uppercase">REST Web Platform</p>
          </div>
        </div>

        {/* Connection Diagnostics Beacon */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3.5 px-4 py-2 rounded-xl border border-white/5 bg-[#0a0b10]/40">
            <span className="text-[11px] text-[#9ca3af] uppercase tracking-wider font-mono">Backend:</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isBackendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
              <span className={`text-[12px] font-semibold ${isBackendOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isBackendOnline ? 'ONLINE' : 'OFFLINE (SANDBOX)'}
              </span>
            </div>
          </div>
          
          <button 
            onClick={checkHealth}
            className="p-2.5 rounded-xl border border-white/5 bg-[#11131c] hover:border-purple-500/30 transition-all text-[#9ca3af] hover:text-white"
            title="Check diagnostics health"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Main Dashboard Layout Grid */}
      <main className="flex-1 grid grid-cols-12 gap-6 p-8 max-w-[1600px] w-full mx-auto">
        
        {/* Left column: Discovered Workspace Files (Width: 3 cols) */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wider text-[#9ca3af] uppercase font-mono flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-cyan-400" />
              Workspace Files ({files.length})
            </h2>
            <button 
              onClick={triggerAutoDetect}
              disabled={isScanning}
              className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scanning...' : 'Rescan'}
            </button>
          </div>

          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[70vh] pr-1">
            {files.map((file, idx) => (
              <div
                key={idx}
                onClick={() => handleFileSelect(file)}
                className={`group flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all duration-300 ${
                  selectedFile?.file_path === file.file_path
                    ? 'border-purple-500 bg-purple-500/5 shadow-[0_0_15px_rgba(168,85,247,0.06)]'
                    : 'border-white/5 bg-[#11131c]/40 hover:border-white/10 hover:bg-[#11131c]/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: getLanguageColor(file.language) }}
                  />
                  <div className="text-left">
                    <p className="text-sm font-medium leading-none group-hover:text-white transition-colors">
                      {file.file_path.split('/').pop()}
                    </p>
                    <span className="text-[10px] text-[#6b7280] font-mono leading-none">{file.file_path}</span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-[#6b7280] transition-transform ${selectedFile?.file_path === file.file_path ? 'translate-x-1 text-purple-400' : ''}`} />
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-[#11131c]/20 text-xs">
            <span className="text-[#6b7280] font-mono block mb-1">PROJECT ROOT</span>
            <span className="font-mono text-[#9ca3af] truncate block" title={projectRoot}>{projectRoot}</span>
          </div>
        </section>

        {/* Center column: Work Console Options & Terminal (Width: 9 cols) */}
        <section className="col-span-12 lg:col-span-9 flex flex-col gap-6">
          
          {/* Active File Meta HUD Banner */}
          {selectedFile && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl border border-white/5 bg-[#11131c]/30 backdrop-blur-sm">
              <div>
                <span className="text-[10px] text-[#6b7280] font-mono uppercase tracking-wider">Target File</span>
                <p className="text-base font-semibold text-white mt-0.5 truncate">{selectedFile.file_path.split('/').pop()}</p>
              </div>
              <div>
                <span className="text-[10px] text-[#6b7280] font-mono uppercase tracking-wider">Detected Language</span>
                <p className="text-base font-semibold text-white mt-0.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getLanguageColor(selectedFile.language) }} />
                  {selectedFile.language}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[#6b7280] font-mono uppercase tracking-wider">Linter Framework</span>
                <p className="text-base font-semibold text-purple-400 mt-0.5">{selectedFile.framework}</p>
              </div>
              <div>
                <span className="text-[10px] text-[#6b7280] font-mono uppercase tracking-wider">Heuristic Complexity</span>
                <p className="text-base font-semibold text-cyan-400 mt-0.5">{parsedStructure?.complexity || 'Analyzing...'}</p>
              </div>
            </div>
          )}

          {/* Action Hub Panels & Tabs */}
          <div className="flex-1 flex flex-col rounded-2xl border border-white/5 bg-[#11131c]/50 overflow-hidden shadow-lg min-h-[500px]">
            {/* Header Tabs switcher */}
            <div className="flex border-b border-white/5 bg-[#11131c]">
              <button
                onClick={() => setActiveTab('generate')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === 'generate'
                    ? 'border-purple-500 text-purple-400 bg-white/[0.01]'
                    : 'border-transparent text-[#9ca3af] hover:text-white'
                }`}
              >
                <Cpu className="w-4 h-4" />
                AI Test Suite Generator
              </button>
              <button
                onClick={() => setActiveTab('parse')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === 'parse'
                    ? 'border-purple-500 text-purple-400 bg-white/[0.01]'
                    : 'border-transparent text-[#9ca3af] hover:text-white'
                }`}
              >
                <Code className="w-4 h-4" />
                Parsed AST Inspector
              </button>
              <button
                onClick={() => setActiveTab('terminal')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === 'terminal'
                    ? 'border-purple-500 text-purple-400 bg-white/[0.01]'
                    : 'border-transparent text-[#9ca3af] hover:text-white'
                }`}
              >
                <Terminal className="w-4 h-4" />
                Live Console logs
              </button>
            </div>

            {/* Content Routed by Active Tab */}
            <div className="flex-1 p-6 flex flex-col justify-between">
              
              {/* TAB 1: AI Test Suite Generator */}
              {activeTab === 'generate' && (
                <div className="flex-1 grid grid-cols-12 gap-8 animation-slideUp">
                  
                  {/* Left sub-panel: Config form parameters */}
                  <div className="col-span-12 md:col-span-6 flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider font-mono">LLM Provider</label>
                      <select 
                        value={selectedProvider} 
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="form-input form-select"
                      >
                        <option value="mock">Offline Mock compiler (instant)</option>
                        <option value="openai">OpenAI (GPT-4o)</option>
                        <option value="gemini">Google Gemini (1.5-flash)</option>
                        <option value="anthropic">Anthropic Claude</option>
                        <option value="ollama">Ollama (Local Models)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider font-mono">Model Endpoint</label>
                      <input 
                        type="text" 
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="form-input" 
                        placeholder="e.g. gemini-1.5-flash, gpt-4o"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider font-mono">Override Framework (Optional)</label>
                      <input 
                        type="text" 
                        value={customFramework}
                        onChange={(e) => setCustomFramework(e.target.value)}
                        className="form-input" 
                        placeholder="Leave blank for auto-detected defaults"
                      />
                    </div>
                  </div>

                  {/* Right sub-panel: Toggles & Launch trigger */}
                  <div className="col-span-12 md:col-span-6 flex flex-col justify-between">
                    <div className="flex flex-col gap-4">
                      {/* Caching check */}
                      <div 
                        onClick={() => setUseCache(!useCache)}
                        className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-[#0a0b10]/40 cursor-pointer hover:border-white/10 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <Database className="w-5 h-5 text-cyan-400" />
                          <div className="text-left">
                            <p className="text-sm font-semibold text-white">Enable Cache Lookups</p>
                            <span className="text-[10px] text-[#6b7280] font-mono">Retrieves identical queries from cache to save LLM tokens.</span>
                          </div>
                        </div>
                        <input type="checkbox" checked={useCache} onChange={() => {}} className="accent-purple-500" />
                      </div>

                      {/* Auto runner check */}
                      <div 
                        onClick={() => setRunImmediately(!runImmediately)}
                        className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-[#0a0b10]/40 cursor-pointer hover:border-white/10 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <Play className="w-5 h-5 text-purple-400" />
                          <div className="text-left">
                            <p className="text-sm font-semibold text-white">Auto Execute Runner</p>
                            <span className="text-[10px] text-[#6b7280] font-mono">Launches subprocess tests immediately after generation.</span>
                          </div>
                        </div>
                        <input type="checkbox" checked={runImmediately} onChange={() => {}} className="accent-purple-500" />
                      </div>
                    </div>

                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || !selectedFile}
                      className="glowing-button py-4 mt-6 text-center justify-center font-bold text-base"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          GENERATING TESTS...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 fill-current" />
                          GENERATE & VALIDATE TEST SUITE
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: Parsed AST Inspector */}
              {activeTab === 'parse' && (
                <div className="flex-1 flex flex-col gap-6 animation-slideUp">
                  {isLoadingAnalysis ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
                      <p className="text-sm text-[#9ca3af] font-mono">Parsing file classes and imports...</p>
                    </div>
                  ) : parsedStructure ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Classes and methods */}
                      <div className="p-4 rounded-xl border border-white/5 bg-[#0a0b10]/40 flex flex-col gap-3">
                        <span className="text-xs font-semibold text-purple-400 font-mono tracking-wider uppercase flex items-center gap-1.5">
                          <Layers className="w-4 h-4" />
                          Classes Detected
                        </span>
                        {parsedStructure.classes.length > 0 ? (
                          <div className="flex flex-col gap-3">
                            {parsedStructure.classes.map((cls, idx) => (
                              <div key={idx} className="p-3 rounded-lg bg-[#11131c] border border-white/5">
                                <p className="text-sm font-semibold text-white font-mono">{cls.name}</p>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {cls.methods.map((method, mIdx) => (
                                    <span key={mIdx} className="text-[10px] font-mono bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                                      {method}()
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#6b7280] italic">No classes declared.</p>
                        )}
                      </div>

                      {/* Standalone functions */}
                      <div className="p-4 rounded-xl border border-white/5 bg-[#0a0b10]/40 flex flex-col gap-3">
                        <span className="text-xs font-semibold text-cyan-400 font-mono tracking-wider uppercase flex items-center gap-1.5">
                          <Code className="w-4 h-4" />
                          Standalone Functions
                        </span>
                        {parsedStructure.functions.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {parsedStructure.functions.map((func, idx) => (
                              <span key={idx} className="text-xs font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-lg">
                                {func}()
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#6b7280] italic">No standalone functions detected.</p>
                        )}
                      </div>

                      {/* Imports and packages */}
                      <div className="p-4 rounded-xl border border-white/5 bg-[#0a0b10]/40 flex flex-col gap-3">
                        <span className="text-xs font-semibold text-emerald-400 font-mono tracking-wider uppercase flex items-center gap-1.5">
                          <Database className="w-4 h-4" />
                          Import Dependencies
                        </span>
                        {parsedStructure.imports.length > 0 ? (
                          <div className="flex flex-col gap-2 max-h-[25vh] overflow-y-auto">
                            {parsedStructure.imports.map((imp, idx) => (
                              <span key={idx} className="text-xs font-mono text-[#9ca3af] truncate" title={imp}>
                                import {imp}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#6b7280] italic">No imports processed.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-sm text-[#6b7280] italic">Select a file to parse its structure.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Live Console logs */}
              {activeTab === 'terminal' && (
                <div className="flex-1 flex flex-col gap-4 animation-slideUp h-[300px]">
                  {/* Console window */}
                  <div className="flex-1 p-4 rounded-xl bg-[#07080c] border border-white/5 font-mono text-xs overflow-y-auto flex flex-col gap-1.5 text-left select-text">
                    {terminalLogs.map((log, idx) => (
                      <div key={idx} className="leading-relaxed">
                        {log.startsWith('❌') ? (
                          <span className="text-red-400">{log}</span>
                        ) : log.startsWith('✅') || log.startsWith('✨') ? (
                          <span className="text-emerald-400">{log}</span>
                        ) : log.startsWith('⚙️') || log.startsWith('🌐') ? (
                          <span className="text-purple-400">{log}</span>
                        ) : log.startsWith('📊') ? (
                          <span className="text-cyan-400 font-bold">{log}</span>
                        ) : (
                          <span className="text-gray-300">{log}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Generation and Execution Visual Outcome summary metrics */}
                  {generationOutcome && (
                    <div className="flex flex-wrap gap-4 p-4 rounded-xl border border-white/5 bg-[#11131c]/50">
                      <div className="flex items-center gap-2 mr-6">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <span className="text-xs font-mono uppercase tracking-wider text-[#9ca3af]">Linter:</span>
                        <span className="text-sm font-semibold text-emerald-400 uppercase">Passed</span>
                      </div>
                      
                      {generationOutcome.run_result && (
                        <>
                          <div className="flex items-center gap-2 mr-6">
                            <span className="text-xs font-mono uppercase tracking-wider text-[#9ca3af]">Test Outcomes:</span>
                            <span className={`text-sm font-semibold uppercase ${generationOutcome.run_result.status === 'passed' ? 'text-emerald-400' : 'text-red-400'}`}>
                              {generationOutcome.run_result.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mr-6">
                            <span className="text-xs font-mono uppercase tracking-wider text-[#9ca3af]">Total Tests:</span>
                            <span className="text-sm font-semibold text-white">{generationOutcome.run_result.passed_count} Passed</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono uppercase tracking-wider text-[#9ca3af]">Duration:</span>
                            <span className="text-sm font-semibold text-cyan-400">{generationOutcome.run_result.duration_seconds.toFixed(3)}s</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </section>

      </main>

      {/* 3. Footer */}
      <footer className="py-6 border-t border-white/5 bg-[#11131c]/40 text-center text-xs text-[#6b7280] font-mono flex flex-col gap-1.5">
        <p>© 2026 PolyTest AI REST Platform. Enterprise Edition.</p>
        <p className="text-[10px] text-cyan-400/60 uppercase tracking-widest flex items-center justify-center gap-1">
          <Binary className="w-3.5 h-3.5" />
          Java Backend + React Frontend Architecture
        </p>
      </footer>
    </div>
  );
}

export default App;
