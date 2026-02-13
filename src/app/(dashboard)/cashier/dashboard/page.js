'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function CashierDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('today');

  useEffect(() => {
    if (session) {
      fetchAnalytics();
    }
  }, [session, period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cashier/analytics?period=${period}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {loading ? '...' : value}
          </p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Period
        </label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="today">Today</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Today Sales"
          value={`₹${(analytics?.todaySales || 0).toLocaleString('en-IN')}`}
          icon="💰"
          color="border-green-500"
        />
        <StatCard
          title="Today Orders"
          value={analytics?.todayOrders || 0}
          icon="🛒"
          color="border-blue-500"
        />
        <StatCard
          title="Today Online Orders"
          value={analytics?.todayOnlineOrders || 0}
          icon="📱"
          color="border-purple-500"
        />
        <StatCard
          title="Live Orders"
          value={analytics?.liveOrders || 0}
          icon="🔴"
          color="border-orange-500"
        />
        <StatCard
          title="Cancelled Orders"
          value={analytics?.cancelledOrders || 0}
          icon="❌"
          color="border-red-500"
        />
        <StatCard
          title="Tips Collected"
          value={`₹${(analytics?.tipsCollected || 0).toLocaleString('en-IN')}`}
          icon="💵"
          color="border-yellow-500"
        />
      </div>

      {/* Sales Graph */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Sales Overview</h3>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading graph...</p>
          </div>
        ) : (
          <div className="h-64 flex items-end justify-between gap-2">
            {analytics?.graphData?.map((item, index) => {
              const maxSales = Math.max(...analytics.graphData.map(d => d.sales));
              const height = maxSales > 0 ? (item.sales / maxSales) * 100 : 0;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full group">
                    <div
                      className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600 cursor-pointer"
                      style={{ height: `${height}%`, minHeight: item.sales > 0 ? '20px' : '2px' }}
                    />
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      ₹{item.sales.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 text-center">{item.label}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
