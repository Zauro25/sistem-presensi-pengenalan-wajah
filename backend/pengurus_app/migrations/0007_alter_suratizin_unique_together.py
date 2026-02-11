from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('pengurus_app', '0006_suratizin_kelas'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='suratizin',
            unique_together={('santri', 'kelas', 'tanggal', 'sesi')},
        ),
    ]
