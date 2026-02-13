'use client';

import { useEffect, useState } from 'react';

export default function CashierTips() {
  const [tipsByUser, setTipsByUser] = useState([]);
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'settled'
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchTips();
  }, [filter]);

  const fetchTips = async () => {
    try {
      setLoading(true);
      const statusParam = filter === 'all' ? '' : `?status=${filter}`;
      const response = await fetch(`/api/cashier/tips${statusParam}`);
      const data = await response.json();
      setTipsByUser(data.tipsByUser || []);
    } catch (error) {
      console.error('Error fetching tips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettleTips = async (userId) => {
    const userTips = tipsByUser.find(u => u.user.id === userId);
    const pendingTipIds = userTips.tips
      .filter(tip => !tip.isSettled)
      .map(tip => tip.id);

    if (pendingTipIds.length === 0) {
      alert('No pending tips to settle');
      return;
    }

    const confirmed = confirm(
      `Settle ₹${userTips.pendingTips.toFixed(2)} in tips for ${userTips.user.name}?\n\nThis will mark ${pendingTipIds.length} tip(s) as given to the employee.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch('/api/cashier/tips', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipIds: pendingTipIds })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to settle tips');
      }

      alert('Tips settled successfully!');
      fetchTips();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSettleSingleTip = async (tipId) => {
    const confirmed = confirm('Mark this tip as settled?');
    if (!confirmed) return;

    try {
      const response = await fetch('/api/cashier/tips', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to settle tip');
      }

      alert('Tip settled successfully!');
      fetchTips();
    } catch (error) {
      alert(error.message);
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Tips Management</h1>
        <p className="text-gray-600 mt-1">Track and settle employee tips</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'pending'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('settled')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'settled'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Settled
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
      </div>

      {tipsByUser.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tipsByUser.map((userTipData) => (
            <div key={userTipData.user.id} className="bg-white rounded-xl shadow-lg p-6">
              {/* Employee Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {userTipData.user.photo ? (
                    <img
                      src={userTipData.user.photo}
                      alt={userTipData.user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-600">
                      {userTipData.user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {userTipData.user.name}
                    </h3>
                    <p className="text-sm text-gray-600">{userTipData.user.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    ₹{userTipData.totalTips.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">Total Tips</p>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-700 font-medium">Pending</p>
                  <p className="text-xl font-bold text-yellow-800">
                    ₹{userTipData.pendingTips.toFixed(2)}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    {userTipData.tips.filter(t => !t.isSettled).length} tip(s)
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700 font-medium">Settled</p>
                  <p className="text-xl font-bold text-green-800">
                    ₹{userTipData.settledTips.toFixed(2)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {userTipData.tips.filter(t => t.isSettled).length} tip(s)
                  </p>
                </div>
              </div>

              {/* Tips List */}
              <div className="mb-4 max-h-60 overflow-y-auto">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Recent Tips ({Math.min(5, userTipData.tips.length)} of {userTipData.tips.length})
                </h4>
                <div className="space-y-2">
                  {userTipData.tips.slice(0, 5).map((tip) => (
                    <div
                      key={tip.id}
                      className={`flex justify-between items-start p-3 rounded-lg border ${
                        tip.isSettled 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-800">
                            Table: {tip.tableNumber}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            tip.paymentMode === 'CASH' 
                              ? 'bg-green-100 text-green-700'
                              : tip.paymentMode === 'UPI'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {tip.paymentMode}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {new Date(tip.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })} • {new Date(tip.date).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {tip.isSettled && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Settled on {new Date(tip.settledAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short'
                            })}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-3">
                        <p className="font-bold text-lg text-gray-800">
                          ₹{tip.amount.toFixed(2)}
                        </p>
                        {!tip.isSettled && (
                          <button
                            onClick={() => handleSettleSingleTip(tip.id)}
                            className="text-xs text-green-600 hover:text-green-700 hover:underline mt-1"
                          >
                            Mark Settled
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {userTipData.pendingTips > 0 && (
                  <button
                    onClick={() => handleSettleTips(userTipData.user.id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <span>💰</span>
                    <span>Settle All Pending Tips (₹{userTipData.pendingTips.toFixed(2)})</span>
                  </button>
                )}

                {userTipData.tips.length > 5 && (
                  <button
                    onClick={() => setSelectedUser(userTipData)}
                    className="w-full text-indigo-600 hover:text-indigo-700 text-sm font-medium py-2"
                  >
                    View All {userTipData.tips.length} Tips →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {filter === 'pending' 
              ? 'No Pending Tips'
              : filter === 'settled'
              ? 'No Settled Tips Yet'
              : 'No Tips Recorded Yet'}
          </h3>
          <p className="text-gray-500">
            {filter === 'pending' 
              ? 'All tips have been settled'
              : filter === 'settled'
              ? 'No tips have been settled yet'
              : 'Tips will appear here when customers give them'}
          </p>
        </div>
      )}

      {/* Detailed Modal - View All Tips */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-4 border-b">
              <div className="flex items-center gap-3">
                {selectedUser.user.photo ? (
                  <img
                    src={selectedUser.user.photo}
                    alt={selectedUser.user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-600">
                    {selectedUser.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{selectedUser.user.name}</h3>
                  <p className="text-sm text-gray-600">All Tips - {selectedUser.tips.length} total</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-600 hover:text-gray-800 text-3xl leading-none"
              >
                ×
              </button>
            </div>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-700 font-medium">Total</p>
                <p className="text-2xl font-bold text-blue-800">₹{selectedUser.totalTips.toFixed(2)}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-sm text-yellow-700 font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-800">₹{selectedUser.pendingTips.toFixed(2)}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-sm text-green-700 font-medium">Settled</p>
                <p className="text-2xl font-bold text-green-800">₹{selectedUser.settledTips.toFixed(2)}</p>
              </div>
            </div>

            {/* All Tips List */}
            <div className="space-y-3">
              {selectedUser.tips.map((tip) => (
                <div
                  key={tip.id}
                  className={`flex justify-between items-start p-4 rounded-lg border ${
                    tip.isSettled ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-800 text-lg">
                        Table: {tip.tableNumber}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        tip.paymentMode === 'CASH' 
                          ? 'bg-green-100 text-green-700'
                          : tip.paymentMode === 'UPI'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {tip.paymentMode}
                      </span>
                      {tip.isSettled && (
                        <span className="text-xs px-2 py-1 rounded bg-green-600 text-white font-medium">
                          ✓ Settled
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      📅 {new Date(tip.date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })} at {new Date(tip.date).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {tip.isSettled && (
                      <p className="text-xs text-green-700 mt-1">
                        ✓ Settled on {new Date(tip.settledAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })} at {new Date(tip.settledAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-2xl text-gray-800">₹{tip.amount.toFixed(2)}</p>
                    {!tip.isSettled && (
                      <button
                        onClick={() => {
                          handleSettleSingleTip(tip.id);
                          setSelectedUser(null);
                        }}
                        className="mt-2 text-sm text-green-600 hover:text-green-700 hover:underline font-medium"
                      >
                        Mark as Settled
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Settle All Button in Modal */}
            {selectedUser.pendingTips > 0 && (
              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    handleSettleTips(selectedUser.user.id);
                    setSelectedUser(null);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold text-lg"
                >
                  💰 Settle All {selectedUser.tips.filter(t => !t.isSettled).length} Pending Tips 
                  (₹{selectedUser.pendingTips.toFixed(2)})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
