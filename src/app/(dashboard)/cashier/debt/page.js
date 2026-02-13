'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function DebtManagement() {
  const { data: session } = useSession();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleAmount, setSettleAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
  try {
    setError('');
    console.log('=== Fetching debts ===');
    console.log('API URL:', '/api/cashier/debts');
    
    const response = await fetch('/api/cashier/debts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    console.log('Response status:', response.status);
    console.log('Response OK:', response.ok);
    
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    // Get response as text first
    const text = await response.text();
    console.log('Raw response (first 500 chars):', text.substring(0, 500));
    
    if (!contentType || !contentType.includes('application/json')) {
      console.error('ERROR: Server returned HTML instead of JSON');
      console.error('This usually means there is an error in the API route');
      throw new Error('Server error - Check browser console and terminal for details');
    }

    // Parse JSON
    let data;
    try {
      data = JSON.parse(text);
      console.log('Parsed data:', data);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Invalid JSON response from server');
    }

    if (!response.ok) {
      throw new Error(data.error || `Server error: ${response.status}`);
    }

    console.log('Debts loaded successfully:', data.debts?.length || 0);
    setDebts(data.debts || []);
    
  } catch (error) {
    console.error('=== Fetch Debts Error ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    setError(error.message);
  }
};



  const handleSettleClick = (debt) => {
    setSelectedDebt(debt);
    setSettleAmount(debt.remainingAmount.toString());
    setShowSettleModal(true);
  };

  const handleSettleDebt = async (e) => {
    e.preventDefault();
    
    if (!selectedDebt) return;

    const amount = parseFloat(settleAmount);
    if (amount <= 0 || amount > selectedDebt.remainingAmount) {
      alert('Invalid settlement amount');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/cashier/settle-debt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debtId: selectedDebt.id,
          amount,
          paymentMode
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to settle debt');
        } else {
          throw new Error('Server error - not returning JSON');
        }
      }

      const data = await response.json();

      alert('Debt settled successfully!');
      setShowSettleModal(false);
      setSelectedDebt(null);
      setSettleAmount('');
      setPaymentMode('CASH');
      fetchDebts();

    } catch (error) {
      console.error('Settlement error:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-red-100 text-red-800',
      PARTIAL: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredDebts = debts.filter(debt => {
    if (filter === 'ALL') return true;
    return debt.paymentStatus === filter;
  });

  const stats = {
    total: debts.reduce((sum, debt) => sum + debt.totalDebt, 0),
    paid: debts.reduce((sum, debt) => sum + debt.paidAmount, 0),
    remaining: debts.reduce((sum, debt) => sum + debt.remainingAmount, 0),
    pendingCount: debts.filter(d => d.paymentStatus === 'PENDING' || d.paymentStatus === 'PARTIAL').length
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="font-semibold">Error loading debts</p>
        <p className="text-sm">{error}</p>
        <button 
          onClick={fetchDebts}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600">Total Debt</p>
          <p className="text-2xl font-bold text-gray-800">
            ₹{stats.total.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600">Amount Paid</p>
          <p className="text-2xl font-bold text-green-600">
            ₹{stats.paid.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600">Remaining</p>
          <p className="text-2xl font-bold text-red-600">
            ₹{stats.remaining.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600">Pending Customers</p>
          <p className="text-2xl font-bold text-orange-600">
            {stats.pendingCount}
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Debt Management</h3>
          
          {/* Filter Tabs */}
          <div className="flex gap-2">
            {['ALL', 'PENDING', 'PARTIAL', 'PAID'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {filteredDebts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {filter === 'ALL' ? 'No debts found' : `No ${filter.toLowerCase()} debts found`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Debt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDebts.map((debt) => (
                  <tr key={debt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{debt.customerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {debt.customerPhone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ₹{debt.totalDebt.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      ₹{debt.paidAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                      ₹{debt.remainingAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(debt.paymentStatus)}`}>
                        {debt.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(debt.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {debt.paymentStatus !== 'PAID' ? (
                        <button
                          onClick={() => handleSettleClick(debt)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                        >
                          Settle
                        </button>
                      ) : (
                        <span className="text-green-600 font-medium">✓ Paid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Settle Modal */}
      {showSettleModal && selectedDebt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Settle Debt</h3>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600">Customer</p>
                  <p className="font-semibold">{selectedDebt.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Phone</p>
                  <p className="font-semibold">{selectedDebt.customerPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Debt</p>
                  <p className="font-semibold">₹{selectedDebt.totalDebt.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Already Paid</p>
                  <p className="font-semibold text-green-600">₹{selectedDebt.paidAmount.toLocaleString('en-IN')}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-gray-600">Remaining Amount</p>
                <p className="text-2xl font-bold text-red-600">
                  ₹{selectedDebt.remainingAmount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <form onSubmit={handleSettleDebt} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Settlement Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  max={selectedDebt.remainingAmount}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setSettleAmount((selectedDebt.remainingAmount / 2).toFixed(2))}
                    className="px-3 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Half
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettleAmount(selectedDebt.remainingAmount.toString())}
                    className="px-3 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Full
                  </button>
                </div>
              </div>

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
                </select>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold"
                >
                  {loading ? 'Processing...' : 'Settle Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSettleModal(false);
                    setSelectedDebt(null);
                    setSettleAmount('');
                    setPaymentMode('CASH');
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
