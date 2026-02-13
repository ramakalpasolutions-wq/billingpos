'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useOnlineOrderNotifications } from '@/hooks/useOnlineOrderNotifications';
import { useOnlinePendingNotifications } from '@/hooks/useOnlinePendingNotifications';

export default function CashierLayout({ children }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isAuthenticated = status === 'authenticated' && session?.user?.role === 'CASHIER';

  // Enable NEW online order notifications (double beep, urgent)
  useOnlineOrderNotifications(
    session?.user?.branchId, 
    isAuthenticated
  );

  // Enable PENDING order notifications (single beep, softer - when order becomes ready)
  useOnlinePendingNotifications(
    session?.user?.branchId,
    isAuthenticated
  );

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            console.log('Notification permission granted');
          }
        });
      }
    }
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/cashier/dashboard', icon: '📊' },
    { name: 'Orders', path: '/cashier/orders', icon: '🍽️' },
    { name: 'Pending Orders', path: '/cashier/pending-orders', icon: '⏳' },
    { name: 'Online Orders', path: '/cashier/online-orders', icon: '📱' },
    { name: 'Online Pending', path: '/cashier/online-pending', icon: '🔔' },
    { name: 'Employee Creation', path: '/cashier/employee-creation', icon: '👥' },
    { name: 'Tips', path: '/cashier/tips', icon: '💵' },
    { name: 'Debt', path: '/cashier/debt', icon: '💳' },
    { name: 'Order History', path: '/cashier/order-history', icon: '📜' },
    { name: 'Settings', path: '/cashier/settings', icon: '⚙️' },
    { name: 'Profile', path: '/cashier/profile', icon: '👤' },
  ];

  return (
    <>
      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 8000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '14px',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          },
          success: {
            duration: 12000,
            iconTheme: {
              primary: '#fff',
              secondary: '#10B981',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            },
          },
        }}
      />

      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-20'
          } bg-white shadow-lg transition-all duration-300 flex flex-col overflow-y-auto`}
        >
          {/* Logo */}
          <div className="p-4 border-b">
            <h1 className={`font-bold text-xl text-blue-600 ${!sidebarOpen && 'text-center'}`}>
              {sidebarOpen ? 'Cashier Portal' : 'C'}
            </h1>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span className="font-medium text-sm">{item.name}</span>}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-all"
            >
              <span className="text-xl">🚪</span>
              {sidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-600 hover:bg-gray-100"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white shadow-sm p-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {menuItems.find((item) => item.path === pathname)?.name || 'Dashboard'}
              </h2>
              <p className="text-sm text-gray-600">
                {session?.user?.branch?.name || 'No Branch Assigned'}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold text-gray-800">{session?.user?.name}</p>
                <p className="text-xs text-gray-500 uppercase">{session?.user?.role}</p>
              </div>
              {session?.user?.photo ? (
                <img
                  src={session.user.photo}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  {session?.user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </>
  );
}
