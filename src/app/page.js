import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl font-bold">POS</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Restaurant POS System
          </h1>
          <p className="text-gray-600">
            Complete billing and management solution
          </p>
        </div>

        {/* Features */}
        <div className="mb-8 space-y-3 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">✓</span>
            </div>
            <span className="text-gray-700">Multi-branch management</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">📱</span>
            </div>
            <span className="text-gray-700">Online orders integration</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🍳</span>
            </div>
            <span className="text-gray-700">Kitchen order tracking</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
            <span className="text-gray-700">Complete billing system</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Login to Your Account
          </Link>
          <Link
            href="/register"
            className="block w-full bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-3 rounded-lg transition-colors"
          >
            Register New Restaurant
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Powered by Ramakalpa Solutions
          </p>
        </div>
      </div>
    </div>
  );
}
