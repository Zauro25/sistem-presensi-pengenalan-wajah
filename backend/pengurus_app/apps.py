from django.apps import AppConfig
from django.core.exceptions import FieldDoesNotExist


class PengurusAppConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "pengurus_app"

    def ready(self):
        self._patch_auth_user_fields()

    @staticmethod
    def _patch_auth_user_fields():
        """Map User.first_name to DB column full_name and hide last_name field from ORM."""
        from django.contrib.auth import get_user_model

        User = get_user_model()
        opts = User._meta

        first_name_field = opts.get_field("first_name")
        if first_name_field.db_column != "full_name":
            first_name_field.db_column = "full_name"
            first_name_field.column = "full_name"
            opts._expire_cache()

        try:
            opts.get_field("last_name")
        except FieldDoesNotExist:
            pass
        else:
            opts.local_fields = [f for f in opts.local_fields if f.name != "last_name"]
            opts._expire_cache()

        if not hasattr(User, "full_name"):
            def _get_full_name(self):
                return self.first_name

            def _set_full_name(self, value):
                self.first_name = value or ""

            User.add_to_class("full_name", property(_get_full_name, _set_full_name))
