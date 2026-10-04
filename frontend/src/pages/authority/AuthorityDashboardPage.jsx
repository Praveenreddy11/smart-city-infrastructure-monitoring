import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Activity, AlertTriangle, CheckCircle, Clock, Wrench, Shield, FileCheck } from 'lucide-react';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

export const AuthorityDashboardPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/authority/analytics');
      setAnalytics(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard analytics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Authority Analytics...</div>;
  if (error) return <div style={{ padding: '2rem', color: '#ef4444' }}>{error}</div>;

  const health = analytics?.health_info || {};

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', color: '#1e3a8a', marginBottom: '0.25rem' }}>Government Authority Monitoring Dashboard</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Real-time road infrastructure health analytics & municipal task tracking</p>
      </div>

      {/* Infrastructure Health Score Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Infrastructure Health Score</span>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, margin: '0.25rem 0' }}>
            {health.health_score} <span style={{ fontSize: '1.25rem', fontWeight: 400, opacity: 0.9 }}>/ 100</span>
          </h2>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600 }}>
            Condition Status: {health.status_label}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{health.total_issues}</span>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Total Reports</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fca5a5' }}>{health.high_critical_count}</span>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>High/Critical</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fde047' }}>{health.pending_issues}</span>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Pending Repair</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#86efac' }}>{health.verified_issues}</span>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Verified Resolved</div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total Potholes</span>
            <AlertTriangle size={20} />
          </div>
          <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0f172a' }}>{health.pothole_count}</span>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f766e', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Road Cracks</span>
            <Activity size={20} />
          </div>
          <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0f172a' }}>{health.crack_count}</span>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Completed Work</span>
            <Wrench size={20} />
          </div>
          <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0f172a' }}>{health.completed_issues}</span>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Verified Repaired</span>
            <FileCheck size={20} />
          </div>
          <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0f172a' }}>{health.verified_issues}</span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid-2">
        {/* Issues by Severity Chart */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', color: '#1e3a8a', marginBottom: '1rem' }}>Issues Breakdown by Severity</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.by_severity || []}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issues by Status Chart */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', color: '#1e3a8a', marginBottom: '1rem' }}>Workflow Status Pipeline</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.by_status || []}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
