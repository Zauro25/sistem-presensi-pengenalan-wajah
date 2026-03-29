'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

const POSE_STEPS = [
  { key: 'front', title: 'Hadap Depan', hint: 'Posisikan wajah lurus menghadap kamera' },
  { key: 'right', title: 'Hadap Kanan', hint: 'Putar kepala sedikit ke kanan' },
  { key: 'left', title: 'Hadap Kiri', hint: 'Putar kepala sedikit ke kiri' },
  { key: 'up', title: 'Hadap Sedikit Atas', hint: 'Angkat dagu sedikit agar sudut atas wajah terekam' },
  { key: 'down', title: 'Hadap Sedikit Bawah', hint: 'Turunkan dagu sedikit agar sudut bawah wajah terekam' },
];

const STATUS_COPY = {
  idle: 'Siapkan posisi wajah sesuai instruksi.',
  detecting: 'Kamera siap. Ikuti instruksi pose saat ini.',
  capturing: 'Mengambil pose...',
  registering: 'Menyimpan data wajah...',
  success: 'Registrasi wajah berhasil.',
  error: 'Registrasi gagal. Coba ulangi pose.',
};

export default function FaceRegistrationPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [captures, setCaptures] = useState<Record<string, string>>({});
  const [lastScan, setLastScan] = useState(null);

  const videoRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const overlayRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play().catch((err) => console.error('Video play error', err));
      }
      setStatus('detecting');
      setMessage('');
    } catch (err) {
      console.error('getUserMedia error:', err);
      setStatus('error');
      setMessage('Tidak dapat mengakses kamera');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    const overlay = overlayRef.current;
    const video = videoRef.current;
    if (!overlay || !video) return;

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    overlay.width = vw;
    overlay.height = vh;

    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, vw, vh);
    const centerX = vw / 2;
    const centerY = vh / 2;
    const boxW = Math.min(300, vw * 0.5);
    const boxH = Math.min(360, vh * 0.7);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(centerX - boxW / 2, centerY - boxH / 2, boxW, boxH);
    ctx.setLineDash([]);
  }, [currentStep]);

  const capturePose = useCallback(() => {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      setStatus('error');
      setMessage('Kamera belum siap, tunggu sebentar lalu coba lagi.');
      return;
    }

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setStatus('capturing');
    ctx.drawImage(video, 0, 0, vw, vh);
    const dataUrl = canvas.toDataURL('image/jpeg');

    const stepKey = POSE_STEPS[currentStep].key;
    setCaptures((prev) => ({ ...prev, [stepKey]: dataUrl }));

    if (currentStep < POSE_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setStatus('idle');
      setMessage(`Pose ${POSE_STEPS[currentStep].title} tersimpan.`);
    } else {
      setStatus('idle');
      setMessage('Semua pose sudah diambil. Klik Simpan Registrasi.');
    }
  }, [currentStep]);

  const submitRegistration = useCallback(async () => {
    const images = POSE_STEPS.map((s) => captures[s.key]).filter(Boolean);
    if (images.length < POSE_STEPS.length) {
      setStatus('error');
      setMessage('Semua pose wajib diambil: depan, kanan, kiri.');
      return;
    }

    try {
      const santriId = user?.santri_id || user?.id;
      setProcessing(true);
      setStatus('registering');
      const res = await api.registrasiWajah(santriId, images);

      setStatus('success');
      setMessage(res?.message || 'Registrasi berhasil.');
      setLastScan({
        success: true,
        nama: res?.nama || user?.nama_lengkap || user?.username || 'Santri',
        captured: res?.captured,
        total: res?.total,
        time: new Date().toLocaleTimeString('id-ID'),
      });
    } catch (err) {
      const errMsg = err?.message || err?.data?.error || 'Registrasi gagal';
      setStatus('error');
      setMessage(errMsg);
      setLastScan({ success: false, message: errMsg, time: new Date().toLocaleTimeString('id-ID') });
    } finally {
      setProcessing(false);
    }
  }, [captures, user]);

  const resetSteps = useCallback(() => {
    setCurrentStep(0);
    setCaptures({});
    setStatus('idle');
    setMessage('');
  }, []);

  const currentPose = POSE_STEPS[currentStep];
  const capturedCount = POSE_STEPS.filter((s) => Boolean(captures[s.key])).length;
  const allCaptured = capturedCount === POSE_STEPS.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white text-center">Registrasi Wajah</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas
              ref={overlayRef}
              className="absolute inset-0 w-full h-full"
            />
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-sm font-semibold text-green-800">
                Langkah {currentStep + 1}/{POSE_STEPS.length}: {currentPose.title}
              </p>
              <p className="text-sm text-green-700">{currentPose.hint}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {POSE_STEPS.map((step) => {
                const done = Boolean(captures[step.key]);
                return (
                  <span
                    key={step.key}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {done ? 'Tersimpan' : 'Belum'}: {step.title}
                  </span>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={capturePose}
                disabled={processing || (allCaptured && currentStep === POSE_STEPS.length - 1)}
                className="bg-primary text-white px-5 py-2 rounded-lg font-semibold hover:bg-primary-700 transition disabled:bg-primary-300"
              >
                Ambil Pose Ini
              </button>
              <button
                type="button"
                onClick={submitRegistration}
                disabled={processing || !allCaptured}
                className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-green-300"
              >
                Simpan Registrasi
              </button>
              <button
                type="button"
                onClick={resetSteps}
                disabled={processing}
                className="bg-gray-200 text-gray-800 px-5 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Ulangi Pose
              </button>
            </div>

            <p className="text-sm text-gray-700 font-medium">
              {STATUS_COPY[status] || 'Siapkan posisi wajah sesuai instruksi.'}
            </p>
            {message && (
              <p className={`mt-2 text-sm ${status === 'success' ? 'text-green-600' : status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Deteksi</h3>
          {lastScan ? (
            lastScan.success ? (
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">{lastScan.nama}</p>
                <p className="text-sm text-green-600">Terdeteksi & tersimpan ({lastScan.captured || capturedCount}/{lastScan.total || POSE_STEPS.length} pose)</p>
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
            <p className="text-gray-600">Belum ada hasil deteksi</p>
          )}
        </div>
      </div>

      <canvas ref={captureCanvasRef} className="hidden" aria-hidden="true" />
    </div>
  );
}
