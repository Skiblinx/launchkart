import React, { useState, useEffect } from 'react';
import { apiRequest } from '../App';

const SystemManagement = () => {
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  useEffect(() => {
    fetchSystemHealth();
  }, []);

  const fetchSystemHealth = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await apiRequest('get', '/admin/manage/system/health', null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSystemHealth(response.data);
    } catch (error) {
      setError('Failed to fetch system health');
      console.error('System health fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenanceMode = async () => {
    try {
      const token = sessionStorage.getItem('admin_token');
      await apiRequest('post', '/admin/manage/system/maintenance', 
        { enable: !maintenanceMode, message: maintenanceMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMaintenanceMode(!maintenanceMode);
      if (!maintenanceMode) {
        alert('Maintenance mode enabled');
      } else {
        alert('Maintenance mode disabled');
      }
    } catch (error) {
      console.error('Maintenance mode toggle error:', error);
      alert('Failed to toggle maintenance mode');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">System Management</h1>
          <p className="text-gray-600 mt-1">Monitor system health and manage platform settings</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : (
          <>
            {/* System Health Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">System Health Status</h3>
                <button
                  onClick={fetchSystemHealth}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                >
                  <span>🔄</span>
                  <span>Refresh</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {systemHealth && Object.entries(systemHealth).map(([service, data]) => (
                  <div key={service} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 capitalize">
                        {service.replace('_', ' ')}
                      </h4>
                      <span className="text-2xl">{getStatusIcon(data.status)}</span>
                    </div>
                    <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(data.status)}`}>
                      {data.status}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {data.response_time && <p>Response: {data.response_time}</p>}
                      {data.usage && <p>Usage: {data.usage}</p>}
                      {data.last_sent && <p>Last sent: {new Date(data.last_sent).toLocaleTimeString()}</p>}
                      {data.last_transaction && <p>Last transaction: {new Date(data.last_transaction).toLocaleTimeString()}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Maintenance Mode */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Maintenance Mode</h3>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">Platform Maintenance</h4>
                  <p className="text-sm text-gray-600">
                    {maintenanceMode 
                      ? 'Platform is currently in maintenance mode'
                      : 'Platform is running normally'
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`w-3 h-3 rounded-full ${maintenanceMode ? 'bg-red-500' : 'bg-green-500'}`}></span>
                  <span className={`text-sm font-medium ${maintenanceMode ? 'text-red-600' : 'text-green-600'}`}>
                    {maintenanceMode ? 'Maintenance Mode' : 'Active'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maintenance Message
                  </label>
                  <textarea
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter a message to display to users during maintenance..."
                  />
                </div>
                <button
                  onClick={toggleMaintenanceMode}
                  className={`px-6 py-2 rounded-lg font-medium ${
                    maintenanceMode
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {maintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
                </button>
              </div>
            </div>

            {/* Platform Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Server Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Server Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Server Time</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date().toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Uptime</span>
                    <span className="text-sm font-medium text-gray-900">99.9%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Version</span>
                    <span className="text-sm font-medium text-gray-900">v1.0.0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Environment</span>
                    <span className="text-sm font-medium text-gray-900">Production</span>
                  </div>
                </div>
              </div>

              {/* Resource Usage */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Usage</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">CPU Usage</span>
                      <span className="text-sm font-medium text-gray-900">45%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Memory Usage</span>
                      <span className="text-sm font-medium text-gray-900">67%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '67%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Disk Usage</span>
                      <span className="text-sm font-medium text-gray-900">78%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Network I/O</span>
                      <span className="text-sm font-medium text-gray-900">32%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '32%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent System Events */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent System Events</h3>
              <div className="space-y-3">
                {[
                  { time: '2 minutes ago', event: 'Database backup completed successfully', type: 'success' },
                  { time: '15 minutes ago', event: 'Email service queue processed 45 messages', type: 'info' },
                  { time: '1 hour ago', event: 'Storage cleanup completed - freed 2.3GB', type: 'success' },
                  { time: '3 hours ago', event: 'High memory usage detected - 89%', type: 'warning' },
                  { time: '6 hours ago', event: 'System maintenance completed', type: 'success' }
                ].map((log, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      log.type === 'success' ? 'bg-green-500' :
                      log.type === 'warning' ? 'bg-yellow-500' :
                      log.type === 'error' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{log.event}</p>
                      <p className="text-xs text-gray-500">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🗄️</span>
                    <div>
                      <h4 className="font-medium text-gray-900">Backup Database</h4>
                      <p className="text-sm text-gray-600">Create system backup</p>
                    </div>
                  </div>
                </button>
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🧹</span>
                    <div>
                      <h4 className="font-medium text-gray-900">Clear Cache</h4>
                      <p className="text-sm text-gray-600">Clear application cache</p>
                    </div>
                  </div>
                </button>
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📊</span>
                    <div>
                      <h4 className="font-medium text-gray-900">Generate Report</h4>
                      <p className="text-sm text-gray-600">System health report</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SystemManagement;