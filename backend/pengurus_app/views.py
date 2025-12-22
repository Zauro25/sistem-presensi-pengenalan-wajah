from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import Santri, Absensi, SuratIzin, RegistrationCode
from .serializers import SantriSerializer, AbsensiSerializer, SuratIzinSerializer, UserSerializer, RegisterSantriAccountSerializer
from .models import Santri
from .face_utils import decode_base64_image, recognize_from_image_pil, encode_face_from_image
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework import generics, status
from rest_framework.views import APIView
from django.core.cache import cache
import datetime
import pandas as pd
from io import BytesIO
from django.http import HttpResponse, HttpRequest
import numpy as np
import face_recognition
from django.db import IntegrityError
from openpyxl.styles import Alignment, Font, PatternFill
from .utils import get_rekap_data
import os
from django.conf import settings



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_logout(request):
    try:
        if hasattr(request.user, "auth_token"):
            request.user.auth_token.delete()
    except Exception as e:
        print("Logout error:", e)
    return Response({"ok": True, "message": "Logout berhasil"})

class StartAbsensiView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        tanggal = request.data.get("tanggal")
        sesi = request.data.get("sesi")
        if not tanggal or not sesi:
            return Response({"ok": False, "message": "Lengkapi tanggal & sesi"}, status=400)
        cache.set(ABSENSI_KEY, {"tanggal": tanggal, "sesi": sesi, "time": timezone.now()}, 3600)
        return Response({"ok": True, "message": "Absensi dimulai"})
    
class StartTelatView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        telat_time = timezone.now()
        cache.set(TELAT_KEY, telat_time, 3600)
        return Response({"ok": True, "message": "Penghitungan keterlambatan dimulai"})
    
ABSENSI_KEY = "absensi_start_time"
TELAT_KEY = "telat_start_time"

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_permohonan_izin(request):
    import sys
    from datetime import datetime
    
    # Log to file and stderr
    log_file = '/tmp/izin_api.log'
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
    
    def log_msg(msg):
        print(f"[{timestamp}] {msg}", file=sys.stderr)
        try:
            with open(log_file, 'a') as f:
                f.write(f"[{timestamp}] {msg}\n")
        except:
            pass
        sys.stderr.flush()
    
    # Very visible logging
    log_msg("\n" + "="*80)
    log_msg(">>> API PERMOHONAN IZIN CALLED")
    log_msg("="*80)
    
    # Get the data
    santri_pk = request.data.get('santri_pk')
    tanggal = request.data.get('tanggal')
    sesi = request.data.get('sesi')
    alasan = request.data.get('alasan')
    kelas = request.data.get('kelas')
    
    # Log extracted values
    log_msg(f">>> Extracted data:")
    log_msg(f"    santri_pk = {santri_pk!r}")
    log_msg(f"    tanggal   = {tanggal!r}")
    log_msg(f"    sesi      = {sesi!r}")
    log_msg(f"    alasan    = {alasan!r}")
    log_msg(f"    kelas     = {kelas!r}")
    
    # Validate
    log_msg(f">>> Validating...")
    if not (santri_pk and tanggal and sesi and alasan):
        log_msg(f">>> VALIDATION FAILED - Missing required fields")
        log_msg("="*80 + "\n")
        return Response({'ok': False, 'message': 'Lengkapi data'}, status=400)
    
    log_msg(f">>> Validation OK - Looking up santri...")
    try:
        s = Santri.objects.get(pk=santri_pk)
        log_msg(f">>> Found santri: {s.nama} (ID: {s.id})")
    except Santri.DoesNotExist:
        log_msg(f">>> ERROR: Santri with pk={santri_pk} not found")
        log_msg("="*80 + "\n")
        return Response({'ok': False, 'message': 'Santri tidak ditemukan'}, status=404)
    
    # Create
    log_msg(f">>> Creating SuratIzin...")
    si = SuratIzin(santri=s, kelas=kelas, tanggal=tanggal, sesi=sesi, alasan=alasan)
    si.save()
    log_msg(f">>> SUCCESS! Created SuratIzin with ID: {si.id}")
    log_msg("="*80 + "\n")
    
    return Response({'ok': True, 'surat': SuratIzinSerializer(si).data})
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_izin_santri(request):
    izin = SuratIzin.objects.filter(santri__user=request.user).select_related('santri').order_by('-tanggal')
    return Response({'ok': True, 'data': SuratIzinSerializer(izin, many=True).data})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_permohonan_izin(request):
    user = request.user
    
    if user.is_staff:
        izin = SuratIzin.objects.filter(status="Menunggu").select_related('santri').order_by('-tanggal')
    else:
        santri = Santri.objects.get(user=user)
        izin = SuratIzin.objects.filter(santri=santri).select_related('santri').order_by('-tanggal')

    data = [{
        "id": i.id,
        "santri_id": i.santri.santri_id,
        "nama": i.santri.nama,
        "kelas": i.kelas,
        "tanggal": i.tanggal,
        "sesi": i.sesi,
        "alasan": i.alasan,
        "status": i.status
    } for i in izin]
    return Response({"ok": True, "data": data})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validasi_izin(request, izin_id):
    try:
        izin = SuratIzin.objects.get(id=izin_id)
    except SuratIzin.DoesNotExist:
        return Response({'ok': False, 'message': 'Izin tidak ditemukan'}, status=404)

    action = request.data.get('status')
    if action not in ['Disetujui', 'Ditolak']:
        return Response({'ok': False, 'message': 'Status tidak valid'}, status=400)

    izin.status = action
    izin.note = request.data.get('note', '')
    izin.save()
    return Response({'ok': True, 'message': f'Izin {action} berhasil'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_list_santri(request):
    santris = Santri.objects.all().order_by('santri_id')
    return Response({'ok': True, 'data': SantriSerializer(santris, many=True).data})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_get_user(request):
    user = request.user
    role = "pengurus" if user.is_staff else "santri"
    return Response({
        "id": user.id,
        "username": user.username,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "role": role
    })

@api_view(['POST'])
@permission_classes([AllowAny])  
def api_permohonan_izin(request):
    santri = request.data.get('santri')
    kelas = request.data.get('kelas')
    tanggal = request.data.get('tanggal')
    sesi = request.data.get('sesi')
    alasan = request.data.get('alasan')
    if not (santri and kelas and tanggal and sesi and alasan):
        return Response({'ok': False, 'message': 'Lengkapi data'}, status=400)
    try:
        s = Santri.objects.get(santri_id=santri)
    except Santri.DoesNotExist:
        return Response({'ok': False, 'message': 'Santri tidak ditemukan'}, status=404)
    try:
        si = SuratIzin(santri=s, kelas=kelas, tanggal=tanggal, sesi=sesi, alasan=alasan, status='Menunggu')
        si.save()
    except IntegrityError:
        return Response({'ok': False, 'message': 'Sudah ada surat izin untuk santri ini pada tanggal & sesi tersebut'}, status=400)
    return Response({'ok': True, 'surat': SuratIzinSerializer(si).data})


class RegisterPengurusView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class RegisterSantriView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSantriAccountSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        # Validate registration code
        registration_code = request.data.get('registration_code', '').strip()
        if not registration_code:
            return Response({
                "ok": False,
                "message": "Kode registrasi wajib diisi. Hubungi pengurus untuk mendapatkan kode."
            }, status=400)
        
        try:
            reg_code = RegistrationCode.objects.get(code=registration_code)
        except RegistrationCode.DoesNotExist:
            return Response({
                "ok": False,
                "message": "Kode registrasi tidak valid"
            }, status=400)
        
        if reg_code.used:
            return Response({
                "ok": False,
                "message": "Kode registrasi sudah pernah digunakan"
            }, status=400)
        
        if not reg_code.is_valid():
            return Response({
                "ok": False,
                "message": "Kode registrasi sudah kadaluarsa"
            }, status=400)
        
        # Verify name matches
        nama_input = request.data.get('nama', '').strip()
        if nama_input.lower() != reg_code.santri_name.lower():
            return Response({
                "ok": False,
                "message": f"Nama tidak sesuai dengan kode registrasi. Kode ini untuk: {reg_code.santri_name}"
            }, status=400)
        
        # Proceed with registration
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        santri = serializer.save()
        
        # Mark code as used
        reg_code.used = True
        reg_code.used_by = santri.user
        reg_code.save()

        return Response({
            "ok": True,
            "santri_id": santri.id,
            "user_id": santri.user.id,
            "username": santri.user.username,
            "nama": santri.nama,
            "sektor": santri.sektor,
            "role": "santri",
            "message": "Registrasi berhasil!"
        })

class LoginPengurusView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from django.contrib.auth import authenticate
        username = request.data.get("username")
        password = request.data.get("password")
        
        print(f"Login attempt for username: {username}")
        
        if not username or not password:
            print("Missing username or password")
            return Response({"error": "Username dan password harus diisi"}, status=400)
        
        user = authenticate(username=username, password=password)
        if not user:
            print(f"Authentication failed for username: {username}")
            return Response({"error": "Username atau password salah"}, status=401)

        token, _ = Token.objects.get_or_create(user=user)
        role = "pengurus" if user.is_staff else "santri"
        santri_profile = getattr(user, "santri_profile", None)
        
        print(f"Login successful for {username} (role: {role})")
        
        return Response({
            "token": token.key,
            "role": role,
            "user": {
                "id": user.id,
                "username": user.username,
                "nama_lengkap": santri_profile.nama if santri_profile else None,
                "santri_id": santri_profile.id if santri_profile else None,
                "sektor": santri_profile.sektor if santri_profile else None,
                "angkatan": santri_profile.angkatan if santri_profile else None
            }
        })


# ======================================================
# SANTRI UPLOAD / REGISTRASI WAJAH
# ======================================================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_santri_registrasi_wajah(request):
    try:
        santri_id = request.data.get("santri_id")
        image_data = request.data.get("image")

        if not santri_id or not image_data:
            return Response(
                {"error": "santri_id dan image wajib diisi"},
                status=status.HTTP_400_BAD_REQUEST
            )

        print(f"DEBUG >> registrasi wajah santri_id={santri_id}")

        try:
            santri = Santri.objects.get(id=santri_id)
        except Santri.DoesNotExist:
            try:
                santri = Santri.objects.get(user_id=santri_id)
            except Santri.DoesNotExist:
                return Response({"error": f"Santri dengan id {santri_id} tidak ditemukan"}, status=404)

        pil_img = decode_base64_image(image_data)
        img = np.array(pil_img)

        face_locations = face_recognition.face_locations(img, model="hog")
        if not face_locations:
            return Response({"error": "Wajah tidak ditemukan"}, status=400)

        face_encodings = face_recognition.face_encodings(img, face_locations)

        if not face_encodings:
            return Response({"error": "Encoding wajah gagal"}, status=400)

        santri.face_encoding = face_encodings[0].tolist()
        santri.save()

        top, right, bottom, left = face_locations[0]

        return Response({
            "ok": True,
            "message": f"Wajah {santri.nama} berhasil diregistrasi!",
            "nama": santri.nama,
            "location": {"top": top, "right": right, "bottom": bottom, "left": left}
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Error registrasi wajah:", str(e))
        return Response({"error": str(e)}, status=500)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_santri_upload_foto(request):
    try:
        santri_id = request.data.get("santri_id")
        foto_file = request.FILES.get("foto")

        if not santri_id or not foto_file:
            return Response({"error": "santri_id dan foto wajib diisi"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            santri = Santri.objects.get(id=santri_id)
        except Santri.DoesNotExist:
            return Response({"error": "Santri tidak ditemukan"}, status=status.HTTP_404_NOT_FOUND)

        santri.foto = foto_file
        santri.save()

        img_path = santri.foto.path
        print("DEBUG >> proses file:", img_path)

        img = face_recognition.load_image_file(img_path)
        print("DEBUG >> dtype:", img.dtype, "shape:", img.shape, "C_CONTIGUOUS:", img.flags['C_CONTIGUOUS'])

        encs = face_recognition.face_encodings(img)

        if len(encs) == 0:
            return Response({"error": "Wajah tidak terdeteksi, coba gunakan foto yang lebih jelas"}, status=status.HTTP_400_BAD_REQUEST)

        santri.face_encoding = encs[0].tolist()
        santri.save()

        return Response({"success": True, "message": "Foto berhasil diupload & encoding disimpan"}, status=status.HTTP_200_OK)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": f"Error proses wajah: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_start_absensi(request):
    tanggal = request.data.get("tanggal")
    sesi = request.data.get("sesi")
    if not tanggal or not sesi:
        return Response({"ok": False, "message": "Lengkapi tanggal & sesi"})
    absensi_info = {
        "tanggal": tanggal,
        "sesi": sesi,
        "time": timezone.now().isoformat(),
        "telat_start": None
    }
    cache.set(ABSENSI_KEY, absensi_info, 3600)
    return Response({"ok": True, "message": "Absensi dimulai"})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_start_telat(request):
    absensi_info = cache.get(ABSENSI_KEY)
    if not absensi_info:
        return Response({"ok": False, "message": "Absensi belum dimulai"}, status=400)

    absensi_info["telat_start"] = timezone.now().isoformat()
    cache.set(ABSENSI_KEY, absensi_info, 3600)
    return Response({"ok": True, "message": "Penghitungan keterlambatan dimulai"})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_end_absensi(request):
    cache.delete(ABSENSI_KEY)
    cache.delete(TELAT_KEY)
    return Response({"ok": True, "message": "Absensi selesai"})



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_recognize_and_attend(request):
    try:
        data_url = request.data.get('image')
        if not data_url:
            return Response({"ok": False, "message": "Image data tidak ditemukan"}, status=400)
            
        absensi_info = cache.get(ABSENSI_KEY)
        kelas = request.data.get("kelas") or "Kamu kelas apa?"
        print(absensi_info)

        if not absensi_info:
            return Response({"ok": False, "message": "Absensi belum dimulai"}, status=400)

        tanggal = absensi_info['tanggal']
        sesi = absensi_info['sesi']
        telat_start = absensi_info.get('telat_start')

        pil_img = decode_base64_image(data_url)
        santri, info, location = recognize_from_image_pil(pil_img, min_prob=0.6)
        if not santri:
            error_map = {
                "no_face": "Wajah tidak terdeteksi, pastikan wajah terlihat jelas",
                "no_dataset": "Belum ada dataset wajah yang terdaftar",
                "not_enough_classes": "Minimal dua santri perlu diregistrasi agar model SVM bisa dilatih",
                "low_confidence": "Wajah tidak cocok (confidence terlalu rendah)",
                "not_found": "Profil santri tidak ditemukan"
            }
            message = error_map.get(info, "Wajah tidak cocok")
            status_code = 404 if info in {"low_confidence", "no_face"} else 400
            return Response({"ok": False, "message": message}, status=status_code)

        status_absensi = "Hadir"
        if telat_start:
            try:
                telat_dt = datetime.datetime.fromisoformat(telat_start)
                if timezone.is_naive(telat_dt):
                    telat_dt = timezone.make_aware(telat_dt)
                diff = (timezone.now() - telat_dt).total_seconds() / 60
                if diff <= 5:
                    status_absensi = "T1"
                elif diff <= 15:
                    status_absensi = "T2"
                else:
                    status_absensi = "T3"
            except Exception as e:
                print("TELAT ERROR:", e)

        Absensi.objects.update_or_create(
            santri=santri,
            tanggal=tanggal,
            sesi=sesi,
            kelas=kelas,
            defaults={
                "status": status_absensi,
                "kelas": kelas,
                "created_by": request.user
            }
        )
        
        # Auto-assign santri to class on first attendance
        if kelas and kelas != "Kamu kelas apa?":
            santri.assign_to_kelas(kelas)

        return Response({
            "ok": True,
            "santri": {"id": santri.id, "nama": santri.nama},
            "kelas": kelas,
            "status": status_absensi,
            "location": {
                "top": location[0],
                "right": location[1],
                "bottom": location[2],
                "left": location[3]
            }
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error in recognize_and_attend: {str(e)}")
        return Response({"ok": False, "message": f"Error processing: {str(e)}"}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_rekap(request):
    start = request.GET.get('start')
    end = request.GET.get('end')
    kelas = request.GET.get('kelas')  # Get the kelas filter parameter
    if not start or not end:
        return Response({'ok': False, 'message': 'start & end required'}, status=400)
    
    from .utils import get_rekap_data
    data = get_rekap_data(start, end, kelas)
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_export_xlsx(request):
    start = request.GET.get('start')
    end = request.GET.get('end')
    kelas = request.GET.get('kelas')  # Get the kelas filter parameter
    if not start or not end:
        return Response({'ok': False, 'message': 'start & end required'}, status=400)

    data = get_rekap_data(start, end, kelas)
    headers = data['headers']
    putra = data['putra']
    putri = data['putri']

    cols = ['Nama'] + [h['col_key'] for h in headers]
    
    # Handle empty data - create DataFrames with proper columns
    if len(putra) > 0:
        df_putra = pd.DataFrame(putra)[cols]
    else:
        df_putra = pd.DataFrame(columns=cols)
    
    if len(putri) > 0:
        df_putri = pd.DataFrame(putri)[cols]
    else:
        df_putri = pd.DataFrame(columns=cols)

    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        for name, df in [("Putra", df_putra), ("Putri", df_putri)]:
            df.to_excel(writer, index=False, sheet_name=name)

            ws = writer.sheets[name]
            alignment = Alignment(horizontal="center", vertical="center")
            font_bold = Font(bold=True)
            for cell in ws[1]:
                cell.font = font_bold
                cell.alignment = alignment

            fill_colors = {
                "Hadir": "C6EFCE",
                "T1": "FFF2CC", 
                "T2": "FFE699",
                "T3": "FFD966",
                "Izin": "C9DAF8",  
                "-": "F4CCCC"     
            }

            for row in ws.iter_rows(min_row=2, min_col=2):
                for cell in row:
                    val = str(cell.value)
                    if val in fill_colors:
                        cell.fill = PatternFill(start_color=fill_colors[val], end_color=fill_colors[val], fill_type="solid")
                    cell.alignment = alignment

            for column_cells in ws.columns:
                length = max(len(str(cell.value)) if cell.value else 0 for cell in column_cells)
                ws.column_dimensions[column_cells[0].column_letter].width = length + 2

    output.seek(0)
    response = HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = 'attachment; filename=rekap_absensi.xlsx'
    return response


# ======================================================
# REGISTRATION CODE VERIFICATION
# ======================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_verify_santri_name(request):
    """
    Pengurus endpoint to verify if a santri name exists in data_santri.xlsx
    and generate a registration code.
    """
    if not request.user.is_staff:
        return Response({'ok': False, 'message': 'Only pengurus can verify santri'}, status=403)
    
    santri_name = request.data.get('santri_name', '').strip()
    if not santri_name:
        return Response({'ok': False, 'message': 'Nama santri harus diisi'}, status=400)
    
    # Read the Excel file
    excel_path = os.path.join(settings.MEDIA_ROOT, 'data_santri', 'data_santri.xlsx')
    if not os.path.exists(excel_path):
        return Response({'ok': False, 'message': 'File data santri tidak ditemukan'}, status=500)
    
    try:
        df = pd.read_excel(excel_path)
        # Normalize column names (remove spaces, lowercase)
        df.columns = df.columns.str.strip().str.lower()
        
        # Look for name column - try common variations
        name_column = None
        for col in ['nama', 'name', 'nama santri', 'nama lengkap']:
            if col in df.columns:
                name_column = col
                break
        
        if name_column is None:
            return Response({
                'ok': False, 
                'message': 'Kolom nama tidak ditemukan di file Excel',
                'available_columns': list(df.columns)
            }, status=500)
        
        # Search for the name (case-insensitive)
        df[name_column] = df[name_column].astype(str).str.strip()
        found = df[df[name_column].str.lower() == santri_name.lower()]
        
        if found.empty:
            return Response({
                'ok': False, 
                'message': f'Nama "{santri_name}" tidak ditemukan dalam daftar santri resmi',
                'verified': False
            })
        
        # Name found - generate registration code
        reg_code = RegistrationCode.objects.create(
            santri_name=santri_name,
            generated_by=request.user
        )
        
        return Response({
            'ok': True,
            'verified': True,
            'message': f'Santri "{santri_name}" terverifikasi',
            'registration_code': reg_code.code,
            'expires_at': reg_code.expires_at.isoformat()
        })
        
    except Exception as e:
        return Response({
            'ok': False,
            'message': f'Error reading Excel file: {str(e)}'
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_list_registration_codes(request):
    """
    List all registration codes (for pengurus)
    """
    if not request.user.is_staff:
        return Response({'ok': False, 'message': 'Only pengurus can view codes'}, status=403)
    
    codes = RegistrationCode.objects.all().order_by('-created_at')
    data = [{
        'id': code.id,
        'code': code.code,
        'santri_name': code.santri_name,
        'used': code.used,
        'is_valid': code.is_valid(),
        'created_at': code.created_at,
        'expires_at': code.expires_at,
        'generated_by': code.generated_by.username if code.generated_by else None,
        'used_by': code.used_by.username if code.used_by else None
    } for code in codes]
    
    return Response({'ok': True, 'data': data})
