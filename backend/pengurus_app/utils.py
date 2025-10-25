from .models import Santri, Absensi, SuratIzin
from datetime import datetime

def get_rekap_data(start, end):
    start_date = datetime.strptime(start, "%Y-%m-%d").date()
    end_date = datetime.strptime(end, "%Y-%m-%d").date()

    absensi = Absensi.objects.filter(tanggal__range=(start_date, end_date)).select_related("santri")
    izin = SuratIzin.objects.filter(tanggal__range=(start_date, end_date)).select_related("santri")

    headers = []
    all_tanggal = sorted(list(set(absensi.values_list("tanggal", flat=True)) | set(izin.values_list("tanggal", flat=True))))
    all_sesi = ["Subuh", "Sore", "Malam"]

    for t in all_tanggal:
        for s in all_sesi:
            headers.append({"col_key": f"{t} ( {s} )", "tanggal": str(t), "sesi": s})

    putra, putri = [], []

    for s in Santri.objects.all():
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
