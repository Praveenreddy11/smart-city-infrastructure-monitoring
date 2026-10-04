import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge, SeverityBadge } from '../../components/common/Badges';
import { Wrench, MapPin, CheckCircle, Clock, Upload, ArrowRight } from 'lucide-react';

export const WorkerDashboardPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    fetchAssignedTasks();
  }, []);

  const fetchAssignedTasks = async () => {
    try {
      const res = await api.get('/worker/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (issueId, newStatus) => {
    try {
      await api.put(`/worker/tasks/${issueId}/status?new_status=${newStatus}`);
      fetchAssignedTasks();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status.');
    }
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'Assigned') return t.status === 'Assigned';
    if (activeTab === 'Accepted') return t.status === 'Accepted';
    if (activeTab === 'In Progress') return t.status === 'In Progress';
    if (activeTab === 'Completed') return t.status === 'Completed' || t.status === 'Verified';
    return true;
  });

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', color: '#0f766e', marginBottom: '0.25rem' }}>Municipal Worker Task Portal</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>View assigned road infrastructure repairs and submit completion proof</p>
      </div>

      {/* Task Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #cbd5e1', pb: '0.5rem' }}>
        {[
          { key: 'ALL', label: `All Tasks (${tasks.length})` },
          { key: 'Assigned', label: `Pending (${tasks.filter(t => t.status === 'Assigned').length})` },
          { key: 'Accepted', label: `Accepted (${tasks.filter(t => t.status === 'Accepted').length})` },
          { key: 'In Progress', label: `In Progress (${tasks.filter(t => t.status === 'In Progress').length})` },
          { key: 'Completed', label: `Completed (${tasks.filter(t => t.status === 'Completed' || t.status === 'Verified').length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              background: activeTab === tab.key ? '#0f766e' : '#f1f5f9',
              color: activeTab === tab.key ? 'white' : '#475569',
              border: 'none',
              fontWeight: activeTab === tab.key ? 600 : 400
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div>Loading Assigned Tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <Wrench size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
          <h3>No Tasks Found</h3>
          <p style={{ fontSize: '0.875rem' }}>No tasks found for tab filter: '{activeTab}'.</p>
        </div>
      ) : (
        <div className="grid-2">
          {filteredTasks.map((task) => (
            <div key={task.id} className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontFamily: 'monospace', color: '#1e3a8a', fontSize: '1.1rem' }}>{task.report_id}</h3>
                <StatusBadge status={task.status} />
              </div>

              <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                  <MapPin size={14} color="#0f766e" /> <strong>Location:</strong> {task.location_name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>Damage Severity:</span>
                  <SeverityBadge severity={task.overall_severity} />
                </div>
              </div>

              {task.image_path && (
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Reported Defect Photograph:</span>
                  <img
                    src={`${API_BASE_URL}/${task.image_path}`}
                    alt="Defect"
                    style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                  />
                </div>
              )}

              {/* Status Transition Controls */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {task.status === 'Assigned' && (
                  <button onClick={() => handleUpdateStatus(task.id, 'Accepted')} className="btn btn-sm btn-primary" style={{ background: '#2563eb' }}>
                    Accept Dispatch Task
                  </button>
                )}

                {(task.status === 'Assigned' || task.status === 'Accepted') && (
                  <button onClick={() => handleUpdateStatus(task.id, 'In Progress')} className="btn btn-sm btn-secondary" style={{ background: '#7c3aed', color: 'white' }}>
                    Mark Task 'In Progress'
                  </button>
                )}

                {(task.status === 'Accepted' || task.status === 'In Progress') && (
                  <Link to={`/worker/proof/${task.id}`} className="btn btn-sm btn-success" style={{ textAlign: 'center', justifyContent: 'center' }}>
                    <Upload size={14} /> Upload Repair Proof & Complete Task
                  </Link>
                )}

                {task.status === 'Completed' && (
                  <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600, textAlign: 'center', padding: '0.4rem', background: '#d1fae5', borderRadius: '4px' }}>
                    ✓ Proof Uploaded. Awaiting Authority Verification.
                  </div>
                )}

                {task.status === 'Verified' && (
                  <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600, textAlign: 'center', padding: '0.4rem', background: '#dcfce7', borderRadius: '4px' }}>
                    ✓ Work Verified & Resolved.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
