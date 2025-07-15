import React, { useState, useEffect } from 'react';
import { apiRequest } from '../App';
import { useAdmin } from './AdminDashboard';

const InvestmentManagement = ({ onMenuClick }) => {
  const [pitches, setPitches] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [dealFlow, setDealFlow] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pitches');
  const [selectedPitch, setSelectedPitch] = useState(null);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const { adminUser } = useAdmin();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pitchesResponse, investorsResponse, dealFlowResponse] = await Promise.all([
        apiRequest('get', '/admin/investment/pitches', null, {
          headers: { Authorization: `Bearer ${sessionStorage.getItem('admin_token')}` }
        }),
        apiRequest('get', '/admin/investment/investors', null, {
          headers: { Authorization: `Bearer ${sessionStorage.getItem('admin_token')}` }
        }),
        apiRequest('get', '/admin/investment/deal-flow', null, {
          headers: { Authorization: `Bearer ${sessionStorage.getItem('admin_token')}` }
        })
      ]);
      
      setPitches(pitchesResponse.data);
      setInvestors(investorsResponse.data);
      setDealFlow(dealFlowResponse.data);
    } catch (error) {
      console.error('Failed to fetch investment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePitchStatus = async (pitchId, status, reviewNotes = '') => {
    try {
      await apiRequest('put', `/admin/investment/pitch/${pitchId}/review`, {
        review_status: status,
        review_notes: reviewNotes,
        reviewed_by: adminUser.id
      }, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('admin_token')}` }
      });
      
      setPitches(prev => 
        prev.map(pitch => 
          pitch.id === pitchId 
            ? { ...pitch, review_status: status, review_notes: reviewNotes }
            : pitch
        )
      );
    } catch (error) {
      console.error('Failed to update pitch status:', error);
      alert('Failed to update pitch status');
    }
  };

  const assignInvestor = async (pitchId, investorId) => {
    try {
      await apiRequest('put', `/admin/investment/pitch/${pitchId}/assign`, {
        investor_id: investorId,
        assigned_by: adminUser.id
      }, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('admin_token')}` }
      });
      
      setPitches(prev => 
        prev.map(pitch => 
          pitch.id === pitchId 
            ? { ...pitch, assigned_investor: investorId }
            : pitch
        )
      );
    } catch (error) {
      console.error('Failed to assign investor:', error);
      alert('Failed to assign investor');
    }
  };

  const viewFile = (file, fileName) => {
    setSelectedFile({ data: file, name: fileName });
    setShowFileModal(true);
  };

  const downloadFile = (fileData, fileName) => {
    const byteCharacters = atob(fileData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'funded': return 'bg-purple-100 text-purple-800';
      case 'due_diligence': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPitches = pitches.filter(pitch => {
    const matchesSearch = pitch.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pitch.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pitch.industry?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pitch.review_status === statusFilter;
    const matchesIndustry = industryFilter === 'all' || pitch.industry === industryFilter;
    return matchesSearch && matchesStatus && matchesIndustry;
  });

  const industries = [...new Set(pitches.map(p => p.industry))];

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
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Investment Management</h1>
                <p className="text-gray-600 hidden sm:block">Manage pitch submissions and investor relations</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchData}
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

      {/* Tabs */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('pitches')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'pitches' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Pitch Submissions ({pitches.length})
              </button>
              <button
                onClick={() => setActiveTab('investors')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'investors' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Investors ({investors.length})
              </button>
              <button
                onClick={() => setActiveTab('dealflow')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'dealflow' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Deal Flow ({dealFlow.length})
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'analytics' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>

          {/* Filters */}
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="funded">Funded</option>
                  <option value="due_diligence">Due Diligence</option>
                </select>
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Industries</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Search pitches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content Based on Active Tab */}
        {activeTab === 'pitches' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Founder
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Industry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Funding
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
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
                  {filteredPitches.map((pitch) => (
                    <tr key={pitch.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center">
                              <span className="text-white font-medium">
                                {pitch.company_name?.charAt(0) || '?'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {pitch.company_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {pitch.stage}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{pitch.user_name}</div>
                        <div className="text-sm text-gray-500">{pitch.user_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {pitch.industry}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${pitch.funding_amount?.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {pitch.equity_offering}% equity
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(pitch.review_status)}`}>
                          {pitch.review_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(pitch.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedPitch(pitch)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Review
                          </button>
                          {pitch.review_status === 'under_review' && (
                            <>
                              <button
                                onClick={() => updatePitchStatus(pitch.id, 'approved')}
                                className="text-green-600 hover:text-green-800"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updatePitchStatus(pitch.id, 'rejected')}
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
        )}

        {activeTab === 'investors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {investors.map((investor) => (
              <div key={investor.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {investor.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">{investor.name}</h3>
                      <p className="text-sm text-gray-500">{investor.firm}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedInvestor(investor)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Focus:</span>
                    <span className="text-sm font-medium">{investor.focus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ticket Size:</span>
                    <span className="text-sm font-medium">{investor.ticket_size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Deals:</span>
                    <span className="text-sm font-medium">{investor.active_deals || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'dealflow' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Deal Flow Pipeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {['Under Review', 'Due Diligence', 'Term Sheet', 'Funded'].map((stage) => (
                <div key={stage} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">{stage}</h4>
                  <div className="space-y-2">
                    {dealFlow
                      .filter(deal => deal.stage === stage.toLowerCase().replace(' ', '_'))
                      .map((deal) => (
                        <div key={deal.id} className="bg-white p-3 rounded border">
                          <div className="text-sm font-medium">{deal.company_name}</div>
                          <div className="text-xs text-gray-500">${deal.amount?.toLocaleString()}</div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Pitch Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Pitches</span>
                  <span className="font-semibold">{pitches.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Under Review</span>
                  <span className="font-semibold text-yellow-600">
                    {pitches.filter(p => p.review_status === 'under_review').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Approved</span>
                  <span className="font-semibold text-green-600">
                    {pitches.filter(p => p.review_status === 'approved').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Funded</span>
                  <span className="font-semibold text-purple-600">
                    {pitches.filter(p => p.review_status === 'funded').length}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Funding Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Requested</span>
                  <span className="font-semibold">
                    ${pitches.reduce((sum, p) => sum + (p.funding_amount || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Ask</span>
                  <span className="font-semibold">
                    ${Math.round(pitches.reduce((sum, p) => sum + (p.funding_amount || 0), 0) / pitches.length).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold text-green-600">
                    {Math.round((pitches.filter(p => p.review_status === 'funded').length / pitches.length) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Top Industries</h3>
              <div className="space-y-2">
                {industries.slice(0, 5).map((industry) => (
                  <div key={industry} className="flex justify-between">
                    <span className="text-gray-600">{industry}</span>
                    <span className="font-semibold">
                      {pitches.filter(p => p.industry === industry).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pitch Detail Modal */}
      {selectedPitch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Pitch Review - {selectedPitch.company_name}</h2>
              <button
                onClick={() => setSelectedPitch(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Company Details</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Company:</strong> {selectedPitch.company_name}</p>
                  <p><strong>Industry:</strong> {selectedPitch.industry}</p>
                  <p><strong>Stage:</strong> {selectedPitch.stage}</p>
                  <p><strong>Funding Amount:</strong> ${selectedPitch.funding_amount?.toLocaleString()}</p>
                  <p><strong>Equity Offered:</strong> {selectedPitch.equity_offering}%</p>
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedPitch.review_status)}`}>
                      {selectedPitch.review_status}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Founder Information</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {selectedPitch.user_name}</p>
                  <p><strong>Email:</strong> {selectedPitch.user_email}</p>
                  <p><strong>Phone:</strong> {selectedPitch.phone_number || 'Not provided'}</p>
                  <p><strong>Country:</strong> {selectedPitch.country}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Business Overview</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong>Problem:</strong>
                    <p className="text-gray-600 mt-1">{selectedPitch.problem || 'Not provided'}</p>
                  </div>
                  <div>
                    <strong>Solution:</strong>
                    <p className="text-gray-600 mt-1">{selectedPitch.solution || 'Not provided'}</p>
                  </div>
                  <div>
                    <strong>Market Size:</strong>
                    <p className="text-gray-600 mt-1">{selectedPitch.market_size || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Documents</h3>
                <div className="space-y-2">
                  {selectedPitch.files?.pitch_deck && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Pitch Deck</span>
                      <button
                        onClick={() => downloadFile(selectedPitch.files.pitch_deck, 'pitch_deck.pdf')}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Download
                      </button>
                    </div>
                  )}
                  {selectedPitch.files?.business_plan && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Business Plan</span>
                      <button
                        onClick={() => downloadFile(selectedPitch.files.business_plan, 'business_plan.pdf')}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Download
                      </button>
                    </div>
                  )}
                  {selectedPitch.files?.financial_projections && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Financial Projections</span>
                      <button
                        onClick={() => downloadFile(selectedPitch.files.financial_projections, 'financial_projections.pdf')}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Download
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedPitch.review_notes && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Review Notes</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {selectedPitch.review_notes}
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <div>
                <select
                  onChange={(e) => assignInvestor(selectedPitch.id, e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Assign to Investor</option>
                  {investors.map(investor => (
                    <option key={investor.id} value={investor.id}>{investor.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedPitch(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
                {selectedPitch.review_status === 'under_review' && (
                  <>
                    <button
                      onClick={() => updatePitchStatus(selectedPitch.id, 'approved')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updatePitchStatus(selectedPitch.id, 'rejected')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Investor Detail Modal */}
      {selectedInvestor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Investor Details</h2>
              <button
                onClick={() => setSelectedInvestor(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600">Name:</label>
                  <p className="font-medium">{selectedInvestor.name}</p>
                </div>
                <div>
                  <label className="text-gray-600">Firm:</label>
                  <p className="font-medium">{selectedInvestor.firm}</p>
                </div>
                <div>
                  <label className="text-gray-600">Focus:</label>
                  <p className="font-medium">{selectedInvestor.focus}</p>
                </div>
                <div>
                  <label className="text-gray-600">Ticket Size:</label>
                  <p className="font-medium">{selectedInvestor.ticket_size}</p>
                </div>
              </div>

              <div>
                <label className="text-gray-600">Bio:</label>
                <p className="bg-gray-50 p-3 rounded-lg">{selectedInvestor.bio || 'No bio provided'}</p>
              </div>

              <div>
                <label className="text-gray-600">Portfolio:</label>
                <div className="flex flex-wrap gap-2">
                  {selectedInvestor.portfolio?.map((company, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {company}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedInvestor(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentManagement;