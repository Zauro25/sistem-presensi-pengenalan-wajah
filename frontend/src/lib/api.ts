interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

interface ApiError extends Error {
  status?: number;
  data?: any;
}

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:8000/api`;
  }

  return 'http://localhost:8000/api';
}

class ApiClient {
  baseURL: string;

  constructor() {
    this.baseURL = getApiBaseUrl();
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
    }
  }

  async request(endpoint: string, options: RequestOptions = {}): Promise<any> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
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
        const error = new Error(data.message || data.error || 'Request failed') as ApiError;
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 401) {
        this.removeToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      throw error;
    }
  }

  async uploadFile(endpoint: string, formData: FormData): Promise<any> {
    const token = this.getToken();
    const headers: Record<string, string> = {};

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

  async login(username: string, password: string): Promise<any> {
    return this.request('/login-token/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      skipAuth: true,
    });
  }

  async registerPengurus(data: any): Promise<any> {
    return this.request('/register-pengurus/', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  }

  async registerSantri(data: any): Promise<any> {
    return this.request('/register-santri/', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  }

  async getUser(): Promise<any> {
    return this.request('/user/', { method: 'GET' });
  }

  async logout(): Promise<any> {
    const response = await this.request('/logout/', { method: 'POST' });
    this.removeToken();
    return response;
  }

  async listSantri(): Promise<any> {
    return this.request('/santri/', { method: 'GET' });
  }

  async uploadSantriFoto(santriId: number | string, fotoFile: File): Promise<any> {
    const formData = new FormData();
    formData.append('santri_id', String(santriId));
    formData.append('foto', fotoFile);
    return this.uploadFile('/santri/upload-foto/', formData);
  }

  async registrasiWajah(santriId: number | string, imageBase64: string): Promise<any> {
    return this.request('/santri/registrasi-wajah/', {
      method: 'POST',
      body: JSON.stringify({
        santri_id: santriId,
        image: imageBase64,
      }),
    });
  }

  async permohonanIzin(data: any): Promise<any> {
    return this.request('/santri/izin/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listIzinSantri(): Promise<any> {
    return this.request('/santri/izin/list/', { method: 'GET' });
  }

  async listPermohonanIzin(): Promise<any> {
    return this.request('/izin/list/', { method: 'GET' });
  }

  async validasiIzin(izinId: number | string, status: string, note: string = ''): Promise<any> {
    return this.request(`/izin/validasi/${izinId}/`, {
      method: 'POST',
      body: JSON.stringify({ status, note }),
    });
  }

  async startPresensi(tanggal: string, sesi: string): Promise<any> {
    return this.request('/start-presensi/', {
      method: 'POST',
      body: JSON.stringify({ tanggal, sesi }),
    });
  }

  async startTelat(): Promise<any> {
    return this.request('/start-telat/', {
      method: 'POST',
    });
  }

  async endPresensi(): Promise<any> {
    return this.request('/end-presensi/', {
      method: 'POST',
    });
  }

  async recognizeAndAttend(imageBase64: string, kelas: string): Promise<any> {
    return this.request('/recognize/', {
      method: 'POST',
      body: JSON.stringify({
        image: imageBase64,
        kelas,
      }),
    });
  }

  async getRekap(start: string, end: string, kelas: string | null = null): Promise<any> {
    const params = new URLSearchParams({ start, end });
    if (kelas && kelas !== 'All' && kelas !== 'Semua Kelas') {
      params.append('kelas', kelas);
    }
    return this.request(`/rekap/?${params.toString()}`, { method: 'GET' });
  }

  async exportXlsx(start: string, end: string, kelas: string | null = null): Promise<void> {
    const token = this.getToken();
    const params = new URLSearchParams({ start, end });
    if (kelas && kelas !== 'All' && kelas !== 'Semua Kelas') {
      params.append('kelas', kelas);
    }

    const headers: Record<string, string> = {};
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
    a.download = 'rekap_presensi.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  async verifySantriName(santriName: string): Promise<any> {
    return this.request('/verify-santri/', {
      method: 'POST',
      body: JSON.stringify({ santri_name: santriName }),
    });
  }

  async listRegistrationCodes(): Promise<any> {
    return this.request('/registration-codes/', { method: 'GET' });
  }
}

export const api = new ApiClient();
