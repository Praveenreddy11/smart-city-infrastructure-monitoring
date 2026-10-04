import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { DollarSign, FileText, CheckCircle, Clock } from 'lucide-react';

export const PaymentRecordsPage = () => {
  const [payments, setPayments] = useState([]);
  const [issues, setIssues] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    issue_id: '',
    worker_id: '',
    amount: 250,
    remarks: 'Routine road patch payout record'
  });

  useEffect(() => {
    fetchPayments();
    fetchData();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await api.get('/payments');
      setPayments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const issuesRes = await api.get('/authority/issues');
      setIssues(issuesRes.data.filter(i => i.status === 'Verified' || i.status === 'Completed'));
      const workersRes = await api.get('/workers');
      setWorkers(workersRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!formData.issue_id || !formData.worker_id) return;

    try {
      await api.post('/payments', {
        issue_id: parseInt(formData.issue_id),
        worker_id: parseInt(formData.worker_id),
        amount: parseFloat(formData.amount),
        remarks: formData.remarks
      });
      alert('Work payment record created successfully.');
      setShowAddModal(false);
      fetchPayments();
    } catch (err) {
      alert('Failed to record payment.');
    }
  };

  const updateStatus = async (id, statusStr) => {
    try {
      await api.put(`/payments/${id}/status?status_str=${statusStr}`);
      fetchPayments();
    } catch (err) {
      alert('Failed to update payment status.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: '#1e3a8a', marginBottom: '0.25rem' }}>Work & Payment Records</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Audit work completion logs and authorize municipal worker payout records</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <DollarSign size={18} /> Record Work Payout
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Issue ID</th>
                <th>Worker ID</th>
                <th>Amount ($)</th>
                <th>Payment Status</th>
                <th>Remarks</th>
                <th>Date Logged</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Loading Records...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No work payout records registered yet.</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id}>
                    <td><strong>PAY-{p.id}</strong></td>
                    <td>Issue #{p.issue_id}</td>
                    <td>Worker #{p.worker_id}</td>
                    <td style={{ fontWeight: 'bold', color: '#10b981' }}>${p.amount.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${p.payment_status === 'Paid' ? 'badge-verified' : p.payment_status === 'Approved' ? 'badge-accepted' : 'badge-assigned'}`}>
                        {p.payment_status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{p.remarks}</td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                    <td>
                      {p.payment_status === 'Pending' && (
                        <button onClick={() => updateStatus(p.id, 'APPROVED')} className="btn btn-sm btn-secondary">Approve</button>
                      )}
                      {p.payment_status === 'Approved' && (
                        <button onClick={() => updateStatus(p.id, 'PAID')} className="btn btn-sm btn-success">Mark Paid</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Record Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ color: '#1e3a8a', marginBottom: '1rem' }}>Create Work Payout Record</h3>

            <form onSubmit={handleCreatePayment}>
              <div className="form-group">
                <label>Select Verified Issue</label>
                <select
                  value={formData.issue_id}
                  onChange={(e) => setFormData({ ...formData, issue_id: e.target.value })}
                  className="form-control"
                  required
                >
                  <option value="">-- Choose Issue --</option>
                  {issues.map(i => (
                    <option key={i.id} value={i.id}>{i.report_id} - {i.location_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select Worker</label>
                <select
                  value={formData.worker_id}
                  onChange={(e) => setFormData({ ...formData, worker_id: e.target.value })}
                  className="form-control"
                  required
                >
                  <option value="">-- Choose Worker --</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.specialization})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Work Payment Amount ($ USD)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Remarks / Work Log</label>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Payout Record</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
