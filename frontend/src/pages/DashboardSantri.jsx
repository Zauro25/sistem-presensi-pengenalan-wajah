import React from "react";
import { useNavigate } from "react-router-dom";
import uploadIcon from "../assets/upload.png"; // ikon untuk foto wajah
import izinIcon from "../assets/rekap.png";   // bikin ikon ini di folder assets

export default function DashboardSantri() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));


  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-300 rounded-2xl shadow-2xl w-full max-w-2xl p-12 flex flex-col items-center">
        
        {/* Judul */}
        <div className="text-center mb-10 space-y-8">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-wide">
            MENU SANTRI
          </h1>
          <h2>
            Selamat datang, <strong>{user?.nama_lengkap || user?.username}</strong>
          </h2>
        </div>

        {/* Tombol Menu */}
        <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16 w-full">
          
          {/* Tombol Upload Foto Wajah */}
          <button
            onClick={() => navigate("/register-wajah")}
            className="flex flex-col items-center justify-center bg-green-600 text-white rounded-2xl w-full sm:w-48 h-48 hover:bg-green-700 active:bg-green-800 active:scale-95 transition-all duration-150 shadow-lg group"
          >
            <div className="w-16 h-16 mb-3 bg-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-150">
              <img src={uploadIcon} alt="upload foto" className="w-10 h-10" />
            </div>
            <span className="font-black text-xl tracking-wider">Register Wajah</span>
          </button>

          {/* Tombol Upload Surat Izin */}
          <button
            onClick={() => navigate("/izin")}
            className="flex flex-col items-center justify-center bg-green-600 text-white rounded-2xl w-full sm:w-48 h-48 hover:bg-green-700 active:bg-green-800 active:scale-95 transition-all duration-150 shadow-lg group"
          >
            <div className="w-16 h-16 mb-3 bg-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-150">
              <img src={izinIcon} alt="upload izin" className="w-10 h-10" />
            </div>
            <span className="font-black text-xl tracking-wider">Upload Surat Izin</span>
          </button>

        </div>

        {/* Tombol Logout */}
        <button
          className="bg-red-700 text-white font-bold px-16 rounded-2xl hover:bg-red-800 active:bg-red-900 active:scale-95 transition-all duration-150 shadow-lg text-xl tracking-wider"
          onClick={() => {
            localStorage.removeItem("user");
            navigate("/");
          }}
        >
          LOGOUT
        </button>
      </div>
    </div>
  );
}
