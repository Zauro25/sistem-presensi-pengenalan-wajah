from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pengurus_app', '0002_alter_santri_foto'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='presensi',
            unique_together=set(),
        ),
        migrations.AlterUniqueTogether(
            name='suratizin',
            unique_together=set(),
        ),
        migrations.AddField(
            model_name='presensi',
            name='kelas',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='suratizin',
            name='kelas',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AlterUniqueTogether(
            name='presensi',
            unique_together={('santri', 'kelas', 'tanggal', 'sesi')},
        ),
        migrations.AlterUniqueTogether(
            name='suratizin',
            unique_together={('santri', 'kelas', 'tanggal', 'sesi')},
        ),
    ]
