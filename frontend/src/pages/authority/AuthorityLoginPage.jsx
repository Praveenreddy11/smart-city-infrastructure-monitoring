import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Mail, AlertCircle } from 'lucide-react';

export const AuthorityLoginPage = () => {
  const [email, setEmail] = useState('admin@smartcity.gov');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState(null);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const res = await login(email, password);
    if (res.success) {
      if (res.role === 'AUTHORITY') {
        navigate('/authority/dashboard');
      } else {
        setError('Account is registered as Worker. Please use Worker Portal.');
      }
    } else {
      setError(res.message);
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '3rem auto' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: '56px', height: '56px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
            <Shield size={32} color="#1e3a8a" />
          </div>
          <h2 style={{ color: '#1e3a8a', fontSize: '1.5rem' }}>Authority Portal</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Municipal Infrastructure Control Dashboard</p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Mail size={14} /> Official Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Lock size={14} /> Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
            {loading ? 'Authenticating...' : 'Sign In as Authority'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
          <strong>Development Demo Account:</strong>
          <div>Email: <code>admin@smartcity.gov</code></div>
          <div>Password: <code>Admin@123</code></div>
        </div>
      </div>
    </div>
  );
};
