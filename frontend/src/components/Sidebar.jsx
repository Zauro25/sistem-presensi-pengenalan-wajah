import React from "react";
import { useNavigate } from "react-router-dom";

export default function Sidebar({ isDarkMode, sidebarOpen, setSidebarOpen, role = "santri" }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Menu items based on role
  const pengurusMenuItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Presensi (Scan Wajah)", path: "/absensi" },
    { label: "Rekap", path: "/rekap" },
    { label: "Perizinan", path: "/validasi-izin" },
    { label: "Registrasi Santri", path: "/registrasi" },
    { label: "Profile", path: "/profile" },
  ];

  const santriMenuItems = [
    { label: "Dashboard", path: "/dashboard-santri" },
    { label: "Izin", path: "/izin" },
    { label: "Register Wajah", path: "/register-wajah" },
    { label: "Profile", path: "/profile" },
  ];

  const menuItems = role === "pengurus" ? pengurusMenuItems : santriMenuItems;

  return (
    <>
      {/* Mobile Top Bar */}
      <div className={`md:hidden flex items-center justify-between px-4 py-3 shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <button
          className={`p-2 rounded-md border ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-200'}`}
          onClick={() => setSidebarOpen((s) => !s)}
          aria-label="Toggle sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <div className={`font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
          {role === "pengurus" ? "Dashboard Pengurus" : "Dashboard Santri"}
        </div>
        <div />
      </div>

      {/* Sidebar */}
      <aside className={`shadow-md w-64 p-4 space-y-2 fixed inset-y-0 left-0 z-30 transform md:transform-none transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`hidden md:block text-xl font-black mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Menu</div>
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
              className={`text-left px-3 py-2 rounded-lg transition ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-900'}`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => {
              logout();
              setSidebarOpen(false);
            }}
            className="text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 transition"
          >
            Logout
          </button>
        </nav>
      </aside>
    </>
  );
}
