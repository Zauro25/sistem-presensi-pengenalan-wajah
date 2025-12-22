'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useEffect, useState } from 'react';

export default function PengurusLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState('');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');
    setTheme(initial);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', initial);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', next);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', next);
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/pengurus/dashboard'},
    { name: 'Presensi', path: '/pengurus/presensi'},
    { name: 'Verifikasi Izin', path: '/pengurus/verifikasi-izin'},
    { name: 'Verifikasi Data Santri', path: '/pengurus/verify-santri'},
    { name: 'Rekap Presensi', path: '/pengurus/rekap'},
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <ProtectedRoute allowedRoles={['pengurus']}>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
        {/* Sidebar */}
        <aside className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform" style={{ backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}>
          <div className="h-full px-3 py-4 overflow-y-auto">
            {/* Logo/Header */}
            <div className="mb-6 px-3">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-blue-600 text-center">Sistem Presensi PPM</h2>
              </div>
            </div>

            {/* User Info */}
            <div className="mb-6 px-3 py-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-900 text-center">{user?.username}</p>
              <p className="text-xs text-gray-600 text-center">Pengurus</p>
            </div>

            {/* Menu */}
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    pathname === item.path
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Logout */}
            <div className="absolute bottom-4 left-3 right-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <span className="mr-3"></span>
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="ml-64">
          <main className="p-8">
            {children}
          </main>
          {/* Floating Theme Toggle */}
          <div className="fixed bottom-4 right-4 z-50">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="px-4 py-3 rounded-full shadow border border-gray-300 bg-white"
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            >
              {theme === 'dark' ? 'dark' : 'light'}
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
