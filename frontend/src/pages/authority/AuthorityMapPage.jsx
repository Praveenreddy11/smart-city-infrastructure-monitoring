import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import { SeverityBadge, StatusBadge } from '../../components/common/Badges';
import { MapPin, Filter } from 'lucide-react';

export const AuthorityMapPage = () => {
  const [issues, setIssues] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, [statusFilter, severityFilter]);

  const fetchIssues = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;

      const res = await api.get('/authority/issues', { params });
      setIssues(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const defaultCenter = [37.7749, -122.4194];
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: '#1e3a8a', marginBottom: '0.25rem' }}>Infrastructure Map Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>GIS Spatial distribution of reported road hazards</p>
        </div>
      </div>

      {/* Map Filters */}
      <div className="card" style={{ marginBottom: '1rem', padding: '0.875rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#1e3a8a', fontWeight: 600 }}>
            <Filter size={16} /> Map Filters:
          </div>

          <div style={{ width: '180px' }}>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-control" style={{ padding: '0.4rem 0.6rem' }}>
              <option value="">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Verified">Verified</option>
            </select>
          </div>

          <div style={{ width: '180px' }}>
            <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="form-control" style={{ padding: '0.4rem 0.6rem' }}>
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: 'auto' }}>
            Showing <strong>{issues.length}</strong> markers on map
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="card" style={{ padding: '0.5rem' }}>
        <MapContainer center={defaultCenter} zoom={12} scrollWheelZoom={true} style={{ height: '600px', borderRadius: '6px' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {issues.map((issue) => (
            <Marker key={issue.id} position={[issue.latitude, issue.longitude]}>
              <Popup style={{ minWidth: '220px' }}>
                <div style={{ padding: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <strong style={{ fontFamily: 'monospace', color: '#1e3a8a' }}>{issue.report_id}</strong>
                    <StatusBadge status={issue.status} />
                  </div>

                  <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#475569' }}>
                    <strong>Location:</strong> {issue.location_name}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.5rem 0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Severity:</span>
                    <SeverityBadge severity={issue.overall_severity} />
                  </div>

                  {issue.image_path && (
                    <img
                      src={`${API_BASE_URL}/${issue.image_path}`}
                      alt="Thumbnail"
                      style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px', marginTop: '0.25rem' }}
                    />
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};
