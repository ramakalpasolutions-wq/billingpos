'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function WaiterLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (session && session.user.role !== 'WAITER') {
      router.push('/login');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session || session.user.role !== 'WAITER') {
    return null;
  }

  const navItems = [
    { name: 'Dashboard', href: '/waiter/dashboard', icon: '📊' },
    { name: 'Orders', href: '/waiter/orders', icon: '🍽️' },
    { name: 'Pending Orders', href: '/waiter/pending-orders', icon: '⏳' },
    { name: 'Tips', href: '/waiter/tips', icon: '💰' },
    { name: 'Profile', href: '/waiter/profile', icon: '👤' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-indigo-900 text-white transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 bg-indigo-800">
          <h1 className="text-xl font-bold">Waiter Portal</h1>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white"
          >
            ✕
          </button>
        </div>

        <nav className="mt-8 px-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 mb-2 rounded-lg transition-colors ${
                pathname === item.href
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-100 hover:bg-indigo-800'
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4">
          <div className="bg-indigo-800 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                {session.user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{session.user.name}</p>
                <p className="text-xs text-indigo-300">{session.user.role}</p>
              </div>
            </div>
            <button
              onClick={() => {
                router.push('/api/auth/signout');
              }}
              className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className={`fixed top-4 left-4 z-40 lg:hidden bg-indigo-600 text-white p-2 rounded-lg ${sidebarOpen ? 'hidden' : 'block'}`}
      >
        ☰
      </button>

      {/* Main content */}
      <main className={`transition-all duration-200 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
