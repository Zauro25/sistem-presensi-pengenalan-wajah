from .models import Santri, Presensi, SuratIzin
from datetime import datetime

def get_rekap_data(start, end, kelas=None):
    start_date = datetime.strptime(start, "%Y-%m-%d").date()
    end_date = datetime.strptime(end, "%Y-%m-%d").date()

    presensi = Presensi.objects.filter(tanggal__range=(start_date, end_date)).select_related("santri")
    izin = SuratIzin.objects.filter(tanggal__range=(start_date, end_date)).select_related("santri")

    if kelas and kelas not in ["All", "Semua Kelas"]:
        presensi = presensi.filter(kelas=kelas)
        izin = izin.filter(kelas=kelas)

    headers = []
    all_tanggal = sorted(list(set(presensi.values_list("tanggal", flat=True)) | set(izin.values_list("tanggal", flat=True))))
    
    date_class_sessions = {}
    
    for t in all_tanggal:
        sesi_presensi = set(presensi.filter(tanggal=t).values_list("sesi", flat=True))
        sesi_izin = set(izin.filter(tanggal=t).values_list("sesi", flat=True))
        actual_sessions = sorted(list(sesi_presensi | sesi_izin), key=lambda x: ["Subuh", "Sore", "Malam"].index(x))
        
        for s in actual_sessions:
            classes_on_date = set(presensi.filter(tanggal=t, sesi=s).values_list("kelas", flat=True))
            for cls in classes_on_date:
                if cls:
                    date_class_sessions[(t, cls, s)] = True
        
        for s in actual_sessions:
            headers.append({"col_key": f"{t} ( {s} )", "tanggal": str(t), "sesi": s})

    putra, putri = [], []

    if kelas and kelas not in ["All", "Semua Kelas"]:
        santri_ids_presensi = set(presensi.values_list("santri_id", flat=True))
        santri_ids_izin = set(izin.values_list("santri_id", flat=True))
        santri_ids = santri_ids_presensi | santri_ids_izin
        
        santri_list = Santri.objects.filter(id__in=santri_ids)
    else:
        santri_list = Santri.objects.all()

    for s in santri_list:
        row = {"Nama": s.nama}
        for h in headers:
            tanggal_str = h["tanggal"]
            tanggal = datetime.strptime(tanggal_str, "%Y-%m-%d").date()
            sesi = h["sesi"]

            pr = presensi.filter(santri=s, tanggal=tanggal, sesi=sesi).first()
            if pr:
                row[h["col_key"]] = pr.status
                continue

            iz = izin.filter(santri=s, tanggal=tanggal, sesi=sesi, status="Disetujui").first()
            if iz:
                row[h["col_key"]] = "Izin"
                continue

            santri_classes = s.kelas_list if s.kelas_list else []
            should_mark_absent = False
            
            for santri_kelas in santri_classes:
                if (tanggal, santri_kelas, sesi) in date_class_sessions:
                    if kelas and kelas not in ["All", "Semua Kelas"]:
                        if santri_kelas == kelas:
                            should_mark_absent = True
                            break
                    else:
                        should_mark_absent = True
                        break
            
            if should_mark_absent:
                row[h["col_key"]] = "-"
            else:
                row[h["col_key"]] = ""

        if s.jenis_kelamin == "L":
            putra.append(row)
        else:
            putri.append(row)

    return {"ok": True, "headers": headers, "putra": putra, "putri": putri}
