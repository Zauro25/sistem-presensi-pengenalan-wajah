from django.contrib import admin
from .models import Santri, Absensi, SuratIzin

@admin.register(Santri)
class SantriAdmin(admin.ModelAdmin):
    list_display = ('santri_id','nama')

@admin.register(Absensi)
class AbsensiAdmin(admin.ModelAdmin):
    list_display = ('santri','status','created_by')

@admin.register(SuratIzin)
class SuratIzinAdmin(admin.ModelAdmin):
    list_display = ('santri','alasan','status')
