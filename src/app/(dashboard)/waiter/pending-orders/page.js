'use client';

import { useEffect, useState } from 'react';

export default function WaiterPendingOrders() {
  const [kots, setKots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchPendingOrders();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchPendingOrders, 10000); // Refresh every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchPendingOrders = async () => {
    try {
      const response = await fetch('/api/waiter/pending-orders');
      const data = await response.json();
      setKots(data.kots || []);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickup = async (kotId) => {
    const confirmed = confirm('Mark this order as picked up?');
    if (!confirmed) return;

    try {
      const response = await fetch('/api/waiter/pending-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kotId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark as picked up');
      }

      await fetchPendingOrders();
    } catch (error) {
      alert(error.message);
    }
  };

  const getPreparationTime = (printedAt) => {
    const now = new Date();
    const printed = new Date(printedAt);
    const diffMinutes = Math.floor((now - printed) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min`;
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-50 border-yellow-300 text-yellow-800';
      case 'PREPARING':
        return 'bg-blue-50 border-blue-300 text-blue-800';
      case 'READY':
        return 'bg-green-50 border-green-300 text-green-800';
      default:
        return 'bg-gray-50 border-gray-300 text-gray-800';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return { text: 'Sent to Kitchen', emoji: '📋', color: 'bg-yellow-200 text-yellow-800' };
      case 'PREPARING':
        return { text: 'Preparing', emoji: '👨‍🍳', color: 'bg-blue-200 text-blue-800' };
      case 'READY':
        return { text: 'Ready for Pickup', emoji: '✅', color: 'bg-green-200 text-green-800' };
      default:
        return { text: status, emoji: '📌', color: 'bg-gray-200 text-gray-800' };
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Pending Orders</h1>
          <p className="text-gray-600 mt-1">Kitchen orders in progress</p>
        </div>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">
              Auto-refresh (10s)
            </span>
          </label>
          <button
            onClick={fetchPendingOrders}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {kots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kots.map((kot) => {
            const status = getStatusBadge(kot.status);
            const items = JSON.parse(kot.items);
            const prepTime = getPreparationTime(kot.printedAt);
            const isReady = kot.status === 'READY';

            return (
              <div
                key={kot.id}
                className={`rounded-xl shadow-lg border-2 ${
                  isReady 
                    ? 'border-green-400 bg-green-50' 
                    : kot.status === 'PREPARING'
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-yellow-400 bg-yellow-50'
                }`}
              >
                {/* Header */}
                <div className={`p-4 rounded-t-xl ${
                  isReady 
                    ? 'bg-green-100' 
                    : kot.status === 'PREPARING'
                    ? 'bg-blue-100'
                    : 'bg-yellow-100'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-800">
                      {kot.order.table?.tableName || `Table ${kot.order.table?.tableNumber}`}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                      {status.emoji} {status.text}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 font-medium">
                      {kot.kotNumber}
                    </span>
                    <span className={`font-semibold ${
                      prepTime.includes('Just now') 
                        ? 'text-green-600'
                        : prepTime.includes('min') && parseInt(prepTime) < 15
                        ? 'text-blue-600'
                        : 'text-red-600'
                    }`}>
                      ⏱️ {prepTime}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 mt-1">
                    Order: {kot.order.orderNumber}
                  </div>
                </div>

                {/* Items */}
                <div className="p-4 bg-white">
                  <h4 className="font-semibold text-gray-700 mb-3 text-sm">
                    Items ({items.length})
                  </h4>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {item.name}
                          </p>
                          {item.size && (
                            <p className="text-xs text-gray-500">{item.size}</p>
                          )}
                        </div>
                        <div className="text-right ml-3">
                          <span className="text-2xl font-bold text-indigo-600">
                            ×{item.quantity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action - Only show for READY status */}
                {isReady && (
                  <div className="p-4 bg-white border-t rounded-b-xl">
                    <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-3">
                      <p className="text-sm text-green-800 font-semibold text-center">
                        🎉 Food is ready! Please pick up from kitchen
                      </p>
                    </div>
                    <button
                      onClick={() => handlePickup(kot.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors"
                    >
                      ✅ Mark as Picked Up
                    </button>
                  </div>
                )}

                {/* Status info for non-ready */}
                {!isReady && (
                  <div className="p-4 bg-white border-t rounded-b-xl">
                    <p className="text-sm text-gray-600 text-center">
                      {kot.status === 'PENDING' 
                        ? '⏳ Waiting for kitchen to start...'
                        : '👨‍🍳 Kitchen is preparing your order...'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">✨</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No Pending Orders
          </h3>
          <p className="text-gray-500">
            All orders have been completed or there are no active orders
          </p>
        </div>
      )}
    </div>
  );
}
