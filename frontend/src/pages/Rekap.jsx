import React, { useState, useEffect } from "react";
import { apiClient } from "../services/apiClient";
import Sidebar from "../components/Sidebar";

export default function Rekap() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [data, setData] = useState(null);
  const [kelas, setKelas] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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

const doRekap = async () => {
  if (!start || !end) {
    alert("Pilih Dari dan Sampai tanggalnya");
    return;
  }
  try {
    setLoading(true);
    console.log("Fetching rekap with params:", { start, end, kelas });
    const { data } = await apiClient.attendance.list({ start, end, kelas });
    console.log("Rekap response:", data);
    
    if (data?.ok) {
      setData(data);
    } else {
      console.error("Rekap failed:", data);
      alert(data?.message || "Gagal memuat data");
    }
  } catch (e) {
    console.error("Rekap error:", e);
    const errorMsg = e.response?.data?.message || e.message;
    alert("Gagal memuat rekap: " + errorMsg);
  } finally {
    setLoading(false);
  }
};
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Sidebar 
        isDarkMode={isDarkMode} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        role="pengurus"
      />
      <div className="md:ml-64 flex items-center justify-center min-h-screen">
        <div className={`rounded-3xl shadow-lg p-8 w-[90%] max-w-5xl text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Judul */}
        <h1 className={`text-3xl font-extrabold mb-8 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>REKAP ABSENSI</h1>

        {/* Input tanggal */}
        <div className="flex justify-center gap-12 mb-6">
          <div className="flex flex-col items-center ">
            <span className={`font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>DARI</span>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className={`px-4 py-3 rounded-lg border text-center font-bold ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
          <div className="flex flex-col items-center">
            <span className={`font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>SAMPAI</span>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className={`px-4 py-3 rounded-lg border text-center font-bold ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
          <div className="flex flex-col items-center">
            <span className={`font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>KELAS</span>
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
        </div>

        {/* Tombol utama */}
        <button
          onClick={doRekap}
          disabled={loading}
          className={`px-8 py-3 rounded-lg font-bold transition-all ${
            loading 
              ? 'bg-gray-500 cursor-not-allowed' 
              : 'bg-green-700 hover:bg-green-800 active:scale-95'
          } text-white`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              MEMPROSES...
            </span>
          ) : (
            'TAMPILKAN REKAP'
          )}
        </button>

        {/* Loading indicator */}
        {loading && (
          <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
            <p className="font-semibold text-center">⏳ Sedang memproses data rekap absensi...</p>
            <p className="text-sm text-center mt-1">Mohon tunggu sebentar</p>
          </div>
        )}

        {/* Kalau data ada */}
        {data && data.ok && (
          <div className="mt-10 text-left overflow-x-auto">
            {/* Filter Info */}
            {kelas && kelas !== "Semua Kelas" && (
              <div className={`mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                <p className="font-semibold">
                  Rekap kelas <strong>{kelas}</strong>
                </p>
              </div>
            )}
            
            {/* Tabel Putra */}
            <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Putra</h2>
            <table className={`table-auto border-collapse w-full text-sm mb-6 ${isDarkMode ? 'border-gray-600' : 'border-gray-500'}`}>
              <thead>
                <tr className={isDarkMode ? 'bg-gray-700' : 'bg-gray-400'}>
                  <th className={`border px-2 py-1 ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-500 text-gray-900'}`}>Nama</th>
                  {data.headers.map((h) => (
                    <th
                      key={h.col_key}
                      className={`border px-2 py-1 ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-500 text-gray-900'}`}
                    >
                      {h.tanggal} {h.sesi}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.putra.map((r, index) => (
                  <tr key={r.santri_id || index} className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                    <td className={`border px-2 py-1 ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-500 text-gray-900'}`}>
                      {r.Nama}
                    </td>
                    {data.headers.map((h) => (
                      <td
                        key={h.col_key}
                        className={`border px-2 py-1 text-center ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-500 text-gray-900'}`}
                      >
                        {r[h.col_key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Tabel Putri */}
            <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Putri</h2>
            <table className={`table-auto border-collapse w-full text-sm ${isDarkMode ? 'border-gray-600' : 'border-gray-500'}`}>
              <thead>
                <tr className={isDarkMode ? 'bg-gray-700' : 'bg-gray-400'}>
                  <th className={`border px-2 py-1 ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-500 text-gray-900'}`}>Nama</th>
                  {data.headers.map((h) => (
                    <th
                      key={h.col_key}
                      className={`border px-2 py-1 ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-500 text-gray-900'}`}
                    >
                      {h.tanggal} {h.sesi}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.putri.map((r, index) => (
                  <tr key={r.santri_id || index} className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                    <td className={`border px-2 py-1 ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-500 text-gray-900'}`}>
                      {r.Nama}
                    </td>
                    {data.headers.map((h) => (
                      <td
                        key={h.col_key}
                        className={`border px-2 py-1 text-center ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-500 text-gray-900'}`}
                      >
                        {r[h.col_key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Tombol export */}
            <div className="flex gap-4 mb-6 justify-center mt-10">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700"
                onClick={async () => {
                  try {
                    console.log("Exporting rekap to XLSX with params:", { start, end, kelas });
                    const { data: blob } = await apiClient.reports.rekapXlsx({ start, end, kelas });
                    const url = window.URL.createObjectURL(new Blob([blob]));
                    const a = document.createElement("a");
                    a.href = url;
                    const kelasName = kelas === "Semua Kelas" ? "all" : kelas.toLowerCase().replace(" ", "_");
                    a.download = `rekap_absensi_${kelasName}.xlsx`;
                    a.click();
                    console.log("Export successful");
                  } catch (error) {
                    console.error("Export error:", error);
                    alert("Gagal export: " + (error.response?.data?.message || error.message));
                  }
                }}
              >
                Export Laporan
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
