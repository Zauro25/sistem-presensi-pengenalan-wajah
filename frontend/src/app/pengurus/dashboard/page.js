'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function PengurusDashboard() {
  const [stats, setStats] = useState({
    totalSantri: 0,
    putra: 0,
    putri: 0,
    registeredFaces: 0,
    noFaces: 0,
    pendingIzin: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [santriRes, izinRes] = await Promise.all([
        api.listSantri(),
        api.listPermohonanIzin(),
      ]);

      const santri = santriRes.data || [];
      const pendingIzin = (izinRes.data || []).filter((i) => i.status === 'Menunggu').length;
      const putra = santri.filter((s) => (s.sektor || '').toLowerCase() === 'putra').length;
      const putri = santri.filter((s) => (s.sektor || '').toLowerCase() === 'putri').length;
      const registeredFaces = santri.filter((s) => Array.isArray(s.face_encoding) || s.face_encoding).length;
      const noFaces = santri.length - registeredFaces;

      setStats({
        totalSantri: santri.length,
        putra,
        putri,
        registeredFaces,
        noFaces,
        pendingIzin,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 text-center">Dashboard Pengurus</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        {[
          { label: 'Total Santri', value: stats.totalSantri, icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          )},
          { label: 'Putra', value: stats.putra, icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          )},
          { label: 'Putri', value: stats.putri, icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l-2-2m0 0l-2 2m2-2v6m4-6l-2-2m0 0l-2 2m2-2v6m-7-6a7 7 0 1114 0 7 7 0 01-14 0z" />
          )},
          { label: 'Face Registered', value: stats.registeredFaces, icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          )},
          { label: 'Izin (Menunggu Persetujuan)', value: stats.pendingIzin, icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          )},
        ].map((card) => (
          <div key={card.label} className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
            <div className="flex items-center">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'color-mix(in oklab, var(--foreground) 12%, transparent)' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--foreground)' }}>
                  {card.icon}
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium" style={{ color: 'color-mix(in oklab, var(--foreground) 70%, transparent)' }}>{card.label}</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{loading ? '-' : card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
