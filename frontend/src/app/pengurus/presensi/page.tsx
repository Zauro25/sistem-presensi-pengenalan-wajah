'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

export default function PresensiPage() {
  const [step, setStep] = useState('setup');
  const [kelas, setKelas] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [sesi, setSesi] = useState('Subuh');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [lastBox, setLastBox] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setTanggal(today);

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Tidak dapat mengakses kamera' });
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  const handleStartAbsensi = async () => {
    if (!kelas || !tanggal || !sesi) {
      setMessage({ type: 'error', text: 'Lengkapi semua field terlebih dahulu' });
      return;
    }

    try {
      await api.startAbsensi(tanggal, sesi);
      setMessage({ type: 'success', text: 'Absensi dimulai! Aktifkan kamera untuk scan wajah.' });
      setStep('active');
      await startCamera();
      startAutoScan();
      captureAndRecognize();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Gagal memulai absensi' });
    }
  };

  const handleStartTelat = async () => {
    try {
      await api.startTelat();
      setMessage({ type: 'success', text: 'Penghitungan keterlambatan dimulai!' });
      setStep('telat');
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Gagal memulai telat' });
    }
  };

  const handleEndAbsensi = async () => {
    try {
      await api.endAbsensi();
      setMessage({ type: 'success', text: 'Absensi selesai!' });
      stopCamera();
      setStep('setup');
      setScanning(false);
      setLastScan(null);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Gagal mengakhiri absensi' });
    }
  };

  const captureAndRecognize = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || scanning) return;

    setScanning(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = canvas.toDataURL('image/jpeg');
      
      const response = await api.recognizeAndAttend(imageData, kelas);
      
      setLastScan({
        success: true,
        nama: response.santri.nama,
        status: response.status,
        time: new Date().toLocaleTimeString('id-ID'),
      });
      if (response.location) {
        setLastBox(response.location);
      }
      
      setMessage({ 
        type: 'success', 
        text: `${response.santri.nama} - ${response.status}` 
      });

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setLastScan({
        success: false,
        message: error.message || 'Wajah tidak dikenali',
        time: new Date().toLocaleTimeString('id-ID'),
      });
      
      setMessage({ 
        type: 'error', 
        text: error.message || 'Wajah tidak dikenali' 
      });

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setScanning(false);
    }
  }, [kelas, scanning]);

  const startAutoScan = useCallback(() => {
    scanIntervalRef.current = setInterval(() => {
      captureAndRecognize();
    }, 1000);
  }, [captureAndRecognize]);

  const getStatusColor = (status) => {
    const colors = {
      'Hadir': 'text-green-600',
      'T1': 'text-yellow-600',
      'T2': 'text-orange-600',
      'T3': 'text-red-600',
    };
    return colors[status] || 'text-gray-600';
  };

  useEffect(() => {
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!video || !overlay) return;
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    overlay.width = vw;
    overlay.height = vh;
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, vw, vh);
    if (!lastBox) return;
    const { top, right, bottom, left } = lastBox;
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.strokeRect(left, top, right - left, bottom - top);
  }, [lastBox]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 text-center">Presensi</h1>
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

      {step === 'setup' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sesi Presensi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kelas <span className="text-red-500">*</span>
              </label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Pilih kelas</option>
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
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sesi <span className="text-red-500">*</span>
              </label>
              <select
                value={sesi}
                onChange={(e) => setSesi(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="Subuh">Subuh</option>
                <option value="Sore">Sore</option>
                <option value="Malam">Malam</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleStartAbsensi}
            className="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
          >
            Mulai
          </button>
        </div>
      )}

      {(step === 'active' || step === 'telat') && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Sesi Aktif</h2>
                <p className="text-gray-600">Kelas: {kelas} • Tanggal: {new Date(tanggal).toLocaleDateString('id-ID')} • Sesi: {sesi}</p>
              </div>
              <div className="flex items-center space-x-2">
                {step === 'active' && (
                  <button
                    onClick={handleStartTelat}
                    className="bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-700 transition"
                  >
                    Mulai Hitung Telat
                  </button>
                )}
                <button
                  onClick={handleEndAbsensi}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  Selesai
                </button>
              </div>
            </div>

            {step === 'telat' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 font-medium">Hitung Keterlambatan dimulai</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full"
                  />
                  <canvas ref={overlayRef} className="absolute inset-0 w-full h-full" />
                  {scanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="bg-white rounded-lg p-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-sm mt-2">Memproses...</p>
                      </div>
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />

                <button
                  onClick={captureAndRecognize}
                  disabled={scanning}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-green-300"
                >
                  Scan Manual
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Kehadiran</h3>
              {lastScan ? (
                lastScan.success ? (
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900">{lastScan.nama}</p>
                    <p className={`text-sm font-medium ${getStatusColor(lastScan.status)}`}>Status: {lastScan.status}</p>
                    <p className="text-xs text-gray-500">{lastScan.time}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-semibold text-red-900">Gagal</p>
                    <p className="text-sm text-red-700">{lastScan.message}</p>
                    <p className="text-xs text-gray-500">{lastScan.time}</p>
                  </div>
                )
              ) : (
                <p className="text-gray-600">Belum ada hasil scan</p>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
