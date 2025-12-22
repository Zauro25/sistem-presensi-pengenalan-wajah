# 🚀 Quick Start Guide

## Prerequisites
- ✅ Backend Django server running on `http://localhost:8000`
- ✅ Node.js 18+ installed
- ✅ Modern browser (Chrome/Firefox/Edge/Safari)

## Installation (30 seconds)

```bash
cd frontend
npm install
npm run dev
```

Visit: `http://localhost:3000`

## First-Time Setup

### Step 1: Create Pengurus Account
Since registration endpoint is open but you need staff privileges:
```bash
# In backend directory
cd backend
python manage.py createsuperuser
# Or use existing admin account
```

### Step 2: Login as Pengurus
1. Go to `http://localhost:3000/login`
2. Enter your pengurus credentials
3. You'll be redirected to `/pengurus/dashboard`

### Step 3: Generate Registration Code for Santri
1. Go to "Verifikasi Data Santri" page
2. Enter santri name (must exist in `media/data_santri/data_santri.xlsx`)
3. Click "Verifikasi & Generate Kode"
4. Copy the 8-character code

### Step 4: Register as Santri
1. Logout (bottom of sidebar)
2. Click "Daftar Santri" on login page
3. Enter the registration code
4. Fill all required fields:
   - Nama (must match exactly with verification)
   - Username & password
   - Asal daerah
   - Sektor (Kepuh/Sidobali)
   - Angkatan
   - Jenis Kelamin
5. Click "Daftar"
6. You'll be redirected to login

### Step 5: Register Face (Santri)
1. Login with santri account
2. Go to "Registrasi Wajah"
3. Choose method:
   - **Camera**: Click "Aktifkan Kamera" → "Ambil Foto"
   - **Upload**: Drag & drop or select photo file
4. Click "Registrasi Wajah"
5. Wait for success message

### Step 6: Test Attendance (Pengurus)
1. Login as pengurus
2. Go to "Presensi"
3. Fill in:
   - Kelas: "Kelas A" (example)
   - Tanggal: Select today
   - Sesi: Choose "Subuh", "Sore", or "Malam"
4. Click "Mulai Absensi"
5. Camera will activate
6. Position santri's face in view
7. Wait for auto-scan (or click "Scan Manual")
8. See result: Name + Status (Hadir/T1/T2/T3)
9. Optional: Click "Mulai Telat" to activate lateness tracking
10. Click "Selesai" when done

### Step 7: Test Leave Request (Santri)
1. Login as santri
2. Go to "Pengajuan Izin"
3. Click "+ Ajukan Izin"
4. Fill form:
   - Kelas
   - Tanggal
   - Sesi
   - Alasan
5. Submit
6. Check status in list below

### Step 8: Approve Leave (Pengurus)
1. Login as pengurus
2. Go to "Verifikasi Izin"
3. See pending requests
4. Click "Proses" on any request
5. Add note (optional)
6. Click "Setujui" or "Tolak"

### Step 9: View Reports (Pengurus)
1. Go to "Rekap Presensi"
2. Set date range
3. Set kelas filter (or leave as "All")
4. Click "Tampilkan Rekap"
5. View tables (Putra/Putri separated)
6. Click "Export Excel" to download

## Common Tasks

### Add More Santri
```
Pengurus → Verifikasi Data Santri → Generate code → 
Share with santri → Santri registers
```

### Daily Attendance
```
Pengurus → Presensi → Set kelas/tanggal/sesi → 
Mulai Absensi → Scan faces → Selesai
```

### Weekly Reports
```
Pengurus → Rekap Presensi → Set last 7 days → 
View data → Export Excel
```

## Troubleshooting

### Camera Not Working?
1. Check browser permissions (🔒 icon in URL bar)
2. Use HTTPS or localhost only
3. Try different browser
4. Check browser console for errors

### Login Failed?
1. Verify backend is running: `http://localhost:8000/api/`
2. Check credentials
3. Open Network tab, check API response
4. Verify `.env.local` has correct API URL

### Rekap Empty?
1. Ensure attendance records exist for date range
2. Check kelas filter matches recorded kelas
3. Verify santri has been assigned to that kelas
4. Check backend `/api/rekap/` endpoint directly

### Registration Code Invalid?
1. Code might be expired (7 days)
2. Code might be already used
3. Name must match exactly (case-insensitive)
4. Check pengurus generated it correctly

## Development Tips

### Hot Reload
- Changes auto-refresh
- API calls visible in Network tab
- Console logs in browser DevTools

### API Testing
- Use browser DevTools Network tab
- Check request/response bodies
- Verify token in Authorization header

### Debugging
```javascript
// Add to any component
console.log('Debug:', variableName);

// Check auth state
console.log(user, role);

// Check API response
console.log(response);
```

## Production Deployment

1. **Set Environment Variable**:
```env
NEXT_PUBLIC_API_URL=https://your-backend.com/api
```

2. **Build**:
```bash
npm run build
```

3. **Start**:
```bash
npm start
```

4. **Or Deploy to Vercel**:
```bash
vercel deploy
```

## File Structure Reference

```
frontend/
├── src/
│   ├── app/              # All pages
│   ├── components/       # Reusable components
│   ├── contexts/         # Auth context
│   └── lib/             # API client
├── .env.local           # Configuration
└── package.json         # Dependencies
```

## Support

If you encounter issues:
1. Check browser console
2. Check Network tab for API errors
3. Verify backend is running
4. Check backend logs
5. Review DOCUMENTATION.md

## Next Steps

After testing basic flow:
- [ ] Test all features thoroughly
- [ ] Add more santri accounts
- [ ] Customize styling if needed
- [ ] Add production error handling
- [ ] Set up monitoring
- [ ] Deploy to production

---

**You're all set! 🎉**

The system is ready for use. Start by creating your first pengurus account and generating registration codes for santri.
