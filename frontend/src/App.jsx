import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { ReportIssuePage } from './pages/public/ReportIssuePage';
import { TrackReportPage } from './pages/public/TrackReportPage';

// Authority Pages
import { AuthorityLoginPage } from './pages/authority/AuthorityLoginPage';
import { AuthorityDashboardPage } from './pages/authority/AuthorityDashboardPage';
import { AuthorityIssuesPage } from './pages/authority/AuthorityIssuesPage';
import { AuthorityMapPage } from './pages/authority/AuthorityMapPage';
import { WorkerManagementPage } from './pages/authority/WorkerManagementPage';
import { AuthorityVerificationPage } from './pages/authority/AuthorityVerificationPage';
import { PaymentRecordsPage } from './pages/authority/PaymentRecordsPage';

// Worker Pages
import { WorkerLoginPage } from './pages/worker/WorkerLoginPage';
import { WorkerDashboardPage } from './pages/worker/WorkerDashboardPage';
import { RepairProofPage } from './pages/worker/RepairProofPage';

// Icons
import { LayoutDashboard, AlertCircle, Map, Users, CheckSquare, DollarSign, Wrench, Shield } from 'lucide-react';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to={requiredRole === 'AUTHORITY' ? '/authority/login' : '/worker/login'} replace />;
  }
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const AuthorityLayout = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/authority/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/authority/issues', label: 'Issues List', icon: AlertCircle },
    { path: '/authority/map', label: 'GIS Map', icon: Map },
    { path: '/authority/workers', label: 'Workers', icon: Users },
    { path: '/authority/verification', label: 'Verification', icon: CheckSquare },
    { path: '/authority/payments', label: 'Work Records', icon: DollarSign },
  ];

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div style={{ padding: '0.5rem 1rem 1rem', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Authority Control
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={isActive ? 'active' : ''}>
              <Icon size={18} /> {item.label}
            </Link>
          );
        })}
      </aside>
      <main className="dashboard-main">{children}</main>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<div className="main-content"><HomePage /></div>} />
            <Route path="/report" element={<div className="main-content"><ReportIssuePage /></div>} />
            <Route path="/track" element={<div className="main-content"><TrackReportPage /></div>} />

            {/* Authority Authentication & Portal */}
            <Route path="/authority/login" element={<div className="main-content"><AuthorityLoginPage /></div>} />
            <Route
              path="/authority/*"
              element={
                <ProtectedRoute requiredRole="AUTHORITY">
                  <AuthorityLayout>
                    <Routes>
                      <Route path="dashboard" element={<AuthorityDashboardPage />} />
                      <Route path="issues" element={<AuthorityIssuesPage />} />
                      <Route path="map" element={<AuthorityMapPage />} />
                      <Route path="workers" element={<WorkerManagementPage />} />
                      <Route path="verification" element={<AuthorityVerificationPage />} />
                      <Route path="payments" element={<PaymentRecordsPage />} />
                    </Routes>
                  </AuthorityLayout>
                </ProtectedRoute>
              }
            />

            {/* Worker Authentication & Portal */}
            <Route path="/worker/login" element={<div className="main-content"><WorkerLoginPage /></div>} />
            <Route
              path="/worker/dashboard"
              element={
                <ProtectedRoute requiredRole="WORKER">
                  <div className="main-content"><WorkerDashboardPage /></div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/proof/:issueId"
              element={
                <ProtectedRoute requiredRole="WORKER">
                  <div className="main-content"><RepairProofPage /></div>
                </ProtectedRoute>
              }
            />
          </Routes>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
