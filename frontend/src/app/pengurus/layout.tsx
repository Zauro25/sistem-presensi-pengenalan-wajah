'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api } from '@/lib/api';

export default function PengurusLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingIzinCount, setPendingIzinCount] = useState(0);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');
    setTheme(initial);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', initial);
    }
  }, []);

  // Fetch pending izin count
  useEffect(() => {
    const fetchPendingIzin = async () => {
      try {
        const response = await api.listPermohonanIzin();
        const pendingCount = (response.data || []).filter((izin: any) => izin.status === 'Menunggu').length;
        setPendingIzinCount(pendingCount);
      } catch (error) {
        console.error('Error fetching pending izin:', error);
      }
    };

    fetchPendingIzin();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingIzin, 30000);
    
    // Listen for custom event when izin is validated
    const handleIzinValidated = () => {
      fetchPendingIzin();
    };
    window.addEventListener('izinValidated', handleIzinValidated);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('izinValidated', handleIzinValidated);
    };
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
      <div className="min-h-screen" style={{ color: 'var(--foreground)' }}>
        {/* Hamburger Button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-primary text-white shadow-lg"
          aria-label="Open sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Backdrop Overlay */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`fixed top-0 left-0 z-50 w-64 h-screen transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`} style={{ backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}>
          <div className="h-full px-3 py-4 overflow-y-auto">
            {/* Close Button (Mobile Only) */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-200 text-gray-600"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="mb-6 px-3">
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold text-center ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
                  Sistem Presensi PPM
                </h2>
              </div>
            </div>

            <div className="mb-6 px-3 py-3 bg-secondary rounded-lg">
              <p className="text-sm font-semibold text-white text-center">{user?.username}</p>
              <p className="text-xs text-white text-center">Pengurus</p>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    pathname === item.path
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.name}</span>
                  {item.name === 'Verifikasi Izin' && pendingIzinCount > 0 && (
                    <span className="ml-2 px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                      {pendingIzinCount}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

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

        <div className="md:ml-64">
          <main className="p-8 pt-20 md:pt-8">
            {children}
          </main>
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
