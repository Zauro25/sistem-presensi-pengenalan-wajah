# API Reference - Frontend Integration

Complete reference for all backend API endpoints used by the frontend.

## Base URL
```
Development: http://localhost:8000/api
Production: https://your-domain.com/api
```

## Authentication

All authenticated endpoints require a token in the header:
```
Authorization: Token <your-token-here>
```

---

## 🔐 Auth Endpoints

### Login
```http
POST /login-token/
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "role": "pengurus",  // or "santri"
  "user": {
    "id": 1,
    "username": "admin",
    "nama_lengkap": "Ahmad Santoso",  // if santri
    "santri_id": 5,  // if santri
    "sektor": "kepuh",  // if santri
    "angkatan": "2023"  // if santri
  }
}
```

### Register Santri
```http
POST /register-santri/
```

**Request Body:**
```json
{
  "registration_code": "ABC12345",
  "nama": "Ahmad Santoso",
  "username": "ahmad123",
  "password": "securepass",
  "asal_daerah": "Jakarta",
  "sektor": "kepuh",  // "kepuh" or "sidobali"
  "angkatan": "2023",
  "jenis_kelamin": "L"  // "L" or "P"
}
```

**Response (200):**
```json
{
  "ok": true,
  "santri_id": 5,
  "user_id": 10,
  "username": "ahmad123",
  "nama": "Ahmad Santoso",
  "sektor": "kepuh",
  "role": "santri",
  "message": "Registrasi berhasil!"
}
```

**Error (400):**
```json
{
  "ok": false,
  "message": "Kode registrasi tidak valid"
}
```

### Logout
```http
POST /logout/
```

**Headers:** Requires authentication

**Response (200):**
```json
{
  "ok": true,
  "message": "Logout berhasil"
}
```

### Get Current User
```http
GET /user/
```

**Headers:** Requires authentication

**Response (200):**
```json
{
  "id": 1,
  "username": "admin",
  "is_staff": true,
  "is_superuser": false,
  "role": "pengurus"
}
```

---

## 👤 Face Registration

### Register Face (Santri)
```http
POST /santri/registrasi-wajah/
```

**Headers:** Requires authentication

**Request Body:**
```json
{
  "santri_id": 5,
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Wajah Ahmad Santoso berhasil diregistrasi!",
  "nama": "Ahmad Santoso",
  "location": {
    "top": 100,
    "right": 300,
    "bottom": 400,
    "left": 200
  }
}
```

**Error (400):**
```json
{
  "error": "Wajah tidak ditemukan"
}
```

---

## 📅 Attendance Session Control (Pengurus)

### Start Attendance Session
```http
POST /start-absensi/
```

**Headers:** Requires authentication

**Request Body:**
```json
{
  "tanggal": "2024-01-15",
  "sesi": "Subuh"  // "Subuh", "Sore", or "Malam"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Absensi dimulai"
}
```

### Start Lateness Tracking
```http
POST /start-telat/
```

**Headers:** Requires authentication

**Response (200):**
```json
{
  "ok": true,
  "message": "Penghitungan keterlambatan dimulai"
}
```

**Error (400):**
```json
{
  "ok": false,
  "message": "Absensi belum dimulai"
}
```

### End Attendance Session
```http
POST /end-absensi/
```

**Headers:** Requires authentication

**Response (200):**
```json
{
  "ok": true,
  "message": "Absensi selesai"
}
```

---

## 📸 Face Recognition & Attendance

### Recognize Face & Record Attendance
```http
POST /recognize/
```

**Headers:** Requires authentication

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "kelas": "Kelas A"
}
```

**Response (200):**
```json
{
  "ok": true,
  "santri": {
    "id": 5,
    "nama": "Ahmad Santoso"
  },
  "kelas": "Kelas A",
  "status": "Hadir",  // "Hadir", "T1", "T2", or "T3"
  "location": {
    "top": 100,
    "right": 300,
    "bottom": 400,
    "left": 200
  }
}
```

**Error (404):**
```json
{
  "ok": false,
  "message": "Wajah tidak terdeteksi, pastikan wajah terlihat jelas"
}
```

**Error Codes:**
- `no_face`: Wajah tidak terdeteksi
- `no_dataset`: Belum ada dataset wajah
- `not_enough_classes`: Minimal 2 santri perlu registrasi
- `low_confidence`: Wajah tidak cocok
- `not_found`: Profil santri tidak ditemukan

---

## 📝 Leave Requests (Izin)

### Submit Leave Request (Santri)
```http
POST /santri/izin/
```

**Headers:** Requires authentication

**Request Body:**
```json
{
  "santri_pk": 5,
  "kelas": "Kelas A",
  "tanggal": "2024-01-15",
  "sesi": "Subuh",
  "alasan": "Sakit demam"
}
```

**Response (200):**
```json
{
  "ok": true,
  "surat": {
    "id": 10,
    "santri": {...},
    "kelas": "Kelas A",
    "tanggal": "2024-01-15",
    "sesi": "Subuh",
    "alasan": "Sakit demam",
    "status": "Menunggu",
    "note": null
  }
}
```

### Get Own Leave Requests (Santri)
```http
GET /santri/izin/list/
```

**Headers:** Requires authentication

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "id": 10,
      "santri": {...},
      "kelas": "Kelas A",
      "tanggal": "2024-01-15",
      "sesi": "Subuh",
      "alasan": "Sakit demam",
      "status": "Menunggu",
      "note": null
    }
  ]
}
```

### Get All Leave Requests (Pengurus)
```http
GET /izin/list/
```

**Headers:** Requires authentication (pengurus)

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "id": 10,
      "santri_id": "S5",
      "nama": "Ahmad Santoso",
      "kelas": "Kelas A",
      "tanggal": "2024-01-15",
      "sesi": "Subuh",
      "alasan": "Sakit demam",
      "status": "Menunggu"
    }
  ]
}
```

### Validate Leave Request (Pengurus)
```http
POST /izin/validasi/{izin_id}/
```

**Headers:** Requires authentication (pengurus)

**Request Body:**
```json
{
  "status": "Disetujui",  // "Disetujui" or "Ditolak"
  "note": "Disetujui, segera sembuh"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Izin Disetujui berhasil"
}
```

---

## 📊 Reports & Rekap

### Get Attendance Report
```http
GET /rekap/?start=2024-01-01&end=2024-01-31&kelas=Kelas A
```

**Headers:** Requires authentication

**Query Parameters:**
- `start` (required): Start date (YYYY-MM-DD)
- `end` (required): End date (YYYY-MM-DD)
- `kelas` (optional): Filter by class ("All" for all classes)

**Response (200):**
```json
{
  "ok": true,
  "headers": [
    {
      "col_key": "2024-01-15 ( Subuh )",
      "tanggal": "2024-01-15",
      "sesi": "Subuh"
    }
  ],
  "putra": [
    {
      "Nama": "Ahmad Santoso",
      "2024-01-15 ( Subuh )": "Hadir",
      "2024-01-15 ( Sore )": "T1"
    }
  ],
  "putri": [
    {
      "Nama": "Fatimah",
      "2024-01-15 ( Subuh )": "Izin",
      "2024-01-15 ( Sore )": "-"
    }
  ]
}
```

**Status Values:**
- `Hadir`: On time
- `T1`: Late ≤5 minutes
- `T2`: Late 5-15 minutes
- `T3`: Late >15 minutes
- `Izin`: Approved leave
- `-`: Absent (no record)
- `""`: Not applicable (santri not in this class)

### Export to Excel
```http
GET /rekap/export/xlsx/?start=2024-01-01&end=2024-01-31&kelas=All
```

**Headers:** Requires authentication

**Query Parameters:** Same as Get Rekap

**Response:** Excel file download (binary)

---

## 🔍 Santri Verification (Pengurus)

### Verify Santri Name & Generate Code
```http
POST /verify-santri/
```

**Headers:** Requires authentication (pengurus)

**Request Body:**
```json
{
  "santri_name": "Ahmad Santoso"
}
```

**Response (200) - Found:**
```json
{
  "ok": true,
  "verified": true,
  "message": "Santri \"Ahmad Santoso\" terverifikasi",
  "registration_code": "ABC12345",
  "expires_at": "2024-01-22T10:30:00Z"
}
```

**Response (200) - Not Found:**
```json
{
  "ok": false,
  "verified": false,
  "message": "Nama \"Ahmad Santoso\" tidak ditemukan dalam daftar santri resmi"
}
```

### List Registration Codes
```http
GET /registration-codes/
```

**Headers:** Requires authentication (pengurus)

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "code": "ABC12345",
      "santri_name": "Ahmad Santoso",
      "used": false,
      "is_valid": true,
      "created_at": "2024-01-15T10:00:00Z",
      "expires_at": "2024-01-22T10:00:00Z",
      "generated_by": "admin",
      "used_by": null
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "ok": false,
  "message": "Error description"
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid token."
}
```

Frontend auto-redirects to login on 401.

### 403 Forbidden
```json
{
  "ok": false,
  "message": "Only pengurus can perform this action"
}
```

### 404 Not Found
```json
{
  "ok": false,
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "error": "Internal server error description"
}
```

---

## Rate Limiting

No rate limiting currently implemented. Consider adding in production:

```python
# In Django settings
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',
        'user': '1000/day'
    }
}
```

---

## CORS Configuration

Backend must allow frontend origin:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://yourdomain.com",
]
```

---

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:8000/api/login-token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

### Get Rekap (with token)
```bash
curl http://localhost:8000/api/rekap/?start=2024-01-01&end=2024-01-31 \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

---

## Frontend API Client Usage

```javascript
import { api } from '@/lib/api';

// Login
const response = await api.login('username', 'password');

// Get rekap
const data = await api.getRekap('2024-01-01', '2024-01-31', 'Kelas A');

// Register face
await api.registrasiWajah(santriId, base64Image);
```

All methods handle authentication automatically using stored token.

---

**Last Updated:** 2024
**API Version:** 1.0
**Base URL:** `/api/`
