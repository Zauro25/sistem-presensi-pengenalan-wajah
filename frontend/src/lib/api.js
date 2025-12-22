// Centralized API client for backend communication
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  setToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
    }
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token && !options.skipAuth) {
      headers['Authorization'] = `Token ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.message || data.error || 'Request failed');
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      if (error.status === 401) {
        this.removeToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      throw error;
    }
  }

  async uploadFile(endpoint, formData) {
    const token = this.getToken();
    const headers = {};

    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.message || data.error || 'Upload failed',
        data,
      };
    }

    return data;
  }

  // AUTH APIs
  async login(username, password) {
    return this.request('/login-token/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      skipAuth: true,
    });
  }

  async registerPengurus(data) {
    return this.request('/register-pengurus/', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  }

  async registerSantri(data) {
    return this.request('/register-santri/', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  }

  async getUser() {
    return this.request('/user/', { method: 'GET' });
  }

  async logout() {
    const response = await this.request('/logout/', { method: 'POST' });
    this.removeToken();
    return response;
  }

  // SANTRI APIs
  async listSantri() {
    return this.request('/santri/', { method: 'GET' });
  }

  async uploadSantriFoto(santriId, fotoFile) {
    const formData = new FormData();
    formData.append('santri_id', santriId);
    formData.append('foto', fotoFile);
    return this.uploadFile('/santri/upload-foto/', formData);
  }

  async registrasiWajah(santriId, imageBase64) {
    return this.request('/santri/registrasi-wajah/', {
      method: 'POST',
      body: JSON.stringify({
        santri_id: santriId,
        image: imageBase64,
      }),
    });
  }

  // IZIN APIs
  async permohonanIzin(data) {
    return this.request('/santri/izin/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listIzinSantri() {
    return this.request('/santri/izin/list/', { method: 'GET' });
  }

  async listPermohonanIzin() {
    return this.request('/izin/list/', { method: 'GET' });
  }

  async validasiIzin(izinId, status, note = '') {
    return this.request(`/izin/validasi/${izinId}/`, {
      method: 'POST',
      body: JSON.stringify({ status, note }),
    });
  }

  // ABSENSI CONTROL APIs
  async startAbsensi(tanggal, sesi) {
    return this.request('/start-absensi/', {
      method: 'POST',
      body: JSON.stringify({ tanggal, sesi }),
    });
  }

  async startTelat() {
    return this.request('/start-telat/', {
      method: 'POST',
    });
  }

  async endAbsensi() {
    return this.request('/end-absensi/', {
      method: 'POST',
    });
  }

  // RECOGNITION API
  async recognizeAndAttend(imageBase64, kelas) {
    return this.request('/recognize/', {
      method: 'POST',
      body: JSON.stringify({
        image: imageBase64,
        kelas,
      }),
    });
  }

  // REKAP APIs
  async getRekap(start, end, kelas = null) {
    const params = new URLSearchParams({ start, end });
    if (kelas && kelas !== 'All' && kelas !== 'Semua Kelas') {
      params.append('kelas', kelas);
    }
    return this.request(`/rekap/?${params.toString()}`, { method: 'GET' });
  }

  async exportXlsx(start, end, kelas = null) {
    const token = this.getToken();
    const params = new URLSearchParams({ start, end });
    if (kelas && kelas !== 'All' && kelas !== 'Semua Kelas') {
      params.append('kelas', kelas);
    }

    const headers = {};
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }

    const response = await fetch(`${this.baseURL}/rekap/export/xlsx/?${params.toString()}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rekap_absensi.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  // REGISTRATION CODE APIs
  async verifySantriName(santriName) {
    return this.request('/verify-santri/', {
      method: 'POST',
      body: JSON.stringify({ santri_name: santriName }),
    });
  }

  async listRegistrationCodes() {
    return this.request('/registration-codes/', { method: 'GET' });
  }
}

export const api = new ApiClient();
