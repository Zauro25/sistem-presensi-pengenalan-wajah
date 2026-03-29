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
  const [scanResult, setScanResult] = useState<any>(null);
  const [lastBoxes, setLastBoxes] = useState<any[]>([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const streamRef = useRef(null);
  const processingRef = useRef(false);
  const nextScanAtRef = useRef(0);
  const scanRafRef = useRef<number | null>(null);
  const captureSizeRef = useRef({ w: 640, h: 480 });

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
      streamRef.current = stream;

      const attachStream = (retry = 0) => {
        if (!streamRef.current || streamRef.current !== stream) return;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
          return;
        }
        if (retry < 20) {
          setTimeout(() => attachStream(retry + 1), 100);
        }
      };

      attachStream();

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
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
    if (scanRafRef.current !== null) {
      cancelAnimationFrame(scanRafRef.current);
      scanRafRef.current = null;
    }
    processingRef.current = false;
    nextScanAtRef.current = 0;
    setScanning(false);
  }, []);

  const handleStartPresensi = async () => {
    if (!kelas || !tanggal || !sesi) {
      setMessage({ type: 'error', text: 'Lengkapi semua field terlebih dahulu' });
      return;
    }

    try {
      await api.startPresensi(tanggal, sesi);
      setMessage({ type: 'success', text: 'Presensi dimulai! Aktifkan kamera untuk scan wajah.' });
      setStep('active');
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Gagal memulai presensi' });
    }
  };

  useEffect(() => {
    if (step === 'active' || step === 'telat') {
      startCamera();
    }
  }, [step, startCamera]);

  const handleStartTelat = async () => {
    try {
      await api.startTelat();
      setMessage({ type: 'success', text: 'Penghitungan keterlambatan dimulai!' });
      setStep('telat');
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Gagal memulai telat' });
    }
  };

  const handleEndPresensi = async () => {
    try {
      await api.endPresensi();
      setMessage({ type: 'success', text: 'Presensi selesai!' });
      stopCamera();
      setStep('setup');
      setScanning(false);
      setScanResult(null);
      setLastBoxes([]);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Gagal mengakhiri presensi' });
    }
  };

  const captureAndRecognize = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || processingRef.current) return;

    processingRef.current = true;
    setScanning(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
        return;
      }

      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }

      const sourceW = video.videoWidth;
      const sourceH = video.videoHeight;
      const targetW = Math.min(480, sourceW || 480);
      const targetH = Math.max(1, Math.round((sourceH / sourceW) * targetW));

      canvas.width = targetW;
      canvas.height = targetH;
      captureSizeRef.current = { w: targetW, h: targetH };
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL('image/jpeg', 0.75);
      
      const response = await api.recognizeAndAttend(imageData, kelas);

      const attendees = Array.isArray(response.attendees)
        ? response.attendees
        : (response.santri ? [{ santri: response.santri, status: response.status, confidence: response.confidence, location: response.location }] : []);

      const nowText = new Date().toLocaleTimeString('id-ID');
      setScanResult({
        success: true,
        time: nowText,
        attendees: attendees.map((a) => ({
          nama: a.santri?.nama,
          status: a.status,
          confidence: typeof a.confidence === 'number' ? a.confidence : null,
        })),
      });

      const mappedBoxes = attendees
        .filter((a) => a.location)
        .map((a) => ({
          ...a.location,
          confidence: typeof a.confidence === 'number' ? a.confidence : null,
          nama: a.santri?.nama || null,
        }));
      setLastBoxes(mappedBoxes);
      
      setMessage({ 
        type: 'success', 
        text: `${attendees.length} wajah tercatat` 
      });

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      const detections = Array.isArray(error?.data?.detections) ? error.data.detections : [];

      setScanResult({
        success: false,
        message: error.message || 'Wajah tidak dikenali',
        time: new Date().toLocaleTimeString('id-ID'),
      });
      setLastBoxes(
        detections
          .filter((d) => d.location)
          .map((d) => ({
            ...d.location,
            confidence: typeof d.confidence === 'number' ? d.confidence : null,
            nama: null,
          }))
      );
      
      setMessage({ 
        type: 'error', 
        text: error.message || 'Wajah tidak dikenali' 
      });

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      processingRef.current = false;
      setScanning(false);
      nextScanAtRef.current = Date.now() + 400;
    }
  }, [kelas]);

  const startAutoScan = useCallback(() => {
    if (scanRafRef.current !== null) return;

    const loop = async () => {
      if (step === 'setup') {
        scanRafRef.current = null;
        return;
      }

      if (!streamRef.current) {
        scanRafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (Date.now() >= nextScanAtRef.current && !processingRef.current) {
        await captureAndRecognize();
      }

      scanRafRef.current = requestAnimationFrame(loop);
    };

    scanRafRef.current = requestAnimationFrame(loop);
  }, [captureAndRecognize, step]);

  useEffect(() => {
    if (step === 'active' || step === 'telat') {
      startAutoScan();
      return;
    }

    if (scanRafRef.current !== null) {
      cancelAnimationFrame(scanRafRef.current);
      scanRafRef.current = null;
    }
  }, [step, startAutoScan]);

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
    if (!lastBoxes || lastBoxes.length === 0) return;
    const captureW = captureSizeRef.current.w || vw;
    const captureH = captureSizeRef.current.h || vh;
    const scaleX = vw / captureW;
    const scaleY = vh / captureH;

    for (const box of lastBoxes) {
      const { top, right, bottom, left, confidence, nama } = box;
      const scaledTop = top * scaleY;
      const scaledRight = right * scaleX;
      const scaledBottom = bottom * scaleY;
      const scaledLeft = left * scaleX;

      // Backend box uses raw capture coordinates; preview video is visually mirrored.
      const drawLeft = vw - scaledRight;
      const drawRight = vw - scaledLeft;
      const drawWidth = drawRight - drawLeft;
      const drawHeight = scaledBottom - scaledTop;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.strokeRect(drawLeft, scaledTop, drawWidth, drawHeight);

      const labelParts = [];
      if (nama) labelParts.push(nama);
      if (typeof confidence === 'number') labelParts.push(`${confidence.toFixed(1)}%`);
      if (labelParts.length > 0) {
        const label = labelParts.join(' - ');
        ctx.font = 'bold 14px sans-serif';
        const textWidth = ctx.measureText(label).width;
        const textX = drawLeft;
        const textY = Math.max(scaledTop - 10, 20);
        const rectX = textX - 6;
        const rectY = textY - 15;
        const rectWidth = textWidth + 12;
        const rectHeight = 20;

        ctx.fillStyle = '#22c55e';
        ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, textX, textY);
      }
    }
  }, [lastBoxes]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white text-center">Presensi</h1>
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
            onClick={handleStartPresensi}
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
                  onClick={handleEndPresensi}
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
                    muted
                    className="w-full"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <canvas ref={overlayRef} className="absolute inset-0 w-full h-full" />
                  {scanning && (
                    <div className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                      Memproses...
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <p className="text-sm text-gray-600">
                  Status scanner: {scanning ? 'mendeteksi wajah...' : 'menunggu frame berikutnya'}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Kehadiran</h3>
              {scanResult ? (
                scanResult.success ? (
                  <div className="space-y-3">
                    <p className="text-sm text-green-700 font-medium">Terdeteksi {scanResult.attendees?.length || 0} orang</p>
                    {(scanResult.attendees || []).map((a, idx) => (
                      <div key={`${a.nama}-${idx}`} className="border border-gray-200 rounded-md p-2">
                        <p className="font-semibold text-gray-900">{a.nama}</p>
                        <p className={`text-sm font-medium ${getStatusColor(a.status)}`}>Status: {a.status}</p>
                        {a.confidence !== null && (
                          <p className="text-sm text-green-700">Akurasi: {a.confidence.toFixed(1)}%</p>
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">{scanResult.time}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-semibold text-red-900">Gagal</p>
                    <p className="text-sm text-red-700">{scanResult.message}</p>
                    <p className="text-xs text-gray-500">{scanResult.time}</p>
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
