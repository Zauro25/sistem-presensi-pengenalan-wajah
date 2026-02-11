from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid
from datetime import timedelta

def santri_photo_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"SANTRI_{instance.santri_id}_{int(timezone.now().timestamp())}.{ext}"
    return f"santri_photos/{filename}"

class Santri(models.Model):
    JENIS_CHOICES = [('L','Laki-laki'), ('P','Perempuan')]
    SEKTOR_CHOICES = [('kepuh','Kepuh'), ('sidobali','Sidobali')]

    santri_id = models.CharField(max_length=50, unique=True)
    nama = models.CharField(max_length=150)
    asal_daerah = models.CharField(max_length=150, blank=True, null=True)
    sektor = models.CharField(max_length=20, choices=SEKTOR_CHOICES, blank=True, null=True)
    angkatan = models.CharField(max_length=50, blank=True, null=True)
    jenis_kelamin = models.CharField(max_length=1, choices=JENIS_CHOICES, default='L')
    foto = models.ImageField(upload_to='santri_photos/', null=True, blank=True)
    face_encoding = models.JSONField(null=True, blank=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="santri_profile", null=True, blank=True)
    kelas_list = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.santri_id} - {self.nama}"
    
    def assign_to_kelas(self, kelas):
        if kelas and kelas not in self.kelas_list:
            self.kelas_list.append(kelas)
            self.save()
    
    def is_in_kelas(self, kelas):
        return kelas in self.kelas_list if self.kelas_list else False


class Absensi(models.Model):
    SESI_CHOICES = [('Subuh','Subuh'), ('Sore','Sore'), ('Malam','Malam')]
    STATUS_CHOICES = [('Hadir','Hadir'),('T1','T1'),('T2','T2'),('T3','T3')]

    santri = models.ForeignKey(Santri, on_delete=models.CASCADE)
    kelas = models.CharField(max_length=50, blank=True, null=True)
    tanggal = models.DateField()
    sesi = models.CharField(max_length=10, choices=SESI_CHOICES)
    waktu_scan = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        unique_together = ('santri', 'kelas', 'tanggal', 'sesi')

    def __str__(self):
        return f"{self.santri} - {self.kelas} {self.tanggal} {self.sesi} - {self.status}"


class SuratIzin(models.Model):
    SESI_CHOICES = [('Subuh','Subuh'), ('Sore','Sore'), ('Malam','Malam')]
    santri = models.ForeignKey(Santri, on_delete=models.CASCADE)
    kelas = models.CharField(max_length=50, blank=True, null=True)
    tanggal = models.DateField()
    sesi = models.CharField(max_length=10, choices=SESI_CHOICES)
    alasan = models.TextField(max_length=500, default='')
    status = models.CharField(max_length=20, default='Menunggu')
    note = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('santri', 'kelas', 'tanggal', 'sesi')

    def __str__(self):
        return f"Izin {self.santri} - {self.kelas} {self.tanggal} {self.sesi} {self.alasan} - {self.status}"


class RegistrationCode(models.Model):
    code = models.CharField(max_length=8, unique=True, db_index=True)
    santri_name = models.CharField(max_length=150)
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="generated_codes")
    used = models.BooleanField(default=False)
    used_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="used_codes")
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = str(uuid.uuid4())[:8].upper()
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=7)
        super().save(*args, **kwargs)

    def is_valid(self):
        return not self.used and timezone.now() < self.expires_at

    def __str__(self):
        return f"{self.code} - {self.santri_name} ({'Used' if self.used else 'Valid' if self.is_valid() else 'Expired'})"
    def __str__(self):
        return f"{self.code} - {self.santri_name} ({'Used' if self.used else 'Valid' if self.is_valid() else 'Expired'})"