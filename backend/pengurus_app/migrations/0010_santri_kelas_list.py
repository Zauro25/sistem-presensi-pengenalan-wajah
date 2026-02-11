from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pengurus_app', '0009_registrationcode'),
    ]

    operations = [
        migrations.AddField(
            model_name='santri',
            name='kelas_list',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
