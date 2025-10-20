import React, {useState, useEffect} from "react";
import { listSantri, registerSantri } from "../services/api";

export default function RegistrasiSantri() {
  const [santriId, setSantriId] = useState("");
  const [nama, setNama] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("L");
  const [foto, setFoto] = useState(null);
  const [list, setList] = useState([]);

  useEffect(()=>{ fetchList(); },[]);
  async function fetchList(){
    const res = await listSantri();
    if(res.ok) setList(res.data);
  }

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('santri_id', santriId);
    fd.append('nama', nama);
    fd.append('jenis_kelamin', jenisKelamin);
    fd.append('foto', foto);
    const res = await registerSantri(fd);
    if(res.ok){
      alert('Terdaftar!');
      fetchList();
      setSantriId(''); setNama(''); setFoto(null);
    } else {
      alert(res.message || 'Gagal');
    }
  };

  return (
    <div className="container">
      <h3>Registrasi Santri</h3>
      <form onSubmit={submit}>
        <input className="form-control mb-2" placeholder="santri_id" value={santriId} onChange={e=>setSantriId(e.target.value)} />
        <input className="form-control mb-2" placeholder="Nama" value={nama} onChange={e=>setNama(e.target.value)} />
        <select className="form-select mb-2" value={jenisKelamin} onChange={e=>setJenisKelamin(e.target.value)}>
          <option value="L">Laki-laki</option>
          <option value="P">Perempuan</option>
        </select>
        <input type="file" accept="image/*" className="form-control mb-2" onChange={e=>setFoto(e.target.files[0])} />
        <button className="btn btn-primary">Daftarin</button>
      </form>
      <hr />
      <h5>Daftar Santri</h5>
      <ul>
        {list.map(s=> <li key={s.id}>{s.santri_id} - {s.nama} ({s.jenis_kelamin})</li>)}
      </ul>
    </div>
  );
}
