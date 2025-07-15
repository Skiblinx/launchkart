import React, { useState, useEffect } from 'react';
import { apiRequest } from '../App';

const AdminManagementComponent = () => {
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promotionData, setPromotionData] = useState({
    role: 'admin',
    permissions: []
  });

  const availableRoles = [
    { value: 'super_admin', label: 'Super Admin', description: 'Full system access' },
    { value: 'admin', label: 'Admin', description: 'General administrative access' },
    { value: 'moderator', label: 'Moderator', description: 'Content moderation and user management' },
    { value: 'support', label: 'Support', description: 'Customer support and basic management' }
  ];

  const availablePermissions = [
    { value: 'user_management', label: 'User Management', category: 'User' },
    { value: 'admin_management', label: 'Admin Management', category: 'User' },
    { value: 'content_moderation', label: 'Content Moderation', category: 'Content' },
    { value: 'service_approval', label: 'Service Approval', category: 'Content' },
    { value: 'payment_management', label: 'Payment Management', category: 'Financial' },
    { value: 'refund_processing', label: 'Refund Processing', category: 'Financial' },
    { value: 'analytics_access', label: 'Analytics Access', category: 'Analytics' },
    { value: 'report_generation', label: 'Report Generation', category: 'Analytics' },
    { value: 'system_configuration', label: 'System Configuration', category: 'System' },
    { value: 'email_management', label: 'Email Management', category: 'System' },
    { value: 'kyc_verification', label: 'KYC Verification', category: 'KYC' },
    { value: 'kyc_approval', label: 'KYC Approval', category: 'KYC' }
  ];

  useEffect(() => {
    fetchEligibleUsers();
  }, [searchTerm]);

  const fetchEligibleUsers = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('admin_token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await apiRequest('get', `/admin/manage/eligible-users?${params}`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEligibleUsers(response.data.users);
    } catch (error) {
      setError('Failed to fetch eligible users');
      console.error('Eligible users fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const promoteUserToAdmin = async () => {
    if (!selectedUser) return;

    try {
      const token = sessionStorage.getItem('admin_token');
      await apiRequest('post', '/admin/manage/promote-user', {
        user_id: selectedUser.id,
        role: promotionData.role,
        permissions: promotionData.permissions
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('User promoted to admin successfully!');
      setShowPromoteModal(false);
      setSelectedUser(null);
      setPromotionData({ role: 'admin', permissions: [] });
      fetchEligibleUsers();
    } catch (error) {
      console.error('User promotion error:', error);
      alert('Failed to promote user to admin');
    }
  };

  const handlePermissionToggle = (permission) => {
    setPromotionData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const getRolePermissions = (role) => {
    switch (role) {
      case 'super_admin':
        return availablePermissions.map(p => p.value);
      case 'admin':
        return ['user_management', 'content_moderation', 'service_approval', 'analytics_access', 'kyc_verification'];
      case 'moderator':
        return ['content_moderation', 'user_management', 'service_approval'];
      case 'support':
        return ['user_management', 'analytics_access'];
      default:
        return [];
    }
  };

  useEffect(() => {
    if (promotionData.role) {
      setPromotionData(prev => ({
        ...prev,
        permissions: getRolePermissions(prev.role)
      }));
    }
  }, [promotionData.role]);

  const groupedPermissions = availablePermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600 mt-1">Promote verified users to admin roles</p>
        </div>
      </div>

      <div className="p-6">
        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Eligible Users
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setSearchTerm('')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Eligible Users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Eligible Users for Admin Promotion</h3>
            <p className="text-sm text-gray-600">Users with verified KYC who are not already admins</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">{error}</div>
          ) : eligibleUsers.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No eligible users found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {eligibleUsers.map((user) => (
                <div key={user.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {user.fullName?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{user.fullName}</h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                            user.role === 'founder' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'mentor' ? 'bg-green-100 text-green-800' :
                            user.role === 'investor' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            KYC Verified
                          </span>
                          {user.country && (
                            <span className="text-xs text-gray-500">{user.country}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowPromoteModal(true);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Promote to Admin
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Promote User Modal */}
      {showPromoteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">Promote User to Admin</h3>
                <button
                  onClick={() => {
                    setShowPromoteModal(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {selectedUser.fullName?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{selectedUser.fullName}</h4>
                    <p className="text-gray-600">{selectedUser.email}</p>
                    <p className="text-sm text-gray-500">Current Role: {selectedUser.role}</p>
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Admin Role
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableRoles.map((role) => (
                    <div
                      key={role.value}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        promotionData.role === role.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setPromotionData(prev => ({ ...prev, role: role.value }))}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          checked={promotionData.role === role.value}
                          onChange={() => setPromotionData(prev => ({ ...prev, role: role.value }))}
                          className="text-purple-600"
                        />
                        <div>
                          <h5 className="font-medium text-gray-900">{role.label}</h5>
                          <p className="text-sm text-gray-600">{role.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Permissions
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Permissions are automatically assigned based on role, but you can customize them.
                </p>
                
                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([category, permissions]) => (
                    <div key={category}>
                      <h6 className="font-medium text-gray-900 mb-2">{category} Permissions</h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {permissions.map((permission) => (
                          <label
                            key={permission.value}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={promotionData.permissions.includes(permission.value)}
                              onChange={() => handlePermissionToggle(permission.value)}
                              className="text-purple-600"
                            />
                            <span className="text-sm text-gray-700">{permission.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={promoteUserToAdmin}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Promote to Admin
                </button>
                <button
                  onClick={() => {
                    setShowPromoteModal(false);
                    setSelectedUser(null);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagementComponent;