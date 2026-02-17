'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

const STATUS_COPY = {
  idle: 'Detecting your face...',
  detecting: 'Detecting your face...',
  registering: 'Face detected. Registering...',
  success: 'Registration successful',
  error: 'Error: detection failed',
};

export default function FaceRegistrationPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [box, setBox] = useState(null);
  const [detectedName, setDetectedName] = useState('');
  const [lastScan, setLastScan] = useState(null);

  const videoRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const overlayRef = useRef(null);
  const streamRef = useRef(null);
  const nextScanAtRef = useRef(0);

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
    if (!box) {
      const ctx = overlay.getContext('2d');
      ctx.clearRect(0, 0, overlay.width, overlay.height);
      return;
    }

    const { top, right, bottom, left } = box;
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    overlay.width = vw;
    overlay.height = vh;

    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, vw, vh);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.strokeRect(left, top, right - left, bottom - top);

    if (detectedName) {
      ctx.fillStyle = '#22c55e';
      ctx.font = '16px sans-serif';
      ctx.fillText(detectedName, left, Math.max(top - 8, 16));
    }
  }, [box, detectedName]);

  const processFrame = useCallback(async () => {
    const now = Date.now();
    if (processing || now < nextScanAtRef.current) {
      requestAnimationFrame(processFrame);
      return;
    }
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas) return;
    if (video.readyState < 2) {
      requestAnimationFrame(processFrame);
      return;
    }

    setProcessing(true);
    nextScanAtRef.current = Date.now() + 1000;
    setStatus((prev) => (prev === 'success' ? prev : 'detecting'));

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, vw, vh);
    const dataUrl = canvas.toDataURL('image/jpeg');

    try {
      const santriId = user?.santri_id || user?.id;
      setStatus('registering');
      const res = await api.registrasiWajah(santriId, dataUrl);

      if (res?.location) {
        setBox(res.location);
      }
      setDetectedName(res?.nama || user?.nama_lengkap || user?.username || 'Santri');
      setMessage(res?.message || 'Registration successful');
      setStatus('success');
      setLastScan({ success: true, nama: res?.nama || detectedName, time: new Date().toLocaleTimeString('id-ID') });
    } catch (err) {
      const errMsg = err?.message || err?.data?.error || 'Error: detection failed';
      setMessage(errMsg);
      setStatus('error');
      setBox(null);
      setLastScan({ success: false, message: errMsg, time: new Date().toLocaleTimeString('id-ID') });
    } finally {
      setProcessing(false);
      requestAnimationFrame(processFrame);
    }
  }, [processing, user, detectedName]);

  useEffect(() => {
    requestAnimationFrame(processFrame);
  }, [processFrame]);

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
            />
            <canvas
              ref={overlayRef}
              className="absolute inset-0 w-full h-full"
            />
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-700 font-medium">
              {STATUS_COPY[status] || 'Detecting your face...'}
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
                <p className="text-sm text-green-600">Terdeteksi & tersimpan</p>
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
