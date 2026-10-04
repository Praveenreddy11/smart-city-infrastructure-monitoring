import React, { useState } from 'react';
import api from '../../services/api';
import { SeverityBadge, StatusBadge } from '../../components/common/Badges';
import { Search, MapPin, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const TrackReportPage = () => {
  const [reportIdInput, setReportIdInput] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!reportIdInput.trim()) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await api.get(`/public/track/${reportIdInput.trim()}`);
      setReport(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Report ID not found. Please verify the ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const statusSteps = ['Reported', 'Assigned', 'Accepted', 'In Progress', 'Completed', 'Verified'];

  const getStepStatus = (step) => {
    if (!report) return 'pending';
    const currentIndex = statusSteps.indexOf(report.status);
    const stepIndex = statusSteps.indexOf(step);
    if (stepIndex <= currentIndex) return 'completed';
    return 'pending';
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#1e3a8a' }}>
          <Search size={24} /> Track Incident Report Status
        </h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Enter your unique Report ID (e.g. <code>REP-2026-X89F</code>) to view current inspection, assignment, and repair status.
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <input
            type="text"
            value={reportIdInput}
            onChange={(e) => setReportIdInput(e.target.value)}
            placeholder="Enter Report ID (e.g. REP-2026-XXXXXX)"
            className="form-control"
            style={{ fontSize: '1rem', fontFamily: 'monospace' }}
            required
          />
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {report && (
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: '#1e3a8a', fontFamily: 'monospace' }}>{report.report_id}</h3>
                <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={14} /> {report.location_name}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <StatusBadge status={report.status} />
                <div style={{ marginTop: '0.25rem' }}>
                  <SeverityBadge severity={report.overall_severity} />
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div style={{ background: '#f8fafc', padding: '1.25rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>Report Status Timeline</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', flexWrap: 'wrap', gap: '0.5rem' }}>
                {statusSteps.map((step, idx) => {
                  const state = getStepStatus(step);
                  return (
                    <div key={idx} style={{ textAlign: 'center', flex: 1, minWidth: '80px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', margin: '0 auto 0.4rem',
                        background: state === 'completed' ? '#10b981' : '#cbd5e1',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold'
                      }}>
                        {state === 'completed' ? <CheckCircle2 size={16} /> : idx + 1}
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: state === 'completed' ? 600 : 400, color: state === 'completed' ? '#0f172a' : '#64748b' }}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Images View */}
            <div className="grid-2" style={{ marginBottom: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }}>Original Uploaded Image</h4>
                <img
                  src={`${API_BASE_URL}/${report.image_path}`}
                  alt="Original Report"
                  style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </div>

              {report.annotated_image_path && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }}>YOLOv8 Detection Preview</h4>
                  <img
                    src={`${API_BASE_URL}/${report.annotated_image_path}`}
                    alt="AI Detection Preview"
                    style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                </div>
              )}
            </div>

            {/* Details Table */}
            <div style={{ fontSize: '0.875rem', color: '#334155' }}>
              <p><strong>Date Reported:</strong> {new Date(report.created_at).toLocaleString()}</p>
              {report.description && <p><strong>Description:</strong> {report.description}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
