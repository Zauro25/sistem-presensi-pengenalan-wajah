'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function VerifikasiIzinPage() {
  const [izinList, setIzinList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedIzin, setSelectedIzin] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    loadPendingIzin();
  }, []);

  const loadPendingIzin = async () => {
    try {
      const response = await api.listPermohonanIzin();
      setIzinList(response.data || []);
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal memuat data izin' });
    } finally {
      setLoading(false);
    }
  };

  const handleValidasi = async (izinId, status) => {
    setProcessing(izinId);
    setMessage({ type: '', text: '' });

    try {
      await api.validasiIzin(izinId, status, note);
      setMessage({ 
        type: 'success', 
        text: `Izin berhasil ${status.toLowerCase()}!` 
      });
      setSelectedIzin(null);
      setNote('');
      loadPendingIzin(); // Reload list
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Gagal memvalidasi izin' });
    } finally {
      setProcessing(null);
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

  const pendingIzin = izinList.filter(i => i.status === 'Menunggu');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 text-center">Verifikasi Izin</h1>
        <p className="text-gray-600 mt-2 text-center">Kelola permohonan izin santri</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-6 px-4 py-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Pending Count */}
      <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 font-medium">
          {pendingIzin.length} permohonan izin menunggu verifikasi
        </p>
      </div>

      {/* Izin List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Daftar Permohonan Izin</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : izinList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Belum ada permohonan izin
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Santri</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal & Sesi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alasan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {izinList.map((izin) => (
                    <tr key={izin.id} className={selectedIzin?.id === izin.id ? 'bg-blue-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{izin.nama}</div>
                        <div className="text-sm text-gray-500">ID: {izin.santri_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{izin.kelas || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{new Date(izin.tanggal).toLocaleDateString('id-ID')}</div>
                        <div className="text-sm text-gray-500">{izin.sesi}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{izin.alasan}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(izin.status)}`}>
                          {izin.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {izin.status === 'Menunggu' ? (
                          <button
                            onClick={() => setSelectedIzin(izin)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Proses
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Validation Modal */}
      {selectedIzin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Verifikasi Izin</h3>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Nama Santri</p>
                  <p className="font-semibold text-gray-900">{selectedIzin.nama}</p>
                </div>
                <div>
                  <p className="text-gray-600">Kelas</p>
                  <p className="font-semibold text-gray-900">{selectedIzin.kelas || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Tanggal</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedIzin.tanggal).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Sesi</p>
                  <p className="font-semibold text-gray-900">{selectedIzin.sesi}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600">Alasan</p>
                  <p className="font-semibold text-gray-900">{selectedIzin.alasan}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan (Opsional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tambahkan catatan jika diperlukan..."
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => handleValidasi(selectedIzin.id, 'Disetujui')}
                disabled={processing === selectedIzin.id}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-green-300"
              >
                ✓ Setujui
              </button>
              <button
                onClick={() => handleValidasi(selectedIzin.id, 'Ditolak')}
                disabled={processing === selectedIzin.id}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-red-300"
              >
                ✕ Tolak
              </button>
              <button
                onClick={() => {
                  setSelectedIzin(null);
                  setNote('');
                }}
                disabled={processing === selectedIzin.id}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
