import React, {useState, useEffect} from "react";
import { apiClient } from "../services/apiClient";
import Sidebar from "../components/Sidebar";

export default function RegistrasiSantri() {
  const [santriId, setSantriId] = useState("");
  const [nama, setNama] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("L");
  const [foto, setFoto] = useState(null);
  const [list, setList] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  useEffect(()=>{ fetchList(); },[]);
  async function fetchList(){
    const { data: res } = await apiClient.santri.list();
    if(res?.ok) setList(res.data);
  }

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('santri_id', santriId);
    fd.append('nama', nama);
    fd.append('jenis_kelamin', jenisKelamin);
    fd.append('foto', foto);
    const { data: res } = await apiClient.legacy.registerSantri(fd);
    if(res?.ok){
      alert('Terdaftar!');
      fetchList();
      setSantriId(''); setNama(''); setFoto(null);
    } else {
      alert(res.message || 'Gagal');
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Sidebar 
        isDarkMode={isDarkMode} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        role="pengurus"
      />
      <div className="md:ml-64 flex items-center justify-center p-4 min-h-screen">
        <div className={`w-full max-w-3xl rounded-3xl shadow-lg p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Registrasi Santri</h3>
        <form onSubmit={submit} className="space-y-4 mb-8">
          <input 
            className={`w-full px-4 py-3 rounded-lg border outline-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
            placeholder="Santri ID" 
            value={santriId} 
            onChange={e=>setSantriId(e.target.value)} 
          />
          <input 
            className={`w-full px-4 py-3 rounded-lg border outline-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
            placeholder="Nama Lengkap" 
            value={nama} 
            onChange={e=>setNama(e.target.value)} 
          />
          <select 
            className={`w-full px-4 py-3 rounded-lg border outline-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
            value={jenisKelamin} 
            onChange={e=>setJenisKelamin(e.target.value)}
          >
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
          <input 
            type="file" 
            accept="image/*" 
            className={`w-full px-4 py-3 rounded-lg border outline-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
            onChange={e=>setFoto(e.target.files[0])} 
          />
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Daftarkan
          </button>
        </form>
        
        <div className={`border-t pt-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
          <h5 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Daftar Santri</h5>
          <ul className="space-y-2">
            {list.map(s=> (
              <li 
                key={s.id} 
                className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-900'}`}
              >
                {s.santri_id} - {s.nama} ({s.jenis_kelamin})
              </li>
            ))}
          </ul>
        </div>
        </div>
      </div>
    </div>
  );
}
