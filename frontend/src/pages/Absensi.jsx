import React, { useState } from "react";
import { recognizeAndAttend } from "../services/api";
import CameraCapture from "../components/CameraCapture";

export default function Absensi() {
  const [result, setResult] = useState(null);
  const [tanggal, setTanggal] = useState("");
  const [sesi, setSesi] = useState("Subuh");
  const [active, setActive] = useState(false);

  const startAbsensi = async () => {
    await fetch("http://127.0.0.1:8000/api/start-absensi/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token " + localStorage.getItem("token"),
      },
      body: JSON.stringify({
        tanggal: tanggal || new Date().toISOString().slice(0, 10),
        sesi,
      }),
    });
    alert("✅ Absensi dimulai");
    setActive(true);
  };

  const startTelat = async () => {
    await fetch("http://127.0.0.1:8000/api/start-telat/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token " + localStorage.getItem("token"),
      },
      body: JSON.stringify({
        tanggal: tanggal || new Date().toISOString().slice(0, 10),
        sesi,
      }),
    });
    alert("⏳ Hitung keterlambatan dimulai");
  };

  const endAbsensi = async () => {
    await fetch("http://127.0.0.1:8000/api/end-absensi/", {
      method: "POST",
      headers: { Authorization: "Token " + localStorage.getItem("token") },
    });
    alert("🛑 Absensi dihentikan");
    setActive(false);
    setResult(null);
  };

  const handleCapture = async (dataURL) => {
    const res = await recognizeAndAttend(
      dataURL,
      tanggal || new Date().toISOString().slice(0, 10),
      sesi
    );

    if (res.ok && res.santri) {
      setResult({
        nama: res.santri.nama,
        status: res.status,
      });
    }
    return res; 
  };

  const goBack = () => window.history.back();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-800 px-4 py-6">
      <div className="bg-gray-300 rounded-3xl shadow-lg p-6 w-full max-w-6xl flex flex-col items-center">
        <div className="flex flex-col md:flex-row w-full gap-6 md:items-stretch">
          <div className="flex flex-col gap-4 md:w-1/4 w-full">
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="px-4 py-3 rounded-lg border text-center font-bold text-white bg-gray-700 w-full"
            />
            <select
              value={sesi}
              onChange={(e) => setSesi(e.target.value)}
              className="px-4 py-3 rounded-lg border text-center font-bold text-white bg-gray-700 w-full"
            >
              <option value="Subuh">Subuh</option>
              <option value="Sore">Sore</option>
              <option value="Malam">Malam</option>
            </select>
          </div>

          {/* Kamera */}
          <div className="flex-1 flex items-center justify-center text-white rounded-lg text-3xl font-bold w-full md:w-auto order-2 md:order-none">
            {active && <CameraCapture onCapture={handleCapture} active={active} />}
          </div>

          {/* Kotak hasil kanan */}
          <div className="bg-white p-6 rounded-lg md:w-64 w-full h-auto flex items-center justify-center shadow order-3 md:order-none">
            {result ? (
              <div className="text-center">
                <h3 className="font-bold text-xl">{result.nama}</h3>
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
              <p className="text-gray-500 text-center">
                Belum ada wajah terdeteksi
              </p>
            )}
          </div>
        </div>

        {/* Tombol bawah */}
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
  );
}