'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function TestOnlineOrders() {
  const { data: session } = useSession();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('SWIGGY');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/chairman/branches');
      const data = await response.json();
      setBranches(data.branches || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const simulateOrder = async () => {
    if (!selectedBranch) {
      alert('Please select a branch first!');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test/simulate-online-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranch,
          platform: selectedPlatform
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          order: data.order,
          onlineOrder: data.onlineOrder
        });
        alert(`✅ ${data.message}\nOrder Number: ${data.order.orderNumber}`);
      } else {
        throw new Error(data.error || 'Failed to create test order');
      }
    } catch (error) {
      setResult({
        success: false,
        message: error.message
      });
      alert('❌ ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Test Online Orders</h1>
        <p className="text-gray-600 mt-1">Simulate orders from Swiggy, Zomato, and other platforms</p>
      </div>

      {/* Test Configuration */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Configure Test Order</h2>

        <div className="space-y-4">
          {/* Branch Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Branch <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a Branch --</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>

          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Platform <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSelectedPlatform('SWIGGY')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  selectedPlatform === 'SWIGGY'
                    ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                    : 'border-gray-300 hover:border-orange-300'
                }`}
              >
                <div className="text-3xl mb-2">🛵</div>
                <div className="font-semibold text-gray-800">Swiggy</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlatform('ZOMATO')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  selectedPlatform === 'ZOMATO'
                    ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                    : 'border-gray-300 hover:border-red-300'
                }`}
              >
                <div className="text-3xl mb-2">🍔</div>
                <div className="font-semibold text-gray-800">Zomato</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlatform('DUNZO')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  selectedPlatform === 'DUNZO'
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="text-3xl mb-2">🚴</div>
                <div className="font-semibold text-gray-800">Dunzo</div>
              </button>
            </div>
          </div>

          {/* Simulate Button */}
          <button
            onClick={simulateOrder}
            disabled={loading || !selectedBranch}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 rounded-lg font-semibold text-lg transition-all shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creating Test Order...
              </span>
            ) : (
              <span>🚀 Simulate {selectedPlatform} Order</span>
            )}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 How to Test</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Select the branch where you want to test the order</li>
          <li>Choose a platform (Swiggy, Zomato, or Dunzo)</li>
          <li>Click "Simulate Order" to create a test order</li>
          <li>The order will appear in the Cashier's "Online Orders" page</li>
          <li>Cashier can accept the order, which sends it to Kitchen</li>
          <li>Kitchen can mark it as PREPARING and then READY</li>
          <li>Order appears in "Online Pending" for cashier to mark as PICKED UP</li>
        </ol>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`rounded-xl p-6 ${
          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className="text-3xl">{result.success ? '✅' : '❌'}</div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold mb-2 ${
                result.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {result.success ? 'Test Order Created!' : 'Error'}
              </h3>
              <p className={`text-sm mb-4 ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.message}
              </p>

              {result.success && result.order && (
                <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-semibold text-gray-800">{result.order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-semibold text-gray-800">{result.order.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-semibold text-gray-800">{result.order.customerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform:</span>
                    <span className="font-semibold text-gray-800">{result.onlineOrder.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
                      {result.onlineOrder.orderStatus}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-bold text-green-600 text-lg">₹{result.order.grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <p className="text-gray-600 mb-2">Items ({result.order.orderItems.length}):</p>
                    {result.order.orderItems.map((item, index) => (
                      <div key={index} className="flex justify-between text-xs text-gray-700 mb-1">
                        <span>{item.quantity}× {item.menuItem.name}</span>
                        <span>₹{item.totalPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.success && (
                <div className="mt-4 space-y-2">
                  <a
                    href="/cashier/online-orders"
                    className="block text-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold"
                  >
                    View in Cashier Dashboard →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Testing Checklist */}
      <div className="bg-gray-50 rounded-xl p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">✅ Testing Checklist</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" />
            <label>Order appears in Cashier's "Online Orders" page</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" />
            <label>Cashier receives notification (toast + sound)</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" />
            <label>Cashier can accept the order</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" />
            <label>KOT is created and sent to Kitchen</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" />
            <label>Kitchen receives the KOT with sound notification</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" />
            <label>Kitchen can mark order as PREPARING</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" />
            <label>Kitchen can mark order as READY</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" />
            <label>Order appears in "Online Pending" page</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" />
            <label>Cashier receives notification when order is ready</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" />
            <label>Cashier can mark order as PICKED UP</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" />
            <label>Order moves to Order History</label>
          </div>
        </div>
      </div>
    </div>
  );
}
