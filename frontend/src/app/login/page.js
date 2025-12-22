'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, role } = useAuth();
  const [theme, setTheme] = useState('');
  const router = useRouter();

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

  useEffect(() => {
    // Redirect if already logged in
    if (user && role) {
      if (role === 'pengurus') {
        router.push('/pengurus/dashboard');
      } else {
        router.push('/santri/dashboard');
      }
    }
  }, [user, role, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(username, password);
      
      // Redirect based on role
      if (response.role === 'pengurus') {
        router.push('/pengurus/dashboard');
      } else {
        router.push('/santri/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa username dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="rounded-2xl shadow-xl w-full max-w-md p-8" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Sistem Absensi PPM</h1>
          <p className="text-gray-600">Silakan login untuk melanjutkan</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Memproses...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Belum punya akun?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Daftar Santri
            </Link>
          </p>
        </div>
          <div className="fixed bottom-4 right-4 z-50">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="px-4 py-3 rounded-full shadow border border-gray-300"
              style={{ backgroundColor: 'var(--surface)' }}
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
          </div>
      </div>
    </div>
  );
}
