import React, { useEffect, useState } from "react";
import { listSantri } from "../services/api";
import { useNavigate } from "react-router-dom";
// import icon dari src/assets
import absensiIcon from "../assets/absensi.png";
import rekapIcon from "../assets/rekap.png";
import izinIcon from "../assets/perizinan.png"

export default function Dashboard() {
  const [santris, setSantris] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      navigate("/"); 
    }
    fetchSantri();
  }, []);

  async function fetchSantri() {
    const res = await listSantri();
    if (res.ok) {
      setSantris(res.data);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-300 rounded-2xl shadow-2xl w-full max-w-2xl p-12 flex flex-col items-center">
        
        {/* Judul */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 tracking-wide">SISTEM ABSENSI</h1>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-wide">PPM JOGJA</h2>
        </div>
        
        {/* Sapaan */}
        <div className="mb-12">
          <p className="text-2xl md:text-3xl font-black text-gray-900 tracking-wide">
            HALO <strong>{JSON.parse(localStorage.getItem("user"))?.username} </strong></p>
        </div>
        
        {/* Tombol utama */}
        <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16 w-full">
          <button
            onClick={() => navigate("/absensi")}
            className="flex flex-col items-center justify-center bg-green-600 text-white rounded-2xl w-full sm:w-48 h-48 hover:bg-green-700 active:bg-green-800 active:scale-95 transition-all duration-150 shadow-lg group"
          >
            <div className="w-16 h-16 mb-3 bg-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-150">
              <img src={absensiIcon} alt="absensi" className="w-10 h-10" />
            </div>
            <span className="font-black text-xl tracking-wider">ABSENSI (Scan Wajah)</span>
          </button>
          
          <button
            onClick={() => navigate("/rekap")}
            className="flex flex-col items-center justify-center bg-green-600 text-white rounded-2xl w-full sm:w-48 h-48 hover:bg-green-700 active:bg-green-800 active:scale-95 transition-all duration-150 shadow-lg group"
          >
            <div className="w-16 h-16 mb-3 bg-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-150">
              <img src={rekapIcon} alt="rekap" className="w-10 h-10" />
            </div>
            <span className="font-black text-xl tracking-wider">REKAP</span>
          </button>
                    <button
            onClick={() => navigate("/rekap")}
            className="flex flex-col items-center justify-center bg-green-600 text-white rounded-2xl w-full sm:w-48 h-48 hover:bg-green-700 active:bg-green-800 active:scale-95 transition-all duration-150 shadow-lg group"
          >
            <div className="w-16 h-16 mb-3 bg-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-150">
              <img src={izinIcon} alt="perizinan" className="w-10 h-10" />
            </div>
            <span className="font-black text-xl tracking-wider">Perizinan</span>
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