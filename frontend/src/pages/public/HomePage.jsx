import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Search, ShieldCheck, Cpu, MapPin, CheckCircle } from 'lucide-react';

export const HomePage = () => {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0f766e 100%)', color: 'white', padding: '3.5rem 2rem', borderRadius: '12px', marginBottom: '2.5rem', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 800 }}>
          AI-Powered Smart City Road Infrastructure Monitoring
        </h1>
        <p style={{ fontSize: '1.15rem', opacity: 0.9, maxWidth: '750px', margin: '0 auto 2rem' }}>
          Empowering citizens and municipal authorities with real-time computer vision (YOLOv8) to detect potholes, road cracks, evaluate severity, and accelerate repairs.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/report" className="btn btn-primary" style={{ background: '#3b82f6', fontSize: '1rem', padding: '0.75rem 1.5rem' }}>
            <Camera size={20} /> Report a Road Hazard
          </Link>
          <Link to="/track" className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', fontSize: '1rem', padding: '0.75rem 1.5rem' }}>
            <Search size={20} /> Track Report Status
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid-2" style={{ marginBottom: '2.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#1e3a8a' }}>
            <Cpu size={28} />
            <h3 style={{ fontSize: '1.25rem' }}>YOLOv8 Object Detection</h3>
          </div>
          <p style={{ color: '#64748b' }}>
            Automated image analysis identifies structural defects including potholes and road cracks, calculating precise bounding box coordinates and confidence scores.
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#0f766e' }}>
            <ShieldCheck size={28} />
            <h3 style={{ fontSize: '1.25rem' }}>Prototype Severity Rating</h3>
          </div>
          <p style={{ color: '#64748b' }}>
            Rule-based severity estimation (Low, Medium, High, Critical) evaluates surface damage proportion to prioritize municipal repair dispatches.
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#2563eb' }}>
            <MapPin size={28} />
            <h3 style={{ fontSize: '1.25rem' }}>GIS Map & Dispatch</h3>
          </div>
          <p style={{ color: '#64748b' }}>
            Interactive Leaflet maps pinpoint defect GPS coordinates, enabling authorities to assign specialized maintenance workers and track resolution.
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#059669' }}>
            <CheckCircle size={28} />
            <h3 style={{ fontSize: '1.25rem' }}>Verification & Work Records</h3>
          </div>
          <p style={{ color: '#64748b' }}>
            Municipal workers upload after-repair proof images. Municipal authorities review proof before verifying task completion and recording work logs.
          </p>
        </div>
      </div>

      {/* Role Links */}
      <div className="card" style={{ background: '#f1f5f9', textAlign: 'center', padding: '2rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Portal Access for City Staff</h3>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Are you a municipal authority administrator or authorized maintenance worker?</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <Link to="/authority/login" className="btn btn-primary">Authority Login</Link>
          <Link to="/worker/login" className="btn btn-secondary" style={{ background: '#0f766e', color: 'white' }}>Worker Login</Link>
        </div>
      </div>
    </div>
  );
};
