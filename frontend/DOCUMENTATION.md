# Sistem Absensi PPM - Frontend Documentation

## Overview

Complete Next.js frontend for face recognition-based attendance system with role-based access control.

## 🚀 Quick Start

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`

## Environment Setup

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Project Structure

```
src/
├── app/                      # Pages (Next.js App Router)
│   ├── login/               # Login page
│   ├── register/            # Santri registration
│   ├── santri/              # Santri portal
│   │   ├── dashboard/
│   │   ├── face-registration/
│   │   └── izin/
│   └── pengurus/            # Pengurus portal
│       ├── dashboard/
│       ├── presensi/
│       ├── verifikasi-izin/
│       ├── verify-santri/
│       └── rekap/
├── components/              # Reusable components
├── contexts/                # React Context (Auth)
└── lib/                     # API client & utilities
```

## Features Implemented

### ✅ Authentication System
- Token-based auth (localStorage)
- Role-based routing (santri/pengurus)
- Protected routes with auto-redirect
- Persistent sessions

### ✅ Santri Portal
1. **Dashboard**: Profile info, recent izin
2. **Face Registration**: Camera/upload with real-time detection
3. **Izin Management**: Submit requests, view status

### ✅ Pengurus Portal
1. **Dashboard**: Quick stats & actions
2. **Presensi**: Live face recognition, lateness tracking
3. **Verifikasi Izin**: Approve/reject with notes
4. **Verify Santri**: Generate registration codes
5. **Rekap**: Reports with Excel export

## API Endpoints Used

All endpoints match backend exactly:

**Auth**:
- `POST /api/login-token/`
- `POST /api/register-santri/`
- `POST /api/logout/`

**Face**:
- `POST /api/santri/registrasi-wajah/`
- `POST /api/recognize/`

**Attendance**:
- `POST /api/start-absensi/`
- `POST /api/start-telat/`
- `POST /api/end-absensi/`

**Izin**:
- `POST /api/santri/izin/`
- `GET /api/santri/izin/list/`
- `GET /api/izin/list/`
- `POST /api/izin/validasi/{id}/`

**Reports**:
- `GET /api/rekap/?start=...&end=...&kelas=...`
- `GET /api/rekap/export/xlsx/`

**Registration**:
- `POST /api/verify-santri/`
- `GET /api/registration-codes/`

## Backend Integration Notes

### Field Mappings
- **Sesi**: `Subuh`, `Sore`, `Malam` (exact match)
- **Sektor**: `kepuh`, `sidobali` (lowercase)
- **Status**: `Hadir`, `T1`, `T2`, `T3` (backend logic)
- **Izin Status**: `Menunggu`, `Disetujui`, `Ditolak`

### Request Formats
All match backend serializers:
- Registration: nama, username, password, asal_daerah, sektor, angkatan, jenis_kelamin, registration_code
- Face registration: santri_id, image (base64)
- Recognition: image (base64), kelas
- Izin: santri_pk, kelas, tanggal, sesi, alasan

## User Flows

### Santri Registration Flow
1. Pengurus verifies santri name → generates code
2. Santri visits `/register`
3. Enters code + fills form
4. Backend validates name matches code
5. Account created → redirect to login
6. Login → register face → ready to attend

### Attendance Flow (Pengurus)
1. Go to Presensi page
2. Set kelas, tanggal, sesi
3. Click "Mulai Absensi"
4. Camera activates, auto-scans every 3s
5. Optional: Click "Mulai Telat" for T1/T2/T3
6. Face recognized → record saved
7. Click "Selesai" to end

## Technical Details

### Camera Implementation
- Uses `getUserMedia` API
- Canvas for capture
- Base64 encoding
- Auto-scan interval (3s)

### State Management
- AuthContext for global auth state
- Local state for page-specific data
- No external state library needed

### Styling
- Tailwind CSS utility classes
- Responsive grid layouts
- Custom color scheme
- Status badges with color coding

## Testing Checklist

- [ ] Login as pengurus
- [ ] Verify santri name
- [ ] Copy registration code
- [ ] Register as santri with code
- [ ] Upload face photo
- [ ] Start presensi session
- [ ] Scan face (auto/manual)
- [ ] Submit izin request
- [ ] Approve/reject izin
- [ ] View rekap report
- [ ] Export Excel

## Production Deployment

1. Set production API URL in `.env.production`
2. Build: `npm run build`
3. Start: `npm start`
4. Deploy to Vercel/Netlify or Docker

### Environment Variables
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (requires HTTPS for camera)
- Mobile: ✅ Responsive design

## Known Limitations

1. Camera requires HTTPS (except localhost)
2. Large Excel files may be slow
3. No offline support yet
4. Single language (Bahasa Indonesia)

## Future Enhancements

- [ ] Mobile sidebar toggle
- [ ] Real-time notifications
- [ ] Batch santri registration
- [ ] Attendance analytics charts
- [ ] Multi-language support
- [ ] Dark mode
- [ ] PWA offline support

## Troubleshooting

**Camera not working?**
- Grant browser permissions
- Use HTTPS or localhost
- Check browser console for errors

**401 Errors?**
- Token may be invalid
- Try logging out and back in
- Check backend is running

**Empty rekap?**
- Ensure date range has data
- Check kelas filter
- Verify santri has attendance records

## Contact & Support

For issues or questions, check:
- Backend API documentation
- Backend models.py for field details
- Browser console for errors
- Network tab for API responses

---

**Built with**: Next.js 16, Tailwind CSS 4, React 19
**Backend**: Django REST Framework with face_recognition
