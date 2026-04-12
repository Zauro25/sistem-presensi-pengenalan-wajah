from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
        ("pengurus_app", "0014_alter_registrationcode_table"),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                "ALTER TABLE auth_user RENAME COLUMN first_name TO full_name;",
                "ALTER TABLE auth_user DROP COLUMN last_name;",
            ],
            reverse_sql=[
                "ALTER TABLE auth_user ADD COLUMN last_name varchar(150) NOT NULL DEFAULT '';",
                "ALTER TABLE auth_user RENAME COLUMN full_name TO first_name;",
            ],
        ),
    ]
