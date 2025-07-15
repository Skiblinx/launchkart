import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiRequest } from '../App';

const EmailVerification = () => {
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Get token from URL params
  const urlParams = new URLSearchParams(location.search);
  const token = urlParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('Invalid verification link');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await apiRequest('post', '/email/verify', { token });
      
      if (response.data.verified) {
        setStatus('success');
        setMessage('Email verified successfully! You can now sign in.');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login?verified=true');
        }, 3000);
      } else {
        setStatus('error');
        setMessage('Email verification failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.detail || 'Email verification failed');
    }
  };

  const resendVerification = async () => {
    if (!window.lastVerificationEmail) {
      setMessage('No email address found for resending verification');
      return;
    }

    setResending(true);
    try {
      await apiRequest('post', '/email/resend-verification', {
        email: window.lastVerificationEmail
      });
      setMessage('Verification email sent! Please check your inbox.');
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center">
            {status === 'verifying' && (
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
            )}
            {status === 'success' && (
              <div className="bg-green-100 w-full h-full rounded-full flex items-center justify-center">
                <span className="text-4xl">✅</span>
              </div>
            )}
            {status === 'error' && (
              <div className="bg-red-100 w-full h-full rounded-full flex items-center justify-center">
                <span className="text-4xl">❌</span>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {status === 'verifying' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h1>

          <p className={`text-lg ${
            status === 'success' ? 'text-green-600' : 
            status === 'error' ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            {message}
          </p>
        </div>

        {status === 'success' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700">
                🎉 Welcome to LaunchKart! Your account is now active and you can access all features.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
            >
              Continue to Sign In
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 mb-3">
                Your verification link may have expired or is invalid.
              </p>
              {window.lastVerificationEmail && (
                <button
                  onClick={resendVerification}
                  disabled={resending}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  {resending ? 'Sending...' : 'Resend verification email'}
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/signup')}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Sign Up Again
              </button>
              <button
                onClick={() => navigate('/login')}
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Try Sign In
              </button>
            </div>
          </div>
        )}

        {status === 'verifying' && (
          <div className="text-sm text-gray-500">
            Please wait while we verify your email address...
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;