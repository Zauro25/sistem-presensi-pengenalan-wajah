from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('pengurus_app', '0004_remove_suratizin_file_remove_suratizin_uploaded_at_and_more'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='suratizin',
            unique_together={('santri', 'tanggal', 'sesi')},
        ),
        migrations.RemoveField(
            model_name='suratizin',
            name='kelas',
        ),
    ]
