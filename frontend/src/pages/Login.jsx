import React, { useState, useEffect } from "react";
import { apiClient } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  const { login: setAuth } = useAuth();

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
    setMsg("Sedang login...");

    try {
      const { data: res } = await apiClient.auth.login(username, password);
      console.log("Login response:", res);

      if (res?.token) {
        const userData = {
          role: res.role || (res.user?.is_staff ? "pengurus" : "santri"),
          username: res.user?.username || username,
          nama_lengkap: res.user?.nama_lengkap,
          santri_id: res.user?.santri_id,
          id: res.user?.id,
        };
        setAuth(userData, res.token);
        setMsg("Login sukses!");

        if (userData.role === "pengurus") {
          navigate("/dashboard");
        } else if (userData.role === "santri") {
          navigate("/dashboard-santri");
        } else {
          navigate("/");
        }
      } else {
        const errorMsg = res.error || res.detail || res.message || "Respons tidak valid";
        console.error("Login failed:", res);
        setMsg("Gagal login: " + errorMsg);
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || err.message;
      setMsg("Error koneksi: " + errorMsg);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className={`p-10 rounded-2xl w-screen max-w-md shadow-lg text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`font-bold mb-1 text-4xl ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>SISTEM ABSENSI</h2>
        <h4 className={`mb-5 text-3xl ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>PPM JOGJA</h4>

        <form onSubmit={submit}>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border outline-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-black'}`}
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border outline-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-black'}`}
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded-xl border-none bg-blue-600 text-white font-bold cursor-pointer text-base transition-colors duration-200 hover:bg-green-600 transition-all duration-150 active:bg-blue-800 tracking-wider"
          >
            Login
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={() => navigate("/register")}
            className={`bg-transparent border-none hover:underline transition-all duration-150 cursor-pointer text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-700 hover:text-blue-600'}`}
          >
            Belum punya akun? Registrasi disini
          </button>
        </div>

        {msg && (
          <div className={`mt-4 text-sm p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}