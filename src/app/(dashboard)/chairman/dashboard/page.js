'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function ChairmanDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/chairman/stats');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data.stats);
      } else {
        console.error('Failed to fetch stats:', data.error);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load statistics</p>
        <button
          onClick={fetchStats}
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome, {session?.user?.name}
          </h1>
          <p className="text-gray-600 mt-1">Organization Overview & Analytics</p>
        </div>
        <button
          onClick={fetchStats}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-3xl font-bold">₹{stats.revenue.total.toLocaleString('en-IN')}</p>
          <p className="text-xs opacity-75 mt-1">All time</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Today's Revenue</h3>
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-3xl font-bold">₹{stats.revenue.today.toLocaleString('en-IN')}</p>
          <p className="text-xs opacity-75 mt-1">Last 24 hours</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">This Month</h3>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-3xl font-bold">₹{stats.revenue.month.toLocaleString('en-IN')}</p>
          <p className="text-xs opacity-75 mt-1">Current month</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">This Year</h3>
            <span className="text-2xl">🎯</span>
          </div>
          <p className="text-3xl font-bold">₹{stats.revenue.year.toLocaleString('en-IN')}</p>
          <p className="text-xs opacity-75 mt-1">YTD</p>
        </div>
      </div>

      {/* Orders & Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Orders */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Orders Overview</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{stats.orders.total}</p>
              <p className="text-sm text-gray-600 mt-1">Total Orders</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{stats.orders.today}</p>
              <p className="text-sm text-gray-600 mt-1">Today</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">{stats.orders.active}</p>
              <p className="text-sm text-gray-600 mt-1">Active</p>
            </div>
          </div>
        </div>

        {/* Organization Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Organization</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏢</span>
                <span className="font-medium text-gray-700">Total Branches</span>
              </div>
              <span className="text-2xl font-bold text-indigo-600">
                {stats.overview.totalBranches}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👥</span>
                <span className="font-medium text-gray-700">Total Staff</span>
              </div>
              <span className="text-2xl font-bold text-indigo-600">
                {stats.overview.totalStaff}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <span className="font-medium text-gray-700">Customers</span>
              </div>
              <span className="text-2xl font-bold text-indigo-600">
                {stats.overview.totalCustomers}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Trend & Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Revenue Trend (7 Days)</h2>
          <div className="space-y-2">
            {stats.revenueTrend.map((day, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600 w-16">{day.date}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full flex items-center justify-end pr-3"
                    style={{
                      width: `${Math.max((day.revenue / Math.max(...stats.revenueTrend.map(d => d.revenue))) * 100, 5)}%`
                    }}
                  >
                    <span className="text-xs font-semibold text-white">
                      ₹{day.revenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Top Selling Items (This Month)</h2>
          <div className="space-y-3">
            {stats.topItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-indigo-600">#{index + 1}</span>
                  <div>
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.quantity} sold</p>
                  </div>
                </div>
                <p className="font-bold text-green-600">
                  ₹{item.revenue.toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Branch Performance */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Branch Performance (This Month)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.branchPerformance.map((branch, index) => (
            <div key={index} className="border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-500 transition-colors">
              <h3 className="font-bold text-lg text-gray-800 mb-2">{branch.name}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Revenue:</span>
                  <span className="font-semibold text-green-600">
                    ₹{branch.revenue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Orders:</span>
                  <span className="font-semibold text-blue-600">{branch.orders}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Payment Methods (This Month)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.paymentMethods.map((method, index) => (
            <div key={index} className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
              <p className="text-sm font-medium text-gray-600 mb-1">{method.method}</p>
              <p className="text-2xl font-bold text-indigo-600">
                ₹{method.amount.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-500 mt-1">{method.count} transactions</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
