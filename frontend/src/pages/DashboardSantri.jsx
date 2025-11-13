import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../services/apiClient";
import Sidebar from "../components/Sidebar";

// Tailwind-only, responsive, collapsible sidebar layout with attendance stats + custom lightweight chart (no extra deps)

function getDefaultTahunAjaran(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  // Gasal: Jul-Dec, Genap: Jan-Jun
  if (month >= 7) {
    // Current year Gasal (July - December)
    return {
      key: `${year}_gasal`,
      label: `${year}/${year + 1} Gasal`,
      start: `${year}-07-01`,
      end: `${year}-12-31`,
    };
  }
  // Previous year Genap (January - June)
  return {
    key: `${year - 1}_genap`,
    label: `${year - 1}/${year} Genap`,
    start: `${year}-01-01`,
    end: `${year}-06-30`,
  };
}

function isoWeekKey(dateStr) {
  // dateStr: "YYYY-MM-DD" → returns e.g. "2025-W45"
  const d = new Date(dateStr + "T00:00:00");
  // Copy date to avoid side effects
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Thursday in current week decides the year.
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

const STATUS_KEYS = ["Hadir", "T1", "T2", "T3", "Izin"]; // "-" will be ignored for chart and stats denominator

export default function DashboardSantri() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

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

  // Sidebar state (mobile collapsible)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tahun Ajaran & data states
  const defaultTahunAjaran = useMemo(() => getDefaultTahunAjaran(new Date()), []);
  const [tahunAjaranKey, setTahunAjaranKey] = useState(defaultTahunAjaran.key);
  const [dateRange, setDateRange] = useState({ start: defaultTahunAjaran.start, end: defaultTahunAjaran.end });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rekap, setRekap] = useState(null);

  // Derived metrics
  const displayName = user?.nama_lengkap || user?.username || "";

  const { attendancePct, statusCounts } = useMemo(() => {
    if (!rekap || !rekap.ok) return { attendancePct: 0, statusCounts: { Hadir: 0, T1: 0, T2: 0, T3: 0, Izin: 0 } };

    // Find this santri's row by name (backend returns key "Nama")
    const row = (rekap.putra || []).concat(rekap.putri || []).find((r) => r.Nama === displayName);
    if (!row) return { attendancePct: 0, statusCounts: { Hadir: 0, T1: 0, T2: 0, T3: 0, Izin: 0 } };

    // Compute percentage and counts: present = Hadir/T1/T2/T3; denominator excludes Izin and '-'
    let present = 0;
    let total = 0;
    const counts = { Hadir: 0, T1: 0, T2: 0, T3: 0, Izin: 0 };

    (rekap.headers || []).forEach((h) => {
      const status = row[h.col_key];
      if (!status) return;
      // Denominator excludes '-' and 'Izin'
      if (status !== "-" && status !== "Izin") total += 1;
      if (["Hadir", "T1", "T2", "T3"].includes(status)) present += 1;

      // Count each status
      if (STATUS_KEYS.includes(status)) counts[status] += 1;
    });

    const pct = total > 0 ? Math.round((present / total) * 100) : 0;

    return { attendancePct: pct, statusCounts: counts };
  }, [rekap, displayName]);

  async function fetchRekap(retryCount = 0) {
    try {
      setLoading(true);
      setError("");
      const { start, end } = dateRange;
      console.log(`Fetching rekap (attempt ${retryCount + 1})...`);
      const { data } = await apiClient.attendance.list({ start, end });
      console.log("Rekap fetched successfully");
      setRekap(data);
    } catch (e) {
      console.error("Gagal memuat rekap:", e);
      const isTimeout = e.code === 'ECONNABORTED' || e.message?.includes('timeout');
      const errorMsg = isTimeout 
        ? "Koneksi timeout. Server memproses terlalu lama, coba lagi."
        : (e?.response?.data?.message || e.message || "Gagal memuat rekap");
      
      // Retry once on timeout
      if (isTimeout && retryCount < 1) {
        console.log("Retrying after timeout...");
        setTimeout(() => fetchRekap(retryCount + 1), 2000);
        return;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRekap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.start, dateRange.end]);

  function onChangeTahunAjaran(key) {
    setTahunAjaranKey(key);
    const [yearPart, semester] = key.split('_');
    const year = parseInt(yearPart);
    if (semester === "gasal") {
      setDateRange({ start: `${year}-07-01`, end: `${year}-12-31` });
    } else if (semester === "genap") {
      setDateRange({ start: `${year + 1}-01-01`, end: `${year + 1}-06-30` });
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  // Grouped bar chart comparing status counts
  function GroupedBarChart({ data, isDark }) {
    const maxCount = Math.max(...Object.values(data));
    const barMaxHeight = 200; // px

    const colorMap = {
      Hadir: isDark ? "bg-green-400" : "bg-green-500",
      T1: isDark ? "bg-yellow-300" : "bg-yellow-400",
      T2: isDark ? "bg-orange-300" : "bg-orange-400",
      T3: isDark ? "bg-amber-500" : "bg-amber-600",
      Izin: isDark ? "bg-blue-300" : "bg-blue-400",
    };

    const labelColor = isDark ? "text-gray-300" : "text-gray-700";
    const borderColor = isDark ? "border-gray-600" : "border-gray-300";

    return (
      <div className="w-full">
        <div className="flex items-end justify-around gap-4 md:gap-8 pb-2">
          {STATUS_KEYS.map((status) => {
            const count = data[status] || 0;
            const height = maxCount > 0 ? (count / maxCount) * barMaxHeight : 0;
            return (
              <div key={status} className="flex flex-col items-center">
                <div className={`text-sm md:text-base font-bold mb-1 ${labelColor}`}>{count}</div>
                <div
                  className={`${colorMap[status]} w-16 md:w-24 rounded-t-lg border ${borderColor} transition-all hover:opacity-80`}
                  style={{ height: `${height}px`, minHeight: count > 0 ? '20px' : '0px' }}
                  title={`${status}: ${count}`}
                />
                <div className={`text-xs md:text-sm mt-2 font-semibold ${labelColor}`}>{status}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Sidebar 
        isDarkMode={isDarkMode} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        role="santri"
      />

      {/* Main content */}
      <div className="md:ml-64 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Greeting */}
            <div className="mb-6">
              <h1 className={`text-2xl md:text-3xl font-black ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Halo, {displayName}</h1>
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Selamat datang di Dashboard Santri</p>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className={`rounded-xl shadow p-4 flex items-center justify-between ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tahun Ajaran</div>
                  <div className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {tahunAjaranKey.includes('gasal') ? tahunAjaranKey.split('_')[0] + '/' + (parseInt(tahunAjaranKey.split('_')[0]) + 1) + ' Gasal' : tahunAjaranKey.split('_')[0] + '/' + (parseInt(tahunAjaranKey.split('_')[0]) + 1) + ' Genap'}
                  </div>
                </div>
                <select
                  value={tahunAjaranKey}
                  onChange={(e) => onChangeTahunAjaran(e.target.value)}
                  className={`border rounded-lg px-2 py-1 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}
                >
                  <option value="2024_gasal">2024/2025 Gasal</option>
                  <option value="2024_genap">2024/2025 Genap</option>
                  <option value="2025_gasal">2025/2026 Gasal</option>
                  <option value="2025_genap">2025/2026 Genap</option>
                </select>
              </div>

              <div className={`rounded-xl shadow p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Dari</div>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange((d) => ({ ...d, start: e.target.value }))}
                  className={`mt-1 w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div className={`rounded-xl shadow p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sampai</div>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange((d) => ({ ...d, end: e.target.value }))}
                  className={`mt-1 w-full border rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>

            {/* Attendance percentage card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className={`rounded-2xl shadow p-6 flex items-center justify-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="text-center">
                  <div className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Persentase Kehadiran</div>
                  <div className={`text-5xl md:text-6xl font-black ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{attendancePct}%</div>
                  <div className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Periode: {dateRange.start} s/d {dateRange.end}</div>
                </div>
              </div>

              {/* Loading/Error card */}
              <div className={`rounded-2xl shadow p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status Data</div>
                {loading ? (
                  <div className={`animate-pulse h-6 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                ) : error ? (
                  <div className="text-red-600 text-sm">{error}</div>
                ) : (
                  <div className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>Data terbaru telah dimuat.</div>
                )}
              </div>
            </div>

            {/* Chart card */}
            <div className={`rounded-2xl shadow p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className={`text-base md:text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Perbandingan Status Kehadiran</div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total kehadiran berdasarkan status</div>
                </div>
              </div>

              {loading ? (
                <div className={`animate-pulse h-48 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
              ) : (
                <GroupedBarChart data={statusCounts} isDark={isDarkMode} />
              )}
            </div>
          </div>
      </div>
    </div>
  );
}
