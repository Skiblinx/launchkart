import React, { useState, useEffect } from 'react';
import { apiRequest } from '../App';

const AnalyticsOverview = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const periods = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' }
  ];

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await apiRequest('get', `/admin/manage/analytics?period=${selectedPeriod}`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalyticsData(response.data);
    } catch (error) {
      setError('Failed to fetch analytics data');
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!analyticsData) return;

    const reportData = {
      period: selectedPeriod,
      generated_at: new Date().toISOString(),
      user_growth: analyticsData.user_growth,
      revenue: analyticsData.revenue,
      service_requests: analyticsData.service_requests
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_report_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Platform performance and user insights</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {periods.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
              <button
                onClick={exportReport}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
              >
                <span>📊</span>
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total Users"
            value={analyticsData?.user_growth?.total || 0}
            change={`+${analyticsData?.user_growth?.growth_rate || 0}%`}
            icon="👥"
            color="bg-blue-500"
          />
          <MetricCard
            title="Total Revenue"
            value={`₹${(analyticsData?.revenue?.total || 0).toLocaleString()}`}
            change={`+${analyticsData?.revenue?.growth_rate || 0}%`}
            icon="💰"
            color="bg-green-500"
          />
          <MetricCard
            title="Service Requests"
            value={analyticsData?.service_requests?.total || 0}
            change={`${analyticsData?.service_requests?.completion_rate || 0}% completion`}
            icon="🛠️"
            color="bg-purple-500"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
            <div className="h-64 flex items-center justify-center">
              {analyticsData?.user_growth?.period_data?.length > 0 ? (
                <SimpleLineChart 
                  data={analyticsData.user_growth.period_data}
                  dataKey="count"
                  color="#3B82F6"
                />
              ) : (
                <p className="text-gray-500">No user growth data available</p>
              )}
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
            <div className="h-64 flex items-center justify-center">
              {analyticsData?.revenue?.period_data?.length > 0 ? (
                <SimpleLineChart 
                  data={analyticsData.revenue.period_data}
                  dataKey="amount"
                  color="#10B981"
                />
              ) : (
                <p className="text-gray-500">No revenue data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Service Requests Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Service Requests Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📋</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{analyticsData?.service_requests?.total || 0}</p>
              <p className="text-sm text-gray-600">Total Requests</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{analyticsData?.service_requests?.completed || 0}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⏳</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{analyticsData?.service_requests?.pending || 0}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{analyticsData?.service_requests?.completion_rate || 0}%</p>
              <p className="text-sm text-gray-600">Completion Rate</p>
            </div>
          </div>
        </div>

        {/* Platform Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Categories */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Service Categories</h3>
            <div className="space-y-4">
              {[
                { name: 'Logo Design', count: 45, percentage: 35 },
                { name: 'Website Development', count: 32, percentage: 25 },
                { name: 'Marketing Strategy', count: 28, percentage: 22 },
                { name: 'Business Plan', count: 23, percentage: 18 }
              ].map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900">{category.name}</span>
                      <span className="text-sm text-gray-500">{category.count} requests</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Engagement */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Engagement</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Daily Active Users</span>
                <span className="text-lg font-bold text-blue-600">142</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Weekly Active Users</span>
                <span className="text-lg font-bold text-green-600">385</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Monthly Active Users</span>
                <span className="text-lg font-bold text-purple-600">892</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Average Session Duration</span>
                <span className="text-lg font-bold text-orange-600">12m 34s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Geographic Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-4">By Country</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🇮🇳</span>
                    <span className="text-sm font-medium">India</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">78%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🇦🇪</span>
                    <span className="text-sm font-medium">UAE</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '22%' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">22%</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-4">Top Cities</h4>
              <div className="space-y-2">
                {[
                  { city: 'Mumbai', count: 156 },
                  { city: 'Dubai', count: 98 },
                  { city: 'Bangalore', count: 89 },
                  { city: 'Delhi', count: 76 },
                  { city: 'Abu Dhabi', count: 45 }
                ].map((city, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{city.city}</span>
                    <span className="text-sm font-medium text-gray-900">{city.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, change, icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        <p className="text-sm text-green-600 mt-1">{change}</p>
      </div>
      <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center text-white text-xl`}>
        {icon}
      </div>
    </div>
  </div>
);

// Simple Line Chart Component (using CSS for basic visualization)
const SimpleLineChart = ({ data, dataKey, color }) => {
  if (!data || data.length === 0) {
    return <p className="text-gray-500">No data available</p>;
  }

  const maxValue = Math.max(...data.map(item => item[dataKey]));
  const minValue = Math.min(...data.map(item => item[dataKey]));
  const range = maxValue - minValue || 1;

  return (
    <div className="w-full h-full flex items-end justify-between space-x-1 px-4">
      {data.slice(-12).map((item, index) => {
        const height = ((item[dataKey] - minValue) / range) * 100;
        return (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="w-full rounded-t"
              style={{
                height: `${Math.max(height, 10)}%`,
                backgroundColor: color,
                minHeight: '4px'
              }}
            ></div>
            <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
              {new Date(item.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AnalyticsOverview;