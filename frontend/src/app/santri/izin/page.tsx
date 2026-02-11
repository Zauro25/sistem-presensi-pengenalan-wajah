'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export default function IzinPage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [izinList, setIzinList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    kelas: '',
    tanggal: '',
    sesi: 'Subuh',
    alasan: '',
  });

  useEffect(() => {
    loadIzinList();
  }, []);

  const loadIzinList = async () => {
    try {
      const response = await api.listIzinSantri();
      setIzinList(response.data || []);
    } catch (error) {
      console.error('Error loading izin:', error);
    } finally {
      setLoadingList(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!formData.tanggal || !formData.sesi || !formData.alasan) {
      setMessage({ 
        type: 'error', 
        text: 'Harap lengkapi semua field yang diperlukan (Tanggal, Sesi, Alasan)' 
      });
      setLoading(false);
      return;
    }

    try {
      const santriId = user?.santri_id;
      if (!santriId) {
        setMessage({ 
          type: 'error', 
          text: 'Data pengguna tidak lengkap. Silakan login kembali.' 
        });
        setLoading(false);
        return;
      }

      const payload = {
        santri: santriId,
        kelas: formData.kelas || '',
        tanggal: formData.tanggal,
        sesi: formData.sesi,
        alasan: formData.alasan,
      };

      console.log('Submitting izin with data:', payload);
      await api.permohonanIzin(payload);

      setMessage({ type: 'success', text: 'Permohonan izin berhasil diajukan!' });
      setFormData({
        kelas: '',
        tanggal: '',
        sesi: 'Subuh',
        alasan: '',
      });
      setShowForm(false);
      loadIzinList();
    } catch (error) {
      console.error('Error object:', error);
      console.error('Error message:', error?.message);
      console.error('Error data:', error?.data);
      const errorMessage = error?.message || error?.data?.message || 'Gagal mengajukan izin';
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
    } finally {
      setLoading(false);
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 text-center">Pengajuan Izin</h1>
        </div>
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

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Form Permohonan Izin</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Santri
                </label>
                <input
                  type="text"
                  value={user?.nama_lengkap || user?.username || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kelas
                </label>
                <select
                  name="kelas"
                  value={formData.kelas}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Pilih kelas (opsional)</option>
                  <option value="Semua Kelas">Semua kelas</option>
                  <option value="Lambatan">Lambatan</option>
                  <option value="Cepatan">Cepatan</option>
                  <option value="Pra Saringan">Pra Saringan</option>
                  <option value="Saringan">Saringan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sesi <span className="text-red-500">*</span>
                </label>
                <select
                  name="sesi"
                  value={formData.sesi}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="Subuh">Subuh</option>
                  <option value="Sore">Sore</option>
                  <option value="Malam">Malam</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alasan Izin <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="alasan"
                  value={formData.alasan}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Jelaskan alasan Anda meminta izin..."
                  required
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:bg-primary-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Mengirim...' : 'Kirim Permohonan'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Riwayat Permohonan Izin</h2>
        </div>
        <div className="p-6">
          {loadingList ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : izinList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Belum ada permohonan izin
            </div>
          ) : (
            <div className="space-y-4">
              {izinList.map((izin) => (
                <div key={izin.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {new Date(izin.tanggal).toLocaleDateString('id-ID', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                          <p className="text-sm text-gray-600">Sesi: {izin.sesi} • Kelas: {izin.kelas || '-'}</p>
                        </div>
                      </div>
                      <p className="mt-5 text-gray-700 mb-2 font-semibold">Alasan: {izin.alasan}</p>
                      {izin.note && (
                        <div className="mt-2 p-3 bg-gray-50 rounded border-l-4 border-primary text-center">
                          <p className="text-sm font-medium text-gray-700"><b>Catatan:</b></p>
                          <p className="text-sm text-gray-600">{izin.note}</p>
                        </div>
                      )}
                    </div>
                    <span className={`ml-4 px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(izin.status)}`}>
                      {izin.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
        >
          {showForm ? 'Tutup Form' : 'Ajukan Izin'}
        </button>
      </div>
    </div>
  );
}
