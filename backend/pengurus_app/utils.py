from .models import Santri, Absensi, SuratIzin
from datetime import datetime

def get_rekap_data(start, end, kelas=None):
    start_date = datetime.strptime(start, "%Y-%m-%d").date()
    end_date = datetime.strptime(end, "%Y-%m-%d").date()

    # Filter absensi and izin by date range
    absensi = Absensi.objects.filter(tanggal__range=(start_date, end_date)).select_related("santri")
    izin = SuratIzin.objects.filter(tanggal__range=(start_date, end_date)).select_related("santri")

    # If kelas filter is provided and not "All" or "Semua Kelas", filter by kelas
    if kelas and kelas not in ["All", "Semua Kelas"]:
        absensi = absensi.filter(kelas=kelas)
        izin = izin.filter(kelas=kelas)

    headers = []
    all_tanggal = sorted(list(set(absensi.values_list("tanggal", flat=True)) | set(izin.values_list("tanggal", flat=True))))
    
    # Build headers based on actual sessions that exist for each date
    # Also track which classes had sessions on each date
    date_class_sessions = {}  # {(date, kelas, sesi): True}
    
    for t in all_tanggal:
        # Get unique sessions that actually exist for this date
        sesi_absensi = set(absensi.filter(tanggal=t).values_list("sesi", flat=True))
        sesi_izin = set(izin.filter(tanggal=t).values_list("sesi", flat=True))
        actual_sessions = sorted(list(sesi_absensi | sesi_izin), key=lambda x: ["Subuh", "Sore", "Malam"].index(x))
        
        # Track which classes had sessions on this date
        for s in actual_sessions:
            # Get all classes that had this session on this date
            classes_on_date = set(absensi.filter(tanggal=t, sesi=s).values_list("kelas", flat=True))
            for cls in classes_on_date:
                if cls:  # Only track non-empty kelas
                    date_class_sessions[(t, cls, s)] = True
        
        # Only add headers for sessions that actually have records
        for s in actual_sessions:
            headers.append({"col_key": f"{t} ( {s} )", "tanggal": str(t), "sesi": s})

    putra, putri = [], []

    # Get santri who have attendance or izin records in the filtered data
    # This ensures only santri who attended the selected class are shown
    if kelas and kelas not in ["All", "Semua Kelas"]:
        # Get unique santri IDs from the filtered absensi and izin
        santri_ids_absensi = set(absensi.values_list("santri_id", flat=True))
        santri_ids_izin = set(izin.values_list("santri_id", flat=True))
        santri_ids = santri_ids_absensi | santri_ids_izin
        
        # Only process santri who have records in this class
        santri_list = Santri.objects.filter(id__in=santri_ids)
    else:
        # Show all santri when no class filter or "Semua Kelas"
        santri_list = Santri.objects.all()

    for s in santri_list:
        row = {"Nama": s.nama}
        for h in headers:
            tanggal_str = h["tanggal"]
            tanggal = datetime.strptime(tanggal_str, "%Y-%m-%d").date()
            sesi = h["sesi"]

            # Check if santri has attendance record
            ab = absensi.filter(santri=s, tanggal=tanggal, sesi=sesi).first()
            if ab:
                row[h["col_key"]] = ab.status
                continue

            # Check if santri has izin record
            iz = izin.filter(santri=s, tanggal=tanggal, sesi=sesi).first()
            if iz:
                row[h["col_key"]] = "Izin"
                continue

            # NEW LOGIC: Check if santri should be marked absent
            # If this santri is in a class that had a session on this date/sesi, mark as absent
            santri_classes = s.kelas_list if s.kelas_list else []
            should_mark_absent = False
            
            for santri_kelas in santri_classes:
                # Check if this class had a session on this date/sesi
                if (tanggal, santri_kelas, sesi) in date_class_sessions:
                    # If we're filtering by a specific class, only mark absent if it matches
                    if kelas and kelas not in ["All", "Semua Kelas"]:
                        if santri_kelas == kelas:
                            should_mark_absent = True
                            break
                    else:
                        # No class filter - mark absent if any of their classes had session
                        should_mark_absent = True
                        break
            
            if should_mark_absent:
                row[h["col_key"]] = "-"
            else:
                # Don't show anything if santri is not in any class that had session
                row[h["col_key"]] = ""

        if s.jenis_kelamin == "L":
            putra.append(row)
        else:
            putri.append(row)

    return {"ok": True, "headers": headers, "putra": putra, "putri": putri}
