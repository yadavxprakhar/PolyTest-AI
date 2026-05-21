import React, { useState } from 'react';
import { ArrowLeft, Search, Monitor, Type, FileCode, AlignLeft, CheckSquare, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('Commonly Used');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { name: 'Commonly Used', icon: SettingsIcon },
    { name: 'Text Editor', icon: Type },
    { name: 'Formatting', icon: AlignLeft },
    { name: 'Workspace', icon: FileCode },
    { name: 'Window', icon: Monitor },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#090a0f',
      color: '#ffffff',
      fontFamily: 'var(--font-sans)',
      overflow: 'hidden'
    }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: '#0f111a'
      }}>
        <div 
          onClick={() => navigate('/console')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Console
        </div>
        
        <div style={{ margin: '0 auto', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '6px 16px', width: '400px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Search className="w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search settings..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              marginLeft: '8px',
              width: '100%',
              fontSize: '13px'
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{
          width: '240px',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          backgroundColor: '#0f111a',
          padding: '16px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {categories.map(cat => (
            <div 
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 24px',
                cursor: 'pointer',
                color: activeCategory === cat.name ? '#ffffff' : 'var(--text-secondary)',
                backgroundColor: activeCategory === cat.name ? 'rgba(55, 148, 255, 0.1)' : 'transparent',
                borderLeft: activeCategory === cat.name ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                fontSize: '13px',
                fontWeight: activeCategory === cat.name ? 500 : 400,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (activeCategory !== cat.name) {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeCategory !== cat.name) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <cat.icon className="w-4 h-4" />
              {cat.name}
            </div>
          ))}
        </div>

        {/* Settings Content */}
        <div style={{ flex: 1, padding: '32px 48px', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', color: '#ffffff' }}>
            {activeCategory}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '700px' }}>
            {/* Theme Setting */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff' }}>Color Theme</label>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Specifies the color theme used in the workbench.</span>
              <select style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                color: '#fff', 
                padding: '8px 12px', 
                borderRadius: '4px', 
                fontSize: '13px', 
                outline: 'none',
                width: '300px',
                cursor: 'pointer'
              }}>
                <option>Quantum Dark (Default)</option>
                <option>Abyss Dark</option>
                <option>High Contrast</option>
                <option>Light Theme</option>
              </select>
            </div>

            {/* Font Size Setting */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff' }}>Editor: Font Size</label>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Controls the font size in pixels.</span>
              <input 
                type="number" 
                defaultValue={14} 
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: '#fff', 
                  padding: '8px 12px', 
                  borderRadius: '4px', 
                  fontSize: '13px', 
                  outline: 'none',
                  width: '120px'
                }} 
              />
            </div>

            {/* Font Family Setting */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff' }}>Editor: Font Family</label>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Controls the font family.</span>
              <input 
                type="text" 
                defaultValue="'Fira Code', 'JetBrains Mono', Consolas, monospace" 
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: '#fff', 
                  padding: '8px 12px', 
                  borderRadius: '4px', 
                  fontSize: '13px', 
                  outline: 'none',
                  width: '100%',
                  fontFamily: 'var(--font-mono)'
                }} 
              />
            </div>

            {/* Tab Size Setting */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff' }}>Editor: Tab Size</label>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>The number of spaces a tab is equal to.</span>
              <input 
                type="number" 
                defaultValue={2} 
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: '#fff', 
                  padding: '8px 12px', 
                  borderRadius: '4px', 
                  fontSize: '13px', 
                  outline: 'none',
                  width: '120px'
                }} 
              />
            </div>

            {/* Word Wrap Setting */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff' }}>Editor: Word Wrap</label>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Controls how lines should wrap.</span>
              <select style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                color: '#fff', 
                padding: '8px 12px', 
                borderRadius: '4px', 
                fontSize: '13px', 
                outline: 'none',
                width: '300px',
                cursor: 'pointer'
              }}>
                <option>off</option>
                <option>on</option>
                <option>wordWrapColumn</option>
                <option>bounded</option>
              </select>
            </div>

            {/* Format on Save */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '8px' }}>
              <div style={{ paddingTop: '2px' }}>
                <CheckSquare className="w-4 h-4 text-cyan-400" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff', cursor: 'pointer' }}>Editor: Format On Save</label>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Format a file on save. A formatter must be available, the file must not be saved after delay, and the editor must not be shutting down.</span>
              </div>
            </div>

            {/* Auto Save */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff' }}>Files: Auto Save</label>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Controls auto save of dirty editors.</span>
              <select style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                color: '#fff', 
                padding: '8px 12px', 
                borderRadius: '4px', 
                fontSize: '13px', 
                outline: 'none',
                width: '300px',
                cursor: 'pointer'
              }}>
                <option>afterDelay</option>
                <option>onFocusChange</option>
                <option>onWindowChange</option>
                <option>off</option>
              </select>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
