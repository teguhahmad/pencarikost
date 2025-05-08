import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import BackofficeLayout from './components/layout/BackofficeLayout';
import Login from './pages/Login';
import MarketplaceAuth from './pages/marketplace/Auth';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import Rooms from './pages/Rooms';
import Payments from './pages/Payments';
import Maintenance from './pages/Maintenance';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Properties from './pages/Properties';
import Marketplace from './pages/Marketplace';
import MarketplaceSettings from './pages/MarketplaceSettings';
import PropertyDetails from './pages/PropertyDetails';
import SavedProperties from './pages/marketplace/Saved';
import Chat from './pages/marketplace/Chat';
import MarketplaceNotifications from './pages/marketplace/Notifications';
import Profile from './pages/marketplace/Profile';
import BackofficeDashboard from './pages/backoffice/Dashboard';
import BackofficeUsers from './pages/backoffice/Users';
import BackofficeNotifications from './pages/backoffice/Notifications';
import BackofficeProperties from './pages/backoffice/Properties';
import BackofficeSubscriptionPlans from './pages/backoffice/SubscriptionPlans';
import BackofficeSubscriptions from './pages/backoffice/Subscriptions';
import RolePermissions from './pages/backoffice/RolePermissions';
import BackofficeSettings from './pages/backoffice/Settings';
import { PropertyProvider, useProperty } from './contexts/PropertyContext';
import { BackofficeProvider, useBackoffice } from './contexts/BackofficeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import BackofficeSwitch from './components/ui/BackofficeSwitch';
import MarketplaceButton from './components/ui/TestBillingButton';
import { supabase } from './lib/supabase';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedProperty } = useProperty();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      if (!session) {
        // Save the intended destination
        if (location.pathname.startsWith('/marketplace')) {
          navigate('/marketplace/auth', { state: { from: location.pathname } });
        } else {
          navigate('/login', { state: { from: location.pathname } });
        }
      } else {
        // Check user role
        const role = session.user.user_metadata?.role;
        setUserRole(role);

        // Redirect tenant users to marketplace
        if (role === 'tenant' && !location.pathname.startsWith('/marketplace')) {
          navigate('/marketplace');
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (!session) {
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location]);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  // Only redirect to properties if we're not already there and no property is selected
  // and the user is not a tenant
  if (!selectedProperty && location.pathname !== '/properties' && userRole !== 'tenant') {
    return <Navigate to="/properties" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.substring(1) || 'dashboard';
    setActivePage(path);
  }, [location]);

  const pageTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    tenants: 'Manajemen Penyewa',
    rooms: 'Manajemen Kamar',
    payments: 'Catatan Pembayaran',
    maintenance: 'Pemeliharaan',
    reports: 'Laporan Keuangan',
    notifications: 'Notifikasi',
    settings: 'Pengaturan',
    properties: 'Properti',
    marketplace: 'Marketplace',
    'marketplace-settings': 'Pengaturan Marketplace'
  };

  const navigate = useNavigate();

  const handleNavigate = (page: string) => {
    navigate(`/${page}`);
    setActivePage(page);
  };

  // Check if we're in the backoffice section
  if (location.pathname.startsWith('/backoffice')) {
    return <BackofficeContent />;
  }

  // Special case for marketplace - no layout wrapper needed
  if (location.pathname.startsWith('/marketplace')) {
    return (
      <Routes>
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/marketplace/auth" element={<MarketplaceAuth />} />
        <Route path="/marketplace/property/:id" element={<PropertyDetails />} />
        <Route path="/marketplace/saved" element={<SavedProperties />} />
        <Route path="/marketplace/chat" element={<Chat />} />
        <Route path="/marketplace/notifications" element={<MarketplaceNotifications />} />
        <Route path="/marketplace/profile" element={<Profile />} />
      </Routes>
    );
  }

  return (
    <Layout 
      title={pageTitles[activePage]} 
      activeItem={activePage}
      onNavigate={handleNavigate}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard onNavigate={handleNavigate} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tenants" 
          element={
            <ProtectedRoute>
              <Tenants />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/rooms" 
          element={
            <ProtectedRoute>
              <Rooms />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/payments" 
          element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/maintenance" 
          element={
            <ProtectedRoute>
              <Maintenance />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/properties" 
          element={
            <ProtectedRoute>
              <Properties />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/marketplace-settings" 
          element={
            <ProtectedRoute>
              <MarketplaceSettings />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Layout>
  );
};

const BackofficeContent: React.FC = () => {
  return (
    <BackofficeLayout>
      <Routes>
        <Route path="/" element={<BackofficeDashboard />} />
        <Route path="/users" element={<BackofficeUsers />} />
        <Route path="/notifications" element={<BackofficeNotifications />} />
        <Route path="/properties" element={<BackofficeProperties />} />
        <Route path="/subscriptions" element={<BackofficeSubscriptions />} />
        <Route path="/subscription-plans" element={<BackofficeSubscriptionPlans />} />
        <Route path="/role-permissions" element={<RolePermissions />} />
        <Route path="/settings" element={<BackofficeSettings />} />
      </Routes>
    </BackofficeLayout>
  );
};

function App() {
  return (
    <Router>
      <BackofficeProvider>
        <PropertyProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/marketplace/auth" element={<MarketplaceAuth />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/property/:id" element={<PropertyDetails />} />
              <Route path="/marketplace/saved" element={<SavedProperties />} />
              <Route path="/marketplace/chat" element={<Chat />} />
              <Route path="/marketplace/notifications" element={<MarketplaceNotifications />} />
              <Route path="/marketplace/profile" element={<Profile />} />
              <Route path="/backoffice/*" element={<BackofficeContent />} />
              <Route path="/*" element={<AppContent />} />
            </Routes>
            <BackofficeSwitch />
            <MarketplaceButton />
          </NotificationProvider>
        </PropertyProvider>
      </BackofficeProvider>
    </Router>
  );
}

export default App;