from .models import Santri, Presensi, SuratIzin
from datetime import datetime


def _session_sort_key(session_name):
    order = {"Subuh": 0, "Sore": 1, "Malam": 2}
    return order.get(session_name, 99)


def get_rekap_data(start, end, kelas=None):
    start_date = datetime.strptime(start, "%Y-%m-%d").date()
    end_date = datetime.strptime(end, "%Y-%m-%d").date()

    presensi = Presensi.objects.filter(tanggal__range=(start_date, end_date)).select_related("santri")
    izin = SuratIzin.objects.filter(tanggal__range=(start_date, end_date)).select_related("santri")
    izin_disetujui = izin.filter(status="Disetujui")

    if kelas and kelas not in ["All", "Semua Kelas"]:
        presensi = presensi.filter(kelas=kelas)
        izin = izin.filter(kelas=kelas)
        izin_disetujui = izin_disetujui.filter(kelas=kelas)

    headers = []
    all_tanggal = sorted(list(set(presensi.values_list("tanggal", flat=True)) | set(izin.values_list("tanggal", flat=True))))
    
    date_class_sessions = {}
    
    for t in all_tanggal:
        sesi_presensi = set(presensi.filter(tanggal=t).values_list("sesi", flat=True))
        sesi_izin = set(izin_disetujui.filter(tanggal=t).values_list("sesi", flat=True))
        actual_sessions = sorted(list(sesi_presensi | sesi_izin), key=_session_sort_key)
        
        for s in actual_sessions:
            classes_on_date = set(presensi.filter(tanggal=t, sesi=s).values_list("kelas", flat=True))
            classes_on_date.update(izin_disetujui.filter(tanggal=t, sesi=s).values_list("kelas", flat=True))
            for cls in classes_on_date:
                if cls:
                    date_class_sessions[(t, cls, s)] = True
        
        for s in actual_sessions:
            headers.append({"col_key": f"{t} ( {s} )", "tanggal": str(t), "sesi": s})

    putra, putri = [], []

    if kelas and kelas not in ["All", "Semua Kelas"]:
        santri_ids_historic_presensi = set(
            Presensi.objects.filter(kelas=kelas).values_list("santri_id", flat=True)
        )
        santri_ids_historic_izin = set(
            SuratIzin.objects.filter(kelas=kelas).values_list("santri_id", flat=True)
        )
        santri_ids_kelas_list = set(
            Santri.objects.filter(kelas_list__contains=[kelas]).values_list("id", flat=True)
        )

        santri_ids = santri_ids_historic_presensi | santri_ids_historic_izin | santri_ids_kelas_list
        santri_list = Santri.objects.filter(id__in=santri_ids).order_by("nama", "santri_id")
    else:
        santri_list = Santri.objects.all().order_by("nama", "santri_id")

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

            iz = izin_disetujui.filter(santri=s, tanggal=tanggal, sesi=sesi).first()
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


def build_rekap_statistics(rekap_data):
    headers = rekap_data.get("headers", [])
    sheet_rows = [
        ("Putra", rekap_data.get("putra", [])),
        ("Putri", rekap_data.get("putri", [])),
    ]

    def summarize_rows(rows):
        counts = {"Hadir": 0, "Izin": 0, "T1": 0, "T2": 0, "T3": 0, "-": 0, "Kosong": 0}
        total_santri = len(rows)
        total_cells = total_santri * len(headers)

        for row in rows:
            for header in headers:
                value = str(row.get(header["col_key"], "") or "").strip()
                if value in counts:
                    counts[value] += 1
                else:
                    counts["Kosong"] += 1

        terisi = total_cells - counts["Kosong"]
        hadir_rate = round((counts["Hadir"] / terisi) * 100, 2) if terisi else 0

        return {
            "Santri": total_santri,
            "Kolom Jadwal": len(headers),
            "Total Sel": total_cells,
            "Terisi": terisi,
            "Kosong": counts["Kosong"],
            "Hadir": counts["Hadir"],
            "Izin": counts["Izin"],
            "T1": counts["T1"],
            "T2": counts["T2"],
            "T3": counts["T3"],
            "-": counts["-"],
            "Persentase Hadir": hadir_rate,
        }

    summary_rows = []
    for sheet_name, rows in sheet_rows:
        stats = summarize_rows(rows)
        summary_rows.append({"Sheet": sheet_name, **stats})

    total_stats = {
        "Santri": sum(item["Santri"] for item in summary_rows),
        "Kolom Jadwal": len(headers),
        "Total Sel": sum(item["Total Sel"] for item in summary_rows),
        "Terisi": sum(item["Terisi"] for item in summary_rows),
        "Kosong": sum(item["Kosong"] for item in summary_rows),
        "Hadir": sum(item["Hadir"] for item in summary_rows),
        "Izin": sum(item["Izin"] for item in summary_rows),
        "T1": sum(item["T1"] for item in summary_rows),
        "T2": sum(item["T2"] for item in summary_rows),
        "T3": sum(item["T3"] for item in summary_rows),
        "-": sum(item["-"] for item in summary_rows),
    }
    total_stats["Persentase Hadir"] = round((total_stats["Hadir"] / total_stats["Terisi"]) * 100, 2) if total_stats["Terisi"] else 0
    summary_rows.append({"Sheet": "Total", **total_stats})

    unique_dates = sorted({header["tanggal"] for header in headers})
    unique_sessions = sorted({header["sesi"] for header in headers}, key=_session_sort_key)

    return {
        "meta": {
            "Tanggal Mulai": unique_dates[0] if unique_dates else "-",
            "Tanggal Akhir": unique_dates[-1] if unique_dates else "-",
            "Total Hari": len(unique_dates),
            "Total Sesi": len(unique_sessions),
            "Daftar Sesi": ", ".join(unique_sessions) if unique_sessions else "-",
        },
        "summary": summary_rows,
    }
