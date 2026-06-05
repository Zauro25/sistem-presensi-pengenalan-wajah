'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

type Santri = {
  id: number | string;
  nama?: string;
  sektor?: string;
  jenis_kelamin?: string;
  kelas?: string;
  kelas_list?: string | string[];
};

type IzinItem = {
  id: number | string;
  santri_id?: string | number;
  nama?: string;
  status?: string;
  tanggal?: string;
  sesi?: string;
  alasan?: string;
  kelas?: string;
};

type DashboardStats = {
  totalSantri: number;
  putra: number;
  putri: number;
  pendingIzin: number;
  hadirHariIni: number;
  izinHariIni: number;
  belumPresensiHariIni: number;
  telatHariIni: number;
};

type StatusCount = {
  Hadir: number;
  Izin: number;
  T1: number;
  T2: number;
  T3: number;
  Minus: number;
};

const DEFAULT_STATUS_COUNT: StatusCount = {
  Hadir: 0,
  Izin: 0,
  T1: 0,
  T2: 0,
  T3: 0,
  Minus: 0,
};

const prettyDate = (isoDate: string) => {
  if (!isoDate) return '-';
  const dt = new Date(isoDate);
  if (Number.isNaN(dt.getTime())) return '-';

  return dt.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const parseKelasList = (santri: Santri): string[] => {
  if (Array.isArray(santri.kelas_list)) {
    return santri.kelas_list.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof santri.kelas_list === 'string' && santri.kelas_list.trim()) {
    return santri.kelas_list
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof santri.kelas === 'string' && santri.kelas.trim()) {
    return [santri.kelas.trim()];
  }

  return ['Belum diatur'];
};

const getGenderGroup = (santri: Santri): 'putra' | 'putri' | 'unknown' => {
  const jk = (santri.jenis_kelamin || '').toString().trim().toLowerCase();
  if (jk === 'l' || jk === 'lk' || jk === 'laki-laki' || jk === 'laki laki') return 'putra';
  if (jk === 'p' || jk === 'pr' || jk === 'perempuan') return 'putri';

  // Fallback for legacy/dirty data where gender was mixed into sektor.
  const sektor = (santri.sektor || '').toString().trim().toLowerCase();
  if (sektor === 'putra') return 'putra';
  if (sektor === 'putri') return 'putri';

  return 'unknown';
};

const getLocalDateYmd = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeStatus = (value: unknown) => String(value || '').trim().toLowerCase();

export default function PengurusDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSantri: 0,
    putra: 0,
    putri: 0,
    pendingIzin: 0,
    hadirHariIni: 0,
    izinHariIni: 0,
    belumPresensiHariIni: 0,
    telatHariIni: 0,
  });
  const [statusToday, setStatusToday] = useState<StatusCount>(DEFAULT_STATUS_COUNT);
  const [recentIzin, setRecentIzin] = useState<IzinItem[]>([]);
  const [kelasSummary, setKelasSummary] = useState<Array<{ name: string; total: number }>>([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const today = getLocalDateYmd();
      const [santriRes, izinRes, rekapRes] = await Promise.all([
        api.listSantri(),
        api.listPermohonanIzin(),
        api.getRekap(today, today, 'All'),
      ]);

      const santri: Santri[] = santriRes.data || [];
      const izinList: IzinItem[] = izinRes.data || [];

      const pendingIzin = izinList.filter((item) => item.status === 'Menunggu').length;
      const putra = santri.filter((item) => getGenderGroup(item) === 'putra').length;
      const putri = santri.filter((item) => getGenderGroup(item) === 'putri').length;

      const rows = [...(rekapRes?.putra || []), ...(rekapRes?.putri || [])] as Array<Record<string, string>>;
      const hadirSet = new Set<string>();
      const izinSet = new Set<string>();
      const telatSet = new Set<string>();
      const t1Set = new Set<string>();
      const t2Set = new Set<string>();
      const t3Set = new Set<string>();

      rows.forEach((row) => {
        const santriKey = String(row.Nama || '').trim();
        let hasHadir = false;
        let hasIzin = false;
        let hasTelat = false;
        let hasT1 = false;
        let hasT2 = false;
        let hasT3 = false;

        Object.entries(row).forEach(([key, value]) => {
          if (key === 'Nama') return;

          const normalized = normalizeStatus(value);
          if (normalized === 'hadir') hasHadir = true;
          if (normalized === 'izin') hasIzin = true;
          if (normalized === 't1') hasT1 = true;
          if (normalized === 't2') hasT2 = true;
          if (normalized === 't3') hasT3 = true;
          if (normalized === 't1' || normalized === 't2' || normalized === 't3') hasTelat = true;
        });

        if (santriKey) {
          if (hasHadir) hadirSet.add(santriKey);
          if (hasIzin) izinSet.add(santriKey);
          if (hasTelat) telatSet.add(santriKey);
          if (hasT1) t1Set.add(santriKey);
          if (hasT2) t2Set.add(santriKey);
          if (hasT3) t3Set.add(santriKey);
        }
      });

      const telatHariIni = telatSet.size;
  const izinHariIni = izinSet.size;
  const santriTercatatSet = new Set<string>([...hadirSet, ...izinSet, ...telatSet]);
      const belumPresensiHariIni = Math.max(0, santri.length - santriTercatatSet.size);

      const kelasCounter = new Map<string, number>();
      santri.forEach((item) => {
        parseKelasList(item).forEach((kelas) => {
          kelasCounter.set(kelas, (kelasCounter.get(kelas) || 0) + 1);
        });
      });

      const kelasData = [...kelasCounter.entries()]
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);

      const izinSorted = [...izinList]
        .sort((a, b) => {
          const dateA = new Date(a.tanggal || '').getTime();
          const dateB = new Date(b.tanggal || '').getTime();
          return dateB - dateA;
        })
        .slice(0, 5);

      setStats({
        totalSantri: santri.length,
        putra,
        putri,
        pendingIzin,
        hadirHariIni: hadirSet.size,
        izinHariIni,
        belumPresensiHariIni,
        telatHariIni,
      });
      setStatusToday({
        Hadir: hadirSet.size,
        Izin: izinHariIni,
        T1: t1Set.size,
        T2: t2Set.size,
        T3: t3Set.size,
        Minus: belumPresensiHariIni,
      });
      setRecentIzin(izinSorted);
      setKelasSummary(kelasData);
      setLastUpdated(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setErrorMessage('Data dashboard belum bisa dimuat. Coba refresh lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const attendanceRate = useMemo(() => {
    if (stats.totalSantri === 0) return 0;
    return Math.round((stats.hadirHariIni / stats.totalSantri) * 100);
  }, [stats.hadirHariIni, stats.totalSantri]);

  const statusPills = [
    { label: 'Hadir', value: statusToday.Hadir, classes: 'bg-green-100 text-green-800' },
    { label: 'Izin', value: statusToday.Izin, classes: 'bg-blue-100 text-blue-800' },
    { label: 'T1', value: statusToday.T1, classes: 'bg-yellow-100 text-yellow-800' },
    { label: 'T2', value: statusToday.T2, classes: 'bg-orange-100 text-orange-800' },
    { label: 'T3', value: statusToday.T3, classes: 'bg-red-100 text-red-800' },
    { label: 'Tidak Hadir', value: statusToday.Minus, classes: 'bg-gray-200 text-gray-800' },
  ];

  return (
    <div className="space-y-6">
      <section
        className="rounded-2xl p-6 md:p-8 shadow-lg border"
        style={{
          background: 'linear-gradient(120deg, #0b1b3b 0%, #15376b 48%, #0f3b2e 100%)',
          borderColor: 'rgba(255,255,255,0.2)',
          color: '#ffffff',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold mt-1">Dashboard Presensi PPM</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadDashboardData}
              className="px-4 py-2.5 rounded-lg border border-white/40 bg-white/10 text-white font-medium hover:bg-white/20"
              disabled={loading}
            >
              {loading ? 'Memuat...' : 'Refresh Data'}
            </button>
            <div className="px-4 py-2.5 rounded-lg bg-black/20 text-sm">Update terakhir: {lastUpdated || '-'}</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 text-center">
          {[
            {
              label: 'Total Santri',
              value: stats.totalSantri,
              helper: `${stats.putra} putra • ${stats.putri} putri`,
            },
            {
              label: 'Total Kehadiran Hari Ini',
              value: stats.hadirHariIni,
              helper: `${attendanceRate}% dari total santri`,
            },
            {
              label: 'Total Keterlambatan Hari Ini',
              value: stats.telatHariIni,
              helper: 'Akumulasi T1 + T2 + T3',
            },
            {
              label: 'Izin Menunggu Persetujuan',
              value: stats.pendingIzin,
              helper: 'Perlu verifikasi pengurus',
            },
          ].map((item) => (
            <div key={item.label} className="rounded-xl p-4 bg-white/10 border border-white/20 backdrop-blur-sm">
              <p className="text-sm text-blue-100">{item.label}</p>
              <p className="text-3xl font-bold mt-2">{loading ? '-' : item.value}</p>
              <p className="text-xs text-blue-100 mt-1">{item.helper}</p>
            </div>
          ))}
        </div>
      </section>

      {errorMessage && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{errorMessage}</div>}

      <section>
        <div className="rounded-2xl border shadow-sm p-6" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Ringkasan Presensi Hari Ini</h2>
            </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {statusPills.map((pill) => (
                  <span key={pill.label} className={`px-3 py-1.5 rounded-full text-sm font-semibold ${pill.classes}`}>
                    {pill.label}: {loading ? '-' : pill.value}
                  </span>
                ))}
              </div>
          </div>



          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl p-4 border border-gray-200 bg-gray-50 text-center">
              <p className="text-sm text-gray-600">Izin Hari Ini</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{loading ? '-' : stats.izinHariIni}</p>
            </div>
            <div className="rounded-xl p-4 border border-gray-200 bg-gray-50 text-center">
              <p className="text-sm text-gray-600">Persentase Kehadiran hari ini</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{attendanceRate}%</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-2xl border shadow-sm p-6" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Permohonan Izin Terbaru</h2>
            <Link href="/pengurus/verifikasi-izin" className="text-sm font-semibold text-blue-600 hover:underline">
              Lihat Semua
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-gray-500">Memuat data izin...</div>
          ) : recentIzin.length === 0 ? (
            <div className="py-8 text-center text-gray-500">Belum ada data permohonan izin.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="text-left py-2 pr-4 font-semibold">Nama</th>
                    <th className="text-left py-2 pr-4 font-semibold">Kelas</th>
                    <th className="text-left py-2 pr-4 font-semibold">Tanggal</th>
                    <th className="text-left py-2 pr-4 font-semibold">Sesi</th>
                    <th className="text-left py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentIzin.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-medium text-gray-900">{item.nama || '-'}</td>
                      <td className="py-3 pr-4 text-gray-700">{item.kelas || '-'}</td>
                      <td className="py-3 pr-4 text-gray-700">{prettyDate(item.tanggal || '')}</td>
                      <td className="py-3 pr-4 text-gray-700">{item.sesi || '-'}</td>
                      <td className="py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'Disetujui'
                              ? 'bg-green-100 text-green-800'
                              : item.status === 'Ditolak'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {item.status || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border shadow-sm p-6" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h2 className="text-xl font-bold text-center" style={{ color: 'var(--foreground)' }}>Distribusi Kelas</h2>

          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="text-gray-500">Memuat distribusi kelas...</div>
            ) : kelasSummary.length === 0 ? (
              <div className="text-gray-500">Data kelas belum tersedia.</div>
            ) : (
              kelasSummary.map((item) => {
                const widthPercent = Math.round((item.total / Math.max(stats.totalSantri, 1)) * 100);
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900">{item.name}</span>
                      <span className="text-gray-600">{item.total} santri</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${widthPercent}%`, background: 'linear-gradient(90deg, #0f3b2e, #2563eb)' }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
