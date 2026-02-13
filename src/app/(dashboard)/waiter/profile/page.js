'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function WaiterProfile() {
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/waiter/profile');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch profile');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold text-lg mb-2">Error Loading Profile</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchProfile}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
        <p className="text-gray-600 mt-1">View your personal information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col items-center">
              {user.photo ? (
                <img
                  src={user.photo}
                  alt={user.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100 mb-4"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-indigo-100 flex items-center justify-center text-4xl font-bold text-indigo-600 mb-4">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <h2 className="text-2xl font-bold text-gray-800 text-center">{user.name}</h2>
              <p className="text-indigo-600 font-medium mt-1">{user.role}</p>
              
              <div className="mt-4 w-full space-y-2">
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <span className="text-sm">📧</span>
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <span className="text-sm">📱</span>
                  <span className="text-sm">{user.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Card */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Full Name
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-800 font-medium">{user.name}</p>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Email Address
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-800 font-medium">{user.email}</p>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Phone Number
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-800 font-medium">{user.phone}</p>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Role
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-800 font-medium">{user.role}</p>
                </div>
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Address
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-800 font-medium">{user.address}</p>
                </div>
              </div>

              {/* Aadhar Number */}
              {user.aadharNumber && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Aadhar Number
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-800 font-medium">
                      {user.aadharNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')}
                    </p>
                  </div>
                </div>
              )}

              {/* Assigned Hours */}
              {user.assignedHours && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Assigned Hours
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-800 font-medium">{user.assignedHours}</p>
                  </div>
                </div>
              )}

              {/* Branch */}
              {user.branch && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Branch
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-800 font-medium">{user.branch.name}</p>
                    <p className="text-gray-600 text-sm mt-1">{user.branch.address}</p>
                    <p className="text-gray-600 text-sm">📞 {user.branch.phone}</p>
                  </div>
                </div>
              )}

              {/* Restaurant */}
              {user.restaurant && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Restaurant
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-800 font-medium">{user.restaurant.name}</p>
                    <p className="text-gray-600 text-sm mt-1">{user.restaurant.address}</p>
                    <p className="text-gray-600 text-sm">📞 {user.restaurant.phone}</p>
                  </div>
                </div>
              )}

              {/* Account Created */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Account Created
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-800 font-medium">
                    {new Date(user.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Last Updated */}
              {user.updatedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Last Updated
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-800 font-medium">
                      {new Date(user.updatedAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Note */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ℹ️ <strong>Note:</strong> Your profile information is read-only. 
                Please contact your manager or administrator if you need to update any details.
              </p>
            </div>

            {/* Password Change Notice */}
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                🔐 To reset your password, please contact the cashier or chairman. 
                They will send a reset link to their registered email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
