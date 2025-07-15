import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Link, useLocation, Navigate } from 'react-router-dom';
import { apiRequest } from '../App';
import DashboardOverview from './DashboardOverview';
import UserManagement from './UserManagement';
import AnalyticsOverview from './AnalyticsOverview';
import ServiceManagement from './ServiceManagement';
import SystemManagement from './SystemManagement';
import AdminManagementComponent from './AdminManagementComponent';

// Context for admin state
export const AdminProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (token) {
      verifyAdminToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyAdminToken = async (token) => {
    try {
      const response = await apiRequest('get', '/admin/manage/me', null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      sessionStorage.removeItem('admin_token');
      setAdminUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = (token, admin) => {
    sessionStorage.setItem('admin_token', token);
    setAdminUser(admin);
    setIsAuthenticated(true);
  };

  const logout = () => {
    sessionStorage.removeItem('admin_token');
    setAdminUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AdminContext.Provider value={{
      adminUser,
      isAuthenticated,
      loading,
      login,
      logout,
      hasPermission: (permission) => adminUser?.permissions?.includes(permission) || false
    }}>
      {children}
    </AdminContext.Provider>
  );
};

const AdminContext = React.createContext();
export const useAdmin = () => React.useContext(AdminContext);

// Admin Login Component
const AdminLogin = () => {
  const [step, setStep] = useState('email'); // 'email' or 'otp'
  const [formData, setFormData] = useState({ email: '', otp: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const { login } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(timer - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const requestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiRequest('post', '/admin/manage/auth/request-otp', { email: formData.email });
      setStep('otp');
      setTimer(600); // 10 minutes
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiRequest('post', '/admin/manage/auth/verify-otp', {
        email: formData.email,
        otp: formData.otp
      });
      
      login(response.data.token, response.data.admin);
      navigate('/admin/dashboard');
    } catch (error) {
      setError(error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">🛡️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Portal</h1>
          <p className="text-gray-600">
            {step === 'email' ? 'Enter your email to receive OTP' : 'Enter the OTP sent to your email'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={requestOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your admin email"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP
              </label>
              <input
                type="text"
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
              {timer > 0 && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  OTP expires in {formatTime(timer)}
                </p>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
          >
            ← Back to Main Site
          </Link>
        </div>
      </div>
    </div>
  );
};

// Admin Sidebar Component
const AdminSidebar = ({ isOpen, setIsOpen }) => {
  const { adminUser, logout, hasPermission } = useAdmin();
  const location = useLocation();

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊', permission: null },
    { path: '/admin/users', label: 'Users', icon: '👥', permission: 'user_management' },
    { path: '/admin/kyc', label: 'KYC Management', icon: '🔍', permission: 'kyc_verification' },
    { path: '/admin/services', label: 'Services', icon: '🛠️', permission: 'service_approval' },
    { path: '/admin/mentorship', label: 'Mentorship', icon: '🎓', permission: 'content_moderation' },
    { path: '/admin/investments', label: 'Investments', icon: '💰', permission: 'payment_management' },
    { path: '/admin/analytics', label: 'Analytics', icon: '📈', permission: 'analytics_access' },
    { path: '/admin/system', label: 'System', icon: '⚙️', permission: 'system_configuration' },
    { path: '/admin/admins', label: 'Admin Management', icon: '👑', permission: 'admin_management' }
  ];

  const handleMenuClick = () => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white h-screen fixed left-0 top-0 z-40 shadow-2xl
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">🛡️</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Admin Portal</h2>
                <p className="text-xs text-slate-400 capitalize">{adminUser?.role}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
          {menuItems.map((item) => {
            if (item.permission && !hasPermission(item.permission)) return null;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleMenuClick}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="mb-4">
            <p className="text-sm text-slate-400">Logged in as:</p>
            <p className="text-white font-medium truncate">{adminUser?.fullName}</p>
            <p className="text-xs text-slate-400 truncate">{adminUser?.email}</p>
          </div>
          <button
            onClick={logout}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

// Admin Header Component
const AdminHeader = ({ title, onMenuClick }) => {
  const { adminUser } = useAdmin();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">{title}</h1>
      </div>
      <div className="flex items-center space-x-2 lg:space-x-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900">{adminUser?.fullName}</p>
          <p className="text-xs text-gray-500 capitalize">{adminUser?.role}</p>
        </div>
        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">
            {adminUser?.fullName?.charAt(0) || '?'}
          </span>
        </div>
      </div>
    </header>
  );
};

// Protected Admin Route Component
const ProtectedAdminRoute = ({ children, permission = null }) => {
  const { isAuthenticated, loading, hasPermission } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
          <p className="text-gray-600">You don't have permission to access this resource.</p>
        </div>
      </div>
    );
  }

  // Clone children and inject menu handler
  const childrenWithProps = React.cloneElement(children, {
    onMenuClick: () => setSidebarOpen(true)
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 lg:ml-64 min-w-0">
        {childrenWithProps}
      </div>
    </div>
  );
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
  return (
    <AdminProvider>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/dashboard" element={
          <ProtectedAdminRoute>
            <DashboardOverview />
          </ProtectedAdminRoute>
        } />
        <Route path="/users" element={
          <ProtectedAdminRoute permission="user_management">
            <UserManagement />
          </ProtectedAdminRoute>
        } />
        <Route path="/kyc" element={
          <ProtectedAdminRoute permission="kyc_verification">
            <KYCManagement />
          </ProtectedAdminRoute>
        } />
        <Route path="/services" element={
          <ProtectedAdminRoute permission="service_approval">
            <ServiceManagement />
          </ProtectedAdminRoute>
        } />
        <Route path="/mentorship" element={
          <ProtectedAdminRoute permission="content_moderation">
            <MentorshipManagement />
          </ProtectedAdminRoute>
        } />
        <Route path="/investments" element={
          <ProtectedAdminRoute permission="payment_management">
            <InvestmentManagement />
          </ProtectedAdminRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedAdminRoute permission="analytics_access">
            <AnalyticsOverview />
          </ProtectedAdminRoute>
        } />
        <Route path="/system" element={
          <ProtectedAdminRoute permission="system_configuration">
            <SystemManagement />
          </ProtectedAdminRoute>
        } />
        <Route path="/admins" element={
          <ProtectedAdminRoute permission="admin_management">
            <AdminManagementComponent />
          </ProtectedAdminRoute>
        } />
        <Route path="*" element={<Navigate to="/admin/dashboard" />} />
      </Routes>
    </AdminProvider>
  );
};


// Import the management components
import KYCManagement from './KYCManagement';
import MentorshipManagement from './MentorshipManagement';
import InvestmentManagement from './InvestmentManagement';

export default AdminDashboard;