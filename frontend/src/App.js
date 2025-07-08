import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState(localStorage.getItem('sessionToken'));

  useEffect(() => {
    if (sessionToken) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [sessionToken]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData) => {
    setSessionToken(token);
    setUser(userData);
    localStorage.setItem('sessionToken', token);
  };

  const logout = () => {
    setSessionToken(null);
    setUser(null);
    localStorage.removeItem('sessionToken');
  };

  const updateRole = async (role) => {
    try {
      await axios.put(`${API}/auth/role`, role, {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });
      setUser(prev => ({ ...prev, role }));
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Components
const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-lg border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">LK</span>
              </div>
              <span className="text-2xl font-bold text-gray-800">LaunchKart</span>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src={user.picture || 'https://via.placeholder.com/40'} 
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-gray-700">{user.name}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full capitalize">
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
  </div>
);

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/auth/login`);
      window.location.href = response.data.auth_url;
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <div className="flex justify-center items-center space-x-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">LK</span>
              </div>
              <h1 className="text-5xl font-bold text-gray-900">LaunchKart</h1>
            </div>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Empowering early-stage entrepreneurs with business essentials, expert mentorship, 
              and investment opportunities. Your startup journey starts here.
            </p>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Redirecting...' : 'Get Started Now'}
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1513530534585-c7b1394c6d51"
                alt="Business Essentials"
                className="w-full h-48 object-cover rounded-lg mb-6"
              />
              <h3 className="text-xl font-semibold mb-4">Free Business Essentials</h3>
              <p className="text-gray-600">
                Get your logo, landing page, social media creatives, and product mockups instantly after signup.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1573496130103-a442a3754d0e"
                alt="Mentorship"
                className="w-full h-48 object-cover rounded-lg mb-6"
              />
              <h3 className="text-xl font-semibold mb-4">Expert Mentorship</h3>
              <p className="text-gray-600">
                Connect with experienced mentors who can guide you through your entrepreneurial journey.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1588856122867-363b0aa7f598"
                alt="Investment"
                className="w-full h-48 object-cover rounded-lg mb-6"
              />
              <h3 className="text-xl font-semibold mb-4">Investment Opportunities</h3>
              <p className="text-gray-600">
                Access our internal syndicate and get connected with investors looking for promising startups.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RoleSelector = () => {
  const { user, updateRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState(user?.role || 'founder');
  const [loading, setLoading] = useState(false);

  const roles = [
    { id: 'founder', title: 'Startup Founder', description: 'Build and grow your startup' },
    { id: 'mentor', title: 'Mentor', description: 'Guide and support entrepreneurs' },
    { id: 'investor', title: 'Investor', description: 'Discover investment opportunities' },
    { id: 'admin', title: 'Admin', description: 'Manage platform operations' }
  ];

  const handleRoleUpdate = async () => {
    setLoading(true);
    await updateRole(selectedRole);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Role</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {roles.map(role => (
          <div
            key={role.id}
            className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
              selectedRole === role.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedRole(role.id)}
          >
            <h3 className="font-semibold text-lg mb-2">{role.title}</h3>
            <p className="text-gray-600">{role.description}</p>
          </div>
        ))}
      </div>
      <button
        onClick={handleRoleUpdate}
        disabled={loading}
        className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Updating...' : 'Continue'}
      </button>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/dashboard`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('sessionToken')}` }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateEssentials = async () => {
    try {
      await axios.post(`${API}/business-essentials/generate`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('sessionToken')}` }
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to generate essentials:', error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-600">
          {user.role === 'founder' && 'Ready to build your startup empire?'}
          {user.role === 'mentor' && 'Ready to guide the next generation of entrepreneurs?'}
          {user.role === 'investor' && 'Ready to discover promising investment opportunities?'}
          {user.role === 'admin' && 'Ready to manage the platform?'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Business Essentials</h3>
          <p className="text-3xl font-bold text-blue-600">
            {dashboardData?.stats?.total_essentials || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Service Requests</h3>
          <p className="text-3xl font-bold text-green-600">
            {dashboardData?.stats?.total_services || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Completed Projects</h3>
          <p className="text-3xl font-bold text-purple-600">
            {dashboardData?.stats?.completed_services || 0}
          </p>
        </div>
      </div>

      {/* Business Essentials Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Business Essentials</h2>
          {(!dashboardData?.business_essentials || dashboardData.business_essentials.length === 0) && (
            <button
              onClick={generateEssentials}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Generate Essentials
            </button>
          )}
        </div>
        
        {dashboardData?.business_essentials?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dashboardData.business_essentials.map(essential => (
              <div key={essential.id} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">{essential.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{essential.description}</p>
                {essential.type === 'logo' && (
                  <img 
                    src={essential.content} 
                    alt="Logo"
                    className="w-16 h-16 object-contain"
                  />
                )}
                {essential.type === 'website' && (
                  <button className="text-blue-500 hover:text-blue-600">
                    View Website
                  </button>
                )}
                {essential.type === 'social_media' && (
                  <img 
                    src={essential.content} 
                    alt="Social Media"
                    className="w-full h-32 object-cover rounded"
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No business essentials generated yet. Click the button above to get started!
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-semibold mb-2">Request Service</h3>
            <p className="text-sm text-gray-600">Get professional help</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-semibold mb-2">Find Mentor</h3>
            <p className="text-sm text-gray-600">Connect with experts</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-semibold mb-2">Apply for Funding</h3>
            <p className="text-sm text-gray-600">Get investment</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-semibold mb-2">View Analytics</h3>
            <p className="text-sm text-gray-600">Track your progress</p>
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const sessionId = window.location.hash.split('session_id=')[1];
      if (sessionId) {
        try {
          const response = await axios.post(`${API}/auth/profile`, {}, {
            headers: { 'X-Session-ID': sessionId }
          });
          login(response.data.session_token, response.data.user);
          navigate('/dashboard');
        } catch (error) {
          console.error('Authentication failed:', error);
          navigate('/');
        }
      }
    };

    handleAuth();
  }, [login, navigate]);

  return <LoadingSpinner />;
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/role-selector" element={
            <ProtectedRoute>
              <RoleSelector />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;