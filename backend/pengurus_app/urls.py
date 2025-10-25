from django.urls import path
from . import views

urlpatterns = [
    path("register-pengurus/", views.RegisterPengurusView.as_view(), name="register-pengurus"),
    path("register-santri/", views.RegisterSantriView.as_view(), name="register-santri"),
    path("login-token/", views.LoginPengurusView.as_view(), name="login-token"),
    path('santri/', views.api_list_santri),
    path('santri/upload-foto/', views.api_santri_upload_foto, name="santri-upload-foto"),
    path("santri/izin/", views.api_permohonan_izin, name="api_permohonan_izin"),
    path("santri/izin/list/", views.list_izin_santri, name="list_izin_santri"),
    path("izin/list/", views.list_permohonan_izin, name="list_permohonan_izin"),
    path("izin/validasi/<int:izin_id>/", views.validasi_izin, name="validasi_izin"),
    path('santri/registrasi-wajah/', views.api_santri_registrasi_wajah, name="santri-registrasi-wajah"),
    path('recognize/', views.api_recognize_and_attend),
    path('rekap/', views.api_rekap),
    path('rekap/export/xlsx/', views.api_export_xlsx),
    path('start-absensi/', views.api_start_absensi),
    path('end-absensi/', views.api_end_absensi),
    path('start-telat/', views.api_start_telat),
    path('user/', views.api_get_user),
    path("api/logout/", views.api_logout)
]
