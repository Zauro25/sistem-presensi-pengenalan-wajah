import React, {useState, useEffect} from "react";
import { listSantri, uploadIzin, listSantri as fetchSantriApi } from "../services/api";

export default function ListIzin() {
  const [items, setItems] = useState([]);
  const [santris, setSantris] = useState([]);
  const [file, setFile] = useState(null);
  const [santriPk, setSantriPk] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [sesi, setSesi] = useState("Subuh");

  useEffect(()=>{ fetchAll(); },[]);
  async function fetchAll(){
    const r = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:8000/api'}/surat/`, { headers: {} }).then(r=>r.json());
    if(r.ok) setItems(r.data);
    const s = await fetchSantriApi();
    if(s.ok) setSantris(s.data);
  }

  async function upload(e){
    e.preventDefault();
    if(!santriPk || !file || !tanggal || !sesi){
      alert("Lengkapi data");
      return;
    }
    const fd = new FormData();
    fd.append('santri_pk', santriPk);
    fd.append('tanggal', tanggal);
    fd.append('sesi', sesi);
    fd.append('file', file);
    const r = await uploadIzin(fd);
    if(r.ok) {
      alert('File diupload');
      fetchAll();
    } else alert(r.message || 'Gagal');
  }

  return (
    <div className="container">
      <h3>Upload Surat Izin</h3>
      <form onSubmit={upload}>
        <select className="form-select mb-2" onChange={e=>setSantriPk(e.target.value)} value={santriPk}>
          <option value="">Pilih santri</option>
          {santris.map(s=> <option key={s.id} value={s.id}>{s.santri_id} - {s.nama}</option>)}
        </select>
        <input type="date" className="form-control mb-2" value={tanggal} onChange={e=>setTanggal(e.target.value)} />
        <select className="form-select mb-2" value={sesi} onChange={e=>setSesi(e.target.value)}>
          <option>Subuh</option>
          <option>Sore</option>
          <option>Malam</option>
        </select>
        <input type="file" className="form-control mb-2" accept=".pdf,image/*" onChange={e=>setFile(e.target.files[0])} />
        <button className="btn btn-primary">Upload Surat Izin</button>
      </form>

      <hr/>
      <h5>Daftar Surat (Terakhir)</h5>
      <table className="table">
        <thead><tr><th>Santri</th><th>Tanggal</th><th>Sesi</th><th>File</th><th>Status</th></tr></thead>
        <tbody>
          {items.map(it => (
            <tr key={it.id}>
              <td>{it.santri.santri_id} - {it.santri.nama}</td>
              <td>{it.tanggal}</td>
              <td>{it.sesi}</td>
              <td><a href={it.file} target="_blank" rel="noreferrer">Lihat</a></td>
              <td>{it.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
