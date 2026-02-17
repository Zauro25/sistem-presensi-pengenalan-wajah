from django.contrib import admin
from .models import Santri, Presensi, SuratIzin

@admin.register(Santri)
class SantriAdmin(admin.ModelAdmin):
    list_display = ('santri_id','nama')

@admin.register(Presensi)
class PresensiAdmin(admin.ModelAdmin):
    list_display = ('santri','status','created_by')

@admin.register(SuratIzin)
class SuratIzinAdmin(admin.ModelAdmin):
    list_display = ('santri','alasan','status')
