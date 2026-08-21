from django.core.management.base import BaseCommand
from clear_demo_data import clear_all_demo_data

class Command(BaseCommand):
    help = 'Clears all demo data from Tulsi Mart database for fresh start'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Clearing Tulsi Mart Demo Data..."))
        clear_all_demo_data()
        self.stdout.write(self.style.SUCCESS("All demo data cleared successfully!"))
