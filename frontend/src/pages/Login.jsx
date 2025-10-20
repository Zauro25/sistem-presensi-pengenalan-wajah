import React, { useState } from "react";
import { login } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setMsg("Sedang login...");

    try {
      const res = await login(username, password);

      if (res.token) {
        const userData = {
          token: res.token,
          role: res.role || (res.user?.is_staff ? "pengurus" : "santri"),
          username: res.user?.username || username,
          nama_lengkap: res.user?.nama_lengkap,
          id: res.user?.id,
        };

        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", res.token)
        setMsg("Login sukses!");

        if (userData.role === "pengurus") {
          navigate("/dashboard");
        } else if (userData.role === "santri") {
          navigate("/dashboard-santri");
        } else {
          navigate("/");
        }
      } else {
        setMsg("Gagal login: " + (res.error || res.message || "Unknown error"));
      }
    } catch (err) {
      setMsg("Error koneksi: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-400 p-10 rounded-2xl w-screen max-w-md shadow-lg text-center">
        <h2 className="font-bold mb-1 text-4xl">SISTEM ABSENSI</h2>
        <h4 className="mb-5 text-3xl">PPM JOGJA</h4>

        <form onSubmit={submit}>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none bg-white text-black"
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none bg-white text-black"
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
            className="bg-transparent border-none text-blue-700 hover:text-white transition-all duration-150 cursor-pointer text-sm underline"
          >
            Belum punya akun? Registrasi disini
          </button>
        </div>

        {msg && (
          <div className="mt-4 text-sm bg-white p-2 rounded-lg">
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}