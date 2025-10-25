from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import Santri, Absensi, SuratIzin
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

# Surat Izin
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_permohonan_izin(request):
    # expected: santri_pk, tanggal (YYYY-MM-DD), sesi, alasan
    santri_pk = request.data.get('santri_pk')
    tanggal = request.data.get('tanggal')
    sesi = request.data.get('sesi')
    alasan = request.data.get('alasan')
    if not (santri_pk and tanggal and sesi and alasan):
        return Response({'ok': False, 'message': 'Lengkapi data'}, status=400)
    try:
        s = Santri.objects.get(pk=santri_pk)
    except Santri.DoesNotExist:
        return Response({'ok': False, 'message': 'Santri tidak ditemukan'}, status=404)
    si = SuratIzin(santri=s, tanggal=tanggal, sesi=sesi, alasan=alasan)
    si.save()
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

    action = request.data.get('status')  # “Disetujui” atau “Ditolak”
    if action not in ['Disetujui', 'Ditolak']:
        return Response({'ok': False, 'message': 'Status tidak valid'}, status=400)

    izin.status = action
    izin.note = request.data.get('note', '')
    izin.save()
    return Response({'ok': True, 'message': f'Izin {action} berhasil'})


# LIST SANTRI
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_list_santri(request):
    santris = Santri.objects.all().order_by('santri_id')
    return Response({'ok': True, 'data': SantriSerializer(santris, many=True).data})

#GET USER
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

# ======================================================
# REGISTER AKUN PENGURUS & SANTRI
# ======================================================

class RegisterPengurusView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class RegisterSantriView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSantriAccountSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        santri = serializer.save()

        return Response({
            "santri_id": santri.id,
            "user_id": santri.user.id,
            "username": santri.user.username,
            "nama": santri.nama,
            "sektor": santri.sektor,
            "role": "santri"
        })

# ======================================================
# LOGIN
# ======================================================
class LoginPengurusView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from django.contrib.auth import authenticate
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)
        if not user:
            return Response({"error": "Invalid Credentials"}, status=401)

        token, _ = Token.objects.get_or_create(user=user)
        role = "pengurus" if user.is_staff else "santri"
        santri_name = getattr(user, "santri_profile", None)
        return Response({
            "token": token.key,
            "role": role,
            "user": {
                "id": user.id,
                "username": user.username,
                "nama_lengkap": santri_name.nama if santri_name else None,
                "santri_id": santri_name.id if santri_name else None
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

        # ✅ Validasi awal
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

        # Ambil lokasi wajah pertama
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

        # ambil santri
        try:
            santri = Santri.objects.get(id=santri_id)
        except Santri.DoesNotExist:
            return Response({"error": "Santri tidak ditemukan"}, status=status.HTTP_404_NOT_FOUND)

        # simpan file foto dulu
        santri.foto = foto_file
        santri.save()

        # 🔥 load file langsung dengan face_recognition (lebih aman daripada np.array(PIL.Image))
        img_path = santri.foto.path
        print("DEBUG >> proses file:", img_path)

        img = face_recognition.load_image_file(img_path)
        print("DEBUG >> dtype:", img.dtype, "shape:", img.shape, "C_CONTIGUOUS:", img.flags['C_CONTIGUOUS'])

        encs = face_recognition.face_encodings(img)

        if len(encs) == 0:
            return Response({"error": "Wajah tidak terdeteksi, coba gunakan foto yang lebih jelas"}, status=status.HTTP_400_BAD_REQUEST)

        # simpan encoding ke DB
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
    data_url = request.data.get('image')
    absensi_info = cache.get(ABSENSI_KEY)
    kelas = request.data.get("kelas") or "Kamu kelas apa?"
    print(absensi_info)

    if not absensi_info:
        return Response({"ok": False, "message": "Absensi belum dimulai"}, status=400)

    tanggal = absensi_info['tanggal']
    sesi = absensi_info['sesi']
    telat_start = absensi_info.get('telat_start')

    pil_img = decode_base64_image(data_url)
    santri, info, location = recognize_from_image_pil(pil_img, tolerance=0.45)
    if not santri:
        return Response({"ok": False, "message": "Wajah tidak cocok"}, status=404)

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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_rekap(request):
    start = request.GET.get('start')
    end = request.GET.get('end')
    if not start or not end:
        return Response({'ok': False, 'message': 'start & end required'}, status=400)
    
    from .utils import get_rekap_data
    data = get_rekap_data(start, end)
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_export_xlsx(request):
    start = request.GET.get('start')
    end = request.GET.get('end')
    if not start or not end:
        return Response({'ok': False, 'message': 'start & end required'}, status=400)

    data = get_rekap_data(start, end)
    headers = data['headers']
    putra = data['putra']
    putri = data['putri']

    cols = ['Nama'] + [h['col_key'] for h in headers]
    df_putra = pd.DataFrame(putra)[cols]
    df_putri = pd.DataFrame(putri)[cols]

    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        for name, df in [("Putra", df_putra), ("Putri", df_putri)]:
            df.to_excel(writer, index=False, sheet_name=name)

            ws = writer.sheets[name]
            alignment = Alignment(horizontal="center", vertical="center")
            font_bold = Font(bold=True)
            # header style
            for cell in ws[1]:
                cell.font = font_bold
                cell.alignment = alignment

            # warna per status
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
