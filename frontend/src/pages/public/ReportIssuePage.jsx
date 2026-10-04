import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import { SeverityBadge, StatusBadge } from '../../components/common/Badges';
import { Camera, MapPin, CheckCircle, Copy, AlertCircle, Loader } from 'lucide-react';

// Fix Leaflet marker icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

export const ReportIssuePage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [locationName, setLocationName] = useState('Central Avenue Road Segment');
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState([37.7749, -122.4194]); // Default position
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultModal, setResultModal] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Get browser geolocation if allowed
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => console.log('Geolocation permission skipped:', err)
      );
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
          setLocationName(`Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`);
        },
        (err) => setError('Could not access current location. Please pick location on the map.')
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please upload a road image before submitting.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('latitude', position[0]);
    formData.append('longitude', position[1]);
    formData.append('location_name', locationName);
    formData.append('description', description);

    try {
      const response = await api.post('/public/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResultModal(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit report. Please check image and connection.');
    } finally {
      setLoading(false);
    }
  };

  const copyReportId = () => {
    if (resultModal) {
      navigator.clipboard.writeText(resultModal.report_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#1e3a8a' }}>
          <Camera size={24} /> Report Infrastructure Hazard
        </h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Upload a clear photograph of a road pothole or crack. Our AI system will analyze defect severity and submit your report to municipal authorities.
        </p>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* File & Camera Upload */}
          <div className="form-group">
            <label>Road Image Upload (JPG, PNG, WEBP)</label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Select File from Device:</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="form-control"
                />
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Take Photo with Camera:</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="form-control"
                />
              </div>
            </div>
            {previewUrl && (
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{ maxHeight: '250px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            )}
          </div>

          {/* Location Input & Map */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ margin: 0 }}>Incident Location</label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="btn btn-sm btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <MapPin size={14} /> Use My GPS Location
              </button>
            </div>

            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. 5th Avenue & Main St, North District"
              className="form-control"
              style={{ marginBottom: '0.75rem' }}
              required
            />

            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
              Click on the map below to set exact coordinates: <strong>{position[0].toFixed(5)}, {position[1].toFixed(5)}</strong>
            </div>

            <MapContainer center={position} zoom={13} scrollWheelZoom={false} className="leaflet-container">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
          </div>

          {/* Optional Description */}
          <div className="form-group">
            <label>Additional Notes (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Provide extra details about the road damage..."
              className="form-control"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}
          >
            {loading ? (
              <>
                <Loader className="spin" size={20} /> Analyzing Image with YOLOv8...
              </>
            ) : (
              'Submit Report & Run AI Detection'
            )}
          </button>
        </form>
      </div>

      {/* Success Result Modal */}
      {resultModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
              <h3 style={{ fontSize: '1.5rem', color: '#1e3a8a' }}>Report Submitted Successfully!</h3>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Unique Report ID:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '1.1rem', color: '#1e3a8a', fontFamily: 'monospace' }}>{resultModal.report_id}</strong>
                  <button onClick={copyReportId} className="btn btn-sm btn-secondary" title="Copy Report ID">
                    <Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Status:</span>
                <StatusBadge status={resultModal.status} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>AI Estimated Severity:</span>
                <SeverityBadge severity={resultModal.overall_severity} />
              </div>
            </div>

            {/* AI Bounding Box Annotated Image */}
            {resultModal.annotated_image_path && (
              <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
                <h4 style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>YOLOv8 Detection Output</h4>
                <img
                  src={`${API_BASE_URL}/${resultModal.annotated_image_path}`}
                  alt="AI Detection Output"
                  style={{ maxWidth: '100%', maxHeight: '280px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            )}

            {/* Detections List */}
            {resultModal.detections && resultModal.detections.length > 0 ? (
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>Detected Anomalies ({resultModal.detections.length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {resultModal.detections.map((d, idx) => (
                    <div key={idx} style={{ background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span><strong>{d.class_name}</strong> (Conf: {(d.confidence * 100).toFixed(1)}%)</span>
                      <SeverityBadge severity={d.severity} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', marginBottom: '1.25rem' }}>
                No immediate pothole/crack detected above threshold. Report logged for manual verification.
              </p>
            )}

            <button
              onClick={() => setResultModal(null)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Done / Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
