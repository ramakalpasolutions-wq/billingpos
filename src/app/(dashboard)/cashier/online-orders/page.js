'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function CashierOnlineOrders() {
  const { data: session } = useSession();
  const [receivedOrders, setReceivedOrders] = useState([]);
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'accepted'

  useEffect(() => {
    fetchOrders();
    // Refresh every 30 seconds for new orders
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      // Fetch received orders
      const receivedRes = await fetch('/api/cashier/online-orders?status=RECEIVED');
      const receivedData = await receivedRes.json();
      setReceivedOrders(receivedData.orders || []);

      // Fetch accepted/preparing orders
      const acceptedRes = await fetch('/api/cashier/online-orders?status=ACCEPTED,PREPARING,READY');
      const acceptedData = await acceptedRes.json();
      setAcceptedOrders(acceptedData.orders || []);
    } catch (error) {
      console.error('Error fetching online orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
  if (!confirm('Accept this order and send to kitchen?')) return;

  try {
    const response = await fetch('/api/cashier/online-orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: orderId,
        action: 'accept'
      })
    });

    if (!response.ok) throw new Error('Failed to accept order');

    const data = await response.json();
    
    // Show notification with KOT number
    if (data.kot) {
      alert(`✅ Order accepted!\n🍳 KOT #${data.kot.kotNumber} sent to kitchen`);
    } else {
      alert('Order accepted and sent to kitchen!');
    }
    
    // Show toast notification
    if (typeof notifyOrderAccepted !== 'undefined') {
      notifyOrderAccepted(data.order);
    }
    
    fetchOrders();
  } catch (error) {
    console.error('Error accepting order:', error);
    alert(error.message);
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
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      alert(error.message);
    }
  };

  const handlePickedUp = async (orderId) => {
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

      alert('Order marked as picked up!');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      alert(error.message);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      const response = await fetch('/api/cashier/online-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId,
          action: 'cancel'
        })
      });

      if (!response.ok) throw new Error('Failed to cancel order');

      alert('Order cancelled successfully!');
      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(error.message);
    }
  };

  const OrderCard = ({ order }) => {
    const onlineOrder = order.onlineOrder;
    const isReceived = onlineOrder.orderStatus === 'RECEIVED';
    const isAccepted = onlineOrder.orderStatus === 'ACCEPTED' || onlineOrder.orderStatus === 'PREPARING';
    const isReady = onlineOrder.orderStatus === 'READY';

    return (
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                onlineOrder.platform === 'SWIGGY' 
                  ? 'bg-orange-100 text-orange-700'
                  : onlineOrder.platform === 'ZOMATO'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {onlineOrder.platform}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                isReceived ? 'bg-yellow-100 text-yellow-700' :
                isAccepted ? 'bg-blue-100 text-blue-700' :
                isReady ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {onlineOrder.orderStatus.replace(/_/g, ' ')}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-800">#{order.orderNumber}</h3>
            <p className="text-sm text-gray-600">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-indigo-600">
              ₹{order.grandTotal.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">👤 {order.customerName}</p>
          {order.customerPhone && (
            <p className="text-sm text-gray-600">📞 {order.customerPhone}</p>
          )}
          {onlineOrder.deliveryAddress && (
            <p className="text-sm text-gray-600">📍 {onlineOrder.deliveryAddress}</p>
          )}
        </div>

        {/* Items */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2">Order Items:</h4>
          <div className="space-y-2">
            {order.orderItems.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.quantity}x {item.menuItem.name}
                  {item.size && ` (${item.size})`}
                </span>
                <span className="font-medium text-gray-800">
                  ₹{item.totalPrice.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isReceived && (
            <>
              <button
                onClick={() => handleAcceptOrder(order.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                ✓ Accept & Send to Kitchen
              </button>
              <button
                onClick={() => handleCancelOrder(order.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                ✕
              </button>
            </>
          )}
          {isAccepted && (
            <button
              onClick={() => handleReadyForPickup(order.id)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
              🍽️ Mark Ready for Pickup
            </button>
          )}
          {isReady && (
            <button
              onClick={() => handlePickedUp(order.id)}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              ✓ Mark as Picked Up
            </button>
          )}
        </div>
      </div>
    );
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
        <h1 className="text-3xl font-bold text-gray-800">Online Orders</h1>
        <p className="text-gray-600 mt-1">Manage orders from Swiggy, Zomato & other platforms</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'received'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          New Orders ({receivedOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('accepted')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'accepted'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          In Progress ({acceptedOrders.length})
        </button>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeTab === 'received' ? (
          receivedOrders.length > 0 ? (
            receivedOrders.map(order => <OrderCard key={order.id} order={order} />)
          ) : (
            <div className="col-span-2 text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500 text-lg">No new online orders</p>
            </div>
          )
        ) : (
          acceptedOrders.length > 0 ? (
            acceptedOrders.map(order => <OrderCard key={order.id} order={order} />)
          ) : (
            <div className="col-span-2 text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500 text-lg">No orders in progress</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
