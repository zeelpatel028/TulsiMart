from django.core.management.base import BaseCommand
from core.mongodb import sync_all_data_to_mongodb, get_mongo_client, get_mongo_db_name

class Command(BaseCommand):
    help = 'Synchronizes all Tulsi Mart data into MongoDB collections'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Testing connection to MongoDB..."))
        client = get_mongo_client()
        if not client:
            self.stdout.write(self.style.ERROR("Could not connect to MongoDB server. Please ensure MongoDB is running (e.g. mongodb://localhost:27017/)."))
            return

        db_name = get_mongo_db_name()
        self.stdout.write(self.style.SUCCESS(f"Connected to MongoDB database: {db_name}"))
        self.stdout.write(self.style.NOTICE("Starting data sync across all models..."))

        result = sync_all_data_to_mongodb()
        if result.get('status') == 'success':
            self.stdout.write(self.style.SUCCESS(f"Success! {result.get('message')}"))
            self.stdout.write(self.style.SUCCESS(f"Synced collections: {', '.join(result.get('collections', []))}"))
        else:
            self.stdout.write(self.style.ERROR(f"Sync failed: {result.get('message')}"))
