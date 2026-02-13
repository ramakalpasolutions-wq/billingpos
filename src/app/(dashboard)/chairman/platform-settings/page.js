'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function PlatformSettings() {
  const { data: session } = useSession();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [platforms, setPlatforms] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [swiggyForm, setSwiggyForm] = useState({
    apiKey: '',
    restaurantId: '',
    webhookSecret: '',
    isActive: false
  });

  const [zomatoForm, setZomatoForm] = useState({
    clientId: '',
    clientSecret: '',
    restaurantId: '',
    webhookSecret: '',
    isActive: false
  });

  const [dunzoForm, setDunzoForm] = useState({
    apiKey: '',
    clientId: '',
    merchantId: '',
    isActive: false
  });

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

  const fetchPlatformConfig = async (branchId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/chairman/platform-config?branchId=${branchId}`);
      const data = await response.json();
      
      if (response.ok) {
        setPlatforms(data.platforms);
        
        if (data.platforms.swiggy) {
          setSwiggyForm(data.platforms.swiggy);
        }
        if (data.platforms.zomato) {
          setZomatoForm(data.platforms.zomato);
        }
        if (data.platforms.dunzo) {
          setDunzoForm(data.platforms.dunzo);
        }
      }
    } catch (error) {
      console.error('Error fetching platform config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchSelect = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    setSelectedBranch(branch);
    if (branchId) {
      fetchPlatformConfig(branchId);
    }
  };

  const handleSwiggySubmit = async (e) => {
    e.preventDefault();
    if (!selectedBranch) return;

    setSaving(true);
    try {
      const response = await fetch('/api/chairman/platform-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranch.id,
          platform: 'swiggy',
          config: swiggyForm
        })
      });

      if (response.ok) {
        alert('✅ Swiggy configuration saved successfully!');
        fetchPlatformConfig(selectedBranch.id);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      alert('❌ ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleZomatoSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBranch) return;

    setSaving(true);
    try {
      const response = await fetch('/api/chairman/platform-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranch.id,
          platform: 'zomato',
          config: zomatoForm
        })
      });

      if (response.ok) {
        alert('✅ Zomato configuration saved successfully!');
        fetchPlatformConfig(selectedBranch.id);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      alert('❌ ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDunzoSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBranch) return;

    setSaving(true);
    try {
      const response = await fetch('/api/chairman/platform-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranch.id,
          platform: 'dunzo',
          config: dunzoForm
        })
      });

      if (response.ok) {
        alert('✅ Dunzo configuration saved successfully!');
        fetchPlatformConfig(selectedBranch.id);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      alert('❌ ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhooks/online-orders`
    : '';

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Online Platform Settings</h1>
        <p className="text-gray-600 mt-1">Configure Swiggy, Zomato, Dunzo and other delivery platforms</p>
      </div>

      {/* Branch Selection */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Branch</h2>
        <select
          value={selectedBranch?.id || ''}
          onChange={(e) => handleBranchSelect(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Select a Branch --</option>
          {branches.map(branch => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </select>
        {branches.length === 0 && (
          <p className="text-sm text-gray-500 mt-2">
            No branches found. Please create a branch first.
          </p>
        )}
      </div>

      {selectedBranch && (
        <>
          {/* Webhook URL Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <span>📡</span>
              <span>Webhook URL</span>
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Configure this URL in your platform's webhook/API settings to receive orders automatically:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={webhookUrl}
                readOnly
                className="flex-1 px-4 py-2 bg-white border border-blue-300 rounded-lg font-mono text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  alert('✅ Webhook URL copied to clipboard!');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                📋 Copy
              </button>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              💡 Tip: Make sure your server is accessible from the internet for webhooks to work
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Swiggy Configuration */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                    S
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Swiggy Configuration</h2>
                    <p className="text-sm text-gray-600">Configure Swiggy Partner API for order integration</p>
                  </div>
                  {platforms?.swiggy?.isActive && (
                    <span className="ml-auto bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      ✓ Active
                    </span>
                  )}
                </div>

                <form onSubmit={handleSwiggySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={swiggyForm.apiKey}
                      onChange={(e) => setSwiggyForm({...swiggyForm, apiKey: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter Swiggy API Key"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Restaurant ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={swiggyForm.restaurantId}
                      onChange={(e) => setSwiggyForm({...swiggyForm, restaurantId: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter Swiggy Restaurant ID"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webhook Secret (Optional)
                    </label>
                    <input
                      type="text"
                      value={swiggyForm.webhookSecret}
                      onChange={(e) => setSwiggyForm({...swiggyForm, webhookSecret: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter Webhook Secret for signature verification"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Used to verify incoming webhook requests from Swiggy
                    </p>
                  </div>

                  <div className="flex items-center pt-2">
                    <input
                      type="checkbox"
                      checked={swiggyForm.isActive}
                      onChange={(e) => setSwiggyForm({...swiggyForm, isActive: e.target.checked})}
                      className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Enable Swiggy integration for this branch
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    {saving ? 'Saving...' : '💾 Save Swiggy Configuration'}
                  </button>
                </form>
              </div>

              {/* Zomato Configuration */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                    Z
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Zomato Configuration</h2>
                    <p className="text-sm text-gray-600">Configure Zomato Partner API for order integration</p>
                  </div>
                  {platforms?.zomato?.isActive && (
                    <span className="ml-auto bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      ✓ Active
                    </span>
                  )}
                </div>

                <form onSubmit={handleZomatoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={zomatoForm.clientId}
                      onChange={(e) => setZomatoForm({...zomatoForm, clientId: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      placeholder="Enter Zomato Client ID"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Secret <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={zomatoForm.clientSecret}
                      onChange={(e) => setZomatoForm({...zomatoForm, clientSecret: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      placeholder="Enter Zomato Client Secret"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Restaurant ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={zomatoForm.restaurantId}
                      onChange={(e) => setZomatoForm({...zomatoForm, restaurantId: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      placeholder="Enter Zomato Restaurant ID"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webhook Secret (Optional)
                    </label>
                    <input
                      type="text"
                      value={zomatoForm.webhookSecret}
                      onChange={(e) => setZomatoForm({...zomatoForm, webhookSecret: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      placeholder="Enter Webhook Secret for signature verification"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Used to verify incoming webhook requests from Zomato
                    </p>
                  </div>

                  <div className="flex items-center pt-2">
                    <input
                      type="checkbox"
                      checked={zomatoForm.isActive}
                      onChange={(e) => setZomatoForm({...zomatoForm, isActive: e.target.checked})}
                      className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Enable Zomato integration for this branch
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    {saving ? 'Saving...' : '💾 Save Zomato Configuration'}
                  </button>
                </form>
              </div>

              {/* Dunzo Configuration */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                    D
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Dunzo Configuration</h2>
                    <p className="text-sm text-gray-600">Configure Dunzo Partner API for delivery integration</p>
                  </div>
                  {platforms?.dunzo?.isActive && (
                    <span className="ml-auto bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      ✓ Active
                    </span>
                  )}
                </div>

                <form onSubmit={handleDunzoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={dunzoForm.apiKey}
                      onChange={(e) => setDunzoForm({...dunzoForm, apiKey: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter Dunzo API Key"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={dunzoForm.clientId}
                      onChange={(e) => setDunzoForm({...dunzoForm, clientId: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter Dunzo Client ID"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Merchant ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={dunzoForm.merchantId}
                      onChange={(e) => setDunzoForm({...dunzoForm, merchantId: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter Dunzo Merchant ID"
                      required
                    />
                  </div>

                  <div className="flex items-center pt-2">
                    <input
                      type="checkbox"
                      checked={dunzoForm.isActive}
                      onChange={(e) => setDunzoForm({...dunzoForm, isActive: e.target.checked})}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Enable Dunzo integration for this branch
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    {saving ? 'Saving...' : '💾 Save Dunzo Configuration'}
                  </button>
                </form>
              </div>
            </>
          )}
        </>
      )}

      {!selectedBranch && branches.length > 0 && (
        <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Select a Branch
          </h3>
          <p className="text-gray-600">
            Choose a branch from the dropdown above to configure platform integrations
          </p>
        </div>
      )}
    </div>
  );
}
