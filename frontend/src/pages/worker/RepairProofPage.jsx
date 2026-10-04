import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Upload, Camera, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export const RepairProofPage = () => {
  const { issueId } = useParams();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please attach an after-repair proof photo.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('proof_image', selectedFile);
    if (notes) formData.append('completion_notes', notes);

    try {
      await api.post(`/worker/tasks/${issueId}/repair-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Repair proof successfully submitted! Task marked as Completed.');
      navigate('/worker/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to upload repair proof.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} className="btn btn-sm btn-secondary" style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f766e', marginBottom: '0.5rem' }}>
          <Upload size={24} /> Submit Repair Completion Proof
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Upload a clear photograph of the completed road patch/resurfacing work for issue ID #{issueId}.
        </p>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>After-Repair Photo Proof (JPG, PNG, WEBP)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="form-control"
              required
            />

            {previewUrl && (
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <img
                  src={previewUrl}
                  alt="Proof Preview"
                  style={{ maxHeight: '250px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Work Notes & Materials Used (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Applied cold mix asphalt patch and rolled smooth."
              className="form-control"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-success" style={{ width: '100%', padding: '0.75rem' }}>
            {loading ? 'Uploading Proof...' : 'Submit Proof & Complete Task'}
          </button>
        </form>
      </div>
    </div>
  );
};
