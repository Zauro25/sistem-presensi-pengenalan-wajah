from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pengurus_app', '0005_alter_suratizin_unique_together_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='suratizin',
            name='kelas',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]
