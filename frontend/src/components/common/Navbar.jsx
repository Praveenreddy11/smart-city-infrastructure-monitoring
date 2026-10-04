import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Camera, Search, User, LogOut, LayoutDashboard } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{ background: '#1e3a8a', color: '#ffffff', padding: '0.875rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <Link to="/" style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
        <Shield size={24} color="#60a5fa" />
        SmartCity Monitor AI
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <Link to="/report" style={{ color: '#e0f2fe', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 500 }}>
          <Camera size={18} /> Report Issue
        </Link>
        <Link to="/track" style={{ color: '#e0f2fe', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 500 }}>
          <Search size={18} /> Track Status
        </Link>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link 
              to={user.role === 'AUTHORITY' ? '/authority/dashboard' : '/worker/dashboard'} 
              style={{ background: '#2563eb', color: '#ffffff', padding: '0.4rem 0.8rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}
            >
              <LayoutDashboard size={16} /> Dashboard ({user.role})
            </Link>
            <button 
              onClick={handleLogout} 
              style={{ background: 'transparent', border: '1px solid #93c5fd', color: '#ffffff', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/authority/login" className="btn btn-sm btn-secondary" style={{ background: '#3b82f6', color: 'white', border: 'none' }}>
              Authority Portal
            </Link>
            <Link to="/worker/login" className="btn btn-sm btn-secondary" style={{ background: '#0f766e', color: 'white', border: 'none' }}>
              Worker Portal
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
