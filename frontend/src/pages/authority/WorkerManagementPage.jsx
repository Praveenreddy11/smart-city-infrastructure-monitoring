import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, UserPlus, Phone, MapPin, Wrench, CheckCircle, XCircle } from 'lucide-react';

export const WorkerManagementPage = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    area: '',
    specialization: 'Pothole & Asphalt Repair',
    email: '',
    password: 'Worker@123'
  });

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const res = await api.get('/workers');
      setWorkers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorker = async (e) => {
    e.preventDefault();
    try {
      await api.post('/workers', formData);
      alert('Municipal worker registered successfully!');
      setShowAddModal(false);
      setFormData({
        name: '',
        phone: '',
        area: '',
        specialization: 'Pothole & Asphalt Repair',
        email: '',
        password: 'Worker@123'
      });
      fetchWorkers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to register worker.');
    }
  };

  const toggleWorkerStatus = async (worker) => {
    const newStatus = worker.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.put(`/workers/${worker.id}`, { status: newStatus });
      fetchWorkers();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: '#1e3a8a', marginBottom: '0.25rem' }}>Municipal Worker Directory</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Manage registered maintenance staff and dispatch specializations</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <UserPlus size={18} /> Register Municipal Worker
        </button>
      </div>

      <div className="grid-2">
        {loading ? (
          <div>Loading Workers...</div>
        ) : (
          workers.map((w) => (
            <div key={w.id} className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: '#1e3a8a' }}>{w.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Wrench size={14} /> {w.specialization}
                  </span>
                </div>
                <span className={`badge ${w.status === 'ACTIVE' ? 'badge-verified' : 'badge-rejected'}`}>
                  {w.status}
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Phone size={14} /> {w.phone}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} /> Area Zone: {w.area}
                </span>
              </div>

              {/* Real Database Workload & Task Metrics */}
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '1rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center', fontSize: '0.75rem' }}>
                <div>
                  <div style={{ color: '#64748b' }}>Assigned</div>
                  <strong style={{ fontSize: '1rem', color: '#2563eb' }}>{w.assigned_tasks_count || 0}</strong>
                </div>
                <div>
                  <div style={{ color: '#64748b' }}>Pending</div>
                  <strong style={{ fontSize: '1rem', color: '#d97706' }}>{w.pending_tasks_count || 0}</strong>
                </div>
                <div>
                  <div style={{ color: '#64748b' }}>In Progress</div>
                  <strong style={{ fontSize: '1rem', color: '#7c3aed' }}>{w.in_progress_tasks_count || 0}</strong>
                </div>
                <div>
                  <div style={{ color: '#64748b' }}>Completed</div>
                  <strong style={{ fontSize: '1rem', color: '#059669' }}>{w.completed_tasks_count || 0}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                  Active Workload: <strong style={{ color: (w.current_workload || 0) > 3 ? '#dc2626' : '#059669' }}>{w.current_workload || 0} active tasks</strong>
                </span>
                <button
                  onClick={() => toggleWorkerStatus(w)}
                  className={`btn btn-sm ${w.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}`}
                >
                  {w.status === 'ACTIVE' ? 'Deactivate Worker' : 'Activate Worker'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Worker Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ color: '#1e3a8a', marginBottom: '1rem' }}>Register Municipal Worker</h3>

            <form onSubmit={handleAddWorker}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Robert Smith"
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Contact</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1-555-0188"
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Assigned Zone / Area</label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="e.g. North District / Sector 4"
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Specialization</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Account Email (Login credential)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="worker@smartcity.gov"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Register</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
