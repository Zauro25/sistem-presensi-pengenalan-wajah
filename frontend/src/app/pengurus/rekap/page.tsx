'use client';

import { useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const STATUS_LABELS = ['Hadir', 'Izin', 'T1', 'T2', 'T3', '-'];
const STATUS_COLORS = {
  Hadir: '#16a34a',
  Izin: '#2563eb',
  T1: '#ca8a04',
  T2: '#f97316',
  T3: '#dc2626',
  '-': '#6b7280',
};

type RecapRow = Record<string, unknown>;

type RecapStats = {
  Hadir: number;
  Izin: number;
  T1: number;
  T2: number;
  T3: number;
  Minus: number;
  Kosong: number;
  Santri: number;
  Kolom: number;
  PresentaseHadir: number;
  PresentaseTelat: number;
};

const countRecapStatuses = (rows: RecapRow[], headers: Array<{ col_key: string }>): RecapStats => {
  const counts: RecapStats = {
    Hadir: 0,
    Izin: 0,
    T1: 0,
    T2: 0,
    T3: 0,
    Minus: 0,
    Kosong: 0,
    Santri: rows.length,
    Kolom: headers.length,
    PresentaseHadir: 0,
    PresentaseTelat: 0,
  };

  rows.forEach((row) => {
    headers.forEach((header) => {
      const value = String(row?.[header.col_key] || '').trim();
      if (value === 'Hadir') counts.Hadir += 1;
      else if (value === 'Izin') counts.Izin += 1;
      else if (value === 'T1') counts.T1 += 1;
      else if (value === 'T2') counts.T2 += 1;
      else if (value === 'T3') counts.T3 += 1;
      else if (value === '-') counts.Minus += 1;
      else counts.Kosong += 1;
    });
  });

  const totalSel = counts.Santri * counts.Kolom;
  const terisi = totalSel - counts.Kosong;
  const totalTelat = counts.T1 + counts.T2 + counts.T3;

  counts.PresentaseHadir = terisi > 0 ? Math.round((counts.Hadir / terisi) * 100) : 0;
  counts.PresentaseTelat = terisi > 0 ? Math.round((totalTelat / terisi) * 100) : 0;

  return counts;
};

const summaryCards = [
  { key: 'Hadir', label: 'Hadir', className: 'bg-green-50 text-green-700 border-green-200' },
  { key: 'Izin', label: 'Izin', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'T1', label: 'T1', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { key: 'T2', label: 'T2', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  { key: 'T3', label: 'T3', className: 'bg-red-50 text-red-700 border-red-200' },
];

function StatDonutChart({ stats }) {
  const chartItems = [
    { key: 'Hadir', label: 'Hadir', value: stats.Hadir, color: STATUS_COLORS.Hadir },
    { key: 'Izin', label: 'Izin', value: stats.Izin, color: STATUS_COLORS.Izin },
    { key: 'T1', label: 'T1', value: stats.T1, color: STATUS_COLORS.T1 },
    { key: 'T2', label: 'T2', value: stats.T2, color: STATUS_COLORS.T2 },
    { key: 'T3', label: 'T3', value: stats.T3, color: STATUS_COLORS.T3 },
    { key: '-', label: '-', value: stats.Minus, color: STATUS_COLORS['-'] },
  ];

  const total = chartItems.reduce((sum, item) => sum + item.value, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(240px,300px)_1fr]">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="relative mx-auto flex h-64 w-64 items-center justify-center">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="18" />
            {chartItems.map((item) => {
              if (!total || item.value <= 0) {
                return null;
              }

              const dash = (item.value / total) * circumference;
              const offset = circumference - accumulated;
              accumulated += dash;

              return (
                <circle
                  key={item.key}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="18"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
          <div className="absolute text-center">
            <div className="text-3xl font-bold text-gray-900">{total}</div>
            <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Sel</div>
          </div>
        </div>
        <div className="mt-4 text-center text-sm text-gray-500">
          Distribusi status presensi dari seluruh data terisi.
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {chartItems.map((item) => (
          <div key={item.key} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">{item.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{item.value}</p>
              </div>
              <div className="h-4 w-4 rounded-full" style={{ backgroundColor: item.color }} />
            </div>
            <div className="mt-3 h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${total > 0 ? Math.max((item.value / total) * 100, item.value > 0 ? 4 : 0) : 0}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RekapPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [kelas, setKelas] = useState('All');
  const [rekapData, setRekapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('putra');

  const recapStats = useMemo(() => {
    const headers = rekapData?.headers || [];
    const putraRows = rekapData?.putra || [];
    const putriRows = rekapData?.putri || [];

    const putraStats = countRecapStatuses(putraRows, headers);
    const putriStats = countRecapStatuses(putriRows, headers);
    const totalStats = countRecapStatuses([...(putraRows || []), ...(putriRows || [])], headers);

    return {
      headers,
      putra: putraStats,
      putri: putriStats,
      total: totalStats,
    };
  }, [rekapData]);

  const handleLoadRekap = async (e) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      setMessage({ type: 'error', text: 'Tanggal mulai dan akhir harus diisi' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.getRekap(startDate, endDate, kelas);
      setRekapData(response);
      setMessage({ type: 'success', text: 'Data rekap berhasil dimuat' });
      setActiveTab('putra');
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Gagal memuat rekap' });
      setRekapData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!startDate || !endDate) {
      setMessage({ type: 'error', text: 'Tanggal mulai dan akhir harus diisi' });
      return;
    }

    setExporting(true);
    setMessage({ type: '', text: '' });

    try {
      await api.exportXlsx(startDate, endDate, kelas);
      setMessage({ type: 'success', text: 'File Excel berhasil didownload' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Gagal export Excel' });
    } finally {
      setExporting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Hadir': 'bg-green-100 text-green-800',
      'T1': 'bg-yellow-100 text-yellow-800',
      'T2': 'bg-orange-100 text-orange-800',
      'T3': 'bg-red-100 text-red-800',
      'Izin': 'bg-primary-100 text-primary-800',
      '-': 'bg-red-50 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white text-center">Rekap Presensi</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Filter Rekap</h2>
        
        <form onSubmit={handleLoadRekap} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Akhir <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kelas
              </label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="All">All</option>
                <option value="Lambatan">Lambatan</option>
                <option value="Cepatan">Cepatan</option>
                <option value="Pra Saringan">Pra Saringan</option>
                <option value="Saringan">Saringan</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary-700 disabled:bg-primary-300"
            >
              {loading ? 'Memuat...' : 'Tampilkan Rekap'}
            </Button>
            <Button
              type="button"
              onClick={handleExport}
              disabled={exporting || !startDate || !endDate}
              className="bg-green-500 hover:bg-green-700 disabled:bg-green-300"
            >
              {exporting ? 'Exporting...' : 'Export Laporan'}
            </Button>
          </div>
        </form>
      </div>

      {rekapData && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Statistik Rekapitulasi</h2>
                <p className="text-sm text-gray-500">
                  Ringkasan berdasarkan data rekap pada rentang tanggal yang dipilih.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Total Santri</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{recapStats.total.Santri}</p>
                <p className="text-xs text-gray-500 mt-1">Putra {recapStats.putra.Santri} • Putri {recapStats.putri.Santri}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Persentase Kehadiran</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{recapStats.total.PresentaseHadir}%</p>
                <p className="text-xs text-gray-500 mt-1">Dari seluruh sel yang terisi</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Persentase Keterlambatan</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{recapStats.total.PresentaseTelat}%</p>
                <p className="text-xs text-gray-500 mt-1">T1 + T2 + T3 dari seluruh sel yang terisi</p>
              </div>
            </div>

            <StatDonutChart stats={recapStats.total} />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="putra">Rekap Putra</TabsTrigger>
              <TabsTrigger value="putri">Rekap Putri</TabsTrigger>
            </TabsList>

            <TabsContent value="putra">
              {rekapData.putra && rekapData.putra.length > 0 ? (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Rekap Putra</h2>
                  </div>
                  <div className="p-6 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                            Nama
                          </th>
                          {rekapData.headers.map((header, idx) => (
                            <th key={idx} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                              {header.col_key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rekapData.putra.map((row, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                              {row.Nama}
                            </td>
                            {rekapData.headers.map((header, hidx) => {
                              const value = row[header.col_key] || '';
                              return (
                                <td key={hidx} className="px-4 py-3 text-center text-sm whitespace-nowrap">
                                  {value && value !== '' && (
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(value)}`}>
                                      {value}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                  Tidak ada data santri putra
                </div>
              )}
            </TabsContent>

            <TabsContent value="putri">
              {rekapData.putri && rekapData.putri.length > 0 ? (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Rekap Putri</h2>
                  </div>
                  <div className="p-6 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                            Nama
                          </th>
                          {rekapData.headers.map((header, idx) => (
                            <th key={idx} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                              {header.col_key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rekapData.putri.map((row, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                              {row.Nama}
                            </td>
                            {rekapData.headers.map((header, hidx) => {
                              const value = row[header.col_key] || '';
                              return (
                                <td key={hidx} className="px-4 py-3 text-center text-sm whitespace-nowrap">
                                  {value && value !== '' && (
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(value)}`}>
                                      {value}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                  Tidak ada data santri putri
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

