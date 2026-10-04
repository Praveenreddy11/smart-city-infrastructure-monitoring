import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { StatusBadge, SeverityBadge } from '../../components/common/Badges';
import { CheckCircle, XCircle, Eye, AlertTriangle } from 'lucide-react';

export const AuthorityVerificationPage = () => {
  const [completedIssues, setCompletedIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCompletedIssues();
  }, []);

  const fetchCompletedIssues = async () => {
    try {
      // Get issues with Completed status or Verified status
      const res = await api.get('/authority/issues', { params: { status: 'Completed' } });
      setCompletedIssues(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOrReject = async (action) => {
    if (!selectedIssue) return;
    setProcessing(true);

    try {
      const res = await api.post(`/authority/verify/${selectedIssue.id}`, {
        action,
        rejection_reason: rejectionReason
      });
      alert(res.data.message);
      setSelectedIssue(null);
      setRejectionReason('');
      fetchCompletedIssues();
    } catch (err) {
      alert(err.response?.data?.detail || 'Verification process failed.');
    } finally {
      setProcessing(false);
    }
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', color: '#1e3a8a', marginBottom: '0.25rem' }}>Repair Proof Verification Portal</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Inspect completed road repairs submitted by municipal workers and verify resolution quality</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Location</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Loading Completed Tasks...</td></tr>
              ) : completedIssues.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No pending completed repair tasks requiring verification.</td></tr>
              ) : (
                completedIssues.map((issue) => (
                  <tr key={issue.id}>
                    <td><strong style={{ fontFamily: 'monospace', color: '#1e3a8a' }}>{issue.report_id}</strong></td>
                    <td>{issue.location_name}</td>
                    <td><SeverityBadge severity={issue.overall_severity} /></td>
                    <td><StatusBadge status={issue.status} /></td>
                    <td>
                      <button onClick={() => setSelectedIssue(issue)} className="btn btn-sm btn-primary">
                        <Eye size={14} /> Review Proof
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedIssue && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', pb: '0.5rem' }}>
              <h3 style={{ color: '#1e3a8a', fontFamily: 'monospace' }}>Repair Verification: {selectedIssue.report_id}</h3>
              <button onClick={() => setSelectedIssue(null)} className="btn btn-sm btn-secondary">Close</button>
            </div>

            {/* Side-by-Side Image Comparison */}
            <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', color: '#991b1b', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Before: Reported Defect Image
                </h4>
                <img
                  src={`${API_BASE_URL}/${selectedIssue.image_path}`}
                  alt="Original Defect"
                  style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #fca5a5' }}
                />
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', color: '#166534', marginBottom: '0.5rem', fontWeight: 600 }}>
                  After: Worker Repair Proof Image
                </h4>
                {/* Find latest repair proof */}
                {selectedIssue.repairs && selectedIssue.repairs.length > 0 ? (
                  <div>
                    <img
                      src={`${API_BASE_URL}/${selectedIssue.repairs[0].proof_image_path}`}
                      alt="Repair Proof"
                      style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #86efac', marginBottom: '0.5rem' }}
                    />
                    {selectedIssue.repairs[0].completion_notes && (
                      <div style={{ fontSize: '0.8rem', background: '#f0fdf4', padding: '0.5rem', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                        <strong>Worker Completion Notes:</strong> {selectedIssue.repairs[0].completion_notes}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ background: '#f8fafc', height: '200px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                    Proof image reference pending
                  </div>
                )}
              </div>
            </div>

            {/* Verification Actions Form */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: '#1e3a8a' }}>Authority Verdict</h4>

              <div className="form-group">
                <label>Rejection Reason (Required only if rejecting)</label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Surface patch uneven, resurfacing required..."
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  onClick={() => handleVerifyOrReject('VERIFY')}
                  disabled={processing}
                  className="btn btn-success"
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  <CheckCircle size={18} /> Verify Work & Close Issue
                </button>

                <button
                  onClick={() => handleVerifyOrReject('REJECT')}
                  disabled={processing}
                  className="btn btn-danger"
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  <XCircle size={18} /> Reject Repair Proof
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
