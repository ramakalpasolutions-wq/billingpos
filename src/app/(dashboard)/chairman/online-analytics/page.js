'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function ChairmanOnlineAnalytics() {
  const { data: session } = useSession();
  const [stats, setStats] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [selectedBranch, period]);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/chairman/branches');
      const data = await response.json();
      setBranches(data.branches || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/chairman/online-stats?branchId=${selectedBranch}&period=${period}`
      );
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color }) => (
    <div className={`bg-gradient-to-br ${color} rounded-xl shadow-lg p-6 text-white`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm opacity-90 font-medium">{title}</p>
          <h3 className="text-4xl font-bold mt-2">{value}</h3>
          {subtitle && <p className="text-sm opacity-75 mt-1">{subtitle}</p>}
        </div>
        <div className="text-5xl opacity-50">{icon}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Online Orders Analytics</h1>
        <p className="text-gray-600 mt-1">Monitor online delivery platform performance</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Branch Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Period Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Period
            </label>
            <div className="flex gap-2">
              {['today', 'month', 'year'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    period === p
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total Online Orders"
              value={stats.totalOrders}
              icon="📦"
              color="from-blue-500 to-blue-600"
            />
            <StatCard
              title="Total Revenue"
              value={`₹${stats.totalRevenue.toFixed(2)}`}
              icon="💰"
              color="from-green-500 to-green-600"
            />
            <StatCard
              title="Cancelled Orders"
              value={stats.cancelledOrders}
              subtitle={`${((stats.cancelledOrders / stats.totalOrders) * 100).toFixed(1)}% cancellation rate`}
              icon="❌"
              color="from-red-500 to-red-600"
            />
            <StatCard
              title="Avg Order Value"
              value={`₹${stats.avgOrderValue.toFixed(2)}`}
              icon="📊"
              color="from-purple-500 to-purple-600"
            />
          </div>

          {/* Platform Performance */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Orders by Platform</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.ordersByPlatform.map((platform) => (
                <div key={platform.platform} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      platform.platform === 'SWIGGY' ? 'bg-orange-100 text-orange-700' :
                      platform.platform === 'ZOMATO' ? 'bg-red-100 text-red-700' :
                      platform.platform === 'UBER_EATS' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {platform.platform}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{platform.count}</p>
                  <p className="text-sm text-gray-600 mt-1">orders</p>
                  <p className="text-lg font-semibold text-green-600 mt-2">
                    ₹{platform.revenue.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {stats.ordersByStatus.map((status) => (
                <div key={status.status} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-indigo-600">{status.count}</p>
                  <p className="text-xs text-gray-600 mt-1">{status.status.replace(/_/g, ' ')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Branch Performance */}
          {selectedBranch === 'all' && stats.branchStats.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Branch-wise Performance</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2">
                      <th className="text-left py-3 px-4 text-gray-700 font-semibold">Branch</th>
                      <th className="text-right py-3 px-4 text-gray-700 font-semibold">Orders</th>
                      <th className="text-right py-3 px-4 text-gray-700 font-semibold">Revenue</th>
                      <th className="text-right py-3 px-4 text-gray-700 font-semibold">Avg Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.branchStats.map((branch) => (
                      <tr key={branch.branchId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-800">{branch.branchName}</td>
                        <td className="py-3 px-4 text-right text-indigo-600 font-semibold">
                          {branch.orderCount}
                        </td>
                        <td className="py-3 px-4 text-right text-green-600 font-semibold">
                          ₹{branch.revenue.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700">
                          ₹{(branch.revenue / branch.orderCount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
