import React, { useEffect, useState } from "react";

export default function ValidasiIzin() {
  const [daftarIzin, setDaftarIzin] = useState([]);

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
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-6">
      <div className="bg-gray-300 rounded-3xl shadow-lg p-6 w-full max-w-5xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Daftar Permohonan Izin Santri
        </h2>
        <table className="table-auto w-full text-gray-800">
          <thead className="bg-gray-400">
            <tr>
              <th className="px-3 py-2 border">Santri</th>
              <th className="px-3 py-2 border">Kelas</th>
              <th className="px-3 py-2 border">Tanggal</th>
              <th className="px-3 py-2 border">Sesi</th>
              <th className="px-3 py-2 border">Alasan</th>
              <th className="px-3 py-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {daftarIzin.length > 0 ? (
              daftarIzin.map((it) => (
                <tr key={it.id}>
                  <td className="border px-3 py-2">{it.nama}</td>
                  <td className="border px-3 py-2">{it.kelas}</td>
                  <td className="border px-3 py-2">{it.tanggal}</td>
                  <td className="border px-3 py-2">{it.sesi}</td>
                  <td className="border px-3 py-2">{it.alasan}</td>
                  <td className="border px-3 py-2 flex gap-2 justify-center">
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
                <td colSpan="6" className="text-center py-4 text-gray-600">
                  Tidak ada permohonan izin menunggu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
