import React, { useState, useEffect } from "react";
import { apiClient } from "../services/apiClient";
import Sidebar from "../components/Sidebar";

export default function ListIzin() {
  const [riwayatIzin, setRiwayatIzin] = useState([]);
  const [listSantris, setListSantris] = useState([]);
  const [selectedSantri, setSelectedSantri] = useState("");
  const [kelas, setKelas] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [sesi, setSesi] = useState("");
  const [alasan, setAlasan] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    console.log("User data from localStorage:", user);
    
    // ambil list santri
    const { data: s } = await apiClient.santri.list();
    console.log("Santri list response:", s);
    
    if (s?.ok) {
      setListSantris(s.data);
      
      // Auto-select logged-in santri
      // Try to find the santri that matches the logged-in user
      if (user && s.data && s.data.length > 0) {
        // Try different matching strategies
        let matchedSantri = null;
        
        // Strategy 1: Match by user.santri_id with santri.id
        if (user.santri_id) {
          matchedSantri = s.data.find(santri => santri.id === user.santri_id);
          console.log("Match by user.santri_id === santri.id:", matchedSantri);
        }
        
        // Strategy 2: Match by username with santri_id field
        if (!matchedSantri && user.username) {
          matchedSantri = s.data.find(santri => santri.santri_id === user.username);
          console.log("Match by user.username === santri.santri_id:", matchedSantri);
        }
        
        // Strategy 3: Match by username with nama field
        if (!matchedSantri && user.username) {
          matchedSantri = s.data.find(santri => santri.nama === user.username);
          console.log("Match by user.username === santri.nama:", matchedSantri);
        }
        
        // Strategy 4: Match by nama_lengkap with nama field
        if (!matchedSantri && user.nama_lengkap) {
          matchedSantri = s.data.find(santri => santri.nama === user.nama_lengkap);
          console.log("Match by user.nama_lengkap === santri.nama:", matchedSantri);
        }
        
        if (matchedSantri) {
          console.log("Matched santri found:", matchedSantri);
          setSelectedSantri(matchedSantri.santri_id);
        } else {
          console.warn("No matching santri found for user:", user);
        }
      }
    }
    
    // ambil list surat izin (kalau mau nampilin riwayat)
    try {
      const { data } = await apiClient.permits.list();
      if (data?.ok && Array.isArray(data.data)) setRiwayatIzin(data.data);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSantri || !tanggal || !sesi || !alasan) {
      alert("Data belum lengkap!");
      return;
    }

    const formData = new FormData();
    formData.append("santri", selectedSantri);
    formData.append("kelas", kelas);
    formData.append("tanggal", tanggal);
    formData.append("sesi", sesi);
    formData.append("alasan", alasan);

    const res = await apiClient.legacy.uploadIzin(formData);

    if (res?.ok) {
      alert("Permohonan izin berhasil dikirim!");
      setAlasan("");
      fetchData();
    } else {
      alert("Gagal kirim izin: " + (res.message || "error tidak diketahui"));
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Sidebar 
        isDarkMode={isDarkMode} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        role="santri"
      />
      <div className="md:ml-64 flex flex-col items-center justify-start py-10">
        <div className={`rounded-3xl shadow-lg p-6 w-full max-w-5xl flex flex-col items-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-2xl font-extrabold mb-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Permohonan Izin Santri</h2>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md flex flex-col gap-3 mb-8"
        >
          <select
            className={`p-3 rounded-lg border font-semibold ${isDarkMode ? 'bg-gray-600 border-gray-600 text-gray-300 cursor-not-allowed' : 'bg-gray-200 border-gray-300 text-gray-700 cursor-not-allowed'}`}
            value={selectedSantri}
            onChange={(e) => setSelectedSantri(e.target.value)}
            disabled
          >
            <option value="">Pilih Santri</option>
            {listSantris.map((s) => (
              <option key={s.id} value={s.santri_id}>
                {s.santri_id} - {s.nama}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Kelas (opsional)"
            value={kelas}
            onChange={(e) => setKelas(e.target.value)}
            className={`p-3 rounded-lg border font-semibold ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
          />

          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className={`p-3 rounded-lg border font-semibold ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
          />

          <select
            value={sesi}
            onChange={(e) => setSesi(e.target.value)}
            className={`p-3 rounded-lg border font-semibold ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="">Pilih Sesi</option>
            <option value="Subuh">Subuh</option>
            <option value="Sore">Sore</option>
            <option value="Malam">Malam</option>
          </select>

          <textarea
            placeholder="Alasan izin..."
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            className={`p-3 rounded-lg border font-semibold resize-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
          />

          <button
            type="submit"
            className="bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg font-bold active:scale-95 transition-transform"
          >
            Kirim Permohonan Izin
          </button>
        </form>

        {/* Riwayat */}
        <div className="w-full flex flex-col items-center">
          <h3 className={`font-bold text-xl mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Riwayat Izin</h3>
          <p className={`font-semibold text-xl mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Nama: <strong>{user?.nama_lengkap || user?.username}</strong></p>
          {riwayatIzin.length === 0 ? (
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-700'}>Belum ada riwayat izin.</p>
          ) : (
            <table className={`table-auto w-full border text-sm ${isDarkMode ? 'border-gray-600' : 'border-gray-400'}`}>
              <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-400'}>
                <tr>
                  <th className={`border px-2 py-1 ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-500 text-gray-900'}`}>Tanggal</th>
                  <th className={`border px-2 py-1 ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-500 text-gray-900'}`}>Sesi</th>
                  <th className={`border px-2 py-1 ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-500 text-gray-900'}`}>Kelas</th>
                  <th className={`border px-2 py-1 ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-500 text-gray-900'}`}>Alasan</th>
                  <th className={`border px-2 py-1 ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-500 text-gray-900'}`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {riwayatIzin.map((it) => (
                  <tr key={it.id} className={`text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <td className={`border px-2 py-1 ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-500 text-gray-900'}`}>{it.tanggal}</td>
                    <td className={`border px-2 py-1 ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-500 text-gray-900'}`}>{it.sesi}</td>
                    <td className={`border px-2 py-1 ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-500 text-gray-900'}`}>{it.kelas || "-"}</td>
                    <td className={`border px-2 py-1 ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-500 text-gray-900'}`}>{it.alasan}</td>
                    <td className={`border px-2 py-1 font-bold ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-500 text-gray-900'}`}>{it.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
