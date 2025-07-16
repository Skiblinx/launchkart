import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import KYCFlow from './components/KYCFlow';
import Sidebar from './components/Sidebar';
import { UserProvider, useUser } from './context/UserContext';
import ServicesMarketplace from './components/ServicesMarketplace';
import MentorshipSystem from './components/MentorshipSystem';
import InvestmentSyndicate from './components/InvestmentSyndicate';
import AdminDashboard from './components/AdminDashboard';
import EmailVerification from './components/EmailVerification';

// const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
// const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://launchkart.onrender.com';
const API = `${BACKEND_URL}/api`;

// Utility for authenticated requests (always include token from sessionStorage)
export const apiRequest = (method, url, data, config = {}) => {
  // Check for both user token and admin token
  const userToken = sessionStorage.getItem('token');
  const adminToken = sessionStorage.getItem('admin_token');

  // Use admin token for admin routes, otherwise use user token
  const token = url.includes('/admin/') ? adminToken : userToken;

  const headers = {
    ...(config.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return axios({
    method,
    url: `${API}${url.startsWith('/') ? url : '/' + url}`,
    data,
    ...config,
    headers,
  });
};

// Components
const Header = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  return (
    <header className="bg-gradient-to-r from-blue-500 via-pink-400 to-purple-600 shadow-xl border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg drop-shadow">LK</span>
              </div>
              <span className="text-2xl font-extrabold text-pink-500 drop-shadow">LaunchKart</span>
            </Link>
            {user && (
              <nav className="hidden md:flex space-x-6">
                <Link to="/dashboard" className="text-gray-600 hover:text-blue-600">Dashboard</Link>
                <Link to="/services" className="text-gray-600 hover:text-blue-600">Services</Link>
                <Link to="/mentors" className="text-gray-600 hover:text-blue-600">Mentors</Link>
                {user.role === 'founder' && (
                  <Link to="/investment" className="text-gray-600 hover:text-blue-600">Investment</Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin/dashboard" className="text-gray-600 hover:text-blue-600">Admin</Link>
                )}
              </nav>
            )}
          </div>

          {user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img
                  src={user.picture || 'https://via.placeholder.com/40'}
                  alt={user.fullName || user.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-gray-700 hidden md:block">{user.fullName || user.name}</span>
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
          ) : (
            <div className="flex space-x-4">
              <Link to="/login" className="text-pink-500 hover:text-purple-600 font-semibold">Login</Link>
              <Link to="/signup" className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full shadow hover:from-pink-600 hover:to-purple-700 font-bold">
                Sign Up
              </Link>
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

const Toast = ({ message, type, onClose }) => (
  <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`}>
    <div className="flex items-center justify-between">
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">×</button>
    </div>
  </div>
);

const SignupPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    country: 'India',
    businessStage: 'Idea',
    password: '',
    confirmPassword: '',
    referralCode: '',
    role: 'founder'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { setUser } = useUser();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    else if (formData.country === 'India' && !formData.phoneNumber.startsWith('+91')) {
      newErrors.phoneNumber = 'Phone number must start with +91 for India';
    } else if (formData.country === 'UAE' && !formData.phoneNumber.startsWith('+971')) {
      newErrors.phoneNumber = 'Phone number must start with +971 for UAE';
    }

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await apiRequest('post', '/auth/signup', formData);

      // Store email for potential resend verification
      window.lastVerificationEmail = formData.email;

      if (response.data.email_verification_required) {
        setToast({
          message: 'Account created! Please check your email to verify your account before signing in.',
          type: 'success'
        });
        setTimeout(() => navigate('/login?message=verification-sent'), 2000);
      } else {
        // Fallback for existing flow
        setUser(response.data.user);
        sessionStorage.setItem('user', JSON.stringify(response.data.user));
        sessionStorage.setItem('token', response.data.token);
        setToast({ message: 'Account created successfully!', type: 'success' });
        setTimeout(() => navigate('/kyc'), 1500);
      }
    } catch (error) {
      setToast({
        message: error.response?.data?.detail || 'Signup failed',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-100 py-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-gradient-to-br from-white via-pink-50 to-purple-50 rounded-xl shadow-2xl p-8 border border-pink-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-purple-600 mb-2 drop-shadow">Join LaunchKart</h1>
            <p className="text-pink-500">Start your entrepreneurial journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter your full name"
              />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter your email"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="India">India</option>
                  <option value="UAE">UAE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder={formData.country === 'India' ? '+91 XXXXXXXXXX' : '+971 XXXXXXXXX'}
                />
                {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Stage
              </label>
              <select
                name="businessStage"
                value={formData.businessStage}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Idea">Idea</option>
                <option value="Prototype">Prototype</option>
                <option value="Launched">Launched</option>
                <option value="Scaling">Scaling</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <div className="grid grid-cols-2 gap-4">
                {['founder', 'mentor', 'investor'].map(role => (
                  <label key={role} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={formData.role === role}
                      onChange={handleChange}
                      className="text-blue-600"
                    />
                    <span className="capitalize">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Minimum 8 characters"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referral Code (Optional)
              </label>
              <input
                type="text"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter referral code"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              onClick={() => handleGoogleLogin()}
              className="mt-4 w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continue with Google</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  async function handleGoogleLogin() {
    try {
      const response = await apiRequest('get', '/auth/login-redirect');

      // For the mock implementation, we'll directly call the callback endpoint
      const callbackResponse = await apiRequest('get', response.data.auth_url);

      if (callbackResponse.data.token) {
        setUser(callbackResponse.data.user);
        sessionStorage.setItem('user', JSON.stringify(callbackResponse.data.user));
        sessionStorage.setItem('token', callbackResponse.data.token); // store as plain string
        setToast({ message: 'Google login successful!', type: 'success' });
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (error) {
      console.error('Google login error:', error);
      setToast({ message: 'Google login failed', type: 'error' });
    }
  }
};

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [canResendVerification, setCanResendVerification] = useState(false);
  const { setUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for URL messages
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const message = urlParams.get('message');
    const verified = urlParams.get('verified');

    if (message === 'verification-sent') {
      setToast({
        message: 'Verification email sent! Please check your inbox and verify your email before signing in.',
        type: 'success'
      });
    } else if (verified === 'true') {
      setToast({
        message: 'Email verified successfully! You can now sign in.',
        type: 'success'
      });
    }
  }, [location]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

    if (!formData.password) newErrors.password = 'Password is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await apiRequest('post', '/auth/login', formData);
      setUser(response.data.user);
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
      sessionStorage.setItem('token', response.data.token); // store as plain string
      setToast({ message: 'Login successful!', type: 'success' });
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Login failed';

      // Check if it's an email verification error
      if (error.response?.status === 403 && errorMessage.includes('Email not verified')) {
        setCanResendVerification(true);
        setToast({
          message: 'Please verify your email before signing in. Check your inbox for the verification link.',
          type: 'error'
        });
      } else {
        setToast({
          message: errorMessage,
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      setToast({ message: 'Please enter your email first', type: 'error' });
      return;
    }

    try {
      await apiRequest('post', '/email/request-password-reset', { email: formData.email });
      setToast({ message: 'Password reset link sent to your email', type: 'success' });
      setShowForgotPassword(false);
    } catch (error) {
      setToast({ message: 'Failed to send password reset email', type: 'error' });
    }
  };

  const resendVerificationEmail = async () => {
    if (!formData.email) {
      setToast({ message: 'Please enter your email first', type: 'error' });
      return;
    }

    try {
      await apiRequest('post', '/email/resend-verification', { email: formData.email });
      setToast({ message: 'Verification email sent! Please check your inbox.', type: 'success' });
      setCanResendVerification(false);
    } catch (error) {
      setToast({
        message: error.response?.data?.detail || 'Failed to resend verification email',
        type: 'error'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-100 py-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-xl shadow-2xl p-8 border border-blue-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-blue-600 mb-2 drop-shadow">Welcome Back</h1>
            <p className="text-purple-500">Sign in to your LaunchKart account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter your email"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter your password"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Forgot password?
              </button>
            </div>

            {canResendVerification && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 mb-2">
                  Email not verified?
                </p>
                <button
                  type="button"
                  onClick={resendVerificationEmail}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Resend verification email
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 hover:text-blue-800">
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              onClick={() => handleGoogleLogin()}
              className="mt-4 w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continue with Google</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Reset Password</h2>
            <p className="text-gray-600 mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleForgotPassword}>
              <input
                type="email"
                value={formData.email}
                onChange={handleChange}
                name="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                placeholder="Enter your email"
              />
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                >
                  Send Reset Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  async function handleGoogleLogin() {
    try {
      const response = await apiRequest('get', '/auth/login-redirect');

      // For the mock implementation, we'll directly call the callback endpoint
      const callbackResponse = await apiRequest('get', response.data.auth_url);

      if (callbackResponse.data.token) {
        setUser(callbackResponse.data.user);
        sessionStorage.setItem('user', JSON.stringify(callbackResponse.data.user));
        sessionStorage.setItem('token', callbackResponse.data.token); // store as plain string
        setToast({ message: 'Google login successful!', type: 'success' });
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (error) {
      console.error('Google login error:', error);
      setToast({ message: 'Google login failed', type: 'error' });
    }
  }
};

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-100">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <div className="flex justify-center items-center space-x-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-extrabold text-2xl drop-shadow">LK</span>
              </div>
              <h1 className="text-5xl font-extrabold text-pink-500 drop-shadow">LaunchKart</h1>
            </div>
            <p className="text-xl text-purple-500 mb-8 max-w-3xl mx-auto">
              Empowering early-stage entrepreneurs in India & UAE with business essentials,
              expert mentorship, and investment opportunities. Your startup journey starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-pink-500 via-blue-500 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-bold shadow hover:from-pink-600 hover:to-purple-700 transition-all duration-300"
              >
                Get Started Now
              </button>
              <button
                onClick={() => navigate('/login')}
                className="bg-white text-pink-500 border border-pink-300 px-8 py-4 rounded-full text-lg font-bold hover:bg-pink-50 transition-all duration-300"
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-gradient-to-br from-white via-pink-50 to-purple-50 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow border border-pink-100">
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

            <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow border border-blue-100">
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

            <div className="bg-gradient-to-br from-white via-purple-50 to-pink-50 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow border border-purple-100">
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

          {/* Stats Section */}
          <div className="bg-gradient-to-br from-white via-pink-50 to-purple-50 rounded-xl shadow-lg p-8 mb-20 border border-pink-100">
            <h2 className="text-3xl font-bold text-center mb-12">Trusted by Entrepreneurs</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-500 mb-2">500+</div>
                <div className="text-gray-600">Startups Launched</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">₹50M+</div>
                <div className="text-gray-600">Funding Raised</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">100+</div>
                <div className="text-gray-600">Expert Mentors</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-500 mb-2">2</div>
                <div className="text-gray-600">Countries</div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-pink-500 via-blue-500 to-purple-600 text-white rounded-xl p-12 shadow-lg">
            <h2 className="text-3xl font-bold mb-4">Ready to Launch Your Startup?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of entrepreneurs who are building the future with LaunchKart
            </p>
            <button
              onClick={handleGetStarted}
              className="bg-white text-pink-500 px-8 py-4 rounded-full text-lg font-bold shadow hover:bg-pink-50 transition-all duration-300"
            >
              Start Your Journey Today
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { setUser } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const sessionId = window.location.hash.split('session_id=')[1];
      if (sessionId) {
        try {
          const response = await apiRequest('post', '/auth/google-profile', {}, {
            headers: { 'X-Session-ID': sessionId }
          });
          setUser(response.data.user);
          sessionStorage.setItem('user', JSON.stringify(response.data.user));
          navigate('/dashboard');
        } catch (error) {
          console.error('Authentication failed:', error);
          navigate('/');
        }
      }
    };

    handleAuth();
  }, [setUser, navigate]);

  return <LoadingSpinner />;
};

const Dashboard = () => {
  const { user } = useUser();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEssentialsBanner, setShowEssentialsBanner] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiRequest('get', '/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto bg-gradient-to-br from-white via-pink-50 to-purple-50 rounded-xl shadow-lg p-4 sm:p-8">
      {showEssentialsBanner && (
        <div className="flex items-center justify-between bg-gradient-to-r from-pink-500 via-blue-500 to-purple-600 text-white rounded-xl px-6 py-4 mb-6 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎁</span>
            <span className="font-semibold">Get your <span className="underline">Free Business Essentials</span> now!</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setShowEssentialsBanner(false);
                navigate('/services?tab=business-essentials');
              }}
              className="bg-white text-pink-500 font-bold px-4 py-2 rounded-full shadow hover:bg-pink-50 transition-all duration-300"
            >
              Claim Now
            </button>
            <button
              onClick={() => setShowEssentialsBanner(false)}
              className="text-white hover:text-gray-200 text-xl px-2"
              aria-label="Close banner"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.fullName || user.name}!
        </h1>
        <p className="text-gray-600">
          {user.role === 'founder' && 'Ready to build your startup empire?'}
          {user.role === 'mentor' && 'Ready to guide the next generation of entrepreneurs?'}
          {user.role === 'investor' && 'Ready to discover promising investment opportunities?'}
          {user.role === 'admin' && 'Ready to manage the platform?'}
        </p>
      </div>

      {/* KYC Status Banner */}
      {user.kyc_level === 'none' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                Complete your KYC verification to access all features.{' '}
                <Link to="/kyc" className="font-medium underline">
                  Complete KYC
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Service Requests</h3>
          <p className="text-3xl font-bold text-blue-600">
            {dashboardData?.stats?.total_services || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Mentorship Sessions</h3>
          <p className="text-3xl font-bold text-green-600">
            {dashboardData?.stats?.total_sessions || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Applications</h3>
          <p className="text-3xl font-bold text-purple-600">
            {dashboardData?.stats?.total_applications || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Completed</h3>
          <p className="text-3xl font-bold text-orange-600">
            {dashboardData?.stats?.completed_services || 0}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/services" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left block">
            <h3 className="font-semibold mb-2">Request Service</h3>
            <p className="text-sm text-gray-600">Get professional help</p>
          </Link>
          <Link to="/mentors" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left block">
            <h3 className="font-semibold mb-2">Find Mentor</h3>
            <p className="text-sm text-gray-600">Connect with experts</p>
          </Link>
          {user.role === 'founder' && (
            <Link to="/investment" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left block">
              <h3 className="font-semibold mb-2">Apply for Funding</h3>
              <p className="text-sm text-gray-600">Get investment</p>
            </Link>
          )}
          <Link to="/analytics" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left block">
            <h3 className="font-semibold mb-2">View Analytics</h3>
            <p className="text-sm text-gray-600">Track your progress</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div>
              <p className="font-medium">Account created</p>
              <p className="text-sm text-gray-600">Welcome to LaunchKart!</p>
            </div>
          </div>
          {dashboardData?.service_requests?.length > 0 && (
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium">Service request submitted</p>
                <p className="text-sm text-gray-600">Your request is being processed</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user } = useUser();

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-100 flex">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64">
        <Header />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  axios.interceptors.request.use(config => {
    console.log('Outgoing request:', config.url, config.headers.Authorization);
    return config;
  });

  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<><Header /><LandingPage /></>} />
          <Route path="/login" element={<><Header /><LoginPage /></>} />
          <Route path="/signup" element={<><Header /><SignupPage /></>} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/kyc" element={
            <ProtectedRoute>
              <KYCFlow />
            </ProtectedRoute>
          } />
          <Route path="/services" element={
            <ProtectedRoute>
              <ServicesMarketplace />
            </ProtectedRoute>
          } />
          <Route path="/mentors" element={
            <ProtectedRoute>
              <MentorshipSystem />
            </ProtectedRoute>
          } />
          <Route path="/investment" element={
            <ProtectedRoute>
              <InvestmentSyndicate />
            </ProtectedRoute>
          } />
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </UserProvider>
  );
};

export default App;