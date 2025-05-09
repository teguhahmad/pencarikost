import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import MarketplaceAuth from './pages/marketplace/Auth';
import Marketplace from './pages/Marketplace';
import PropertyDetails from './pages/PropertyDetails';
import SavedProperties from './pages/marketplace/Saved';
import Chat from './pages/marketplace/Chat';
import MarketplaceNotifications from './pages/marketplace/Notifications';
import Profile from './pages/marketplace/Profile';
import EditProfile from './pages/marketplace/EditProfile';
import NotificationSettings from './pages/marketplace/NotificationSettings';
import { PropertyProvider } from './contexts/PropertyContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { supabase } from './lib/supabase';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      if (!session) {
        // Save the intended destination
        navigate('/marketplace/auth', { state: { from: location.pathname } });
        return;
      }

      // Check user role
      const role = session.user.user_metadata?.role;
      setUserRole(role);

      // If user is not a tenant, redirect to marketplace
      if (role !== 'tenant') {
        navigate('/marketplace');
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (!session) {
        navigate('/marketplace/auth');
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

  // Only allow tenant users to access protected routes
  if (userRole !== 'tenant') {
    return <Navigate to="/marketplace" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <PropertyProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace/auth" element={<MarketplaceAuth />} />
            <Route path="/marketplace/property/:id" element={<PropertyDetails />} />
            
            {/* Protected Routes - Only for authenticated tenants */}
            <Route path="/marketplace/saved" element={
              <ProtectedRoute>
                <SavedProperties />
              </ProtectedRoute>
            } />
            <Route path="/marketplace/chat" element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } />
            <Route path="/marketplace/notifications" element={
              <ProtectedRoute>
                <MarketplaceNotifications />
              </ProtectedRoute>
            } />
            <Route path="/marketplace/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/marketplace/edit-profile" element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            } />
            <Route path="/marketplace/notification-settings" element={
              <ProtectedRoute>
                <NotificationSettings />
              </ProtectedRoute>
            } />

            {/* Redirect all other routes to marketplace */}
            <Route path="*" element={<Navigate to="/marketplace" replace />} />
          </Routes>
        </NotificationProvider>
      </PropertyProvider>
    </Router>
  );
}

export default App;