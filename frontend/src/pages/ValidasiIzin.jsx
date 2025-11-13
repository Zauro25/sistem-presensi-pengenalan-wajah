import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function ValidasiIzin() {
  const [daftarIzin, setDaftarIzin] = useState([]);
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

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://127.0.0.1:8000/api/izin/list/", {
      headers: { Authorization: "Token " + token },
    });
    const data = await res.json();
    if (data.ok) setDaftarIzin(data.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleValidasi = async (id, status) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://127.0.0.1:8000/api/izin/validasi/${id}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token " + token,
      },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    alert(data.message);
    fetchData();
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Sidebar 
        isDarkMode={isDarkMode} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        role="pengurus"
      />
      <div className="md:ml-64 flex flex-col items-center p-6">
        <div className={`rounded-3xl shadow-lg p-6 w-full max-w-5xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          Daftar Permohonan Izin Santri
        </h2>
        <table className={`table-auto w-full ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-400'}>
            <tr>
              <th className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600' : 'border-gray-500'}`}>Santri</th>
              <th className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600' : 'border-gray-500'}`}>Kelas</th>
              <th className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600' : 'border-gray-500'}`}>Tanggal</th>
              <th className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600' : 'border-gray-500'}`}>Sesi</th>
              <th className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600' : 'border-gray-500'}`}>Alasan</th>
              <th className={`px-3 py-2 border ${isDarkMode ? 'border-gray-600' : 'border-gray-500'}`}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {daftarIzin.length > 0 ? (
              daftarIzin.map((it) => (
                <tr key={it.id}>
                  <td className={`border px-3 py-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-500'}`}>{it.nama}</td>
                  <td className={`border px-3 py-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-500'}`}>{it.kelas}</td>
                  <td className={`border px-3 py-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-500'}`}>{it.tanggal}</td>
                  <td className={`border px-3 py-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-500'}`}>{it.sesi}</td>
                  <td className={`border px-3 py-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-500'}`}>{it.alasan}</td>
                  <td className={`border px-3 py-2 flex gap-2 justify-center ${isDarkMode ? 'border-gray-600' : 'border-gray-500'}`}>
                    <button
                      onClick={() => handleValidasi(it.id, "Disetujui")}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold"
                    >
                      ✅ Setujui
                    </button>
                    <button
                      onClick={() => handleValidasi(it.id, "Ditolak")}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold"
                    >
                      ❌ Tolak
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Tidak ada permohonan izin menunggu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
