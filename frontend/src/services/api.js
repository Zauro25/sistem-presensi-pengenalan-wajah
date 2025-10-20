const API_BASE = "http://localhost:8000/api";

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

export async function recognizeAndAttend(dataURL, tanggal, sesi) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/recognize/`, {
    method: 'POST',
    headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Token ${token}` } : {}) },
    body: JSON.stringify({ image: dataURL, tanggal, sesi })
  });
  return res.json();
}

export async function uploadIzin(formData) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/surat/upload/`, {
    method:'POST',
    headers: token ? { "Authorization": `Token ${token}` } : {},
    body: formData
  });
  return res.json();
}

export async function rekap(start, end) {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams({ start, end });
  const res = await fetch(`${API_BASE}/rekap/?${params.toString()}`, {
    headers: token ? { "Authorization": `Token ${token}` } : {}
  });
  return res.json();
}

export function exportXLSX(start, end) {
  const params = new URLSearchParams({ start, end });
  const token = localStorage.getItem("token");
  const url = `${API_BASE}/rekap/export/xlsx/?${params.toString()}`;
  // open with token? better open via backend; for simplicity, just open url in browser - browser won't include token header
  // instead do fetch and create blob:
  return fetch(url, { headers: token ? { "Authorization": `Token ${token}` } : {} })
    .then(r => r.blob())
    .then(blob => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'rekap_absensi.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
}

export function exportPDF(start, end) {
  const params = new URLSearchParams({ start, end });
  const token = localStorage.getItem("token");
  const url = `${API_BASE}/rekap/export/pdf/?${params.toString()}`;
  return fetch(url, { headers: token ? { "Authorization": `Token ${token}` } : {} })
    .then(r => r.blob())
    .then(blob => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'rekap_absensi.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
}
