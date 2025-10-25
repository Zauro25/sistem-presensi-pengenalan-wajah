const API_BASE = "http://127.0.0.1:8000/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { "Authorization": `Token ${token}` } : {};
}

export async function fetchSantriApi() {
  const res = await fetch(`${API_BASE}/santri/`, {
    headers: authHeaders()
  });
  return res.json();
}
export async function fetchUser() {
  const res = await fetch(`${API_BASE}/user/`, {
    headers: { "Content-Type": "application/json" },
  });
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/login-token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function registerPengurus(data) {
  const res = await fetch(`${API_BASE}/register-pengurus/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function listSantri() {
  const res = await fetch(`${API_BASE}/santri/`, {
    headers: {
      Authorization: `Token ${localStorage.getItem("token")}`,
    },
  });
  return res.json();
}


export async function registerSantri(formData) {
  const res = await fetch(`${API_BASE}/santri/register/`, {
    method: 'POST',
    headers: {
      "Authorization": `Token ${token}`
    },
    body: formData
  });
  return res.json();
}

export async function recognizeAndAttend(dataURL, tanggal, sesi, kelas) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/recognize/`, {
    method: 'POST',
    headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Token ${token}` } : {}) },
    body: JSON.stringify({ image: dataURL, tanggal, sesi, kelas })
  });
  return await res.json();
}

export async function uploadIzin(formData) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/santri/izin/`, {
    method:'POST',
    headers: token ? { "Authorization": `Token ${token}` } : {},
    body: formData
  });
  return res.json();
}

export async function rekap(start, end, kelas = "") {
  const token = localStorage.getItem("token");
  const url = new URL("http://127.0.0.1:8000/api/rekap/");
  url.searchParams.append("start", start);
  url.searchParams.append("end", end);
  if (kelas) url.searchParams.append("kelas", kelas); // kirim kelas kalau dipilih

  const res = await fetch(url, {
    headers: { Authorization: "Token " + token },
  });
  return await res.json();
}


export async function exportXLSX(start, end) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/rekap/export/xlsx/?start=${start}&end=${end}`, {
    headers: { Authorization: "Token " + token },
  });
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rekap_absensi.xlsx";
  a.click();
}



