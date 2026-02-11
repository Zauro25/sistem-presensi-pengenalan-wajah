from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pengurus_app', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='santri',
            name='foto',
            field=models.ImageField(blank=True, null=True, upload_to='santri_photos/'),
        ),
    ]
