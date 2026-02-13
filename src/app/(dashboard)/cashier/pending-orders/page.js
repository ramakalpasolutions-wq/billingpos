'use client';

import { useState, useEffect } from 'react';

export default function CashierPendingOrders() {
  const [kots, setKots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchPendingOrders();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchPendingOrders, 10000); // Auto-refresh every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchPendingOrders = async () => {
    try {
      const response = await fetch('/api/cashier/pending-orders');
      const data = await response.json();
      setKots(data.kots || []);
    } catch (error) {
      console.error('Failed to fetch pending orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'READY':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return { text: 'Sent to Kitchen', emoji: '📋', color: 'bg-yellow-200 text-yellow-800' };
      case 'PREPARING':
        return { text: 'Preparing', emoji: '👨‍🍳', color: 'bg-blue-200 text-blue-800' };
      case 'READY':
        return { text: 'Ready', emoji: '✅', color: 'bg-green-200 text-green-800' };
      default:
        return { text: status, emoji: '📌', color: 'bg-gray-200 text-gray-800' };
    }
  };

  const getTimeSince = (date) => {
    const minutes = Math.floor((new Date() - new Date(date)) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Live Pending Orders (KOT View)</h3>
          <p className="text-sm text-gray-600">Each KOT shown separately</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">Auto-refresh</span>
          </label>
          <button
            onClick={fetchPendingOrders}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {kots.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl mb-4">✨</div>
          <p className="text-gray-500 text-lg">No pending orders</p>
          <p className="text-gray-400 text-sm mt-2">All orders are completed!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kots.map((kot) => {
            const status = getStatusBadge(kot.status);
            const items = JSON.parse(kot.items);
            const timeSince = getTimeSince(kot.printedAt);

            return (
              <div
                key={kot.id}
                className={`bg-white rounded-xl shadow-md border-2 ${getStatusColor(kot.status)} p-4`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-lg">
                      {kot.order.table?.tableName || `Table ${kot.order.table?.tableNumber}`}
                    </h4>
                    <p className="text-xs text-gray-600">{kot.kotNumber}</p>
                    <p className="text-xs text-gray-500">{kot.order.orderNumber}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                    {status.emoji} {status.text}
                  </span>
                </div>

                {/* KOT Items */}
                <div className="space-y-2 mb-3">
                  <p className="text-xs font-semibold text-gray-700 mb-2">
                    Items in this KOT ({items.length}):
                  </p>
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                      <span className="flex-1">
                        {item.name} {item.size && `(${item.size})`}
                      </span>
                      <span className="font-semibold">×{item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-3 border-t">
                  <div className="text-xs text-gray-600">
                    <p className={`font-semibold ${
                      timeSince.includes('Just now')
                        ? 'text-green-600'
                        : timeSince.includes('m')
                        ? 'text-blue-600'
                        : 'text-red-600'
                    }`}>
                      ⏱️ {timeSince}
                    </p>
                    <p className="mt-1">By: {kot.order.user?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Order Total</p>
                    <p className="font-bold text-lg text-indigo-600">
                      ₹{kot.order.grandTotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
