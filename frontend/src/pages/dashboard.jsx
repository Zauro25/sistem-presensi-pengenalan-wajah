import React, { useEffect, useState } from "react";
import { apiClient } from "../services/apiClient";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import absensiIcon from "../assets/absensi.png";
import rekapIcon from "../assets/rekap.png";
import izinIcon from "../assets/perizinan.png"

export default function Dashboard() {
  const [santris, setSantris] = useState([]);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  // Dark mode detection
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Sidebar state (mobile collapsible)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/"); 
    }
    fetchSantri();
  }, []);

  async function fetchSantri() {
    const { data: res } = await apiClient.santri.list();
    if (res?.ok) setSantris(res.data);
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Sidebar 
        isDarkMode={isDarkMode} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        role="pengurus"
      />

      {/* Main content */}
      <div className="md:ml-64 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Greeting */}
            <div className="mb-8">
              <h1 className={`text-3xl md:text-4xl font-black mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>SISTEM PRESENSI PPM JOGJA</h1>
              <p className={`text-xl md:text-2xl font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Halo, <strong>{user?.username}</strong></p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Dashboard Pengurus</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Santri */}
              <div className={`rounded-2xl shadow-lg p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Jumlah Santri</h3>
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                </div>
                <p className={`text-5xl font-black ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{santris.length}</p>
                <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total santri terdaftar</p>
              </div>

              {/* Santri Putra */}
              <div className={`rounded-2xl shadow-lg p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Santri Putra</h3>
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                </div>
                <p className={`text-5xl font-black ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{santris.filter(s => s.jenis_kelamin === 'L').length}</p>
                <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Santri laki-laki</p>
              </div>

              {/* Santri Putri */}
              <div className={`rounded-2xl shadow-lg p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Santri Putri</h3>
                  <div className="w-12 h-12 bg-pink-600 rounded-xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                </div>
                <p className={`text-5xl font-black ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`}>{santris.filter(s => s.jenis_kelamin === 'P').length}</p>
                <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Santri perempuan</p>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}