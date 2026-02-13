'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function ChairmanProfile() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [restaurant, setRestaurant] = useState(null);
  const [formData, setFormData] = useState({
    ownerName: '',
    phone: '',
    email: '',
    license: '',
    cgst: '',
    sgst: '',
    address: ''
  });

  useEffect(() => {
    if (session) {
      fetchRestaurant();
    }
  }, [session]);

  const fetchRestaurant = async () => {
    try {
      const response = await fetch('/api/chairman/profile');
      const data = await response.json();
      
      setRestaurant(data.restaurant);
      setFormData({
        ownerName: data.restaurant.ownerName,
        phone: data.restaurant.phone,
        email: data.restaurant.email,
        license: data.restaurant.license,
        cgst: data.restaurant.cgst || '',
        sgst: data.restaurant.sgst || '',
        address: data.restaurant.address
      });
    } catch (error) {
      console.error('Failed to fetch restaurant:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/chairman/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      setEditing(false);
      fetchRestaurant();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Restaurant Profile</h3>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              Edit Profile
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Restaurant Name (Not Editable) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restaurant Name
            </label>
            <input
              type="text"
              value={restaurant.name}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Restaurant name cannot be changed</p>
          </div>

          {/* Owner Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Name *
              </label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                disabled={!editing}
                required
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                  !editing ? 'bg-gray-50' : 'focus:ring-2 focus:ring-blue-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!editing}
                required
                pattern="[0-9]{10}"
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                  !editing ? 'bg-gray-50' : 'focus:ring-2 focus:ring-blue-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!editing}
                required
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                  !editing ? 'bg-gray-50' : 'focus:ring-2 focus:ring-blue-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Number *
              </label>
              <input
                type="text"
                name="license"
                value={formData.license}
                onChange={handleChange}
                disabled={!editing}
                required
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                  !editing ? 'bg-gray-50' : 'focus:ring-2 focus:ring-blue-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CGST (Optional)
              </label>
              <input
                type="text"
                name="cgst"
                value={formData.cgst}
                onChange={handleChange}
                disabled={!editing}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                  !editing ? 'bg-gray-50' : 'focus:ring-2 focus:ring-blue-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SGST (Optional)
              </label>
              <input
                type="text"
                name="sgst"
                value={formData.sgst}
                onChange={handleChange}
                disabled={!editing}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                  !editing ? 'bg-gray-50' : 'focus:ring-2 focus:ring-blue-500'
                }`}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!editing}
                required
                rows="3"
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                  !editing ? 'bg-gray-50' : 'focus:ring-2 focus:ring-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Action Buttons */}
          {editing && (
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  fetchRestaurant();
                }}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          )}
        </form>

        {/* Additional Info */}
        <div className="mt-8 pt-6 border-t">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Registered On:</span>
              <span className="ml-2 font-medium text-gray-900">
                {new Date(restaurant.createdAt).toLocaleDateString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Last Updated:</span>
              <span className="ml-2 font-medium text-gray-900">
                {new Date(restaurant.updatedAt).toLocaleDateString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
