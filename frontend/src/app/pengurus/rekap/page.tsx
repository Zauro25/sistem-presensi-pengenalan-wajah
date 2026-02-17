'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function RekapPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [kelas, setKelas] = useState('All');
  const [rekapData, setRekapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

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
      setActiveTab('summary');
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

      {message.text && (
        <div className={`mb-6 px-4 py-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Ringkasan</TabsTrigger>
            <TabsTrigger value="putra">Rekap Putra</TabsTrigger>
            <TabsTrigger value="putri">Rekap Putri</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Santri Putra</p>
                    <p className="text-2xl font-bold text-gray-900">{rekapData.putra?.length || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-pink-100 rounded-lg">
                    <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Santri Putri</p>
                    <p className="text-2xl font-bold text-gray-900">{rekapData.putri?.length || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Sesi</p>
                    <p className="text-2xl font-bold text-gray-900">{rekapData.headers?.length || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Keterangan:</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center">
                  <span className={`px-2 py-1 rounded ${getStatusColor('Hadir')} mr-2`}>Hadir</span>
                  <span className="text-gray-600">Hadir tepat waktu</span>
                </div>
                <div className="flex items-center">
                  <span className={`px-2 py-1 rounded ${getStatusColor('T1')} mr-2`}>T1</span>
                  <span className="text-gray-600">Telat ≤5 menit</span>
                </div>
                <div className="flex items-center">
                  <span className={`px-2 py-1 rounded ${getStatusColor('T2')} mr-2`}>T2</span>
                  <span className="text-gray-600">Telat 5-15 menit</span>
                </div>
                <div className="flex items-center">
                  <span className={`px-2 py-1 rounded ${getStatusColor('T3')} mr-2`}>T3</span>
                  <span className="text-gray-600">Telat &gt;15 menit</span>
                </div>
                <div className="flex items-center">
                  <span className={`px-2 py-1 rounded ${getStatusColor('Izin')} mr-2`}>Izin</span>
                  <span className="text-gray-600">Izin disetujui</span>
                </div>
                <div className="flex items-center">
                  <span className={`px-2 py-1 rounded ${getStatusColor('-')} mr-2`}>-</span>
                  <span className="text-gray-600">Tidak hadir</span>
                </div>
              </div>
            </div>
          </TabsContent>

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
      )}
    </div>
  );
}

