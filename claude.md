# Claude Context - Presensi PPM

## Gambaran Sistem

Repository ini adalah monorepo untuk sistem presensi santri berbasis pengenalan wajah.

- Backend: Django + Django REST Framework
- Frontend: Next.js App Router + React + Tailwind CSS
- Database: SQLite untuk development lokal, bisa diarahkan ke PostgreSQL lewat `DATABASE_URL`
- Fitur utama: registrasi santri, login token, presensi wajah, izin, rekap, verifikasi, dan panel pengurus

## Tujuan Produk

Sistem ini dipakai untuk mengelola absensi santri di lingkungan pesantren atau asrama. Pengurus bisa:

- melihat daftar santri
- melakukan presensi manual atau via wajah
- memverifikasi izin
- melihat rekap presensi
- menonaktifkan santri tanpa menghapus riwayat

Santri bisa:

- login ke akun mereka
- mengunggah foto / registrasi wajah
- mengajukan izin
- melihat ringkasan data pribadi dan presensi

## Struktur Repo

- `backend/`: Django project dan app `pengurus_app`
- `frontend/`: Next.js application
- `deploy/`: konfigurasi Nginx dan systemd
- `docker-compose.yml`: setup container lokal

## Backend Ringkas

Backend utama ada di `backend/pengurus_app/`.

File penting:

- `backend/pengurus_app/models.py`: model `Santri`, `Presensi`, `SuratIzin`, `RegistrationCode`
- `backend/pengurus_app/views.py`: endpoint REST utama
- `backend/pengurus_app/serializers.py`: serializer DRF
- `backend/pengurus_app/face_utils.py`: pipeline deteksi wajah, encoding, klasifikasi, dan cache model
- `backend/pengurus_app/urls.py`: routing API

Karakteristik backend:

- autentikasi utama memakai `TokenAuthentication`
- permission default adalah `IsAuthenticated`
- API docs tersedia via drf-spectacular
- media foto disimpan di `backend/media/`

## Frontend Ringkas

Frontend ada di `frontend/src/`.

File penting:

- `frontend/src/lib/api.ts`: wrapper HTTP ke backend
- `frontend/src/contexts/AuthContext.tsx`: state auth
- `frontend/src/components/ProtectedRoute.tsx`: proteksi route
- `frontend/src/app/login/page.tsx`: halaman login
- `frontend/src/app/pengurus/*`: dashboard pengurus
- `frontend/src/app/santri/*`: halaman santri

## Alur Utama Aplikasi

### Login

- User login ke backend lewat endpoint token login
- Backend mengembalikan token dan role
- Frontend menyimpan token lalu mengarahkan user ke dashboard yang sesuai

### Registrasi Wajah

- Santri upload foto atau melakukan registrasi wajah
- Backend mengekstrak encoding wajah dan menyimpannya ke `Santri.face_encoding`
- Model face recognition di-cache lalu di-invalidate saat ada update data wajah

### Presensi

- Pengurus memulai sesi presensi
- Santri scan wajah
- Backend mencocokkan wajah dengan dataset aktif
- Hasil presensi disimpan ke tabel `Presensi`

### Izin

- Santri mengajukan izin
- Pengurus memverifikasi atau menolak
- Riwayat izin tetap tersimpan

### Rekap

- Frontend meminta data rekap dari backend
- Backend menyusun statistik dan export jika diperlukan

## Aturan Penting yang Sudah Berlaku

- Nonaktifkan santri tidak boleh menghapus data dari database
- Gunakan `user.is_active = False` untuk memutus login santri
- Data `Santri`, `Presensi`, dan `SuratIzin` harus tetap ada agar riwayat tetap bisa diakses
- Endpoint list/search/pengenalan wajah sebaiknya hanya memproses santri aktif
- Jika santri dinonaktifkan, token login lama dan jalur autentikasi harus dianggap tidak valid untuk penggunaan normal

## Detail Nonaktifkan Santri

Alur yang diinginkan:

- pengurus pilih santri
- klik tombol nonaktifkan
- konfirmasi muncul
- backend menandai akun terkait sebagai nonaktif
- santri tidak bisa login lagi
- data presensi lama tetap aman dan tetap bisa dibaca

## Catatan Teknis Penting

- Database development saat ini memakai SQLite
- `backend/manage.py` dijalankan dari folder `backend/`
- Frontend expect `NEXT_PUBLIC_API_URL` mengarah ke `http://127.0.0.1:8000/api`
- Jalur API penting berada di `backend/pengurus_app/urls.py`
- Jika mengubah alur login atau status aktif, cek juga frontend yang bergantung pada response login

## File yang Sering Diutak-Atik

- `backend/pengurus_app/views.py`
- `backend/pengurus_app/models.py`
- `backend/pengurus_app/face_utils.py`
- `frontend/src/lib/api.ts`
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/pengurus/nonaktifkan-santri/page.tsx`
- `frontend/src/app/pengurus/dashboard/page.tsx`

## Gaya Kerja yang Diinginkan

- lakukan perubahan kecil dan fokus
- jangan hapus data historis kecuali memang diminta
- cek alur frontend dan backend bersama-sama jika fitur menyentuh auth atau presensi
- kalau ada perubahan model database, pertimbangkan migration
- validasi perubahan minimal dengan `manage.py check`, `py_compile`, atau lint yang relevan

## Ringkasan Singkat

Ini adalah sistem presensi santri berbasis face recognition dengan backend Django DRF dan frontend Next.js. Fokus utamanya adalah autentikasi, presensi wajah, izin, dan rekap. Untuk kasus nonaktifkan santri, perilaku yang diinginkan adalah menonaktifkan akses login tanpa menghapus data dan riwayat presensi.