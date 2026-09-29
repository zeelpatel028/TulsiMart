from django.core.management.base import BaseCommand
from seed_tulsimart import seed_data

class Command(BaseCommand):
    help = 'Seeds demo data into Tulsi Mart database'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Seeding demo data into Tulsi Mart database..."))
        try:
            seed_data()
            self.stdout.write(self.style.SUCCESS("[SUCCESS] Demo data seeded successfully!"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"[ERROR] Failed to seed demo data: {e}"))
