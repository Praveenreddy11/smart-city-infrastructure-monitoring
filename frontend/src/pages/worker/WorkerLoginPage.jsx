import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Wrench, Lock, Mail, AlertCircle } from 'lucide-react';

export const WorkerLoginPage = () => {
  const [email, setEmail] = useState('worker1@smartcity.gov');
  const [password, setPassword] = useState('Worker@123');
  const [error, setError] = useState(null);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const res = await login(email, password);
    if (res.success) {
      if (res.role === 'WORKER') {
        navigate('/worker/dashboard');
      } else {
        setError('Account is registered as Authority. Please use Authority Portal.');
      }
    } else {
      setError(res.message);
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '3rem auto' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: '56px', height: '56px', background: '#ccfbf1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
            <Wrench size={32} color="#0f766e" />
          </div>
          <h2 style={{ color: '#0f766e', fontSize: '1.5rem' }}>Worker Portal</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Municipal Maintenance Staff Task Management</p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Mail size={14} /> Worker Email
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

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ background: '#0f766e', width: '100%', padding: '0.75rem' }}>
            {loading ? 'Authenticating...' : 'Sign In as Worker'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
          <strong>Development Demo Worker Account:</strong>
          <div>Email: <code>worker1@smartcity.gov</code></div>
          <div>Password: <code>Worker@123</code></div>
        </div>
      </div>
    </div>
  );
};
