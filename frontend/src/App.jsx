import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import PageLayout from './components/layout/PageLayout';
import Landing from './pages/Landing';

import PropertiesList from './pages/properties/PropertiesList';
import Dashboard from './pages/dashboard/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import TenantsList from './pages/tenants/TenantsList';
import PaymentsPage from './pages/payments/PaymentsPage';
import TicketsList from './pages/tickets/TicketsList';
import SettingsPage from './pages/settings/SettingsPage';
import TenantPortal from './pages/tenant-portal/TenantPortal';
import PropertyDetail from './pages/properties/PropertyDetail';
import TenantProfile from './pages/tenants/TenantProfile';
import UnitDetail from './pages/units/UnitDetail';
import NotificationsPage from './pages/notifications/NotificationsPage';

/** Logged-out users see the marketing page only at `/`; other app paths require login. */
const AppShell = () => {
  const token = useAuthStore(state => state.token);
  const location = useLocation();
  if (!token) {
    if (location.pathname === '/') return <Landing />;
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <PageLayout />;
};

const RoleBasedHome = () => {
  const user = useAuthStore(state => state.user);
  if (user?.role === 'tenant') {
     return <TenantPortal />;
  }
  return <Dashboard />;
};

function App() {
  const hydrate = useAuthStore(state => state.hydrate);
  
  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Marketing page at `/` when logged out; app shell when logged in */}
        <Route path="/" element={<AppShell />}>
          {/* Sub-routes injected into the Layout's Outlet */}
          <Route index element={<RoleBasedHome />} />
          <Route path="properties" element={<PropertiesList />} />
          <Route path="properties/:id" element={<PropertyDetail />} />
          <Route path="tenants" element={<TenantsList />} />
          <Route path="tenants/:id" element={<TenantProfile />} />
          <Route path="units/:id" element={<UnitDetail />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="tickets" element={<TicketsList />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
