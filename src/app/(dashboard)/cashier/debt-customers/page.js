'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function DebtCustomers() {
  const { data: session } = useSession();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  
  // Add Customer Form
  const [customerForm, setCustomerForm] = useState({
    customerName: '',
    customerPhone: '',
    totalDebt: '',
    paidAmount: '',
    notes: ''
  });

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState(0);

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      const response = await fetch('/api/cashier/debt-list');
      const data = await response.json();
      setDebts(data.debts || []);
    } catch (error) {
      console.error('Failed to fetch debts:', error);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalDebt = parseFloat(customerForm.totalDebt) || 0;
      const paidAmount = parseFloat(customerForm.paidAmount) || 0;
      const remainingAmount = totalDebt - paidAmount;

      const response = await fetch('/api/cashier/add-debt-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerForm.customerName,
          customerPhone: customerForm.customerPhone,
          totalDebt,
          paidAmount,
          remainingAmount,
          paymentStatus: remainingAmount <= 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'PENDING'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add customer');
      }

      alert('Debt customer added successfully!');
      setShowAddModal(false);
      setCustomerForm({
        customerName: '',
        customerPhone: '',
        totalDebt: '',
        paidAmount: '',
        notes: ''
      });
      fetchDebts();

    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedDebt || !paymentAmount || paymentAmount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/cashier/debt-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debtId: selectedDebt.id,
          paymentAmount: parseFloat(paymentAmount)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record payment');
      }

      alert('Payment recorded successfully!');
      setShowPaymentModal(false);
      setSelectedDebt(null);
      setPaymentAmount(0);
      fetchDebts();

    } catch (error) {
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Debt Customers</h3>
          <p className="text-sm text-gray-600">Manage customer debts and payments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          + Add Debt Customer
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm font-medium">Total Outstanding</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            ₹{debts.reduce((sum, d) => sum + d.remainingAmount, 0).toLocaleString('en-IN')}
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm font-medium">Total Collected</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            ₹{debts.reduce((sum, d) => sum + d.paidAmount, 0).toLocaleString('en-IN')}
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm font-medium">Debt Customers</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {debts.filter(d => d.remainingAmount > 0).length}
          </p>
        </div>
      </div>

      {/* Debts Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">Debt Records</h3>
        </div>

        {debts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No debt records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Debt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Paid Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {debts.map((debt) => (
                  <tr key={debt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {debt.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {debt.customerPhone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{debt.totalDebt.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
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
                      {formatDate(debt.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {debt.remainingAmount > 0 && (
                        <button
                          onClick={() => {
                            setSelectedDebt(debt);
                            setPaymentAmount(debt.remainingAmount);
                            setShowPaymentModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add Debt Customer</h3>
            
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={customerForm.customerName}
                  onChange={(e) => setCustomerForm({ ...customerForm, customerName: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={customerForm.customerPhone}
                  onChange={(e) => setCustomerForm({ ...customerForm, customerPhone: e.target.value })}
                  required
                  pattern="[0-9]{10}"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="10-digit phone number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Debt *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={customerForm.totalDebt}
                    onChange={(e) => setCustomerForm({ ...customerForm, totalDebt: e.target.value })}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paid Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={customerForm.paidAmount}
                    onChange={(e) => setCustomerForm({ ...customerForm, paidAmount: e.target.value })}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setCustomerForm({
                      customerName: '',
                      customerPhone: '',
                      totalDebt: '',
                      paidAmount: '',
                      notes: ''
                    });
                  }}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Adding...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedDebt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Record Payment</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Customer</p>
                <p className="font-semibold text-lg">{selectedDebt.customerName}</p>
                <p className="text-sm text-gray-600">{selectedDebt.customerPhone}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Total Debt:</span>
                  <span className="font-semibold">₹{selectedDebt.totalDebt.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Already Paid:</span>
                  <span className="font-semibold text-green-600">₹{selectedDebt.paidAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
                  <span>Remaining:</span>
                  <span className="text-red-600">₹{selectedDebt.remainingAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={selectedDebt.remainingAmount}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter payment amount"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedDebt(null);
                    setPaymentAmount(0);
                  }}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
