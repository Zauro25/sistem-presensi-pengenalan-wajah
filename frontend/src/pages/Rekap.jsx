import React, { useState } from "react";
import { rekap, exportXLSX, exportPDF } from "../services/api";

export default function Rekap() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [data, setData] = useState(null);

  const doRekap = async () => {
    if (!start || !end) {
      alert("Pilih Dari dan Sampai tanggalnya");
      return;
    }
    const res = await rekap(start, end);
    if (res.ok) setData(res);
    else alert(res.message || "Gagal");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-800">
      <div className="bg-gray-300 rounded-3xl shadow-lg p-8 w-[90%] max-w-5xl text-center">
        {/* Judul */}
        <h1 className="text-3xl font-extrabold mb-8">REKAP ABSENSI</h1>

        {/* Input tanggal */}
        <div className="flex justify-center gap-12 mb-6">
          <div className="flex flex-col items-center ">
            <span className="font-bold mb-2">DARI</span>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="px-4 py-3 rounded-lg border text-center text-white font-bold"
            />
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold mb-2">SAMPAI</span>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="px-4 py-3 rounded-lg border text-center font-bold text-white"
            />
          </div>
        </div>

        {/* Tombol utama */}
        <button
          onClick={doRekap}
          className="bg-green-700 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-800 active:scale-95 transition-transform"
        >
          TAMPILKAN REKAP
        </button>

        {/* Kalau data ada */}
        {data && data.ok && (
          <div className="mt-10 text-left overflow-x-auto">
            {/* Tombol export */}
            <div className="flex gap-4 mb-6">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700"
                onClick={() => exportXLSX(start, end)}
              >
                Export XLSX
              </button>
              <button
                className="bg-gray-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-700"
                onClick={() => exportPDF(start, end)}
              >
                Export PDF
              </button>
            </div>

            {/* Tabel Putra */}
            <h2 className="text-xl font-bold mb-2">Putra</h2>
            <table className="table-auto border-collapse border border-gray-500 w-full text-sm mb-6">
              <thead>
                <tr className="bg-gray-400">
                  <th className="border border-gray-500 px-2 py-1">Nama</th>
                  {data.headers.map((h) => (
                    <th
                      key={h.col_key}
                      className="border border-gray-500 px-2 py-1"
                    >
                      {h.tanggal} {h.sesi}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.putra.map((r) => (
                  <tr key={r.santri_id}>
                    <td className="border border-gray-500 px-2 py-1">
                      {r.nama}
                    </td>
                    {data.headers.map((h) => (
                      <td
                        key={h.col_key}
                        className="border border-gray-500 px-2 py-1 text-center"
                      >
                        {r[h.col_key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Tabel Putri */}
            <h2 className="text-xl font-bold mb-2">Putri</h2>
            <table className="table-auto border-collapse border border-gray-500 w-full text-sm">
              <thead>
                <tr className="bg-gray-400">
                  <th className="border border-gray-500 px-2 py-1">Nama</th>
                  {data.headers.map((h) => (
                    <th
                      key={h.col_key}
                      className="border border-gray-500 px-2 py-1"
                    >
                      {h.tanggal} {h.sesi}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.putri.map((r) => (
                  <tr key={r.santri_id}>
                    <td className="border border-gray-500 px-2 py-1">
                      {r.nama}
                    </td>
                    {data.headers.map((h) => (
                      <td
                        key={h.col_key}
                        className="border border-gray-500 px-2 py-1 text-center"
                      >
                        {r[h.col_key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
