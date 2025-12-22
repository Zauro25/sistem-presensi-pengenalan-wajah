'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function VerifySantriPage() {
  const [santriName, setSantriName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [registrationCode, setRegistrationCode] = useState(null);
  const [codes, setCodes] = useState([]);
  const [showCodes, setShowCodes] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    setRegistrationCode(null);

    try {
      const response = await api.verifySantriName(santriName);
      
      if (response.verified) {
        setMessage({ type: 'success', text: response.message });
        setRegistrationCode({
          code: response.registration_code,
          expires_at: response.expires_at,
        });
        setSantriName('');
      } else {
        setMessage({ type: 'error', text: response.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Verifikasi gagal' });
    } finally {
      setLoading(false);
    }
  };

  const loadRegistrationCodes = async () => {
    try {
      const response = await api.listRegistrationCodes();
      setCodes(response.data || []);
      setShowCodes(true);
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal memuat daftar kode' });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Kode berhasil disalin!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  };

  const getValidityBadge = (code) => {
    if (code.used) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Sudah Digunakan</span>;
    }
    if (code.is_valid) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Aktif</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Kadaluarsa</span>;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 text-center">Verifikasi Data Santri</h1>
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

      {/* Verification Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        
        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Lengkap Santri <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={santriName}
              onChange={(e) => setSantriName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan nama lengkap sesuai database"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Memverifikasi...' : 'Verifikasi Santri'}
          </button>
        </form>
      </div>

      {/* Generated Code Display */}
      {registrationCode && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="ml-4 text-xl font-bold text-green-900">Kode Registrasi Berhasil Dibuat!</h3>
          </div>

          <div className="bg-white rounded-lg p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Kode Registrasi:</p>
                <p className="text-4xl font-mono font-bold text-gray-900 tracking-wider">{registrationCode.code}</p>
              </div>
              <button
                onClick={() => copyToClipboard(registrationCode.code)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Salin Kode
              </button>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Berlaku hingga: {new Date(registrationCode.expires_at).toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="bg-green-100 border border-green-300 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium mb-2">Instruksi untuk Santri:</p>
            <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
              <li>Buka halaman registrasi santri</li>
              <li>Masukkan kode registrasi: <span className="font-mono font-bold">{registrationCode.code}</span></li>
              <li>Isi form registrasi dengan lengkap</li>
              <li>Nama harus sesuai dengan yang diverifikasi</li>
              <li>Kode hanya dapat digunakan 1 kali</li>
            </ol>
          </div>
        </div>
      )}

      {/* View All Codes Button */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Daftar Kode Registrasi</h2>
          <button
            onClick={loadRegistrationCodes}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            {showCodes ? 'Refresh' : 'Lihat Semua Kode'}
          </button>
        </div>

        {showCodes && (
          <div className="overflow-x-auto">
            {codes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Belum ada kode registrasi
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Santri</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dibuat Oleh</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dibuat</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kadaluarsa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Digunakan Oleh</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {codes.map((code) => (
                    <tr key={code.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="font-mono font-bold text-gray-900">{code.code}</span>
                          <button
                            onClick={() => copyToClipboard(code.code)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                            title="Salin kode"
                          >
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{code.santri_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{code.generated_by || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(code.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(code.expires_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getValidityBadge(code)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {code.used_by || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
