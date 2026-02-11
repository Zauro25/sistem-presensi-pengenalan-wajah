from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pengurus_app', '0007_alter_suratizin_unique_together'),
    ]

    operations = [
        migrations.AlterField(
            model_name='suratizin',
            name='status',
            field=models.CharField(default='Menunggu', max_length=20),
        ),
    ]
