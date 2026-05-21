import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Shield, Cpu, Code2, ChevronRight, Terminal, Star } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  const features = [
    {
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      title: "Lightning Fast Execution",
      description: "Compile and execute code instantly with our ultra-optimized backend infrastructure."
    },
    {
      icon: <Cpu className="w-6 h-6 text-cyan-400" />,
      title: "AI-Powered Analysis",
      description: "Deep, automated insights into your code logic, performance, and security flaws."
    },
    {
      icon: <Shield className="w-6 h-6 text-green-400" />,
      title: "Fully Offline Sandbox",
      description: "Run safely in an isolated, secure environment without requiring a live internet connection."
    },
    {
      icon: <Code2 className="w-6 h-6 text-purple-400" />,
      title: "Polyglot Architecture",
      description: "Seamlessly test and integrate across multiple languages in a single, unified workspace."
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#03050a', 
      color: '#ffffff',
      fontFamily: 'var(--font-sans)',
      overflowX: 'hidden'
    }}>
      {/* Dynamic Background Gradients */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(0, 245, 255, 0.15) 0%, rgba(3, 5, 10, 0) 70%)',
        filter: 'blur(60px)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '-10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, rgba(3, 5, 10, 0) 70%)',
        filter: 'blur(80px)',
        zIndex: 0
      }} />

      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        padding: '16px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(3, 5, 10, 0.6)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, fontSize: '20px', letterSpacing: '-0.5px' }}>
          <Cpu className="w-6 h-6 text-cyan-400" />
          <span>PolyTest<span style={{ color: 'var(--accent-cyan)' }}>AI</span></span>
        </div>
        <div style={{ display: 'flex', gap: '32px', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>Features</span>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>Documentation</span>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>Pricing</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => navigate('/login')}
            style={{ padding: '8px 20px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/console')}
            style={{ padding: '8px 20px', background: 'var(--accent-cyan)', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 0 20px rgba(0, 245, 255, 0.3)', transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Console
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ position: 'relative', zIndex: 10, paddingTop: '160px', paddingBottom: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible"
          style={{ maxWidth: '800px', padding: '0 24px' }}
        >
          <motion.div variants={itemVariants} style={{ marginBottom: '24px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(0, 245, 255, 0.1)', border: '1px solid rgba(0, 245, 255, 0.2)', borderRadius: '100px', color: 'var(--accent-cyan)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.5px' }}>
              <Star className="w-3.5 h-3.5" /> PolyTest Engine v2.0 Live
            </span>
          </motion.div>

          <motion.h1 variants={itemVariants} style={{ fontSize: '64px', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-2px', marginBottom: '24px' }}>
            The Intelligent Workspace for <br/>
            <span style={{ background: 'linear-gradient(135deg, #00f5ff 0%, #9333ea 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Modern Engineering.</span>
          </motion.h1>

          <motion.p variants={itemVariants} style={{ fontSize: '20px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px' }}>
            Build, test, and analyze code across multiple languages with deeply integrated AI and an instantaneous offline sandbox.
          </motion.p>

          <motion.div variants={itemVariants} style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button 
              onClick={() => navigate('/console')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 32px', background: '#fff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(255,255,255,0.2)' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Start Building Free <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 32px', background: 'rgba(255,255,255,0.03)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 600, transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            >
              <Terminal className="w-4 h-4" /> Read the Docs
            </button>
          </motion.div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', maxWidth: '1100px', width: '100%', padding: '0 48px', marginTop: '120px' }}
        >
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -8, scale: 1.02 }}
              style={{ 
                background: 'rgba(255, 255, 255, 0.02)', 
                border: '1px solid rgba(255, 255, 255, 0.05)', 
                padding: '32px', 
                borderRadius: '16px', 
                textAlign: 'left',
                backdropFilter: 'blur(10px)',
                cursor: 'default'
              }}
            >
              <div style={{ width: '48px', height: '48px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', color: '#fff' }}>{feature.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10, background: '#020308' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          <Cpu className="w-5 h-5 text-gray-500" />
          <span>© 2026 PolyTest AI Inc. All rights reserved.</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          <span style={{ cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>Twitter</span>
          <span style={{ cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>GitHub</span>
          <span style={{ cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>Discord</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
