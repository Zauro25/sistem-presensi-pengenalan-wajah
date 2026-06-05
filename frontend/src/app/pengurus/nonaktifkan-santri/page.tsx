'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type SantriItem = {
  id: number;
  santri_id: string;
  nama: string;
  asal_daerah: string | null;
  sektor: string | null;
  angkatan: string | null;
};

export default function NonaktifkanSantriPage() {
  const [nama, setNama] = useState('');
  const [asalDaerah, setAsalDaerah] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingDeleteId, setLoadingDeleteId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({
    type: '',
    text: '',
  });
  const [results, setResults] = useState<SantriItem[]>([]);
  const [selectedSantri, setSelectedSantri] = useState<SantriItem | null>(null);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setLoadingSearch(true);
    setMessage({ type: '', text: '' });
    setResults([]);

    try {
      const response = await api.searchSantriForDeactivation(nama.trim(), asalDaerah.trim());
      const data = response.data || [];
      setResults(data);

      if (data.length === 0) {
        setMessage({ type: 'error', text: 'Santri tidak ditemukan' });
      }
    } catch (error: any) {
      const errorText = error?.message || 'Santri tidak ditemukan';
      setMessage({ type: 'error', text: errorText });
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!selectedSantri) {
      return;
    }

    setLoadingDeleteId(selectedSantri.id);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.deactivateSantri(selectedSantri.id);
      setResults((prev) => prev.filter((item) => item.id !== selectedSantri.id));
      setMessage({
        type: 'success',
        text: response.message || `${selectedSantri.nama} berhasil dinonaktifkan`,
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Gagal menonaktifkan santri' });
    } finally {
      setLoadingDeleteId(null);
      setSelectedSantri(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white text-center">Nonaktifkan Santri</h1>
      </div>

      {message.text && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap Santri</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Contoh: Ahmad Fauzi"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Asal Daerah</label>
            <input
              type="text"
              value={asalDaerah}
              onChange={(e) => setAsalDaerah(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Contoh: Lamongan"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loadingSearch}
            className="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:bg-primary-300 disabled:cursor-not-allowed"
          >
            {loadingSearch ? 'Mencari...' : 'Cari Santri'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Hasil Pencarian</h2>

        {results.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Belum ada data ditampilkan</div>
        ) : (
          <div className="space-y-3">
            {results.map((santri) => (
              <div
                key={santri.id}
                className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-gray-900">{santri.nama}</p>
                  <p className="text-sm text-gray-600">ID: {santri.santri_id}</p>
                  <p className="text-sm text-gray-600">Asal: {santri.asal_daerah || '-'}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSantri(santri)}
                  disabled={loadingDeleteId === santri.id}
                  className="px-4 py-2 rounded-lg text-white font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#b23a3a' }}
                >
                  {loadingDeleteId === santri.id ? 'Memproses...' : 'Nonaktifkan'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!selectedSantri} onOpenChange={(open) => !open && setSelectedSantri(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Nonaktifkan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah anda yakin ingin menonaktifkan santri? Akun login akan dinonaktifkan, tetapi data tetap tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-white border-0 hover:opacity-90" style={{ backgroundColor: '#b23a3a' }}>
              Tidak
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeactivate}
              className="text-white hover:opacity-90"
              style={{ backgroundColor: '#1f9d55' }}
            >
              Ya
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
