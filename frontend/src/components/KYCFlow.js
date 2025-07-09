import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';

const KYCFlow = () => {
  const { user } = useUser();
  const [kycStatus, setKycStatus] = useState(null);
  const [currentStep, setCurrentStep] = useState('status');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({});
  const [documents, setDocuments] = useState({});

  // Tier 1 specific states
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [panImage, setPanImage] = useState(null);
  const [emiratesIdImage, setEmiratesIdImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);

  // Tier 2 specific states
  const [fullKycSession, setFullKycSession] = useState(null);

  // Remove initiateTier1KYC and instead use a form for basic KYC
  const [basicKycForm, setBasicKycForm] = useState({
    document_type: '',
    document_number: '',
    document_file: null,
  });

  const handleBasicKycInput = (e) => {
    const { name, value } = e.target;
    setBasicKycForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBasicKycFile = (e) => {
    setBasicKycForm((prev) => ({ ...prev, document_file: e.target.files[0] }));
  };

  const submitBasicKyc = async (e) => {
    e.preventDefault();
    if (!basicKycForm.document_type || !basicKycForm.document_number || !basicKycForm.document_file) {
      showToast('Please fill all fields and upload a document', 'error');
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('document_type', basicKycForm.document_type);
      formData.append('document_number', basicKycForm.document_number);
      formData.append('document_file', basicKycForm.document_file);
      await axios.post(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api/kyc/basic`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('Basic KYC submitted successfully', 'success');
      fetchKycStatus();
      setCurrentStep('tier1-complete');
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to submit KYC', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const fetchKycStatus = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api/kyc/status`);
      // Map backend keys to frontend expected keys
      const mapped = {
        ...response.data,
        current_level: response.data.kyc_level,
        current_status: response.data.kyc_status,
      };
      setKycStatus(mapped);

      // Determine current step based on status
      if (mapped.current_level === 'none') {
        setCurrentStep('tier1-initiate');
      } else if (mapped.current_level === 'basic') {
        setCurrentStep('tier1-complete');
      } else if (mapped.current_level === 'full') {
        setCurrentStep('tier2-complete');
      }
    } catch (error) {
      console.error('Failed to fetch KYC status:', error);
      setToast({ message: 'Failed to fetch KYC status', type: 'error' });
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const sendAadhaarOTP = async () => {
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      showToast('Please enter a valid 12-digit Aadhaar number', 'error');
      return;
    }

    try {
      setLoading(true);
      // In a real implementation, you would call HyperVerge API to send OTP
      // For demo purposes, we'll simulate this
      setOtpSent(true);
      showToast('OTP sent to your registered mobile number', 'success');
    } catch (error) {
      showToast('Failed to send OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const verifyAadhaarOTP = async () => {
    if (!otp || otp.length !== 6) {
      showToast('Please enter a valid 6-digit OTP', 'error');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('aadhaar_number', aadhaarNumber);
      formData.append('otp', otp);

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/kyc/tier1/verify-aadhaar`,
        formData
      );

      if (response.data.success) {
        showToast('Aadhaar verified successfully', 'success');
        setCurrentStep('tier1-pan');
      } else {
        showToast(response.data.error_message || 'Aadhaar verification failed', 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.detail || 'Aadhaar verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const verifyPAN = async () => {
    if (!panImage) {
      showToast('Please upload your PAN card image', 'error');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('pan_image', panImage);

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/kyc/tier1/verify-pan`,
        formData
      );

      if (response.data.success) {
        showToast('PAN verified successfully', 'success');
        setCurrentStep('tier1-complete');
        fetchKycStatus();
      } else {
        showToast(response.data.error_message || 'PAN verification failed', 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.detail || 'PAN verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const verifyEmiratesId = async () => {
    if (!emiratesIdImage || !selfieImage) {
      showToast('Please upload both Emirates ID and selfie images', 'error');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('emirates_id_image', emiratesIdImage);
      formData.append('selfie_image', selfieImage);

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/kyc/tier1/verify-emirates-id`,
        formData
      );

      if (response.data.success) {
        showToast('Emirates ID verified successfully', 'success');
        setCurrentStep('tier1-complete');
        fetchKycStatus();
      } else {
        showToast(response.data.error_message || 'Emirates ID verification failed', 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.detail || 'Emirates ID verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const initiateTier2KYC = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/kyc/tier2/initiate`);
      setFullKycSession(response.data);
      setCurrentStep('tier2-video');
      showToast('Full KYC session initiated', 'success');
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to initiate Full KYC', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event, setter) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('Please upload a valid image file', 'error');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be less than 5MB', 'error');
        return;
      }

      setter(file);
    }
  };

  const renderProgressBar = () => {
    const steps = [
      { key: 'tier1-initiate', label: 'Basic KYC', completed: kycStatus?.current_level !== 'none' },
      { key: 'tier1-complete', label: 'Documents', completed: kycStatus?.current_level === 'basic' || kycStatus?.current_level === 'full' },
      { key: 'tier2-initiate', label: 'Full KYC', completed: kycStatus?.current_level === 'full' },
      { key: 'tier2-complete', label: 'Complete', completed: kycStatus?.current_level === 'full' }
    ];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                {step.completed ? '✓' : index + 1}
              </div>
              <span className={`ml-2 text-sm font-medium ${step.completed ? 'text-green-600' : 'text-gray-500'
                }`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 ml-4 ${step.completed ? 'bg-green-500' : 'bg-gray-200'
                  }`}></div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderKycStatus = () => (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">KYC Verification Status</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-semibold">Current Level</h3>
            <p className="text-sm text-gray-600">
              {kycStatus?.current_level === 'none' && 'No KYC completed'}
              {kycStatus?.current_level === 'basic' && 'Basic KYC completed'}
              {kycStatus?.current_level === 'full' && 'Full KYC completed'}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${kycStatus?.current_status === 'verified' ? 'bg-green-100 text-green-800' :
            kycStatus?.current_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
            {kycStatus?.current_status}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">Features Unlocked</h4>
            <ul className="text-sm space-y-1">
              <li className={`flex items-center ${kycStatus?.features_unlocked?.dashboard_access ? 'text-green-600' : 'text-gray-400'}`}>
                <span className="mr-2">{kycStatus?.features_unlocked?.dashboard_access ? '✓' : '○'}</span>
                Dashboard Access
              </li>
              <li className={`flex items-center ${kycStatus?.features_unlocked?.free_services ? 'text-green-600' : 'text-gray-400'}`}>
                <span className="mr-2">{kycStatus?.features_unlocked?.free_services ? '✓' : '○'}</span>
                Free Services
              </li>
              <li className={`flex items-center ${kycStatus?.features_unlocked?.investment_tools ? 'text-green-600' : 'text-gray-400'}`}>
                <span className="mr-2">{kycStatus?.features_unlocked?.investment_tools ? '✓' : '○'}</span>
                Investment Tools
              </li>
              <li className={`flex items-center ${kycStatus?.features_unlocked?.funding_access ? 'text-green-600' : 'text-gray-400'}`}>
                <span className="mr-2">{kycStatus?.features_unlocked?.funding_access ? '✓' : '○'}</span>
                Funding Access
              </li>
            </ul>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">Next Steps</h4>
            <ul className="text-sm space-y-1">
              {kycStatus?.next_steps?.map((step, index) => (
                <li key={index} className="text-gray-600">• {step}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'status':
        return renderKycStatus();
      case 'tier1-initiate':
        return renderTier1Initiate(user, loading);
      case 'tier1-aadhaar':
        return renderTier1Aadhaar();
      case 'tier1-pan':
        return renderTier1Pan();
      case 'tier1-emirates':
        return renderTier1Emirates();
      case 'tier1-complete':
        return renderTier1Complete();
      case 'tier2-initiate':
        return renderTier2Initiate();
      case 'tier2-video':
        return renderTier2Video();
      case 'tier2-complete':
        return renderTier2Complete();
      default:
        return renderKycStatus();
    }
  };

  // Move renderTier1Initiate inside the component
  const renderTier1Initiate = (user, loading) => (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Basic KYC Verification</h2>
      <p className="text-gray-600 mb-6">
        Complete basic KYC to access your dashboard and free business services.
      </p>
      <form onSubmit={submitBasicKyc} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
          <select
            name="document_type"
            value={basicKycForm.document_type}
            onChange={handleBasicKycInput}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select document type</option>
            {user.country === 'India' && <>
              <option value="aadhaar">Aadhaar</option>
              <option value="pan">PAN</option>
            </>}
            {user.country === 'UAE' && <>
              <option value="emirates_id">Emirates ID</option>
            </>}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Document Number</label>
          <input
            type="text"
            name="document_number"
            value={basicKycForm.document_number}
            onChange={handleBasicKycInput}
            placeholder="Enter document number"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Document</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleBasicKycFile}
            className="w-full"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Basic KYC'}
        </button>
      </form>
    </div>
  );

  const renderTier1Aadhaar = () => (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Aadhaar Verification</h2>
      <p className="text-gray-600 mb-6">
        Enter your 12-digit Aadhaar number to receive OTP on your registered mobile.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Aadhaar Number
          </label>
          <input
            type="text"
            value={aadhaarNumber}
            onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
            placeholder="Enter 12-digit Aadhaar number"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {!otpSent ? (
          <button
            onClick={sendAadhaarOTP}
            disabled={loading || aadhaarNumber.length !== 12}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => { setOtpSent(false); setOtp(''); }}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                Resend OTP
              </button>
              <button
                onClick={verifyAadhaarOTP}
                disabled={loading || otp.length !== 6}
                className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderTier1Pan = () => (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">PAN Card Verification</h2>
      <p className="text-gray-600 mb-6">
        Upload a clear image of your PAN card for verification.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PAN Card Image
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, setPanImage)}
              className="hidden"
              id="pan-upload"
            />
            <label htmlFor="pan-upload" className="cursor-pointer">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                {panImage ? panImage.name : 'Click to upload PAN card image'}
              </p>
            </label>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold mb-2">Image Requirements:</h3>
          <ul className="text-sm space-y-1">
            <li>• Clear, well-lit image</li>
            <li>• All text should be readable</li>
            <li>• No shadows or glare</li>
            <li>• Maximum file size: 5MB</li>
          </ul>
        </div>

        <button
          onClick={verifyPAN}
          disabled={loading || !panImage}
          className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify PAN Card'}
        </button>
      </div>
    </div>
  );

  const renderTier1Emirates = () => (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Emirates ID Verification</h2>
      <p className="text-gray-600 mb-6">
        Upload clear images of your Emirates ID and take a selfie for facial recognition.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Emirates ID Image
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, setEmiratesIdImage)}
              className="hidden"
              id="emirates-upload"
            />
            <label htmlFor="emirates-upload" className="cursor-pointer">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                {emiratesIdImage ? emiratesIdImage.name : 'Click to upload Emirates ID'}
              </p>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selfie Image
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, setSelfieImage)}
              className="hidden"
              id="selfie-upload"
            />
            <label htmlFor="selfie-upload" className="cursor-pointer">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                {selfieImage ? selfieImage.name : 'Click to upload selfie'}
              </p>
            </label>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold mb-2">Image Requirements:</h3>
          <ul className="text-sm space-y-1">
            <li>• Clear, well-lit images</li>
            <li>• Face should be clearly visible in selfie</li>
            <li>• No shadows or glare</li>
            <li>• Maximum file size: 5MB each</li>
          </ul>
        </div>

        <button
          onClick={verifyEmiratesId}
          disabled={loading || !emiratesIdImage || !selfieImage}
          className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify Emirates ID'}
        </button>
      </div>
    </div>
  );

  const renderTier1Complete = () => (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Basic KYC Complete!</h2>
        <p className="text-gray-600">
          You can now access your dashboard and use free business services.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold mb-2">✅ Features Now Available:</h3>
          <ul className="text-sm space-y-1">
            <li>• Complete dashboard access</li>
            <li>• Free business essentials (logo, website, etc.)</li>
            <li>• Mentor connections</li>
            <li>• Professional service requests</li>
          </ul>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">🚀 Want More Features?</h3>
          <p className="text-sm mb-2">
            Complete Full KYC to access investment tools and funding opportunities.
          </p>
          <button
            onClick={() => setCurrentStep('tier2-initiate')}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Learn about Full KYC →
          </button>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => setCurrentStep('tier2-initiate')}
            className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600"
          >
            Start Full KYC
          </button>
        </div>
      </div>
    </div>
  );

  const renderTier2Initiate = () => (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Full KYC Verification</h2>
      <p className="text-gray-600 mb-6">
        Complete full KYC to access investment tools and funding opportunities.
      </p>

      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">What's included:</h3>
          <ul className="text-sm space-y-1">
            <li>• Video KYC session with expert</li>
            <li>• Advanced biometric verification</li>
            <li>• Background check and AML screening</li>
            <li>• Risk assessment profile</li>
          </ul>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold mb-2">Requirements ({user.country}):</h3>
          {user.country === 'India' ? (
            <ul className="text-sm space-y-1">
              <li>• Passport (for international verification)</li>
              <li>• PAN card (already verified)</li>
              <li>• Stable internet connection</li>
              <li>• 15-20 minutes for video call</li>
            </ul>
          ) : (
            <ul className="text-sm space-y-1">
              <li>• Passport</li>
              <li>• Emirates ID (already verified)</li>
              <li>• Stable internet connection</li>
              <li>• 15-20 minutes for video call</li>
            </ul>
          )}
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold mb-2">🎯 Unlocks:</h3>
          <ul className="text-sm space-y-1">
            <li>• Investment pitch submission</li>
            <li>• Access to investor network</li>
            <li>• Advanced financial tools</li>
            <li>• Higher service limits</li>
          </ul>
        </div>

        <button
          onClick={initiateTier2KYC}
          disabled={loading}
          className="w-full bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? 'Initiating...' : 'Start Full KYC'}
        </button>
      </div>
    </div>
  );

  const renderTier2Video = () => (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Video KYC Session</h2>
      <p className="text-gray-600 mb-6">
        Complete your video KYC session with our verification partner.
      </p>

      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Session Details:</h3>
          <ul className="text-sm space-y-1">
            <li>• Session ID: {fullKycSession?.session_id}</li>
            <li>• Duration: 15-20 minutes</li>
            <li>• Expires: {fullKycSession?.expires_at}</li>
          </ul>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold mb-2">Before you start:</h3>
          <ul className="text-sm space-y-1">
            {fullKycSession?.instructions?.[user.country.toLowerCase()]?.map((instruction, index) => (
              <li key={index}>• {instruction}</li>
            ))}
          </ul>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => window.open(fullKycSession?.session_url, '_blank')}
            className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600"
          >
            Start Video KYC
          </button>
          <button
            onClick={() => setCurrentStep('tier2-initiate')}
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            After completing the video session, you'll receive an email confirmation.
            The verification process usually takes 24-48 hours.
          </p>
        </div>
      </div>
    </div>
  );

  const renderTier2Complete = () => (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Full KYC Complete!</h2>
        <p className="text-gray-600">
          You now have access to all LaunchKart features including investment tools.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold mb-2">🎉 All Features Unlocked:</h3>
          <ul className="text-sm space-y-1">
            <li>• Investment pitch submission</li>
            <li>• Direct investor connections</li>
            <li>• Advanced financial analytics</li>
            <li>• Premium service tiers</li>
            <li>• Priority mentor access</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => window.location.href = '/investment'}
            className="bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600"
          >
            Apply for Funding
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
          <div className="flex items-center justify-between">
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-4 text-white hover:text-gray-200">
              ×
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">KYC Verification</h1>
            <p className="text-gray-600">
              Complete your identity verification to unlock all LaunchKart features
            </p>
          </div>

          {kycStatus && renderProgressBar()}
          {renderCurrentStep()}

          <div className="mt-8 p-4 bg-white rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-2">
              Having trouble with verification? Our support team is here to help.
            </p>
            <div className="flex space-x-4">
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Contact Support
              </button>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View FAQ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCFlow