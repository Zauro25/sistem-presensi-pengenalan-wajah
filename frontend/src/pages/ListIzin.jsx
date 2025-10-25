import React, { useState, useEffect } from "react";
import { listSantri, uploadIzin } from "../services/api";

export default function ListIzin() {
  const [riwayatIzin, setRiwayatIzin] = useState([]);
  const [listSantris, setListSantris] = useState([]);
  const [selectedSantri, setSelectedSantri] = useState("");
  const [kelas, setKelas] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [sesi, setSesi] = useState("");
  const [alasan, setAlasan] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // ambil list santri
    const s = await listSantri();
    if (s.ok) setListSantris(s.data);
    // ambil list surat izin (kalau mau nampilin riwayat)
    const izinRes = await fetch(`http://127.0.0.1:8000/api/izin/list/`, {
      headers: { Authorization: "Token " + localStorage.getItem("token") },
    });
    if (izinRes.ok) {
      const data = await izinRes.json();
      if (data.ok) setRiwayatIzin(data.data || []);
    }
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

    const res = await uploadIzin(formData);

    if (res.ok) {
      alert("Permohonan izin berhasil dikirim!");
      setAlasan("");
      fetchData();
    } else {
      alert("Gagal kirim izin: " + (res.message || "error tidak diketahui"));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-10 bg-gray-800 text-white">
      <div className="bg-gray-300 rounded-3xl shadow-lg p-6 w-full max-w-5xl flex flex-col items-center text-gray-800">
        <h2 className="text-2xl font-extrabold mb-6">Permohonan Izin Santri</h2>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md flex flex-col gap-3 mb-8 text-white"
        >
          <select
            className="p-3 rounded-lg border font-semibold"
            value={selectedSantri}
            onChange={(e) => setSelectedSantri(e.target.value)}
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
            className="p-3 rounded-lg border font-semibold"
          />

          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="p-3 rounded-lg border font-semibold"
          />

          <select
            value={sesi}
            onChange={(e) => setSesi(e.target.value)}
            className="p-3 rounded-lg border font-semibold"
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
            className="p-3 rounded-lg border font-semibold resize-none"
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
          <h3 className="font-bold text-xl mb-4">Riwayat Izin</h3>
          <p className="font-semibold text-xl">Nama: <strong>{user?.nama_lengkap || user?.username}</strong></p>
          {riwayatIzin.length === 0 ? (
            <p className="text-gray-700">Belum ada riwayat izin.</p>
          ) : (
            <table className="table-auto w-full border border-gray-400 text-sm">
              <thead className="bg-gray-400">
                <tr>
                  <th className="border border-gray-500 px-2 py-1">Tanggal</th>
                  <th className="border border-gray-500 px-2 py-1">Sesi</th>
                  <th className="border border-gray-500 px-2 py-1">Kelas</th>
                  <th className="border border-gray-500 px-2 py-1">Alasan</th>
                  <th className="border border-gray-500 px-2 py-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {riwayatIzin.map((it) => (
                  <tr key={it.id} className="text-center">
                    <td className="border border-gray-500 px-2 py-1">{it.tanggal}</td>
                    <td className="border border-gray-500 px-2 py-1">{it.sesi}</td>
                    <td className="border border-gray-500 px-2 py-1">{it.kelas || "-"}</td>
                    <td className="border border-gray-500 px-2 py-1">{it.alasan}</td>
                    <td className="border border-gray-500 px-2 py-1 font-bold">{it.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
