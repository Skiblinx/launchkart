import React, { useState, useEffect } from 'react';
import { apiRequest } from '../App';
import { useAdmin } from './AdminDashboard';

const MentorshipManagement = ({ onMenuClick }) => {
  const [mentors, setMentors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mentors');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { adminUser } = useAdmin();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mentorsResponse, sessionsResponse] = await Promise.all([
        apiRequest('get', '/admin/mentorship/mentors', null, {
          headers: { Authorization: `Bearer ${sessionStorage.getItem('admin_token')}` }
        }),
        apiRequest('get', '/admin/mentorship/sessions', null, {
          headers: { Authorization: `Bearer ${sessionStorage.getItem('admin_token')}` }
        })
      ]);
      
      setMentors(mentorsResponse.data);
      setSessions(sessionsResponse.data);
    } catch (error) {
      console.error('Failed to fetch mentorship data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMentorStatus = async (mentorId, status) => {
    try {
      await apiRequest('put', `/admin/mentorship/mentor/${mentorId}/status`, {
        status,
        updated_by: adminUser.id
      }, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('admin_token')}` }
      });
      
      setMentors(prev => 
        prev.map(mentor => 
          mentor.id === mentorId 
            ? { ...mentor, status }
            : mentor
        )
      );
    } catch (error) {
      console.error('Failed to update mentor status:', error);
      alert('Failed to update mentor status');
    }
  };

  const updateSessionStatus = async (sessionId, status) => {
    try {
      await apiRequest('put', `/admin/mentorship/session/${sessionId}/status`, {
        status,
        updated_by: adminUser.id
      }, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('admin_token')}` }
      });
      
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, status }
            : session
        )
      );
    } catch (error) {
      console.error('Failed to update session status:', error);
      alert('Failed to update session status');
    }
  };

  const sendMentorNotification = async (mentorId, message) => {
    try {
      await apiRequest('post', `/admin/mentorship/mentor/${mentorId}/notify`, {
        message,
        sent_by: adminUser.id
      }, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('admin_token')}` }
      });
      alert('Notification sent successfully');
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('Failed to send notification');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return stars;
  };

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.expertise?.some(exp => exp.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || mentor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.mentor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.mentee_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Mentorship Management</h1>
                <p className="text-gray-600 hidden sm:block">Manage mentors and mentorship sessions</p>
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
                onClick={() => setActiveTab('mentors')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'mentors' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Mentors ({mentors.length})
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'sessions' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Sessions ({sessions.length})
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
                  {activeTab === 'mentors' ? (
                    <>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                    </>
                  ) : (
                    <>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </>
                  )}
                </select>
              </div>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content Based on Active Tab */}
        {activeTab === 'mentors' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mentor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expertise
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sessions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMentors.map((mentor) => (
                    <tr key={mentor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                              <span className="text-white font-medium">
                                {mentor.user_name?.charAt(0) || '?'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {mentor.user_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {mentor.user_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {mentor.expertise?.slice(0, 3).map((skill, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              {skill}
                            </span>
                          ))}
                          {mentor.expertise?.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                              +{mentor.expertise.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex">
                            {getRatingStars(mentor.rating)}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            ({mentor.rating}/5)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {mentor.total_sessions || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(mentor.status)}`}>
                          {mentor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedMentor(mentor)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View
                          </button>
                          {mentor.status === 'pending' && (
                            <button
                              onClick={() => updateMentorStatus(mentor.id, 'active')}
                              className="text-green-600 hover:text-green-800"
                            >
                              Approve
                            </button>
                          )}
                          {mentor.status === 'active' && (
                            <button
                              onClick={() => updateMentorStatus(mentor.id, 'suspended')}
                              className="text-red-600 hover:text-red-800"
                            >
                              Suspend
                            </button>
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

        {activeTab === 'sessions' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Session
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mentor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mentee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheduled
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {session.agenda || 'General Mentorship'}
                        </div>
                        <div className="text-sm text-gray-500">
                          #{session.id.slice(-8)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{session.mentor_name}</div>
                        <div className="text-sm text-gray-500">{session.mentor_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{session.mentee_name}</div>
                        <div className="text-sm text-gray-500">{session.mentee_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(session.scheduled_at).toLocaleDateString()}
                        <div className="text-gray-500">
                          {new Date(session.scheduled_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.duration} min
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedSession(session)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View
                          </button>
                          {session.status === 'scheduled' && (
                            <button
                              onClick={() => updateSessionStatus(session.id, 'cancelled')}
                              className="text-red-600 hover:text-red-800"
                            >
                              Cancel
                            </button>
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

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Mentor Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Mentors</span>
                  <span className="font-semibold">{mentors.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Mentors</span>
                  <span className="font-semibold text-green-600">
                    {mentors.filter(m => m.status === 'active').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending Approval</span>
                  <span className="font-semibold text-yellow-600">
                    {mentors.filter(m => m.status === 'pending').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Suspended</span>
                  <span className="font-semibold text-red-600">
                    {mentors.filter(m => m.status === 'suspended').length}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Session Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Sessions</span>
                  <span className="font-semibold">{sessions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-semibold text-green-600">
                    {sessions.filter(s => s.status === 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Scheduled</span>
                  <span className="font-semibold text-blue-600">
                    {sessions.filter(s => s.status === 'scheduled').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cancelled</span>
                  <span className="font-semibold text-red-600">
                    {sessions.filter(s => s.status === 'cancelled').length}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Top Expertise Areas</h3>
              <div className="space-y-2">
                {[...new Set(mentors.flatMap(m => m.expertise || []))]
                  .slice(0, 5)
                  .map((expertise, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600">{expertise}</span>
                      <span className="font-semibold">
                        {mentors.filter(m => m.expertise?.includes(expertise)).length}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mentor Detail Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Mentor Details</h2>
              <button
                onClick={() => setSelectedMentor(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-gray-600">Name:</label>
                    <p className="font-medium">{selectedMentor.user_name}</p>
                  </div>
                  <div>
                    <label className="text-gray-600">Email:</label>
                    <p className="font-medium">{selectedMentor.user_email}</p>
                  </div>
                  <div>
                    <label className="text-gray-600">Experience:</label>
                    <p className="font-medium">{selectedMentor.experience_years} years</p>
                  </div>
                  <div>
                    <label className="text-gray-600">Hourly Rate:</label>
                    <p className="font-medium">${selectedMentor.hourly_rate}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedMentor.expertise?.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Bio</h3>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {selectedMentor.bio || 'No bio provided'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Performance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-600">Rating:</label>
                    <div className="flex items-center">
                      {getRatingStars(selectedMentor.rating)}
                      <span className="ml-2 text-sm">({selectedMentor.rating}/5)</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-600">Total Sessions:</label>
                    <p className="font-medium">{selectedMentor.total_sessions || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedMentor(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
              <button
                onClick={() => sendMentorNotification(selectedMentor.id, 'Admin notification')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Send Notification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Session Details</h2>
              <button
                onClick={() => setSelectedSession(null)}
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
                  <label className="text-gray-600">Mentor:</label>
                  <p className="font-medium">{selectedSession.mentor_name}</p>
                </div>
                <div>
                  <label className="text-gray-600">Mentee:</label>
                  <p className="font-medium">{selectedSession.mentee_name}</p>
                </div>
                <div>
                  <label className="text-gray-600">Scheduled:</label>
                  <p className="font-medium">
                    {new Date(selectedSession.scheduled_at).toLocaleDateString()} at{' '}
                    {new Date(selectedSession.scheduled_at).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <label className="text-gray-600">Duration:</label>
                  <p className="font-medium">{selectedSession.duration} minutes</p>
                </div>
              </div>

              <div>
                <label className="text-gray-600">Agenda:</label>
                <p className="font-medium">{selectedSession.agenda || 'No agenda set'}</p>
              </div>

              <div>
                <label className="text-gray-600">Status:</label>
                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedSession.status)}`}>
                  {selectedSession.status}
                </span>
              </div>

              {selectedSession.feedback_mentor && (
                <div>
                  <label className="text-gray-600">Mentor Feedback:</label>
                  <p className="bg-gray-50 p-3 rounded-lg">{selectedSession.feedback_mentor}</p>
                </div>
              )}

              {selectedSession.feedback_mentee && (
                <div>
                  <label className="text-gray-600">Mentee Feedback:</label>
                  <p className="bg-gray-50 p-3 rounded-lg">{selectedSession.feedback_mentee}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedSession(null)}
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

export default MentorshipManagement;