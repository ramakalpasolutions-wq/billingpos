'use client';

import { useEffect, useState, useRef } from 'react';

export default function KitchenOrders() {
  const [kots, setKots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'preparing', 'online', 'dine-in'
  const previousKotCountRef = useRef(0);
  const audioRef = useRef(null);

  useEffect(() => {
    // Initialize audio
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/universfield-phone-ringing-229175.mp3');
      audioRef.current.volume = 0.7;
    }

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/kitchen/orders');
      const data = await response.json();
      
      if (data.kots) {
        // Check if new KOTs arrived
        const newKotCount = data.kots.length;
        if (previousKotCountRef.current > 0 && newKotCount > previousKotCountRef.current) {
          // Play sound for new KOTs
          playNotificationSound();
        }
        previousKotCountRef.current = newKotCount;
        
        setKots(data.kots || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }
  };

  const handleStartPreparing = async (kotId) => {
    try {
      const response = await fetch('/api/kitchen/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kotId: kotId,
          status: 'PREPARING'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update KOT');
      }

      await fetchOrders();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleMarkReady = async (kotId) => {
    const confirmed = confirm('Mark this KOT as ready for pickup?');
    if (!confirmed) return;

    try {
      const response = await fetch('/api/kitchen/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kotId: kotId,
          status: 'READY'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update KOT');
      }

      alert('✅ KOT marked as ready! Waiter/Cashier will be notified.');
      await fetchOrders();
    } catch (error) {
      alert(error.message);
    }
  };

  const getPreparationTime = (printedAt) => {
    const now = new Date();
    const printed = new Date(printedAt);
    const diffMinutes = Math.floor((now - printed) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `${hours}h ${mins}m ago`;
  };

  const filteredKots = kots.filter(kot => {
    if (filter === 'pending') return kot.status === 'PENDING';
    if (filter === 'preparing') return kot.status === 'PREPARING';
    if (filter === 'online') return kot.order.orderType === 'ONLINE';
    if (filter === 'dine-in') return kot.order.orderType === 'DINE_IN';
    return true;
  });

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
          <h1 className="text-3xl font-bold text-gray-800">Kitchen Orders (KOT)</h1>
          <p className="text-gray-600 mt-1">Manage order preparation - KOT by KOT</p>
        </div>
        <button
          onClick={fetchOrders}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <span>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({kots.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🔔 Pending ({kots.filter(k => k.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setFilter('preparing')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'preparing'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          👨‍🍳 Preparing ({kots.filter(k => k.status === 'PREPARING').length})
        </button>
        <button
          onClick={() => setFilter('online')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'online'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🛵 Online ({kots.filter(k => k.order.orderType === 'ONLINE').length})
        </button>
        <button
          onClick={() => setFilter('dine-in')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'dine-in'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🍽️ Dine-In ({kots.filter(k => k.order.orderType === 'DINE_IN').length})
        </button>
      </div>

      {filteredKots.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredKots.map((kot) => {
            const isPending = kot.status === 'PENDING';
            const isPreparing = kot.status === 'PREPARING';
            const prepTime = getPreparationTime(kot.printedAt);
            const items = JSON.parse(kot.items);
            const isOnline = kot.order.orderType === 'ONLINE';
            const onlineOrder = kot.order.onlineOrder;

            return (
              <div
                key={kot.id}
                className={`bg-white rounded-xl shadow-lg border-2 overflow-hidden ${
                  isPending
                    ? 'border-yellow-400 animate-pulse'
                    : isPreparing
                    ? 'border-blue-400'
                    : 'border-gray-200'
                }`}
              >
                {/* Header */}
                <div className={`p-4 ${
                  isOnline
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                    : isPending
                    ? 'bg-yellow-50'
                    : isPreparing
                    ? 'bg-blue-50'
                    : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      {isOnline ? (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-white text-orange-600 px-2 py-1 rounded text-xs font-bold">
                            {onlineOrder?.platform || 'ONLINE'}
                          </span>
                          <span className={`text-xs ${isOnline ? 'text-white' : 'text-gray-600'}`}>
                            {kot.order.orderNumber}
                          </span>
                        </div>
                      ) : (
                        <h3 className="text-xl font-bold text-gray-800">
                          {kot.order.table?.tableName || `Table ${kot.order.table?.tableNumber}`}
                        </h3>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      isPending
                        ? isOnline ? 'bg-white text-orange-600' : 'bg-yellow-200 text-yellow-800'
                        : isPreparing
                        ? isOnline ? 'bg-white text-blue-600' : 'bg-blue-200 text-blue-800'
                        : 'bg-gray-200 text-gray-800'
                    }`}>
                      {isPending ? '🔔 NEW' : isPreparing ? '👨‍🍳 Preparing' : 'Processing'}
                    </span>
                  </div>
                  
                  {/* Customer Info for Online Orders */}
                  {isOnline && onlineOrder && (
                    <div className="mb-2 pb-2 border-b border-orange-400">
                      <p className="text-sm font-semibold">
                        👤 {kot.order.customerName || 'Customer'}
                      </p>
                      {kot.order.customerPhone && (
                        <p className="text-xs opacity-90">📞 {kot.order.customerPhone}</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={`font-bold ${isOnline ? 'text-white' : 'text-purple-700'}`}>
                      KOT #{kot.kotNumber.split('-')[1]?.slice(-6) || kot.kotNumber}
                    </span>
                    <span className={`font-semibold ${
                      isOnline ? 'text-white' :
                      prepTime.includes('Just now') || prepTime.includes('min')
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      ⏱️ {prepTime}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between text-xs ${isOnline ? 'text-white opacity-90' : 'text-gray-600'}`}>
                    <span>
                      {isOnline ? 'Platform Order' : `Order: ${kot.order.orderNumber}`}
                    </span>
                    <span>
                      {isOnline ? 'Delivery' : `Waiter: ${kot.order.user?.name || 'N/A'}`}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 text-sm flex items-center justify-between">
                    <span>Items to Prepare ({items.length})</span>
                    <span className="text-lg font-bold text-indigo-600">
                      ₹{kot.order.grandTotal.toFixed(2)}
                    </span>
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
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
                          {item.category && (
                            <p className="text-xs text-indigo-600">{item.category}</p>
                          )}
                        </div>
                        <div className="text-right ml-3">
                          <span className="inline-block bg-indigo-600 text-white text-sm font-bold rounded-full px-3 py-1">
                            {item.quantity}×
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="p-4 border-t">
                  {isPending ? (
                    <button
                      onClick={() => handleStartPreparing(kot.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
                    >
                      👨‍🍳 Start Preparing
                    </button>
                  ) : isPreparing ? (
                    <button
                      onClick={() => handleMarkReady(kot.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors animate-pulse"
                    >
                      ✅ Mark as Ready
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">
            {filter === 'pending' ? '🔔' : 
             filter === 'preparing' ? '👨‍🍳' : 
             filter === 'online' ? '🛵' :
             filter === 'dine-in' ? '🍽️' : '📋'}
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {filter === 'pending' 
              ? 'No Pending KOTs'
              : filter === 'preparing'
              ? 'No KOTs Being Prepared'
              : filter === 'online'
              ? 'No Online Orders'
              : filter === 'dine-in'
              ? 'No Dine-In Orders'
              : 'No KOTs in Kitchen'}
          </h3>
          <p className="text-gray-500">
            {filter === 'pending' 
              ? 'All KOTs have been started'
              : filter === 'preparing'
              ? 'Start preparing pending KOTs'
              : filter === 'online'
              ? 'No online orders in kitchen'
              : filter === 'dine-in'
              ? 'No dine-in orders in kitchen'
              : 'KOTs will appear here when sent from waiters or online orders are accepted'}
          </p>
        </div>
      )}
    </div>
  );
}
