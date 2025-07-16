import React, { useState, useEffect } from 'react';
import { apiRequest } from '../App';
import { useAdmin } from './AdminDashboard';

const KYCManagement = ({ onMenuClick }) => {
  const [kycSubmissions, setKycSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const { adminUser } = useAdmin();

  useEffect(() => {
    fetchKYCSubmissions();
  }, []);

  const fetchKYCSubmissions = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('get', '/admin/kyc/submissions', null, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('admin_token')}` }
      });
      setKycSubmissions(response.data);
    } catch (error) {
      console.error('Failed to fetch KYC submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateKYCStatus = async (userId, status, reviewNotes = '') => {
    try {
      await apiRequest('put', `/admin/kyc/review/${userId}`, {
        status,
        review_notes: reviewNotes,
        reviewed_by: adminUser.id
      }, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('admin_token')}` }
      });
      
      // Update local state
      setKycSubmissions(prev => 
        prev.map(submission => 
          submission.user_id === userId 
            ? { ...submission, kyc_status: status, review_notes: reviewNotes }
            : submission
        )
      );
      
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to update KYC status:', error);
      alert('Failed to update KYC status');
    }
  };

  const viewDocument = (document) => {
    setSelectedDocument(document);
    setShowDocumentModal(true);
  };

  const filteredSubmissions = kycSubmissions.filter(submission => {
    const matchesFilter = filter === 'all' || submission.kyc_status === filter;
    const matchesSearch = submission.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.user_id?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'full': return 'bg-purple-100 text-purple-800';
      case 'none': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">KYC Management</h1>
                <p className="text-gray-600 hidden sm:block">Review and approve user identity verifications</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 lg:space-x-4">
              <span className="text-sm text-gray-500 hidden sm:block">
                {filteredSubmissions.length} submissions
              </span>
              <button
                onClick={fetchKYCSubmissions}
                className="bg-blue-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters and Search */}
      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Submissions</option>
                <option value="pending">Pending Review</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Status:</span>
                <div className="flex space-x-2">
                  {[
                    { status: 'pending', count: kycSubmissions.filter(s => s.kyc_status === 'pending').length },
                    { status: 'verified', count: kycSubmissions.filter(s => s.kyc_status === 'verified').length },
                    { status: 'rejected', count: kycSubmissions.filter(s => s.kyc_status === 'rejected').length }
                  ].map(({ status, count }) => (
                    <span key={status} className={`px-2 py-1 rounded-full text-xs ${getStatusColor(status)}`}>
                      {status}: {count}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search by name, email, or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
          </div>
        </div>

        {/* KYC Submissions Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    KYC Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {submission.user_name?.charAt(0) || '?'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {submission.user_name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.user_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(submission.kyc_level)}`}>
                        {submission.kyc_level || 'none'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(submission.kyc_status)}`}>
                        {submission.kyc_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {submission.country || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-2">
                        {submission.documents && submission.documents.map((doc, index) => (
                          <button
                            key={index}
                            onClick={() => viewDocument(doc)}
                            className="text-blue-600 hover:text-blue-800 text-xs bg-blue-50 px-2 py-1 rounded"
                          >
                            {doc.document_type}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(submission.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedUser(submission)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Review
                        </button>
                        {submission.kyc_status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateKYCStatus(submission.user_id, 'verified')}
                              className="text-green-600 hover:text-green-800"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateKYCStatus(submission.user_id, 'rejected')}
                              className="text-red-600 hover:text-red-800"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Review Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">KYC Review - {selectedUser.user_name}</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">User Information</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {selectedUser.user_name}</p>
                  <p><strong>Email:</strong> {selectedUser.user_email}</p>
                  <p><strong>Phone:</strong> {selectedUser.phone_number || 'Not provided'}</p>
                  <p><strong>Country:</strong> {selectedUser.country}</p>
                  <p><strong>Business Stage:</strong> {selectedUser.business_stage || 'Not provided'}</p>
                  <p><strong>KYC Level:</strong> 
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getLevelColor(selectedUser.kyc_level)}`}>
                      {selectedUser.kyc_level}
                    </span>
                  </p>
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedUser.kyc_status)}`}>
                      {selectedUser.kyc_status}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Submitted Documents</h3>
                <div className="space-y-3">
                  {selectedUser.documents && selectedUser.documents.map((doc, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{doc.document_type}</p>
                          <p className="text-sm text-gray-600">{doc.document_number}</p>
                        </div>
                        <button
                          onClick={() => viewDocument(doc)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {selectedUser.review_notes && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Review Notes</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {selectedUser.review_notes}
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
              {selectedUser.kyc_status === 'pending' && (
                <>
                  <button
                    onClick={() => updateKYCStatus(selectedUser.user_id, 'verified')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approve KYC
                  </button>
                  <button
                    onClick={() => updateKYCStatus(selectedUser.user_id, 'rejected')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Reject KYC
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document View Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Document: {selectedDocument.document_type}</h2>
              <button
                onClick={() => setShowDocumentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center">
              <img
                src={`data:image/jpeg;base64,${selectedDocument.document_data}`}
                alt={selectedDocument.document_type}
                className="max-w-full max-h-96 mx-auto rounded-lg"
              />
              <p className="mt-4 text-sm text-gray-600">
                Document Number: {selectedDocument.document_number}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCManagement;