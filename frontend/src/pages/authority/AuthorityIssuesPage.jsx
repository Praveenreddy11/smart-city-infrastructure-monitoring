import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { SeverityBadge, StatusBadge } from '../../components/common/Badges';
import { Filter, Search, UserPlus, Eye, MapPin, Calendar, CheckCircle } from 'lucide-react';

export const AuthorityIssuesPage = () => {
  const [issues, setIssues] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchIssues();
    fetchWorkers();
  }, [statusFilter, severityFilter, search]);

  const fetchIssues = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;
      if (search) params.search = search;

      const res = await api.get('/authority/issues', { params });
      setIssues(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await api.get('/workers');
      setWorkers(res.data.filter(w => w.status === 'ACTIVE'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignWorker = async (e) => {
    e.preventDefault();
    if (!selectedIssue || !selectedWorkerId) return;

    setAssigning(true);
    try {
      await api.post('/authority/assign', {
        issue_id: selectedIssue.id,
        worker_id: parseInt(selectedWorkerId),
        notes: assignNotes
      });
      alert('Worker successfully assigned to task!');
      setSelectedIssue(null);
      setSelectedWorkerId('');
      setAssignNotes('');
      fetchIssues();
    } catch (err) {
      alert(err.response?.data?.detail || 'Worker assignment failed.');
    } finally {
      setAssigning(false);
    }
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: '#1e3a8a', marginBottom: '0.25rem' }}>Road Infrastructure Issues</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Monitor AI detections, inspect image evidence, and dispatch workers</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Report ID or location..."
              className="form-control"
            />
          </div>

          <div style={{ width: '160px' }}>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-control">
              <option value="">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Assigned">Assigned</option>
              <option value="Accepted">Accepted</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Verified">Verified</option>
            </select>
          </div>

          <div style={{ width: '160px' }}>
            <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="form-control">
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Location</th>
                <th>AI Detections</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Loading Issues...</td></tr>
              ) : issues.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No infrastructure issues match the current filter criteria.</td></tr>
              ) : (
                issues.map((issue) => (
                  <tr key={issue.id}>
                    <td>
                      <strong style={{ fontFamily: 'monospace', color: '#1e3a8a' }}>{issue.report_id}</strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{issue.location_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
                      </div>
                    </td>
                    <td>
                      {issue.detections && issue.detections.length > 0 ? (
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {issue.detections.map((d, i) => (
                            <span key={i} style={{ background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                              {d.class_name} ({(d.confidence * 100).toFixed(0)}%)
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>None Flagged</span>
                      )}
                    </td>
                    <td><SeverityBadge severity={issue.overall_severity} /></td>
                    <td><StatusBadge status={issue.status} /></td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(issue.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button onClick={() => setSelectedIssue(issue)} className="btn btn-sm btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Eye size={14} /> View / Assign
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Detail & Worker Assignment Modal */}
      {selectedIssue && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', pb: '0.5rem' }}>
              <h3 style={{ color: '#1e3a8a', fontFamily: 'monospace' }}>Issue {selectedIssue.report_id}</h3>
              <button onClick={() => setSelectedIssue(null)} className="btn btn-sm btn-secondary">Close</button>
            </div>

            <div className="grid-2" style={{ marginBottom: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }}>Original Image</h4>
                <img
                  src={`${API_BASE_URL}/${selectedIssue.image_path}`}
                  alt="Original"
                  style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                />
              </div>

              {selectedIssue.annotated_image_path && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }}>YOLOv8 Bounding Box Output</h4>
                  <img
                    src={`${API_BASE_URL}/${selectedIssue.annotated_image_path}`}
                    alt="Annotated"
                    style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                  />
                </div>
              )}
            </div>

            <div style={{ background: '#f8fafc', padding: '0.875rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem' }}>
              <p><strong>Location:</strong> {selectedIssue.location_name} ({selectedIssue.latitude}, {selectedIssue.longitude})</p>
              <p><strong>Status:</strong> <StatusBadge status={selectedIssue.status} /> | <strong>Severity:</strong> <SeverityBadge severity={selectedIssue.overall_severity} /></p>
              {selectedIssue.description && <p><strong>Citizen Notes:</strong> {selectedIssue.description}</p>}
            </div>

            {/* Worker Assignment & Reassignment Form */}
            <form onSubmit={handleAssignWorker} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: '#1e3a8a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <UserPlus size={16} /> {selectedIssue.status !== 'Reported' ? 'Reassign / Redispatch Worker' : 'Dispatch Municipal Worker'}
              </h4>

              {selectedIssue.assignments && selectedIssue.assignments.length > 0 && (
                <div style={{ background: '#eff6ff', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', color: '#1d4ed8', marginBottom: '0.75rem', border: '1px solid #bfdbfe' }}>
                  <strong>Current Assignment History:</strong> Assigned to Worker #{selectedIssue.assignments[selectedIssue.assignments.length - 1].worker_id} (Status: {selectedIssue.assignments[selectedIssue.assignments.length - 1].status})
                </div>
              )}

              <div className="form-group">
                <label>Select Worker</label>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="form-control"
                  required
                >
                  <option value="">-- Choose Registered Municipal Worker --</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.specialization} - Zone: {w.area})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Dispatch Instructions / Reassignment Notes</label>
                <textarea
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Inspect right asphalt lane and perform cold mix patch..."
                  className="form-control"
                  rows={2}
                />
              </div>

              <button type="submit" disabled={assigning} className="btn btn-primary" style={{ width: '100%' }}>
                {assigning ? 'Dispatching...' : selectedIssue.status !== 'Reported' ? 'Reassign Issue to Selected Worker' : 'Assign Worker to Issue'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
