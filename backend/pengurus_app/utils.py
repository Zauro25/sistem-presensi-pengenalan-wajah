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
    all_sesi = ["Subuh", "Sore", "Malam"]

    for t in all_tanggal:
        for s in all_sesi:
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
            tanggal = h["tanggal"]
            sesi = h["sesi"]

            ab = absensi.filter(santri=s, tanggal=tanggal, sesi=sesi).first()
            if ab:
                row[h["col_key"]] = ab.status
                continue

            iz = izin.filter(santri=s, tanggal=tanggal, sesi=sesi).first()
            if iz:
                row[h["col_key"]] = "Izin"
                continue

            row[h["col_key"]] = "-"

        if s.jenis_kelamin == "L":
            putra.append(row)
        else:
            putri.append(row)

    return {"ok": True, "headers": headers, "putra": putra, "putri": putri}
