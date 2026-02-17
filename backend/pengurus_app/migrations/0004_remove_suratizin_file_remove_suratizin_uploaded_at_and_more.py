from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pengurus_app', '0003_alter_presensi_unique_together_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='suratizin',
            name='file',
        ),
        migrations.RemoveField(
            model_name='suratizin',
            name='uploaded_at',
        ),
        migrations.RemoveField(
            model_name='suratizin',
            name='uploaded_by',
        ),
        migrations.AddField(
            model_name='suratizin',
            name='alasan',
            field=models.TextField(default='', max_length=500),
        ),
    ]
