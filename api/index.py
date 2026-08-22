import os
import sys
from pathlib import Path

# Add backend directory to Python sys.path
BASE_DIR = Path(__file__).resolve().parent.parent / 'backend'
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tulsimart_backend.settings')

from django.core.wsgi import get_wsgi_application

app = get_wsgi_application()
