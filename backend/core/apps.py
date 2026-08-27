from django.apps import AppConfig


class CoreConfig(AppConfig):
    name = 'core'

    def ready(self):
        try:
            import core.signals  # noqa
        except Exception:
            pass

        # Trigger MongoDB initial sync
        try:
            from core.mongodb import sync_all_data_to_mongodb
            sync_all_data_to_mongodb()
        except Exception:
            pass
