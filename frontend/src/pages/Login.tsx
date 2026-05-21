
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a', color: 'white' }}>
      <h2>Login to PolyTest AI</h2>
      <div style={{ marginTop: '20px', padding: '24px', background: '#111', borderRadius: '8px', border: '1px solid #222', minWidth: '300px' }}>
        <input type="email" placeholder="Email" style={{ width: '100%', padding: '8px', marginBottom: '12px', background: '#000', color: 'white', border: '1px solid #333', borderRadius: '4px' }} />
        <input type="password" placeholder="Password" style={{ width: '100%', padding: '8px', marginBottom: '20px', background: '#000', color: 'white', border: '1px solid #333', borderRadius: '4px' }} />
        <button 
          onClick={() => navigate('/console')}
          style={{ width: '100%', padding: '10px', background: 'var(--accent-cyan)', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Login
        </button>
      </div>
      <p style={{ marginTop: '16px', color: '#888' }}>
        Don't have an account? <span onClick={() => navigate('/signup')} style={{ color: 'var(--accent-cyan)', cursor: 'pointer' }}>Sign up</span>
      </p>
    </div>
  );
};

export default Login;
