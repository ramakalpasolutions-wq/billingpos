'use client';

import { useEffect, useState } from 'react';

export default function WaiterTips() {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('month'); // 'month', 'all'

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    try {
      const response = await fetch('/api/waiter/stats');
      const data = await response.json();
      setTips(data.tips || []);
    } catch (error) {
      console.error('Error fetching tips:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return tips.reduce((sum, tip) => sum + tip.amount, 0);
  };

  const groupByPaymentMode = () => {
    const grouped = {};
    tips.forEach(tip => {
      if (!grouped[tip.paymentMode]) {
        grouped[tip.paymentMode] = {
          count: 0,
          total: 0
        };
      }
      grouped[tip.paymentMode].count++;
      grouped[tip.paymentMode].total += tip.amount;
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const paymentModeStats = groupByPaymentMode();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Tips</h1>
        <p className="text-gray-600 mt-1">Track your tips received from customers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-green-100 text-sm font-medium">Total Tips (This Month)</p>
          <h3 className="text-4xl font-bold mt-2">₹{calculateTotal().toFixed(2)}</h3>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-blue-100 text-sm font-medium">Total Count</p>
          <h3 className="text-4xl font-bold mt-2">{tips.length}</h3>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-purple-100 text-sm font-medium">Average Tip</p>
          <h3 className="text-4xl font-bold mt-2">
            ₹{tips.length > 0 ? (calculateTotal() / tips.length).toFixed(2) : '0.00'}
          </h3>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-orange-100 text-sm font-medium">Highest Tip</p>
          <h3 className="text-4xl font-bold mt-2">
            ₹{tips.length > 0 ? Math.max(...tips.map(t => t.amount)).toFixed(2) : '0.00'}
          </h3>
        </div>
      </div>

      {/* Payment Mode Breakdown */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Tips by Payment Mode</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.keys(paymentModeStats).map(mode => (
            <div key={mode} className="border rounded-lg p-4">
              <p className="text-sm text-gray-600">{mode}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                ₹{paymentModeStats[mode].total.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {paymentModeStats[mode].count} transaction{paymentModeStats[mode].count !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tips Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">All Tips</h2>
        
        {tips.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Table</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Payment Mode</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {tips.map((tip) => (
                  <tr key={tip.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(tip.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium">{tip.tableNumber}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-green-600 text-lg">
                        ₹{tip.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        tip.paymentMode === 'CASH' 
                          ? 'bg-green-100 text-green-800'
                          : tip.paymentMode === 'UPI'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {tip.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(tip.date).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💰</div>
            <p className="text-gray-500 text-lg">No tips received yet</p>
            <p className="text-gray-400 text-sm mt-2">Tips from customers will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
