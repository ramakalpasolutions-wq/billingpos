'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function WaiterDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    todayOrders: 0,
    totalTips: 0,
    tips: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/waiter/stats');
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {session?.user?.name}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Today's Orders</p>
              <h3 className="text-4xl font-bold mt-2">{stats.todayOrders}</h3>
            </div>
            <div className="text-5xl opacity-50">📋</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Tips (This Month)</p>
              <h3 className="text-4xl font-bold mt-2">₹{stats.totalTips.toFixed(2)}</h3>
            </div>
            <div className="text-5xl opacity-50">💰</div>
          </div>
        </div>
      </div>

      {/* Today's Orders Graph Placeholder */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Orders Overview</h2>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">Chart will be implemented with Recharts</p>
        </div>
      </div>

      {/* Recent Tips */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Tips</h2>
        {stats.tips.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Table</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Payment Mode</th>
                </tr>
              </thead>
              <tbody>
                {stats.tips.slice(0, 5).map((tip) => (
                  <tr key={tip.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(tip.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">{tip.tableNumber}</td>
                    <td className="py-3 px-4 font-semibold text-green-600">
                      ₹{tip.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {tip.paymentMode}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No tips received yet</p>
        )}
      </div>
    </div>
  );
}
