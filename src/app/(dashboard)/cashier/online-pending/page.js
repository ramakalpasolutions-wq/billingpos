'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function CashierOnlinePending() {
  const { data: session } = useSession();
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'accepted', 'preparing', 'ready'

  useEffect(() => {
    fetchPendingOrders();
    // Auto-refresh every 20 seconds
    const interval = setInterval(fetchPendingOrders, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingOrders = async () => {
    try {
      const response = await fetch('/api/cashier/online-orders?status=ACCEPTED,PREPARING,READY');
      const data = await response.json();
      setPendingOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReadyForPickup = async (orderId) => {
    try {
      const response = await fetch('/api/cashier/online-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId,
          action: 'ready'
        })
      });

      if (!response.ok) throw new Error('Failed to update order');

      alert('Order marked as ready for pickup!');
      fetchPendingOrders();
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    }
  };

  const handlePickedUp = async (orderId) => {
    if (!confirm('Confirm that order has been picked up by delivery partner?')) return;

    try {
      const response = await fetch('/api/cashier/online-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId,
          action: 'picked_up'
        })
      });

      if (!response.ok) throw new Error('Failed to update order');

      alert('Order marked as picked up and moved to history!');
      fetchPendingOrders();
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    }
  };

  const getTimeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'PREPARING': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'READY': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'SWIGGY': return 'bg-orange-500';
      case 'ZOMATO': return 'bg-red-500';
      case 'UBER_EATS': return 'bg-green-600';
      case 'DUNZO': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredOrders = filter === 'all' 
    ? pendingOrders 
    : pendingOrders.filter(order => order.onlineOrder.orderStatus === filter.toUpperCase());

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
        <h1 className="text-3xl font-bold text-gray-800">Online Pending Orders</h1>
        <p className="text-gray-600 mt-1">Track and manage accepted online orders</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['all', 'accepted', 'preparing', 'ready'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status === 'all' && ` (${pendingOrders.length})`}
            {status !== 'all' && ` (${pendingOrders.filter(o => o.onlineOrder.orderStatus === status.toUpperCase()).length})`}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const onlineOrder = order.onlineOrder;
            const isReady = onlineOrder.orderStatus === 'READY';
            const isAcceptedOrPreparing = onlineOrder.orderStatus === 'ACCEPTED' || onlineOrder.orderStatus === 'PREPARING';

            return (
              <div 
                key={order.id} 
                className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 transition-all hover:shadow-xl ${
                  isReady ? 'border-green-400' : 'border-gray-200'
                }`}
              >
                {/* Header with Platform Badge */}
                <div className={`${getPlatformColor(onlineOrder.platform)} text-white px-4 py-3`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium opacity-90">Order #{order.orderNumber}</p>
                      <p className="text-xs opacity-75">{getTimeSince(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">₹{order.grandTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="px-4 pt-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border-2 ${getStatusColor(onlineOrder.orderStatus)}`}>
                    {onlineOrder.orderStatus === 'ACCEPTED' && '🕐 Accepted'}
                    {onlineOrder.orderStatus === 'PREPARING' && '👨‍🍳 Preparing'}
                    {onlineOrder.orderStatus === 'READY' && '✓ Ready for Pickup'}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="px-4 py-3">
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                    <p className="text-sm font-semibold text-gray-800">
                      👤 {order.customerName}
                    </p>
                    {order.customerPhone && (
                      <p className="text-xs text-gray-600">📞 {order.customerPhone}</p>
                    )}
                    {onlineOrder.deliveryAddress && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        📍 {onlineOrder.deliveryAddress}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div className="px-4 pb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Items:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {order.orderItems.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm bg-gray-50 rounded px-3 py-2">
                        <span className="text-gray-700">
                          <span className="font-medium text-indigo-600">{item.quantity}x</span> {item.menuItem.name}
                          {item.size && <span className="text-xs text-gray-500"> ({item.size})</span>}
                        </span>
                        <span className="font-semibold text-gray-800">₹{item.totalPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time Indicators */}
                <div className="px-4 pb-3 flex gap-2 text-xs text-gray-600">
                  {onlineOrder.acceptedAt && (
                    <div className="bg-blue-50 px-2 py-1 rounded">
                      Accepted: {getTimeSince(onlineOrder.acceptedAt)}
                    </div>
                  )}
                  {onlineOrder.readyAt && (
                    <div className="bg-green-50 px-2 py-1 rounded">
                      Ready: {getTimeSince(onlineOrder.readyAt)}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="px-4 pb-4">
                  {isAcceptedOrPreparing && (
                    <button
                      onClick={() => handleReadyForPickup(order.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-3 rounded-lg transition-colors"
                    >
                      ✓ Mark Ready for Pickup
                    </button>
                  )}
                  {isReady && (
                    <button
                      onClick={() => handlePickedUp(order.id)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-3 rounded-lg transition-colors animate-pulse"
                    >
                      📦 Mark as Picked Up
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-xl text-gray-500">No pending online orders</p>
          <p className="text-sm text-gray-400 mt-2">Orders will appear here once accepted from kitchen</p>
        </div>
      )}
    </div>
  );
}
