import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Cpu, TerminalSquare, ShieldCheck, Box, Layers, Code2, Zap, Globe } from 'lucide-react';

const Documentation: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const sections = [
    { id: 'overview', title: 'Platform Overview', icon: <Globe className="w-4 h-4" /> },
    { id: 'ast-parser', title: 'AST Class Parser', icon: <Layers className="w-4 h-4" /> },
    { id: 'drycompile-linter', title: 'Drycompile Linter', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'subprocess-subrunner', title: 'Subprocess Subrunner', icon: <Box className="w-4 h-4" /> },
    { id: 'md5-cache', title: 'MD5 Prompt Cache', icon: <Zap className="w-4 h-4" /> },
    { id: 'vscode-extension', title: 'VS Code Extension', icon: <Code2 className="w-4 h-4" /> },
    { id: 'api-sdks', title: 'APIs & SDKs', icon: <TerminalSquare className="w-4 h-4" /> }
  ];

  const content: Record<string, React.ReactNode> = {
    'overview': (
      <div className="doc-content">
        <h1>Platform Overview</h1>
        <p className="lead-text">Welcome to the PolyTest AI documentation. Understand how our intelligent workspace is built from the ground up.</p>
        
        <div className="feature-card">
          <h3>Fully Offline Sandbox</h3>
          <p>PolyTest AI runs entirely on your local machine. We do not send your proprietary codebase to external servers unless you explicitly opt-in to advanced cloud AI reasoning. The sandbox provides a secure, isolated environment where your tests can execute rapidly without external network latency.</p>
        </div>

        <div className="feature-card">
          <h3>Polyglot Architecture</h3>
          <p>Modern engineering rarely uses just one language. Our engine natively understands TypeScript, JavaScript, Python, Go, and Rust. It intelligently switches context depending on the file you are viewing, providing language-specific AST parsing and linting.</p>
        </div>
      </div>
    ),
    'ast-parser': (
      <div className="doc-content">
        <h1>AST Class Parser</h1>
        <p className="lead-text">How we read your code like a machine, not just like a book.</p>
        
        <h3>What is an AST?</h3>
        <p>AST stands for <strong>Abstract Syntax Tree</strong>. When you write code, it looks like a long string of text. But computers don't read text—they read structures. An AST transforms your code text into a tree-like data structure where every branch is a function, variable, or loop.</p>
        
        <h3>How PolyTest uses it</h3>
        <p>Instead of just using basic regex to find bugs, our <strong>AST Class Parser</strong> builds a full structural tree of your file. This allows our AI to understand the exact scope of a variable, the parent class of a method, and the specific syntax rules of the language you are using. This leads to hyper-accurate testing and refactoring suggestions.</p>
      </div>
    ),
    'drycompile-linter': (
      <div className="doc-content">
        <h1>Drycompile Linter</h1>
        <p className="lead-text">Catching errors before the code even runs.</p>
        
        <h3>The Concept of "Dry" Running</h3>
        <p>A "dry run" means going through the motions without actually executing the final action. Our <strong>Drycompile Linter</strong> simulates the compilation and execution phase of your code.</p>

        <h3>Why it matters</h3>
        <p>Before PolyTest AI spends time running heavy tests, the Drycompile Linter sweeps through your AST to check for syntax errors, missing imports, or type mismatches. If it finds an error, it instantly flags it, saving you minutes of waiting for a failed build. It's like a spell-checker, but for programming logic.</p>
      </div>
    ),
    'subprocess-subrunner': (
      <div className="doc-content">
        <h1>Subprocess Subrunner</h1>
        <p className="lead-text">Safe, isolated execution environments.</p>

        <h3>The Problem</h3>
        <p>Running untested or generated code directly in your main application memory is extremely dangerous. It could cause infinite loops, memory leaks, or crash your entire IDE.</p>

        <h3>Our Solution</h3>
        <p>The <strong>Subprocess Subrunner</strong> takes your code and spawns a completely separate, isolated "child" process (a sub-process) in the background. It runs the code inside this safe bubble. If the code crashes or hangs, the Subrunner simply kills the bubble. Your main PolyTest IDE remains fast, stable, and completely unaffected.</p>
      </div>
    ),
    'md5-cache': (
      <div className="doc-content">
        <h1>MD5 Prompt Cache</h1>
        <p className="lead-text">Lightning-fast AI responses through memory.</p>

        <h3>How caching works</h3>
        <p>Asking an AI to analyze code takes time and computational power. If you ask the AI to check the same unmodified function twice, it shouldn't have to rethink the whole answer.</p>

        <h3>The MD5 Approach</h3>
        <p>When you send a request, we create an <strong>MD5 Hash</strong>—a unique digital fingerprint of your prompt and your code. We save the AI's response in our local database tagged with this fingerprint. If you (or the automated system) ask the exact same question again, we instantly load the answer from the cache. This reduces response times from seconds down to milliseconds.</p>
      </div>
    ),
    'vscode-extension': (
      <div className="doc-content">
        <h1>VS Code Extension</h1>
        <p className="lead-text">Bring the power of PolyTest AI directly into your favorite editor.</p>

        <h3>Installation</h3>
        <p>1. Open Visual Studio Code.<br/>2. Navigate to the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`).<br/>3. Search for <strong>PolyTest AI</strong>.<br/>4. Click Install.</p>

        <h3>Features</h3>
        <ul style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>
          <li><strong>Inline Code Actions:</strong> Highlight any code block, right click, and select "Generate Tests with PolyTest".</li>
          <li><strong>Real-time Diagnostics:</strong> The Drycompile Linter will highlight issues directly in your editor via squiggly lines.</li>
          <li><strong>Command Palette Integration:</strong> Press `Cmd+Shift+P` and type `PolyTest` to access all tools, including the AST visualizer and cache manager.</li>
        </ul>

        <h3>Authentication</h3>
        <p>After installation, click the PolyTest icon in the activity bar to log in to your account. The extension will automatically sync with your local PolyTest Engine.</p>
      </div>
    ),
    'api-sdks': (
      <div className="doc-content">
        <h1>APIs & SDKs</h1>
        <p className="lead-text">Automate your testing pipelines programmatically.</p>

        <h3>Local REST API</h3>
        <p>When the PolyTest Console is running, it exposes a local REST API at <code>http://127.0.0.1:8000/api/v1</code>. You can send POST requests with your code payload to trigger the Subrunner or Linter externally.</p>

        <h3>Node.js SDK</h3>
        <pre style={{ background: '#0a0a0a', padding: '16px', borderRadius: '8px', color: '#00f5ff', border: '1px solid #222' }}>
          <code>npm install @polytest/sdk</code>
        </pre>
        <p>Our Node SDK allows you to easily integrate PolyTest into your CI/CD pipelines (like GitHub Actions or Jenkins) to ensure all code is AST-verified before merging.</p>
      </div>
    )
  };



  return (
    <div style={{ minHeight: '100vh', background: '#03050a', color: '#fff', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navbar with Search */}
      <nav style={{
        position: 'sticky',
        top: 0,
        width: '100%',
        height: '70px',
        padding: '0 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(3, 5, 10, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div 
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, fontSize: '20px', letterSpacing: '-0.5px', cursor: 'pointer' }}
          >
            <Cpu className="w-6 h-6 text-cyan-400" />
            <span>PolyTest<span style={{ color: 'var(--accent-cyan)' }}>AI</span> <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 400, marginLeft: '8px' }}>Docs</span></span>
          </div>

          <div style={{ position: 'relative', width: '300px' }}>
            <Search className="w-4 h-4 text-gray-500" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search documentation..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '8px 12px 8px 36px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => navigate('/console')}
            style={{ padding: '8px 20px', background: 'var(--accent-cyan)', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
          >
            Open Console
          </button>
        </div>
      </nav>

      {/* Main Layout */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        
        {/* Sidebar */}
        <aside style={{
          width: '280px',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(255,255,255,0.01)',
          padding: '32px 0',
          position: 'sticky',
          top: '70px',
          height: 'calc(100vh - 70px)',
          overflowY: 'auto'
        }}>
          <div style={{ padding: '0 24px', marginBottom: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Documentation
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px' }}>
            {sections.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())).map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  background: activeSection === section.id ? 'rgba(0, 245, 255, 0.1)' : 'transparent',
                  color: activeSection === section.id ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  if (activeSection !== section.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={e => {
                  if (activeSection !== section.id) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <div style={{ color: activeSection === section.id ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                  {section.icon}
                </div>
                {section.title}
              </button>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <main style={{ flex: 1, padding: '48px 64px', maxWidth: '900px' }}>
          <style dangerouslySetInnerHTML={{__html: `
            .doc-content h1 { font-size: 40px; font-weight: 800; margin-bottom: 16px; letter-spacing: -1px; }
            .doc-content .lead-text { font-size: 20px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 48px; }
            .doc-content h3 { font-size: 24px; font-weight: 600; margin: 40px 0 16px 0; color: #fff; }
            .doc-content p { font-size: 16px; color: var(--text-secondary); line-height: 1.7; margin-bottom: 24px; }
            .doc-content strong { color: #fff; }
            .feature-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 32px; border-radius: 12px; margin-bottom: 24px; }
            .feature-card h3 { margin-top: 0; }
            .feature-card p:last-child { margin-bottom: 0; }
          `}} />
          
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {content[activeSection]}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Documentation;
