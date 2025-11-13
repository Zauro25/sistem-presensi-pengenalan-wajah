import React, { useState, useEffect } from "react";
import { recognizeAndAttend } from "../services/api";
import { apiClient } from "../services/apiClient";
import CameraCapture from "../components/CameraCapture";
import Sidebar from "../components/Sidebar";

export default function Absensi() {
  const [result, setResult] = useState(null);
  const [tanggal, setTanggal] = useState("");
  const [sesi, setSesi] = useState("Pilih Sesi");
  const [kelas, setKelas] = useState("Semua Kelas");
  const [active, setActive] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dark mode detection
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const startAbsensi = async () => {
    if (!tanggal) {
      alert("Pilih tanggal terlebih dahulu");
      return;
    }
    if (sesi === "Pilih Sesi") {
      alert("Pilih sesi terlebih dahulu");
      return;
    }
    
    try {
      console.log("Starting absensi with:", { tanggal, sesi, kelas });
      const response = await apiClient.legacy.startAbsensi({
        tanggal,
        sesi,
        kelas,
      });
      console.log("Absensi started:", response);
      alert("Absensi dimulai");
      setActive(true);
    } catch (error) {
      console.error("Failed to start absensi:", error);
      alert("Gagal memulai absensi: " + (error.response?.data?.message || error.message));
    }
  };

  const startTelat = async () => {
    await apiClient.legacy.startTelat({
      tanggal: tanggal || new Date().toISOString().slice(0, 10),
      sesi,
    });
    alert("Hitung keterlambatan dimulai");
  };

  const endAbsensi = async () => {
    await apiClient.legacy.endAbsensi();
    alert("Absensi dihentikan");
    setActive(false);
    setResult(null);
  };

  const handleCapture = async (dataURL) => {
    try {
      const res = await recognizeAndAttend(
        dataURL,
        tanggal || new Date().toISOString().slice(0, 10),
        sesi,
        kelas
      );

      console.log("Recognition result:", res);

      if (res.ok && res.santri) {
        setResult({
          nama: res.santri.nama,
          status: res.status,
        });
      } else {
        console.log("No face recognized or error:", res.message);
      }
      return res; 
    } catch (error) {
      console.error("Error during face recognition:", error);
      return { ok: false, message: error.message };
    }
  };

  const goBack = () => window.history.back();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Sidebar 
        isDarkMode={isDarkMode} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        role="pengurus"
      />
      <div className="md:ml-64 flex items-center justify-center min-h-screen px-4 py-6">
        <div className={`rounded-3xl shadow-lg p-6 w-full max-w-6xl flex flex-col items-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex flex-col md:flex-row w-full gap-6 md:items-stretch">
          <div className="flex flex-col gap-4 md:w-1/4 w-full">
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className={`px-4 py-3 rounded-lg border text-center font-bold w-full ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
            />
            <select
              value={sesi}
              onChange={(e) => setSesi(e.target.value)}
              className={`px-4 py-3 rounded-lg border text-center font-bold w-full ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="Pilih Sesi">Pilih Sesi</option>
              <option value="Subuh">Subuh</option>
              <option value="Sore">Sore</option>
              <option value="Malam">Malam</option>
            </select>
            <select
              value={kelas}
              onChange={(e) => setKelas(e.target.value)}
              className={`px-4 py-3 rounded-lg border text-center font-bold w-full ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="Semua Kelas">Semua Kelas</option>
              <option value="Lambatan">Lambatan</option>
              <option value="Cepatan">Cepatan</option>
              <option value="Pra Saringan">Pra Saringan</option>
              <option value="Saringan">Saringan</option>
            </select>
          </div>

          <div className="flex-1 flex items-center justify-center text-white rounded-lg text-3xl font-bold w-full md:w-auto order-2 md:order-none">
            {active && <CameraCapture onCapture={handleCapture} active={active} />}
          </div>

          <div className={`p-6 rounded-lg md:w-64 w-full h-auto flex items-center justify-center shadow order-3 md:order-none ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            {result ? (
              <div className="text-center">
                <h3 className={`font-bold text-xl ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{result.nama}</h3>
                <p
                  className={`mt-4 text-2xl font-bold ${
                    result.status === "Hadir"
                      ? "text-green-600"
                      : result.status === "T1"
                      ? "text-yellow-500"
                      : result.status === "T2"
                      ? "text-orange-500"
                      : "text-red-600"
                  }`}
                >
                  {result.status}
                </p>
              </div>
            ) : (
              <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Belum ada wajah terdeteksi
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-center mt-6">
          <button
            onClick={startAbsensi}
            className="bg-green-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-800 active:scale-95 transition-transform"
          >
            MULAI ABSENSI
          </button>
          <button
            onClick={startTelat}
            className="bg-yellow-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-yellow-700 active:scale-95 transition-transform"
          >
            MULAI HITUNG TELAT
          </button>
          <button
            onClick={endAbsensi}
            className="bg-red-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-800 active:scale-95 transition-transform"
          >
            BERHENTI ABSENSI
          </button>
          <button
            onClick={goBack}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-700 active:scale-95 transition-transform"
          >
            KEMBALI
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}