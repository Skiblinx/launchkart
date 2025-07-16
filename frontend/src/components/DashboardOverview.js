import React, { useState, useEffect } from 'react';
import { apiRequest } from '../App';
import { useAdmin } from './AdminDashboard';

const DashboardOverview = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { hasPermission } = useAdmin();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await apiRequest('get', '/admin/manage/dashboard', null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
    } catch (error) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg m-6">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of platform analytics and key metrics</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Users"
            value={dashboardData?.stats?.total_users || 0}
            icon="👥"
            color="bg-blue-500"
            change="+12%"
          />
          <MetricCard
            title="Service Requests"
            value={dashboardData?.stats?.total_service_requests || 0}
            icon="🛠️"
            color="bg-green-500"
            change="+8%"
          />
          <MetricCard
            title="Total Revenue"
            value={`₹${(dashboardData?.stats?.total_revenue || 0).toLocaleString()}`}
            icon="💰"
            color="bg-purple-500"
            change="+15%"
          />
          <MetricCard
            title="Pending KYC"
            value={dashboardData?.stats?.pending_kyc || 0}
            icon="🔍"
            color="bg-orange-500"
            change="-5%"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
            <div className="space-y-4">
              {dashboardData?.recent_users?.slice(0, 5).map((user, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user.fullName?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{user.fullName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.kyc_status === 'verified' 
                        ? 'bg-green-100 text-green-800'
                        : user.kyc_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.kyc_status || 'none'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1 capitalize">{user.role}</p>
                  </div>
                </div>
              )) || <p className="text-gray-500 text-center py-4">No recent users</p>}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              {hasPermission('user_management') && (
                <QuickActionCard
                  title="Manage Users"
                  description="View and manage user accounts"
                  icon="👥"
                  href="/admin/users"
                  color="bg-blue-500"
                />
              )}
              {hasPermission('kyc_verification') && (
                <QuickActionCard
                  title="KYC Review"
                  description="Review pending KYC submissions"
                  icon="🔍"
                  href="/admin/kyc"
                  color="bg-orange-500"
                  badge={dashboardData?.stats?.pending_kyc > 0 ? dashboardData.stats.pending_kyc : null}
                />
              )}
              {hasPermission('service_approval') && (
                <QuickActionCard
                  title="Service Requests"
                  description="Manage service requests"
                  icon="🛠️"
                  href="/admin/services"
                  color="bg-green-500"
                />
              )}
              {hasPermission('analytics_access') && (
                <QuickActionCard
                  title="Analytics"
                  description="View detailed analytics"
                  icon="📈"
                  href="/admin/analytics"
                  color="bg-purple-500"
                />
              )}
              {hasPermission('admin_management') && (
                <QuickActionCard
                  title="Admin Management"
                  description="Manage admin users"
                  icon="👑"
                  href="/admin/admins"
                  color="bg-indigo-500"
                />
              )}
              {hasPermission('system_configuration') && (
                <QuickActionCard
                  title="System Health"
                  description="Monitor system status"
                  icon="⚙️"
                  href="/admin/system"
                  color="bg-gray-500"
                />
              )}
            </div>
          </div>
        </div>

        {/* Platform Statistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Platform Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* User Distribution */}
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-700 mb-3">User Roles</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Founders</span>
                  <span className="text-sm font-medium">65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Mentors</span>
                  <span className="text-sm font-medium">25%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Investors</span>
                  <span className="text-sm font-medium">10%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                </div>
              </div>
            </div>

            {/* Geographic Distribution */}
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Geographic Distribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">India</span>
                  <span className="text-sm font-medium">78%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">UAE</span>
                  <span className="text-sm font-medium">22%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '22%' }}></div>
                </div>
              </div>
            </div>

            {/* Recent Performance */}
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-700 mb-3">This Month</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-blue-600">24</p>
                  <p className="text-sm text-gray-600">New Signups</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">18</p>
                  <p className="text-sm text-gray-600">Completed KYC</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">42</p>
                  <p className="text-sm text-gray-600">Service Requests</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        {hasPermission('system_configuration') && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatusIndicator
                label="Database"
                status="healthy"
                details="Response: 45ms"
              />
              <StatusIndicator
                label="API Service"
                status="healthy"
                details="Uptime: 99.9%"
              />
              <StatusIndicator
                label="Email Service"
                status="healthy"
                details="Queue: 0 pending"
              />
              <StatusIndicator
                label="Storage"
                status="warning"
                details="Usage: 78%"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, icon, color, change }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        {change && (
          <p className={`text-sm mt-1 ${
            change.startsWith('+') ? 'text-green-600' : 'text-red-600'
          }`}>
            {change} from last month
          </p>
        )}
      </div>
      <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center text-white text-xl`}>
        {icon}
      </div>
    </div>
  </div>
);

// Quick Action Card Component
const QuickActionCard = ({ title, description, icon, href, color, badge }) => (
  <a
    href={href}
    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors relative"
  >
    <div className="flex items-start space-x-3">
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center text-white`}>
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
    {badge && (
      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
        {badge}
      </span>
    )}
  </a>
);

// Status Indicator Component
const StatusIndicator = ({ label, status, details }) => {
  const statusColors = {
    healthy: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  };

  const statusIcons = {
    healthy: '✅',
    warning: '⚠️',
    error: '❌'
  };

  return (
    <div className="text-center p-3 border border-gray-200 rounded-lg">
      <div className="text-2xl mb-2">{statusIcons[status]}</div>
      <p className="font-medium text-gray-900">{label}</p>
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${statusColors[status]}`}>
        {status}
      </span>
      <p className="text-xs text-gray-500 mt-1">{details}</p>
    </div>
  );
};

export default DashboardOverview;