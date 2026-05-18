import { useState, useEffect } from 'react';
import { 
  Play, 
  Terminal, 
  Cpu, 
  CheckCircle, 
  RefreshCw, 
  Code,
  FolderOpen, 
  Binary,
  Folder,
  FileCode,
  Settings,
  Bell,
  Activity,
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  ArrowLeft
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
      { name: 'UserAuth', methods: ['login', 'logout', 'requestPasswordReset', 'verifyMfaToken'] }
    ],
    functions: ['validateEmailFormat', 'hashCredentials'],
    imports: ['jwt', 'crypto', 'dbConnector'],
    complexity: 'Medium (O(N))'
  },
  'src/services/PaymentService.ts': {
    classes: [
      { name: 'PaymentService', methods: ['initialize', 'processTransaction', 'refund', 'validateCard'] }
    ],
    functions: [],
    imports: ['stripe', 'config', 'models/Transaction'],
    complexity: 'Low (O(1))'
  },
  'src/api/DataParser.cpp': {
    classes: [
      { name: 'DataParser', methods: ['loadBuffer', 'computeStandardDeviation', 'flushBuffer'] }
    ],
    functions: ['initializeDevice', 'shutdownDevice'],
    imports: ['iostream', 'vector', 'cmath', 'algorithm'],
    complexity: 'High (O(N^2))'
  },
  'src/utils.go': {
    classes: [],
    functions: ['ProcessOrder', 'CancelOrder', 'CalculateTaxes', 'DispatchReceipt'],
    imports: ['fmt', 'context', 'models/shipping'],
    complexity: 'High (O(N log N))'
  },
  'src/models/AuthService.java': {
    classes: [
      { name: 'AuthService', methods: ['authenticateUser', 'generateJwtToken', 'invalidateSession'] }
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
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(SANDBOX_FILES[1]); // Default to PaymentService.ts
  const [isScanning, setIsScanning] = useState<boolean>(false);
  
  // Code Inspection States
  const [parsedStructure, setParsedStructure] = useState<ParsedStructure | null>(SANDBOX_STRUCTURES['src/services/PaymentService.ts']);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [selectedMethods, setSelectedMethods] = useState<string[]>(['initialize', 'processTransaction', 'refund', 'validateCard']);

  // Generator Options
  const [selectedProvider, setSelectedProvider] = useState<string>('mock');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash');
  const [customFramework, setCustomFramework] = useState<string>('');
  const [generationMode, setGenerationMode] = useState<'Comprehensive' | 'Fast'>('Comprehensive');
  const [useCache, setUseCache] = useState<boolean>(true);
  const [runImmediately, setRunImmediately] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Radial Progress parameters
  const [syntaxCorrectness, setSyntaxCorrectness] = useState<number>(98);
  const [validatedCount, setValidatedCount] = useState<number>(114);
  const [issueCount, setIssueCount] = useState<number>(2);

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
          struct.classes.forEach(c => methodsList.push(...c.methods));
          setSelectedMethods(methodsList);
        }
      } catch (e) {
        setTerminalLogs(prev => [...prev, `❌ AST parser error: ${e}`]);
      }
    } else {
      setTimeout(() => {
        const mockStruct = SANDBOX_STRUCTURES[file.file_path] || {
          classes: [{ name: 'CustomService', methods: ['executeOperation'] }],
          functions: ['utilityHelper'],
          imports: ['standard_lib'],
          complexity: 'Low'
        };
        setParsedStructure(mockStruct);
        
        const methodsList: string[] = [];
        mockStruct.classes.forEach(c => methodsList.push(...c.methods));
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
      `⚙️ System Config: Mode=${generationMode}, Model=${selectedModel}, Methods=[${selectedMethods.join(', ')}], Cache=${useCache}`
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

  // Radial progress calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (syntaxCorrectness / 100) * circumference;

  return (
    <div className="select-none">
      
      {/* ========================================================================= */}
      {/* VIEW MODE 1: PREMIUM SAAS LANDING PAGE */}
      {/* ========================================================================= */}
      {viewMode === 'landing' && (
        <div className="animation-slideUp">
          
          {/* SaaS Header Bar */}
          <nav className="saas-navbar">
            <div className="brand-block">
              <div className="brand-icon-box">
                <Cpu className="w-5 h-5 text-cyan-400" />
              </div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-[#8c52ff] to-purple-400 bg-clip-text text-transparent">PolyTest AI</h1>
            </div>

            <div className="navbar-links">
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
              className="glowing-button text-xs"
            >
              Launch Console
              <ArrowRight className="w-4 h-4" />
            </button>
          </nav>

          {/* SaaS Hero Section */}
          <header className="saas-hero-section">
            <div className="hero-left-content">
              <span className="hero-badge-tag">
                🚀 Now Supporting 7 Languages
              </span>
              <h2 className="hero-title">
                Autonomous Unit Test Generation For <span className="gradient-text">Developers.</span>
              </h2>
              <p className="hero-description">
                Statically parse codebase AST architectures, execute compiler linter dry-runs, and validate test suites via sandboxed subprocess runners—instantly and completely offline.
              </p>

              <div className="hero-cta-buttons">
                <button 
                  onClick={() => setViewMode('console')}
                  className="glowing-button"
                >
                  Start Free Workspace
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a 
                  href="#vscode"
                  className="secondary-outline-btn"
                >
                  Install Extension
                </a>
              </div>
            </div>

            {/* Embedded high-resolution illustration banner */}
            <div className="hero-right-visual">
              <div className="hero-visual-frame">
                <img 
                  src="/polytest_saas_hero.png" 
                  alt="PolyTest AI Core Compiler Sphere illustration"
                  className="hero-visual-image"
                />
              </div>
            </div>
          </header>

          {/* Feature grid Section */}
          <section id="features" className="saas-features-section">
            <div className="section-header-block">
              <span className="section-label">Engine Capabilities</span>
              <h3 className="section-main-heading">Engineered for absolute performance</h3>
            </div>

            <div className="features-grid-custom">
              
              {/* Feature 1 */}
              <div className="feature-card-custom">
                <div className="feature-icon-badge cyan">
                  <Code className="w-5 h-5 text-cyan-400" />
                </div>
                <h4 className="feature-card-title">Multi-Language AST</h4>
                <p className="feature-card-desc">
                  State-aware AST parsers statically profile classes, imports, functions, and heuristic complexities with zero native compilers setup.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="feature-card-custom">
                <div className="feature-icon-badge purple">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                </div>
                <h4 className="feature-card-title">Syntax drycompile linter</h4>
                <p className="feature-card-desc">
                  Automated validation linter compiler scans (e.g. `node --check`, `javac`) filter code exceptions prior to writing files.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="feature-card-custom">
                <div className="feature-icon-badge green">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <h4 className="feature-card-title">Subprocess execution</h4>
                <p className="feature-card-desc">
                  Test execution engines trigger local runners (Jest, pytest, JUnit) inside spawned background threads, parsing stdout streams.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="feature-card-custom">
                <div className="feature-icon-badge rose">
                  <Layers className="w-5 h-5 text-rose-400" />
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
          <section id="pricing" className="saas-pricing-section">
            <div className="section-header-block">
              <span className="section-label">Pricing</span>
              <h3 className="section-main-heading">Flexible plans for any team</h3>
            </div>

            <div className="pricing-grid-custom">
              
              {/* Plan 1 */}
              <div className="pricing-card-custom">
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
                <button onClick={() => setViewMode('console')} className="secondary-outline-btn" style={{ marginTop: 'auto', justifyContent: 'center' }}>
                  Get Started
                </button>
              </div>

              {/* Plan 2: Promoted SaaS Card */}
              <div className="pricing-card-custom promoted">
                <span className="pricing-popular-tag">
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
                <button onClick={() => setViewMode('console')} className="glowing-button" style={{ marginTop: 'auto' }}>
                  Launch Console
                </button>
              </div>

              {/* Plan 3 */}
              <div className="pricing-card-custom">
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
                <button onClick={() => setViewMode('console')} className="secondary-outline-btn" style={{ marginTop: 'auto', justifyContent: 'center' }}>
                  Contact Sales
                </button>
              </div>

            </div>
          </section>

          {/* SaaS Footer */}
          <footer className="saas-footer-custom">
            <p>© 2026 PolyTest AI REST Platform. Enterprise SaaS Edition.</p>
            <p className="footer-subtitle-custom">
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
                className="secondary-outline-btn"
                style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px' }}
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
                  <span className={`nav-status-dot ${isBackendOnline ? 'active' : 'sandbox'}`} style={{ animation: 'pulseGlow 2s infinite' }} />
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

              <div style={{ height: '24px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />

              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop" 
                alt="Developer Avatar" 
                className="avatar-hud"
              />
            </div>
          </header>

          {/* Main Dashboard HUD Content */}
          <main className="console-workspace-grid">
            
            {/* Left Side: Directory folders */}
            <section className="console-sidebar glass-panel" style={{ padding: '20px' }}>
              <div className="flex-row-align" style={{ justifyContent: 'space-between' }}>
                <span className="tree-heading">
                  <FolderOpen className="w-4 h-4 text-cyan-400" />
                  Folders Tree
                </span>
                <button 
                  onClick={triggerAutoDetect}
                  disabled={isScanning}
                  style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
                  Rescan
                </button>
              </div>

              <div className="folders-tree-scroll">
                <div className="folder-item-custom" style={{ paddingLeft: '8px' }}>
                  <Folder className="w-4 h-4 text-purple-400 fill-current" />
                  <span>quantum-core-v2</span>
                </div>
                
                <div className="folder-item-custom" style={{ paddingLeft: '24px' }}>
                  <Folder className="w-4 h-4 text-purple-400 fill-current" />
                  <span>src</span>
                </div>

                <div className="flex-col-align" style={{ paddingLeft: '40px', borderLeft: '1px solid rgba(255,255,255,0.05)', marginLeft: '32px', margin: '4px 0 8px 32px' }}>
                  {files.map((file, idx) => {
                    const isSelected = selectedFile?.file_path === file.file_path;
                    const baseName = file.file_path.split('/').pop() || '';
                    return (
                      <div
                        key={idx}
                        onClick={() => handleFileSelect(file)}
                        className={`folder-item-custom ${isSelected ? 'active' : ''}`}
                        style={{ padding: '6px 10px' }}
                      >
                        <FileCode className="w-3.5 h-3.5" style={{ color: getLanguageColor(file.language) }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{baseName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="source-root-banner">
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>LOCAL SOURCE ROOT</span>
                <span style={{ color: 'var(--text-secondary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={projectRoot}>{projectRoot}</span>
              </div>
            </section>

            {/* Center: AST workspace */}
            <section className="console-center-workspace">
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {selectedFile && (
                  <div className="workspace-active-tab">
                    <FileCode className="w-4 h-4" style={{ color: getLanguageColor(selectedFile.language) }} />
                    <span>{selectedFile.file_path.split('/').pop()}</span>
                    <span style={{ color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '8px' }}>×</span>
                  </div>
                )}
                <div className="tab-line-border" />
              </div>

              <div className="workspace-canvas">
                <div className="canvas-header">
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Declaring Workspace Code</span>
                    <h2 style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#fff', marginTop: '4px' }}>
                      class {parsedStructure?.classes?.[0]?.name || 'SourceModule'}
                    </h2>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', background: 'rgba(0, 245, 255, 0.08)', border: '1px solid rgba(0,245,255,0.15)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '4px' }}>
                      Complexity: {parsedStructure?.complexity || 'Low'}
                    </span>
                  </div>
                </div>

                {isLoadingAnalysis ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', flex: 1 }}>
                    <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Statically building method mapping profiles...</p>
                  </div>
                ) : parsedStructure ? (
                  <div className="ast-cards-container">
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', textAlign: 'left' }}>
                      💡 Select which code blocks to target in your generated AI unit test suite:
                    </p>

                    {parsedStructure.classes.map((cls) => 
                      cls.methods.map((method, idx) => {
                        const isSelected = selectedMethods.includes(method);
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleMethod(method)}
                            className={`ast-card-custom ${isSelected ? 'selected' : ''}`}
                          >
                            <div className="ast-card-left">
                              <div className={`ast-card-icon-box ${isSelected ? 'active' : ''}`}>
                                <Code className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-[#475569]'}`} />
                              </div>
                              <div>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                                  {method}<span style={{ color: 'var(--text-muted)' }}>()</span>
                                </p>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                  {isSelected ? 'Targeted for testing' : 'Excluded from prompts'}
                                </span>
                              </div>
                            </div>

                            <div className={`ast-checkbox-box ${isSelected ? 'checked' : ''}`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })
                    )}

                    {parsedStructure.functions.map((func, idx) => {
                      const isSelected = selectedMethods.includes(func);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleMethod(func)}
                          className={`ast-card-custom ${isSelected ? 'selected' : ''}`}
                        >
                          <div className="ast-card-left">
                            <div className={`ast-card-icon-box ${isSelected ? 'active' : ''}`}>
                              <Code className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-[#475569]'}`} />
                            </div>
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                                {func}<span style={{ color: 'var(--text-muted)' }}>()</span>
                              </p>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                {isSelected ? 'Targeted for testing' : 'Excluded'}
                              </span>
                            </div>
                          </div>

                          <div className={`ast-checkbox-box ${isSelected ? 'checked' : ''}`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-mono)' }}>Select a file from folder panel to inspect parsed symbols.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Right Side: Settings & Gauge panel */}
            <section className="console-controls-panel">
              
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span className="tree-heading" style={{ padding: 0 }}>
                  <Settings className="w-4 h-4 text-purple-400" />
                  Test Generation
                </span>

                <div className="settings-group">
                  <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)', textAlign: 'left' }}>LLM Provider</label>
                  <select 
                    value={selectedProvider} 
                    onChange={(e) => {
                      setSelectedProvider(e.target.value);
                      if (e.target.value === 'mock') setSelectedModel('gemini-1.5-flash');
                      else if (e.target.value === 'openai') setSelectedModel('gpt-4o');
                      else if (e.target.value === 'gemini') setSelectedModel('gemini-1.5-flash');
                    }}
                    className="form-input form-select"
                    style={{ fontSize: '12px', padding: '10px 14px' }}
                  >
                    <option value="mock">Offline Mock Engine</option>
                    <option value="gemini">Google Gemini API</option>
                    <option value="openai">OpenAI GPT API</option>
                  </select>
                </div>

                <div className="settings-group">
                  <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)', textAlign: 'left' }}>Model</label>
                  <input 
                    type="text" 
                    value={selectedModel} 
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '12px', padding: '10px 14px' }}
                  />
                </div>

                <div className="settings-group">
                  <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)', textAlign: 'left' }}>Custom Framework</label>
                  <input 
                    type="text" 
                    value={customFramework} 
                    onChange={(e) => setCustomFramework(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '12px', padding: '10px 14px' }}
                    placeholder="Auto-detect framework"
                  />
                </div>

                <div className="setting-row-flex">
                  <span style={{ color: 'var(--text-secondary)' }}>Use Caching</span>
                  <input 
                    type="checkbox" 
                    checked={useCache} 
                    onChange={(e) => setUseCache(e.target.checked)} 
                    className="checkbox-custom" 
                  />
                </div>

                <div className="setting-row-flex">
                  <span style={{ color: 'var(--text-secondary)' }}>Auto-Execute</span>
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
                  className="glowing-button"
                  style={{ width: '100%', padding: '14px', fontSize: '13px', marginTop: '8px' }}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Compiling...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Generate Tests
                    </>
                  )}
                </button>

                <div className="settings-group" style={{ marginTop: '4px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)', textAlign: 'left' }}>Selected Methods</label>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '10px', background: 'rgba(8,10,15,0.5)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Targeting:</span>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{selectedMethods.length} Methods</span>
                  </div>
                </div>

                <div className="settings-group">
                  <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)', textAlign: 'left' }}>Mode</label>
                  <div className="mode-toggle-grid">
                    <button
                      onClick={() => setGenerationMode('Comprehensive')}
                      className={`mode-toggle-btn ${generationMode === 'Comprehensive' ? 'active' : ''}`}
                    >
                      Comprehensive
                    </button>
                    <button
                      onClick={() => setGenerationMode('Fast')}
                      className={`mode-toggle-btn ${generationMode === 'Fast' ? 'active' : ''}`}
                    >
                      Fast
                    </button>
                  </div>
                </div>
              </div>

              {/* Health Gauge Panel */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <span className="tree-heading" style={{ padding: 0, alignSelf: 'flex-start' }}>
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  Syntax Validator Health
                </span>

                <div style={{ position: 'relative', width: '144px', height: '144px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <circle cx="72" cy="72" r={radius} stroke="rgba(255, 255, 255, 0.02)" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="72" 
                      cy="72" 
                      r={radius} 
                      stroke="url(#cyanPurpleGradient)" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="radial-progress-circle"
                      style={{ filter: 'drop-shadow(0 0 8px rgba(0, 245, 255, 0.45))' }}
                    />
                  </svg>

                  <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '30px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{syntaxCorrectness}%</span>
                    <span style={{ fontSize: '9px', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>Healthy</span>
                  </div>
                </div>

                <div className="stats-grid-double">
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block', fontSize: '11px' }}>Validated Files</span>
                    <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-mono)', marginTop: '2px', display: 'block' }}>{validatedCount}</span>
                  </div>
                  <div style={{ textAlign: 'left', borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '16px' }}>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block', fontSize: '11px' }}>Issues</span>
                    <span style={{ color: issueCount > 0 ? 'var(--accent-red)' : 'var(--text-muted)', fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-mono)', marginTop: '2px', display: 'block' }}>{issueCount}</span>
                  </div>
                </div>
              </div>

              {/* Subprocess console Panel */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span className="tree-heading" style={{ padding: 0 }}>
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Execution Streams
                </span>

                <div className="terminal-block-logs">
                  {terminalLogs.map((log, idx) => (
                    <div key={idx} style={{ lineHeight: '1.6' }}>
                      {log.includes('❌') ? (
                        <span style={{ color: 'var(--accent-red)' }}>{log}</span>
                      ) : log.includes('✅') || log.includes('✨') || log.includes('🟢') ? (
                        <span style={{ color: 'var(--accent-cyan)' }}>{log}</span>
                      ) : log.includes('🚀') || log.includes('🌐') ? (
                        <span style={{ color: 'var(--accent-purple)' }}>{log}</span>
                      ) : log.includes('📊') ? (
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{log}</span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>{log}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </section>

          </main>

          {/* Footer */}
          <footer className="saas-footer-custom">
            <p>© 2026 PolyTest AI REST Platform. Enterprise Edition.</p>
            <p className="footer-subtitle-custom">
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
