from django.core.management.base import BaseCommand
from seed_data import seed_database

class Command(BaseCommand):
    help = 'Seeds Tulsi Mart database with comprehensive demo data for testing and understanding the app'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Executing Tulsi Mart Seed Data..."))
        seed_database()
        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully!"))
