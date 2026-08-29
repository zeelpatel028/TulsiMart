from django.apps import AppConfig


class CoreConfig(AppConfig):
    name = 'core'

    def ready(self):
        try:
            import core.signals  # noqa
        except Exception:
            pass

