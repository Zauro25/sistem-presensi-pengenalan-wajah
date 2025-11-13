import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterSantri() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
    nama: "",
    asal_daerah: "",
    sektor: "kepuh",
    angkatan: "",
    jenis_kelamin: "L"
  });
  const [msg, setMsg] = useState("");

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

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://127.0.0.1:8000/api/register-santri/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        setMsg("✅ Registrasi berhasil, silakan login!");
        // redirect ke halaman login setelah 1.5 detik
        setTimeout(() => navigate("/"), 1500);
      } else {
        setMsg("❌ Gagal: " + (data.message || JSON.stringify(data)));
      }
    } catch (err) {
      setMsg("❌ Error: " + err.message);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <h3 className={`font-bold text-2xl md:text-3xl mb-6 text-center ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
        Register Akun Santri
      </h3>
      
      <div className={`w-full max-w-md p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <form onSubmit={submit} className="space-y-4">
          <input
            placeholder="Nama Lengkap"
            className={`w-full px-3 py-2 rounded-lg border outline-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-black'}`}
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            required
          />
          <input
            placeholder="Asal Daerah"
            className={`w-full px-3 py-2 rounded-lg border outline-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-black'}`}
            value={form.asal_daerah}
            onChange={(e) => setForm({ ...form, asal_daerah: e.target.value })}
            required
          />
          <select
            className={`w-full px-3 py-2 rounded-lg border outline-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-black'}`}
            value={form.sektor}
            onChange={(e) => setForm({ ...form, sektor: e.target.value })}
          >
            <option value="kepuh">Kepuh</option>
            <option value="sidobali">Sidobali</option>
          </select>
          <input
            placeholder="Angkatan"
            className={`w-full px-3 py-2 rounded-lg border outline-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-black'}`}
            value={form.angkatan}
            onChange={(e) => setForm({ ...form, angkatan: e.target.value })}
            required
          />
          <select
            className={`w-full px-3 py-2 rounded-lg border outline-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-black'}`}
            value={form.jenis_kelamin}
            onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}
          >
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
          <input
            placeholder="Username"
            className={`w-full px-3 py-2 rounded-lg border outline-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-black'}`}
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className={`w-full px-3 py-2 rounded-lg border outline-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-black'}`}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button 
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Register
          </button>
        </form>
        
        {msg && (
          <div className={`mt-4 p-3 rounded-lg text-sm text-center ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}