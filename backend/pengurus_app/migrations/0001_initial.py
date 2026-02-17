import django.db.models.deletion
import django.utils.timezone
import pengurus_app.models
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Santri',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('santri_id', models.CharField(max_length=50, unique=True)),
                ('nama', models.CharField(max_length=150)),
                ('asal_daerah', models.CharField(blank=True, max_length=150, null=True)),
                ('sektor', models.CharField(blank=True, choices=[('kepuh', 'Kepuh'), ('sidobali', 'Sidobali')], max_length=20, null=True)),
                ('angkatan', models.CharField(blank=True, max_length=50, null=True)),
                ('jenis_kelamin', models.CharField(choices=[('L', 'Laki-laki'), ('P', 'Perempuan')], default='L', max_length=1)),
                ('foto', models.ImageField(blank=True, null=True, upload_to=pengurus_app.models.santri_photo_upload_path)),
                ('face_encoding', models.JSONField(blank=True, null=True)),
                ('user', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='santri_profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Presensi',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tanggal', models.DateField()),
                ('sesi', models.CharField(choices=[('Subuh', 'Subuh'), ('Sore', 'Sore'), ('Malam', 'Malam')], max_length=10)),
                ('waktu_scan', models.DateTimeField(default=django.utils.timezone.now)),
                ('status', models.CharField(choices=[('Hadir', 'Hadir'), ('T1', 'T1'), ('T2', 'T2'), ('T3', 'T3')], max_length=10)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('santri', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='pengurus_app.santri')),
            ],
            options={
                'unique_together': {('santri', 'tanggal', 'sesi')},
            },
        ),
        migrations.CreateModel(
            name='SuratIzin',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tanggal', models.DateField()),
                ('sesi', models.CharField(choices=[('Subuh', 'Subuh'), ('Sore', 'Sore'), ('Malam', 'Malam')], max_length=10)),
                ('file', models.FileField(upload_to='surat_izin/')),
                ('uploaded_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('status', models.CharField(default='Disetujui', max_length=20)),
                ('note', models.TextField(blank=True, null=True)),
                ('santri', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='pengurus_app.santri')),
                ('uploaded_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('santri', 'tanggal', 'sesi')},
            },
        ),
    ]
