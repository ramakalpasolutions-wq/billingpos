'use client';

import { useEffect, useState } from 'react';

export default function KitchenProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/kitchen/profile');
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!user) {
    return <div>Profile not found</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h1>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Name</label>
            <div className="px-4 py-3 bg-gray-50 border rounded-lg">
              <p className="text-gray-800 font-medium">{user.name}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
            <div className="px-4 py-3 bg-gray-50 border rounded-lg">
              <p className="text-gray-800 font-medium">{user.email}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Phone</label>
            <div className="px-4 py-3 bg-gray-50 border rounded-lg">
              <p className="text-gray-800 font-medium">{user.phone}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Role</label>
            <div className="px-4 py-3 bg-gray-50 border rounded-lg">
              <p className="text-gray-800 font-medium">{user.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
