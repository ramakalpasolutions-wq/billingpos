'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function KitchenDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    pendingOrders: 0,
    preparingOrders: 0,
    completedToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/kitchen/stats');
      const data = await response.json();
      setStats(data);
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Kitchen Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage food preparation and orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Pending Orders</p>
              <p className="text-4xl font-bold mt-2">{stats.pendingOrders}</p>
              <p className="text-yellow-100 text-xs mt-1">New KOTs to start</p>
            </div>
            <div className="text-6xl opacity-20">🔔</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Preparing</p>
              <p className="text-4xl font-bold mt-2">{stats.preparingOrders}</p>
              <p className="text-blue-100 text-xs mt-1">In progress</p>
            </div>
            <div className="text-6xl opacity-20">👨‍🍳</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Completed Today</p>
              <p className="text-4xl font-bold mt-2">{stats.completedToday}</p>
              <p className="text-green-100 text-xs mt-1">Ready orders</p>
            </div>
            <div className="text-6xl opacity-20">✅</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/kitchen/orders')}
            className="flex items-center gap-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <div className="text-4xl">📋</div>
            <div className="text-left">
              <p className="font-semibold text-gray-800">View Pending Orders</p>
              <p className="text-sm text-gray-600">See all KOTs waiting to be prepared</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/kitchen/orders')}
            className="flex items-center gap-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="text-4xl">🍳</div>
            <div className="text-left">
              <p className="font-semibold text-gray-800">In Progress Orders</p>
              <p className="text-sm text-gray-600">Track orders being prepared</p>
            </div>
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <span>ℹ️</span>
          <span>How to Use Kitchen Dashboard</span>
        </h3>
        <ul className="space-y-2 text-sm text-blue-700">
          <li className="flex items-start gap-2">
            <span className="font-bold">1.</span>
            <span>When a waiter sends an order, it appears in "Pending Orders" with status <strong>KOT_SENT</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">2.</span>
            <span>Click "Start Preparing" to move the order to <strong>PREPARING</strong> status</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">3.</span>
            <span>When food is ready, click "Mark as Ready" to update status to <strong>READY</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">4.</span>
            <span>The waiter will be notified and can pick up the order</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
