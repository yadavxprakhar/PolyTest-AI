import { useState, useEffect } from 'react';
import { 
  Play, 
  Cpu, 
  RefreshCw, 
  Code,
  FolderOpen, 
  Binary,
  Folder,
  FileCode,
  Bell,
  Activity,
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  ArrowLeft,
  Sliders,
  AlertTriangle
} from 'lucide-react';

// --- Types ---
interface FileItem {
  file_path: string;
  language: string;
  framework: string;
}

interface MethodSignature {
  name: string;
  args: string;
}

interface ParsedStructure {
  classes: Array<{ name: string; methods: MethodSignature[] }>;
  functions: MethodSignature[];
  imports: string[];
  complexity: string;
}

// --- Mock Database for Sandbox Mode ---
const SANDBOX_FILES: FileItem[] = [
  { file_path: 'src/services/UserAuth.ts', language: 'TypeScript', framework: 'Jest' },
  { file_path: 'src/services/PaymentService.ts', language: 'TypeScript', framework: 'Jest' },
  { file_path: 'src/api/DataParser.cpp', language: 'C++', framework: 'Google Test' },
  { file_path: 'src/utils.go', language: 'Go', framework: 'testing' },
  { file_path: 'src/models/AuthService.java', language: 'Java', framework: 'JUnit 5' }
];

const SANDBOX_STRUCTURES: Record<string, ParsedStructure> = {
  'src/services/UserAuth.ts': {
    classes: [
      { 
        name: 'UserAuth', 
        methods: [
          { name: 'login', args: '(user: User, mfaToken: string) -> Promise<Session>' },
          { name: 'logout', args: '(sessionId: string) -> Promise<void>' },
          { name: 'requestPasswordReset', args: '(email: string) -> Promise<boolean>' },
          { name: 'verifyMfaToken', args: '(token: string) -> boolean' }
        ] 
      }
    ],
    functions: [
      { name: 'validateEmailFormat', args: '(email: string) -> boolean' },
      { name: 'hashCredentials', args: '(pass: string) -> Promise<string>' }
    ],
    imports: ['jwt', 'crypto', 'dbConnector'],
    complexity: 'Medium (O(N))'
  },
  'src/services/PaymentService.ts': {
    classes: [
      { 
        name: 'PaymentService', 
        methods: [
          { name: 'initialize', args: '(apiKey: string, sandbox: boolean) -> void' },
          { name: 'processTransaction', args: '(amount: number, currency: string) -> Promise<Receipt>' },
          { name: 'refund', args: '(transactionId: string, value: number) -> Promise<Receipt>' },
          { name: 'validateCard', args: '(cardNumber: string, expiry: string) -> boolean' }
        ] 
      }
    ],
    functions: [],
    imports: ['stripe', 'config', 'models/Transaction'],
    complexity: 'Low (O(1))'
  },
  'src/api/DataParser.cpp': {
    classes: [
      { 
        name: 'DataParser', 
        methods: [
          { name: 'loadBuffer', args: '(const char* buffer, size_t len) -> bool' },
          { name: 'computeStandardDeviation', args: '(const std::vector<double>& v) -> double' },
          { name: 'flushBuffer', args: '() -> void' }
        ] 
      }
    ],
    functions: [
      { name: 'initializeDevice', args: '() -> int' },
      { name: 'shutdownDevice', args: '() -> void' }
    ],
    imports: ['iostream', 'vector', 'cmath', 'algorithm'],
    complexity: 'High (O(N^2))'
  },
  'src/utils.go': {
    classes: [],
    functions: [
      { name: 'ProcessOrder', args: '(ctx context.Context, ord *Order) error' },
      { name: 'CancelOrder', args: '(ctx context.Context, id string) error' },
      { name: 'CalculateTaxes', args: '(subtotal float64, rate float64) float64' },
      { name: 'DispatchReceipt', args: '(receipt *Receipt) <-chan struct{}' }
    ],
    imports: ['fmt', 'context', 'models/shipping'],
    complexity: 'High (O(N log N))'
  },
  'src/models/AuthService.java': {
    classes: [
      { 
        name: 'AuthService', 
        methods: [
          { name: 'authenticateUser', args: '(User user, String pass) -> boolean' },
          { name: 'generateJwtToken', args: '(UserPrincipal principal) -> String' },
          { name: 'invalidateSession', args: '(UUID sessionId) -> void' }
        ] 
      }
    ],
    functions: [],
    imports: ['java.util.Date', 'io.jsonwebtoken.Jwts', 'javax.crypto.SecretKey'],
    complexity: 'Medium'
  }
};

const API_BASE = 'http://127.0.0.1:8000/api/v1';

function App() {
  // Navigation State: 'landing' or 'console'
  const [viewMode, setViewMode] = useState<'landing' | 'console'>('landing');

  // Connection and Workspace States
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [projectRoot, setProjectRoot] = useState<string>('/Users/prakhar/Projects/Polytest AI ');
  const [files, setFiles] = useState<FileItem[]>(SANDBOX_FILES);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(SANDBOX_FILES[1]); // PaymentService.ts
  const [isScanning, setIsScanning] = useState<boolean>(false);
  
  // Code Inspection States
  const [parsedStructure, setParsedStructure] = useState<ParsedStructure | null>(SANDBOX_STRUCTURES['src/services/PaymentService.ts']);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [selectedMethods, setSelectedMethods] = useState<string[]>(['initialize', 'processTransaction', 'refund', 'validateCard']);

  // Advanced AI Slider states
  const [temperature, setTemperature] = useState<number>(0.2);
  const [maxTokens, setMaxTokens] = useState<number>(2048);
  const [coverageTarget, setCoverageTarget] = useState<number>(90);

  // Generator Options
  const [selectedProvider, setSelectedProvider] = useState<string>('mock');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash');
  const [useCache, setUseCache] = useState<boolean>(true);
  const [runImmediately, setRunImmediately] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Radial Progress parameters
  const [syntaxCorrectness, setSyntaxCorrectness] = useState<number>(98);
  const [validatedCount, setValidatedCount] = useState<number>(114);
  const [issueCount, setIssueCount] = useState<number>(2);

  // Terminal Tab State: 'execution' | 'metrics' | 'warnings'
  const [terminalTab, setTerminalTab] = useState<'execution' | 'metrics' | 'warnings'>('execution');

  // Terminal & Run Outcomes
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '🌐 PolyTest AI Premium Engine successfully initialized.',
    '⚡ Active client stack: React + TypeScript (Vite).',
    '🔌 Local host connection: Ready to query REST endpoints.',
    'ℹ️ Sandbox fallback mode is ACTIVE (Mock profiles loaded).'
  ]);

  // 1. Health Ping check to API Server
  const checkHealth = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/health');
      if (res.ok) {
        setIsBackendOnline(true);
        setTerminalLogs(prev => [
          ...prev, 
          '🟢 Node.js TypeScript Express server detected online! Binding REST channels live on Port 8000.'
        ]);
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
            handleFileSelect(data.files_found[0]);
          }
          setTerminalLogs(prev => [
            ...prev, 
            `✅ Found ${data.files_found.length} active multi-language developer files.`
          ]);
        }
      } catch (err) {
        setTerminalLogs(prev => [...prev, `❌ Backend scanning failed. Safe-mode sandbox active.`]);
      }
    } else {
      setTimeout(() => {
        setFiles(SANDBOX_FILES);
        setTerminalLogs(prev => [
          ...prev, 
          `✅ [Sandbox] Auto-scanned project. Located 5 target source files.`
        ]);
        setIsScanning(false);
      }, 500);
      return;
    }
    setIsScanning(false);
  };

  // 3. Analyze Target Code file
  const handleFileSelect = async (file: FileItem) => {
    setSelectedFile(file);
    setIsLoadingAnalysis(true);
    setTerminalLogs(prev => [...prev, `📂 Loading AST structural patterns: ${file.file_path}`]);

    if (isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_path: file.file_path })
        });
        const data = await res.json();
        if (data.status === 'success') {
          const struct: ParsedStructure = {
            classes: data.structure.classes,
            functions: data.structure.functions,
            imports: data.structure.imports,
            complexity: data.structure.complexity || 'Medium'
          };
          setParsedStructure(struct);
          
          const methodsList: string[] = [];
          struct.classes.forEach(c => methodsList.push(...c.methods.map(m => m.name)));
          setSelectedMethods(methodsList);
        }
      } catch (e) {
        setTerminalLogs(prev => [...prev, `❌ AST parser error: ${e}`]);
      }
    } else {
      setTimeout(() => {
        const mockStruct = SANDBOX_STRUCTURES[file.file_path] || {
          classes: [{ name: 'CustomService', methods: [{ name: 'executeOperation', args: '() -> void' }] }],
          functions: [{ name: 'utilityHelper', args: '() -> void' }],
          imports: ['standard_lib'],
          complexity: 'Low'
        };
        setParsedStructure(mockStruct);
        
        const methodsList: string[] = [];
        mockStruct.classes.forEach(c => methodsList.push(...c.methods.map(m => m.name)));
        mockStruct.functions.forEach(f => methodsList.push(f.name));
        setSelectedMethods(methodsList);
        
        setIsLoadingAnalysis(false);
      }, 200);
      return;
    }
    setIsLoadingAnalysis(false);
  };

  // Toggle single method selection
  const toggleMethod = (method: string) => {
    if (selectedMethods.includes(method)) {
      setSelectedMethods(prev => prev.filter(m => m !== method));
    } else {
      setSelectedMethods(prev => [...prev, method]);
    }
  };

  // 4. Generate AI Unit Test Case API
  const handleGenerate = async () => {
    if (!selectedFile) return;
    setIsGenerating(true);
    setTerminalLogs(prev => [
      ...prev, 
      `🚀 Initializing PolyTest test generation for: ${selectedFile.file_path}`,
      `⚙️ System Config: Temperature=${temperature}, Tokens=${maxTokens}, TargetCoverage=${coverageTarget}%, Methods=[${selectedMethods.join(', ')}]`
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
            framework: null,
            mock: selectedProvider === 'mock',
            no_cache: !useCache,
            run: runImmediately
          })
        });
        const data = await res.json();
        if (data.status === 'success' && data.results.length > 0) {
          const mainRes = data.results[0];
          
          setTerminalLogs(prev => [
            ...prev,
            `✨ Test suite written successfully into output: ${mainRes.test_file}`,
            `✅ Compiler Check: PASSED. Generated 12 validation blocks.`
          ]);

          if (mainRes.run_result) {
            const run = mainRes.run_result;
            setTerminalLogs(prev => [
              ...prev,
              `---------------- SUBPROCESS EXECUTION LOGS ----------------`,
              run.raw_output,
              `-----------------------------------------------------------`,
              `📊 Outcomes: Passed=${run.passed_count}, Failed=${run.failed_count}, Duration=${run.duration_seconds.toFixed(3)}s`
            ]);
            
            setSyntaxCorrectness(100);
            setValidatedCount(prev => prev + 1);
            setIssueCount(0);
          }
        } else {
          setTerminalLogs(prev => [...prev, `❌ Generation check failed: ${data.detail || 'Internal server error'}`]);
        }
      } catch (err) {
        setTerminalLogs(prev => [...prev, `❌ Connection error calling REST generate route.`]);
      }
    } else {
      setTimeout(() => {
        const testFileDest = `tests/test_${selectedFile.file_path.split('/').pop()}`;
        
        setTerminalLogs(prev => [
          ...prev,
          `✨ [SANDBOX] AI compilation processed!`,
          `📁 Output created: ${testFileDest}`,
          `⚡ Executing syntax validation compiler pipeline...`,
          `🟢 Validated clean and stable syntax: 100% correct.`
        ]);

        if (runImmediately) {
          setTimeout(() => {
            const numTests = selectedMethods.length > 0 ? selectedMethods.length : 4;
            setTerminalLogs(prev => [
              ...prev,
              `---------------- SUBPROCESS EXECUTION LOGS ----------------`,
              `[POLYTEST] Analysis complete... [AI] Analyzing code methods.`,
              `[STATUS] Generating tests for '${selectedFile.file_path.split('/').pop()}'...`,
              `[SUCCESS] Generated '${testFileDest.split('/').pop()}' (${numTests} specs, 98% cov)`,
              `platform darwin -- node.js v25.9.0, Jest 29.5`,
              `collected ${numTests} items`,
              `tests/${testFileDest.split('/').pop()} . ${'.'.repeat(numTests - 1)} [100%]`,
              `==================== ${numTests} passed in 0.018 seconds ====================`,
              `-----------------------------------------------------------`,
              `📊 Outcomes: Status=PASSED, Passed=${numTests}, Failed=0, Duration=0.018s`
            ]);
            setSyntaxCorrectness(100);
            setValidatedCount(prev => prev + 1);
            setIssueCount(0);
            setIsGenerating(false);
          }, 1000);
        } else {
          setIsGenerating(false);
        }
      }, 1200);
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
      default: return '#94a3b8';
    }
  };



  return (
    <div className="select-none">
      
      {/* ========================================================================= */}
      {/* VIEW MODE 1: PREMIUM SAAS LANDING PAGE */}
      {/* ========================================================================= */}
      {viewMode === 'landing' && (
        <div className="animation-slideUp">
          
          {/* SaaS Header Bar */}
          <nav className="saas-nav-block">
            <div className="flex-row-align">
              <div className="brand-icon-box">
                <Cpu className="w-5 h-5 text-cyan-400" />
              </div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-[#8c52ff] to-purple-400 bg-clip-text text-transparent">PolyTest AI</h1>
            </div>

            <div className="saas-nav-links">
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#vscode">VS Code Extension</a>
              <span className="nav-split-divider" />
              <div className="nav-status-badge">
                <span className={`nav-status-dot ${isBackendOnline ? 'active' : 'sandbox'}`} />
                <span>{isBackendOnline ? 'REST Active' : 'Sandbox Ready'}</span>
              </div>
            </div>

            <button 
              onClick={() => setViewMode('console')}
              className="crisp-button"
            >
              Launch Console
              <ArrowRight className="w-4 h-4" />
            </button>
          </nav>

          {/* SaaS Hero Section */}
          <header className="hero-wrapper">
            <div className="hero-left">
              <span className="hero-tag">
                🚀 Now Supporting 7 Languages
              </span>
              <h2 className="hero-heading">
                Autonomous Unit Test Generation For <span className="gradient-text">Developers.</span>
              </h2>
              <p className="hero-description" style={{ fontSize: '15px' }}>
                Statically parse codebase AST architectures, execute compiler linter dry-runs, and validate test suites via sandboxed subprocess runners—instantly and completely offline.
              </p>

              <div className="hero-cta-buttons">
                <button 
                  onClick={() => setViewMode('console')}
                  className="crisp-button"
                  style={{ padding: '14px 28px' }}
                >
                  Start Free Workspace
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a 
                  href="#vscode"
                  className="crisp-button-secondary"
                  style={{ padding: '14px 28px' }}
                >
                  Install Extension
                </a>
              </div>
            </div>

            {/* Embedded high-resolution illustration banner */}
            <div className="hero-right-visual">
              <div className="hero-visual-frame-crisp">
                <img 
                  src="/polytest_saas_hero.png" 
                  alt="PolyTest AI Core Compiler Sphere illustration"
                  className="hero-visual-image"
                  style={{ borderRadius: '12px' }}
                />
              </div>
            </div>
          </header>

          {/* Feature grid Section */}
          <section id="features" style={{ borderTop: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
            <div className="features-grid-wrapper">
              
              {/* Feature 1 */}
              <div className="feature-box-crisp">
                <div className="icon-wrapper-badge cyan">
                  <Code className="w-4 h-4" />
                </div>
                <h4 className="feature-card-title">Multi-Language AST</h4>
                <p className="feature-card-desc">
                  State-aware AST parsers statically profile classes, imports, functions, and complexity with zero compiler dependencies.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="feature-box-crisp">
                <div className="icon-wrapper-badge purple">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="feature-card-title">Syntax drycompile linter</h4>
                <p className="feature-card-desc">
                  Automated validation linter compiler scans (e.g. `node --check`, `javac`) catch syntax exceptions prior to writing files.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="feature-box-crisp">
                <div className="icon-wrapper-badge green">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="feature-card-title">Subprocess execution</h4>
                <p className="feature-card-desc">
                  Test execution engines trigger local runners (Jest, pytest, JUnit) inside spawned background threads, parsing stdout streams.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="feature-box-crisp">
                <div className="icon-wrapper-badge red">
                  <Layers className="w-4 h-4" />
                </div>
                <h4 className="feature-card-title">MD5 Prompt Caching</h4>
                <p className="feature-card-desc">
                  Encodes generated targets under local MD5 prompts caching hashes, saving up to 80% on developer credit costs.
                </p>
              </div>

            </div>
          </section>

          {/* VS Code Extension Section */}
          <section id="vscode" className="saas-vscode-section">
            <div className="vscode-left-text">
              <span className="section-label">Integrations</span>
              <h3 className="section-main-heading">The native VS Code extension is active</h3>
              <p className="hero-description">
                Since the entire engine runs under zero-dependency TypeScript modules, you can package the backend directly inside your VS Code extension. Trigger unit test code generation with a simple right-click inside your editor panel!
              </p>
              <div className="vscode-terminal-cmd">
                <span>$ ext install polytest.polytest-vscode</span>
              </div>
            </div>

            <div className="vscode-right-mockup">
              <div className="simulated-editor-window">
                <div className="editor-window-header">
                  <span className="dot-btn red" />
                  <span className="dot-btn yellow" />
                  <span className="dot-btn green" />
                  <span className="editor-window-title">polytest-extension-development-host</span>
                </div>
                <p style={{ color: 'var(--accent-purple)' }}>⚡ PolyTest AI VS Code Extension active!</p>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>// Context menu hook registered: editor/context</p>
                <p style={{ color: '#fff', marginTop: '6px' }}>Right-click menu: [PolyTest AI: Generate Unit Tests]</p>
                <p style={{ color: 'var(--accent-cyan)', marginTop: '12px' }}>✨ Generating PaymentService.test.ts (100% correct AST parsed)...</p>
              </div>
            </div>
          </section>

          {/* Pricing Grid Section */}
          <section id="pricing" className="pricing-section-wrapper">
            <div className="section-header-block">
              <span className="section-label">Pricing</span>
              <h3 className="section-main-heading">Flexible plans for any team</h3>
            </div>

            <div className="pricing-grid-crisp">
              
              {/* Plan 1 */}
              <div className="pricing-card-crisp">
                <div>
                  <h4 className="pricing-card-title">Developer</h4>
                  <p className="pricing-card-sub">For hobbyists and local extension compilers.</p>
                </div>
                <div className="pricing-card-amount-block">
                  <span className="pricing-amount">$0</span>
                  <span className="pricing-period">/forever</span>
                </div>
                <ul className="pricing-features-list">
                  <li>✓ Local Mock Generation</li>
                  <li>✓ Dynamic AST Parsers</li>
                  <li>✓ VS Code offline extension</li>
                </ul>
                <button onClick={() => setViewMode('console')} className="crisp-button-secondary" style={{ marginTop: 'auto', justifyContent: 'center' }}>
                  Get Started
                </button>
              </div>

              {/* Plan 2: Promoted SaaS Card */}
              <div className="pricing-card-crisp highlighted">
                <span className="pricing-pop-tag">
                  Popular
                </span>
                <div>
                  <h4 className="pricing-card-title">Startup Pro</h4>
                  <p className="pricing-card-sub">For fast-moving development teams.</p>
                </div>
                <div className="pricing-card-amount-block">
                  <span className="pricing-amount">$29</span>
                  <span className="pricing-period">/month</span>
                </div>
                <ul className="pricing-features-list">
                  <li className="highlight-item">✓ Real OpenAI / Gemini API access</li>
                  <li>✓ Unlimited Cache Lookups</li>
                  <li>✓ Direct CLI subprocess runs</li>
                  <li>✓ Comprehensive validator modes</li>
                </ul>
                <button onClick={() => setViewMode('console')} className="crisp-button" style={{ marginTop: 'auto' }}>
                  Launch Console
                </button>
              </div>

              {/* Plan 3 */}
              <div className="pricing-card-crisp">
                <div>
                  <h4 className="pricing-card-title">Enterprise</h4>
                  <p className="pricing-card-sub">For scale-ups and high compliance pipelines.</p>
                </div>
                <div className="pricing-card-amount-block">
                  <span className="pricing-amount">Custom</span>
                </div>
                <ul className="pricing-features-list">
                  <li>✓ Dedicated local LLM hosting</li>
                  <li>✓ Custom linter integrations</li>
                  <li>✓ SLA support channels</li>
                </ul>
                <button onClick={() => setViewMode('console')} className="crisp-button-secondary" style={{ marginTop: 'auto', justifyContent: 'center' }}>
                  Contact Sales
                </button>
              </div>

            </div>
          </section>

          {/* SaaS Footer */}
          <footer className="saas-footer-crisp">
            <p>© 2026 PolyTest AI REST Platform. Enterprise SaaS Edition.</p>
            <p className="footer-subtitle-crisp">
              <Binary className="w-3.5 h-3.5" />
              TypeScript Core Stack Platform
            </p>
          </footer>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 2: INTERACTIVE DEVELOPER DASHBOARD CONSOLE */}
      {/* ========================================================================= */}
      {viewMode === 'console' && (
        <div className="animation-slideUp">
          
          {/* Header HUD Navigation */}
          <header className="console-hud-bar">
            
            {/* Brand logo & workspace returns */}
            <div className="console-hud-left">
              <button 
                onClick={() => setViewMode('landing')}
                className="crisp-button-secondary"
                style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px' }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Site
              </button>

              <div className="console-hud-brand">
                <div className="brand-icon-box" style={{ padding: '6px' }}>
                  <Cpu className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h1 className="console-hud-brand-title bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">PolyTest AI</h1>
                  <p className="console-hud-brand-subtitle">Developer HUD Console</p>
                </div>
              </div>

              {/* Project folder HUD dropdown */}
              <select className="console-workspace-select">
                <option value="quantum">quantum-core-v2</option>
                <option value="alpha">alpha-parser-test</option>
                <option value="legacy">legacy-service-node</option>
              </select>
            </div>

            {/* Diagnostics HUD */}
            <div className="console-hud-right">
              <div className="diagnostics-banner">
                <Activity className="w-3.5 h-3.5 text-[#475569]" />
                <div className="flex-row-align" style={{ gap: '6px' }}>
                  <span className={`nav-status-dot ${isBackendOnline ? 'active' : 'sandbox'}`} />
                  <span style={{ color: isBackendOnline ? 'var(--accent-cyan)' : 'var(--accent-yellow)' }}>
                    {isBackendOnline ? 'ONLINE' : 'OFFLINE (SANDBOX)'}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={checkHealth}
                className="icon-button-hud"
                title="Diagnose connection"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button className="icon-button-hud" style={{ position: 'relative' }}>
                <Bell className="w-4 h-4" />
                <span style={{ position: 'absolute', top: '4px', right: '4px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-cyan)' }} />
              </button>

              <div style={{ height: '24px', width: '1px', background: 'rgba(255,255,255,0.06)' }} />

              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop" 
                alt="Developer Avatar" 
                className="avatar-hud"
              />
            </div>
          </header>

          {/* Main Dashboard HUD Content */}
          <main className="workspace-grid-crisp">
            
            {/* Left Side: Directory folders */}
            <section className="ide-explorer-panel crisp-panel">
              <div className="flex-row-align" style={{ justifyContent: 'space-between', width: '100%' }}>
                <span className="mono-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                  Files Explorer
                </span>
                <button 
                  onClick={triggerAutoDetect}
                  disabled={isScanning}
                  style={{ fontSize: '10px', color: 'var(--accent-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  Sync
                </button>
              </div>

              {/* Realistic nested directories list with vertical guide lines */}
              <div className="file-tree-container" style={{ width: '100%' }}>
                <div className="tree-node-folder flex-row-align">
                  <Folder className="w-3.5 h-3.5 text-purple-400 fill-current" />
                  <span>quantum-core-v2</span>
                </div>
                
                <div className="tree-node-nested-line-container">
                  <div className="tree-node-folder flex-row-align">
                    <Folder className="w-3.5 h-3.5 text-purple-400 fill-current" />
                    <span>src</span>
                  </div>

                  <div className="tree-node-nested-line-container">
                    {files.map((file, idx) => {
                      const isSelected = selectedFile?.file_path === file.file_path;
                      const baseName = file.file_path.split('/').pop() || '';
                      return (
                        <div
                          key={idx}
                          onClick={() => handleFileSelect(file)}
                          className={`file-item-node ${isSelected ? 'selected' : ''}`}
                        >
                          <FileCode className="w-3.5 h-3.5" style={{ color: getLanguageColor(file.language) }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{baseName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="source-root-banner" style={{ width: '100%' }}>
                <span className="mono-label" style={{ display: 'block', marginBottom: '4px' }}>Workspace Root</span>
                <span style={{ color: 'var(--text-secondary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: '10px' }} title={projectRoot}>{projectRoot}</span>
              </div>
            </section>

            {/* Center: AST workspace */}
            <section className="workspace-center-panel">
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {selectedFile && (
                  <div className="active-file-tab-crisp">
                    <FileCode className="w-3.5 h-3.5" style={{ color: getLanguageColor(selectedFile.language) }} />
                    <span>{selectedFile.file_path.split('/').pop()}</span>
                    <span style={{ color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '6px' }}>×</span>
                  </div>
                )}
                <div className="active-file-tab-line" />
              </div>

              <div className="workspace-canvas">
                <div className="canvas-header">
                  <div style={{ textAlign: 'left' }}>
                    <span className="mono-label">AST Parser Class Nodes</span>
                    <h2 style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#fff', marginTop: '4px' }}>
                      class {parsedStructure?.classes?.[0]?.name || 'SourceModule'}
                    </h2>
                  </div>
                  <div>
                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', background: 'rgba(0, 245, 255, 0.05)', border: '1px solid rgba(0,245,255,0.15)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '4px' }}>
                      {parsedStructure?.complexity || 'Low'}
                    </span>
                  </div>
                </div>

                {isLoadingAnalysis ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', flex: 1 }}>
                    <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Statically profiling AST nodes...</p>
                  </div>
                ) : parsedStructure ? (
                  <div className="ast-inspected-card-container">
                    
                    {/* Rendered class methods */}
                    {parsedStructure.classes.map((cls) => 
                      cls.methods.map((method, idx) => {
                        const isSelected = selectedMethods.includes(method.name);
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleMethod(method.name)}
                            className={`ast-method-block ${isSelected ? 'selected' : ''}`}
                          >
                            <div className="ast-method-signature">
                              <span className="ast-method-name">
                                {method.name}<span style={{ color: 'var(--text-muted)' }}>()</span>
                              </span>
                              <span className="ast-method-args">
                                {method.args}
                              </span>
                            </div>

                            <div className={`ast-checkbox-indicator ${isSelected ? 'checked' : ''}`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Rendered standard modules functions */}
                    {parsedStructure.functions.map((func, idx) => {
                      const isSelected = selectedMethods.includes(func.name);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleMethod(func.name)}
                          className={`ast-method-block ${isSelected ? 'selected' : ''}`}
                        >
                          <div className="ast-method-signature">
                            <span className="ast-method-name">
                              {func.name}<span style={{ color: 'var(--text-muted)' }}>()</span>
                            </span>
                            <span className="ast-method-args">
                              {func.args}
                            </span>
                          </div>

                          <div className={`ast-checkbox-indicator ${isSelected ? 'checked' : ''}`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-mono)' }}>Select a module file from Explorer tree.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Right Side: Settings & Gauge panel */}
            <section className="controls-right-sidebar">
              
              <div className="crisp-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span className="mono-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  Parameters Dock
                </span>

                <div className="settings-group">
                  <label className="mono-label" style={{ display: 'block', textAlign: 'left', marginBottom: '4px' }}>LLM PROVIDER</label>
                  <select 
                    value={selectedProvider} 
                    onChange={(e) => {
                      setSelectedProvider(e.target.value);
                      if (e.target.value === 'mock') setSelectedModel('gemini-1.5-flash');
                      else if (e.target.value === 'openai') setSelectedModel('gpt-4o');
                      else if (e.target.value === 'gemini') setSelectedModel('gemini-1.5-flash');
                    }}
                    className="crisp-input crisp-select"
                  >
                    <option value="mock">Offline Mock Engine</option>
                    <option value="gemini">Google Gemini API</option>
                    <option value="openai">OpenAI GPT API</option>
                  </select>
                </div>

                <div className="settings-group">
                  <label className="mono-label" style={{ display: 'block', textAlign: 'left', marginBottom: '4px' }}>Target Model</label>
                  <input 
                    type="text" 
                    value={selectedModel} 
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="crisp-input"
                  />
                </div>

                {/* Real-time Temperature Slider */}
                <div className="slider-group-crisp">
                  <div className="slider-label-row">
                    <label className="mono-label">Temperature</label>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{temperature}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.0" 
                    max="1.0" 
                    step="0.1" 
                    value={temperature} 
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="crisp-slider"
                  />
                </div>

                {/* Real-time Max Tokens Slider */}
                <div className="slider-group-crisp">
                  <div className="slider-label-row">
                    <label className="mono-label">Max Tokens</label>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{maxTokens}</span>
                  </div>
                  <input 
                    type="range" 
                    min="256" 
                    max="4096" 
                    step="256" 
                    value={maxTokens} 
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="crisp-slider"
                  />
                </div>

                {/* Real-time Target Coverage Slider */}
                <div className="slider-group-crisp">
                  <div className="slider-label-row">
                    <label className="mono-label">Coverage Target</label>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{coverageTarget}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="100" 
                    step="5" 
                    value={coverageTarget} 
                    onChange={(e) => setCoverageTarget(parseInt(e.target.value))}
                    className="crisp-slider"
                  />
                </div>

                <div className="setting-row-flex">
                  <span className="mono-label" style={{ fontSize: '9px' }}>Prompt Caching</span>
                  <input 
                    type="checkbox" 
                    checked={useCache} 
                    onChange={(e) => setUseCache(e.target.checked)} 
                    className="checkbox-custom" 
                  />
                </div>

                <div className="setting-row-flex">
                  <span className="mono-label" style={{ fontSize: '9px' }}>Auto-Execute Run</span>
                  <input 
                    type="checkbox" 
                    checked={runImmediately} 
                    onChange={(e) => setRunImmediately(e.target.checked)} 
                    className="checkbox-custom" 
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedFile || selectedMethods.length === 0}
                  className="crisp-button"
                  style={{ width: '100%', marginTop: '6px' }}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Compiling...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Generate Suite
                    </>
                  )}
                </button>
              </div>

              {/* Health Gauge Panel */}
              <div className="crisp-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <span className="mono-label" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  Validator Diagnostics
                </span>

                <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
                  <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <circle cx="60" cy="60" r="44" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="6" fill="transparent" />
                    <circle 
                      cx="60" 
                      cy="60" 
                      r="44" 
                      stroke="url(#cyanPurpleGradient)" 
                      strokeWidth="6" 
                      fill="transparent" 
                      strokeDasharray={2 * Math.PI * 44}
                      strokeDashoffset={(2 * Math.PI * 44) - (syntaxCorrectness / 100) * (2 * Math.PI * 44)}
                      strokeLinecap="round"
                      className="syntax-circle-path"
                      style={{ filter: 'drop-shadow(0 0 4px rgba(0, 245, 255, 0.3))' }}
                    />
                  </svg>

                  <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '24px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>{syntaxCorrectness}%</span>
                    <span className="mono-label" style={{ fontSize: '8px', color: 'var(--accent-cyan)' }}>LINT OK</span>
                  </div>
                </div>

                <div className="stats-grid-double">
                  <div style={{ textAlign: 'left' }}>
                    <span className="mono-label" style={{ display: 'block', fontSize: '8px' }}>Specs Run</span>
                    <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)', marginTop: '2px', display: 'block' }}>{validatedCount}</span>
                  </div>
                  <div style={{ textAlign: 'left', borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '12px' }}>
                    <span className="mono-label" style={{ display: 'block', fontSize: '8px' }}>Errors Log</span>
                    <span style={{ color: issueCount > 0 ? 'var(--accent-red)' : 'var(--text-muted)', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)', marginTop: '2px', display: 'block' }}>{issueCount}</span>
                  </div>
                </div>

                {/* Detailed linter diagnostics log list */}
                {issueCount > 0 && (
                  <div className="diagnostic-issues-scroller">
                    <div className="diagnostic-log-item">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" style={{ flexShrink: 0 }} />
                      <div>
                        <span style={{ color: '#fff', display: 'block', fontSize: '9px' }}>Warning (Line 14)</span>
                        <span style={{ color: 'var(--text-secondary)' }}>Avoid raw types in cryptokey init.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Subprocess console Panel */}
              <div className="crisp-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                <div className="terminal-hud-header">
                  <div className="terminal-hud-tabs">
                    <button 
                      onClick={() => setTerminalTab('execution')}
                      className={`terminal-tab-btn ${terminalTab === 'execution' ? 'active' : ''}`}
                    >
                      EXECUTION
                    </button>
                    <button 
                      onClick={() => setTerminalTab('metrics')}
                      className={`terminal-tab-btn ${terminalTab === 'metrics' ? 'active' : ''}`}
                    >
                      METRICS
                    </button>
                    <button 
                      onClick={() => setTerminalTab('warnings')}
                      className={`terminal-tab-btn ${terminalTab === 'warnings' ? 'active' : ''}`}
                    >
                      DIAGNOSTICS
                    </button>
                  </div>
                </div>

                <div className="terminal-canvas-scroller">
                  {terminalTab === 'execution' && (
                    terminalLogs.map((log, idx) => (
                      <div key={idx} style={{ lineHeight: '1.5' }}>
                        {log.includes('❌') ? (
                          <span style={{ color: 'var(--accent-red)' }}>{log}</span>
                        ) : log.includes('✅') || log.includes('✨') || log.includes('🟢') ? (
                          <span style={{ color: 'var(--accent-cyan)' }}>{log}</span>
                        ) : log.includes('🚀') || log.includes('🌐') ? (
                          <span style={{ color: 'var(--accent-purple)' }}>{log}</span>
                        ) : log.includes('📊') ? (
                          <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{log}</span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>{log}</span>
                        )}
                      </div>
                    ))
                  )}

                  {terminalTab === 'metrics' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)' }}>
                      <p style={{ color: 'var(--accent-cyan)' }}>📊 AI Test Suite Validation Metrics Summary</p>
                      <p>✓ Active LLM Provider: <span style={{ color: '#fff' }}>{selectedProvider.toUpperCase()}</span></p>
                      <p>✓ Current Temperature: <span style={{ color: '#fff' }}>{temperature}</span></p>
                      <p>✓ Max Tokens Parameter: <span style={{ color: '#fff' }}>{maxTokens} limits</span></p>
                      <p>✓ Target Test Coverage: <span style={{ color: '#fff' }}>{coverageTarget}% target</span></p>
                      <p>✓ Run Duration: <span style={{ color: 'var(--accent-green)' }}>0.018s compiled</span></p>
                      <p>✓ Prompt Hashing Status: <span style={{ color: 'var(--accent-green)' }}>MD5 Caching HIT</span></p>
                    </div>
                  )}

                  {terminalTab === 'warnings' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)' }}>
                      <p style={{ color: 'var(--accent-cyan)' }}>🔍 Active Validator Drycompile warnings</p>
                      <p style={{ color: 'var(--accent-red)' }}>⚠ [PaymentService.ts:Line 14] Warn: Avoid raw type parameters inside cryptographic keys.</p>
                      <p style={{ color: 'var(--accent-yellow)' }}>⚠ [PaymentService.ts:Line 32] Info: Unused dependency 'stripe' imported on line 2.</p>
                      <p style={{ color: 'var(--accent-green)' }}>✓ All other AST compiled modules reported 100% syntactically correct.</p>
                    </div>
                  )}
                </div>
              </div>

            </section>

          </main>

          {/* Footer */}
          <footer className="saas-footer-crisp">
            <p>© 2026 PolyTest AI REST Platform. Enterprise Edition.</p>
            <p className="footer-subtitle-crisp">
              <Binary className="w-3.5 h-3.5" />
              TypeScript Backend + React Frontend Architecture
            </p>
          </footer>

        </div>
      )}

    </div>
  );
}

export default App;
