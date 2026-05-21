
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a', color: 'white' }}>
      <h1>Welcome to PolyTest AI</h1>
      <p style={{ color: '#888888', marginBottom: '24px' }}>The next-generation testing workspace.</p>
      <div style={{ display: 'flex', gap: '16px' }}>
        <button 
          onClick={() => navigate('/login')}
          style={{ padding: '8px 16px', background: 'var(--accent-cyan)', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Login
        </button>
        <button 
          onClick={() => navigate('/console')}
          style={{ padding: '8px 16px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Go to Console
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
