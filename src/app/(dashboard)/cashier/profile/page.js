'use client';

import { useSession } from 'next-auth/react';

export default function CashierProfile() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex items-center gap-6 mb-8">
          {session.user.photo ? (
            <img
              src={session.user.photo}
              alt={session.user.name}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-3xl text-blue-600">
                {session.user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h2 className="text-3xl font-bold text-gray-800">{session.user.name}</h2>
            <p className="text-gray-600 uppercase text-sm font-medium mt-1">
              {session.user.role}
            </p>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Profile Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Email Address
              </label>
              <p className="text-gray-900 font-medium">{session.user.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Branch
              </label>
              <p className="text-gray-900 font-medium">
                {session.user.branch?.name || 'Not Assigned'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Restaurant
              </label>
              <p className="text-gray-900 font-medium">
                {session.user.restaurant?.name}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                User ID
              </label>
              <p className="text-gray-900 font-mono text-sm">{session.user.id}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ℹ️ <strong>Note:</strong> Your profile details are not editable. 
            For any changes, please contact your restaurant administrator (Chairman).
          </p>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            🔐 <strong>Forgot Password?</strong> Password reset requests will be sent to the 
            Chairman's email address registered with the restaurant.
          </p>
        </div>
      </div>
    </div>
  );
}
