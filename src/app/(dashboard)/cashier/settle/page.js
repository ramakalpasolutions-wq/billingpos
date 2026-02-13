'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SettleContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  
  const [order, setOrder] = useState(null);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [tipAmount, setTipAmount] = useState('0');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [debtCustomers, setDebtCustomers] = useState([]);
  const [selectedDebtCustomer, setSelectedDebtCustomer] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      fetchDebtCustomers();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/cashier/orders?orderId=${orderId}`);
      const data = await response.json();
      setOrder(data.order);
      setAmountPaid(data.order.grandTotal.toString());
    } catch (error) {
      console.error('Failed to fetch order:', error);
      alert('Failed to load order details');
    }
  };

  const fetchDebtCustomers = async () => {
    try {
      const response = await fetch('/api/cashier/debts');
      const data = await response.json();
      
      const pendingCustomers = data.debts.filter(
        d => d.paymentStatus === 'PENDING' || d.paymentStatus === 'PARTIAL'
      );
      
      setDebtCustomers(pendingCustomers);
    } catch (error) {
      console.error('Failed to fetch debt customers:', error);
    }
  };

  const handleDebtCustomerSelect = (e) => {
    const customerId = e.target.value;
    setSelectedDebtCustomer(customerId);
    
    if (customerId) {
      const customer = debtCustomers.find(c => c.id === customerId);
      if (customer) {
        setCustomerName(customer.customerName);
        setCustomerPhone(customer.customerPhone);
      }
    } else {
      setCustomerName('');
      setCustomerPhone('');
    }
  };

  const handleSettlement = async (e) => {
    e.preventDefault();

    if (!order) return;

    const paid = parseFloat(amountPaid);
    const tip = parseFloat(tipAmount);

    if (isNaN(paid) || paid < 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (paymentMode === 'DEBT' && (!customerName || !customerPhone)) {
      alert('Please enter customer name and phone for debt payment');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/cashier/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          paymentMode,
          amountPaid: paid,
          tipAmount: tip,
          debtCustomerName: customerName || null,
          debtCustomerPhone: customerPhone || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Settlement failed');
      }

      if (tip > 0 && data.waiterName) {
        alert(`Payment settled successfully!\n\nTip of ₹${tip.toFixed(2)} assigned to ${data.waiterName}.\nYou can settle this tip from the Tips page.`);
      } else {
        alert('Payment settled successfully!');
      }
      
      router.push('/cashier/orders');

    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const balance = order.grandTotal - parseFloat(amountPaid || 0);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Settle Payment</h2>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Order Number:</span>
              <span className="font-semibold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Table:</span>
              <span className="font-semibold">{order.table?.tableNumber || order.table?.tableName || 'N/A'}</span>
            </div>
            {order.user && (
              <div className="flex justify-between">
                <span>Served By:</span>
                <span className="font-semibold">{order.user.name} ({order.user.role})</span>
              </div>
            )}
            
            {/* Order Items */}
            <div className="border-t pt-2 mt-2">
              <p className="font-semibold mb-2">Items:</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {order.orderItems.map((item, index) => (
                  <div key={index} className="flex justify-between text-xs bg-white p-2 rounded">
                    <span>{item.menuItem.name} {item.size && `(${item.size})`}</span>
                    <span>×{item.quantity} = ₹{item.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-2 mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-₹{order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>CGST (2.5%):</span>
                <span>₹{order.cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (2.5%):</span>
                <span>₹{order.sgst.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
              <span>Total Amount:</span>
              <span className="text-green-600">₹{order.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSettlement} className="space-y-4">
          {/* Payment Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Mode *
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="DEBT">Debt (Pay Later)</option>
            </select>
          </div>

          {/* Debt Customer Selection */}
          {paymentMode === 'DEBT' && debtCustomers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Existing Debt Customer (Optional)
              </label>
              <select
                value={selectedDebtCustomer}
                onChange={handleDebtCustomerSelect}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- New Customer --</option>
                {debtCustomers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customerName} - {customer.customerPhone} (Pending: ₹{customer.remainingAmount})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Customer Details for DEBT */}
          {paymentMode === 'DEBT' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Phone *
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  pattern="[0-9]{10}"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="10-digit phone number"
                />
              </div>
            </>
          )}

          {/* Amount Paid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount Paid *
            </label>
            <input
              type="number"
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount paid"
            />
            {paymentMode === 'DEBT' && (
              <p className="text-xs text-gray-500 mt-1">
                Enter partial amount or 0 for full debt
              </p>
            )}
          </div>

          {/* Tip Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tip Amount (Optional)
            </label>
            <input
              type="number"
              step="0.01"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter tip amount"
            />
          </div>

          {/* Tip Assignment Notification */}
          {parseFloat(tipAmount) > 0 && order.user && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <span className="text-blue-500 mr-2 text-lg">ℹ️</span>
                <div>
                  <p className="text-sm text-blue-800">
                    Tip of <strong>₹{parseFloat(tipAmount).toFixed(2)}</strong> will be assigned to{' '}
                    <strong>{order.user.name}</strong> ({order.user.role})
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    💡 You can settle this tip from the Tips Management page after payment is complete
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Balance Display */}
          {balance !== 0 && (
            <div className={`p-4 rounded-lg ${balance > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex justify-between items-center">
                <span className="font-semibold">
                  {balance > 0 ? 'Remaining Balance:' : 'Change to Return:'}
                </span>
                <span className={`text-xl font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{Math.abs(balance).toFixed(2)}
                </span>
              </div>
              {balance > 0 && paymentMode !== 'DEBT' && (
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ Customer needs to pay ₹{balance.toFixed(2)} more
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold text-lg transition-colors"
          >
            {loading ? 'Processing...' : '💳 Complete Settlement'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/cashier/orders')}
            className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SettlePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <SettleContent />
    </Suspense>
  );
}
