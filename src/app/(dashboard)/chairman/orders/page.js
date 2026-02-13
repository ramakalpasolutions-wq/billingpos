'use client';

import { useState, useEffect } from 'react';

export default function ChairmanOrders() {
  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [summary, setSummary] = useState({ 
    totalOrders: 0, 
    totalRevenue: 0,
    totalOrderRevenue: 0,
    ordersWithPayment: 0,
    completedOrders: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, branchFilter, startDate, endDate]);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/chairman/branches');
      const data = await response.json();
      setBranches(data.branches || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (branchFilter !== 'all') params.append('branchId', branchFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/chairman/orders?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setOrders(data.orders || []);
        setSummary(data.summary || { 
          totalOrders: 0, 
          totalRevenue: 0,
          totalOrderRevenue: 0,
          ordersWithPayment: 0,
          completedOrders: 0
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'KOT_SENT': 'bg-blue-100 text-blue-800 border-blue-300',
      'PREPARING': 'bg-purple-100 text-purple-800 border-purple-300',
      'READY': 'bg-green-100 text-green-800 border-green-300',
      'BILL_REQUESTED': 'bg-orange-100 text-orange-800 border-orange-300',
      'COMPLETED': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setBranchFilter('all');
    setStartDate('');
    setEndDate('');
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">All Orders</h1>
        <p className="text-gray-600 mt-1">View and manage orders across all branches</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Total Orders</p>
              <p className="text-4xl font-bold">{summary.totalOrders}</p>
              <p className="text-xs opacity-75 mt-1">All orders</p>
            </div>
            <span className="text-5xl">📦</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Revenue</p>
              <p className="text-3xl font-bold">₹{(summary.totalRevenue || 0).toLocaleString('en-IN')}</p>
              <p className="text-xs opacity-75 mt-1">
                {summary.ordersWithPayment > 0 
                  ? `${summary.ordersWithPayment} paid orders`
                  : summary.completedOrders > 0
                  ? `${summary.completedOrders} completed orders`
                  : 'No payments yet'}
              </p>
            </div>
            <span className="text-5xl">💰</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Total Value</p>
              <p className="text-3xl font-bold">₹{(summary.totalOrderRevenue || 0).toLocaleString('en-IN')}</p>
              <p className="text-xs opacity-75 mt-1">All orders value</p>
            </div>
            <span className="text-5xl">💵</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
          <button
            onClick={clearFilters}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="KOT_SENT">KOT Sent</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
              <option value="BILL_REQUESTED">Bill Requested</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-xs text-gray-500">By: {order.user?.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{order.branch?.name}</p>
                      <p className="text-xs text-gray-500">{order.branch?.address}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {order.table?.tableName || `Table ${order.table?.tableNumber}`}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{order.orderItems.length} items</p>
                      <p className="text-xs text-gray-500">
                        {order.kots.length} KOT(s)
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-green-600">₹{order.grandTotal.toFixed(2)}</p>
                      {order.discount > 0 && (
                        <p className="text-xs text-gray-500">Discount: ₹{order.discount}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      {order.payment && (
                        <p className="text-xs text-gray-500 mt-1">
                          💳 {order.payment.paymentMode}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Order Details</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="font-semibold">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Branch</p>
                  <p className="font-semibold">{selectedOrder.branch?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Table</p>
                  <p className="font-semibold">
                    {selectedOrder.table?.tableName || `Table ${selectedOrder.table?.tableNumber}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created By</p>
                  <p className="font-semibold">{selectedOrder.user?.name} ({selectedOrder.user?.role})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date & Time</p>
                  <p className="font-semibold">
                    {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* KOTs */}
              {selectedOrder.kots.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">KOTs ({selectedOrder.kots.length})</h4>
                  <div className="space-y-2">
                    {selectedOrder.kots.map((kot) => {
                      const items = JSON.parse(kot.items);
                      return (
                        <div key={kot.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-blue-800">{kot.kotNumber}</span>
                            <div className="text-right">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                kot.status === 'PENDING' ? 'bg-yellow-200 text-yellow-800' :
                                kot.status === 'PREPARING' ? 'bg-blue-200 text-blue-800' :
                                kot.status === 'READY' ? 'bg-green-200 text-green-800' :
                                'bg-gray-200 text-gray-800'
                              }`}>
                                {kot.status}
                              </span>
                              <p className="text-xs text-blue-600 mt-1">
                                {new Date(kot.printedAt).toLocaleTimeString('en-IN')}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {items.map((item, idx) => (
                              <div key={idx} className="text-sm text-blue-900 flex justify-between">
                                <span>{item.name} {item.size && `(${item.size})`}</span>
                                <span className="font-semibold">×{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Items</h4>
                <div className="space-y-2">
                  {selectedOrder.orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{item.menuItem.name}</p>
                        {item.size && <p className="text-xs text-gray-500">{item.size}</p>}
                        <p className="text-sm text-gray-600">₹{item.price} × {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-gray-800">₹{item.totalPrice.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Summary */}
              <div className="border-t pt-4">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-medium text-green-600">-₹{selectedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">CGST (2.5%):</span>
                    <span className="font-medium">₹{selectedOrder.cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">SGST (2.5%):</span>
                    <span className="font-medium">₹{selectedOrder.sgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-bold text-gray-800">Grand Total:</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      ₹{selectedOrder.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Payment Info */}
                {selectedOrder.payment ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="font-semibold text-green-800 mb-2">✅ Payment Details</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Mode:</p>
                        <p className="font-medium text-green-800">{selectedOrder.payment.paymentMode}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Status:</p>
                        <p className="font-medium text-green-800">{selectedOrder.payment.status}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Amount Paid:</p>
                        <p className="font-medium text-green-800">₹{selectedOrder.payment.amountPaid.toFixed(2)}</p>
                      </div>
                      {selectedOrder.payment.tipAmount > 0 && (
                        <div>
                          <p className="text-gray-600">Tip:</p>
                          <p className="font-medium text-green-800">₹{selectedOrder.payment.tipAmount.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="font-semibold text-orange-800">⚠️ Payment Pending</p>
                    <p className="text-sm text-orange-600 mt-1">This order has not been paid yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
