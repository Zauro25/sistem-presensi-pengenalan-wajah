'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export default function SantriDashboard() {
  const { user } = useAuth();
  const [izinList, setIzinList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attLoading, setAttLoading] = useState(true);
  const [attError, setAttError] = useState('');
  const [attendance, setAttendance] = useState({ total: 0, hadir: 0, t1: 0, t2: 0, t3: 0 });

  useEffect(() => {
    loadIzinHistory();
  }, []);

  useEffect(() => {
    loadAttendanceStats();
  }, [user]);

  const loadIzinHistory = async () => {
    try {
      const response = await api.listIzinSantri();
      setIzinList(response.data || []);
    } catch (error) {
      console.error('Error loading izin:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceStats = async () => {
    if (!user) return;
    setAttLoading(true);
    setAttError('');
    try {
      const end = todayISO();
      const start = daysAgoISO(14);
      const rekap = await api.getRekap(start, end, null);
      const nama = user.nama_lengkap || user.username;
      const rows = [...(rekap?.putra || []), ...(rekap?.putri || [])];
      const me = rows.find((r) => r.nama === nama);
      if (!me) {
        setAttendance({ total: 0, hadir: 0, t1: 0, t2: 0, t3: 0 });
        return;
      }
      const values = Object.values(me).filter((v) => typeof v === 'string');
      const statuses = values.filter((v) => ['Hadir', 'T1', 'T2', 'T3'].includes(v));
      const hadir = statuses.filter((v) => v === 'Hadir').length;
      const t1 = statuses.filter((v) => v === 'T1').length;
      const t2 = statuses.filter((v) => v === 'T2').length;
      const t3 = statuses.filter((v) => v === 'T3').length;
      setAttendance({ total: statuses.length, hadir, t1, t2, t3 });
    } catch (error) {
      console.error('Error loading attendance stats:', error);
      setAttError('Gagal memuat statistik absensi');
    } finally {
      setAttLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Menunggu': 'bg-yellow-100 text-yellow-800',
      'Disetujui': 'bg-green-100 text-green-800',
      'Ditolak': 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 text-center">Dashboard Santri</h1>
        <p className="text-gray-600 mt-2 text-center">Selamat datang, {user?.nama_lengkap || user?.username}</p>
      </div>

      {/* Info + Attendance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Nama</p>
              <p className="text-lg font-semibold text-gray-900">{user?.nama_lengkap || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sektor</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{user?.sektor || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Angkatan</p>
              <p className="text-lg font-semibold text-gray-900">{user?.angkatan || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Statistik Absensi (14 hari)</p>
              {attLoading ? (
                <p className="text-lg font-semibold text-gray-900">...</p>
              ) : attError ? (
                <p className="text-sm text-red-600">{attError}</p>
              ) : (
                <p className="text-sm text-gray-800">
                  Total {attendance.total} | Hadir {attendance.hadir} | T1 {attendance.t1} | T2 {attendance.t2} | T3 {attendance.t3}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Izin */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Riwayat Izin Terbaru</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : izinList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Belum ada riwayat izin
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sesi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alasan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {izinList.slice(0, 5).map((izin) => (
                    <tr key={izin.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(izin.tanggal).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{izin.sesi}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{izin.kelas || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{izin.alasan}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(izin.status)}`}>
                          {izin.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
