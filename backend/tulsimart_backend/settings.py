"""
Django settings for tulsimart_backend project.
"""

from pathlib import Path
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
import sys
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-tulsimart-super-secret-key-2026-grocery-management')

DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = [host.strip() for host in os.getenv('ALLOWED_HOSTS', '*').split(',') if host.strip()]
if '*' not in ALLOWED_HOSTS:
    for default_host in ['tulsimart.onrender.com', '.onrender.com', 'localhost', '127.0.0.1']:
        if default_host not in ALLOWED_HOSTS:
            ALLOWED_HOSTS.append(default_host)
RENDER_EXTERNAL_HOSTNAME = os.getenv('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME and RENDER_EXTERNAL_HOSTNAME not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    
    # Tulsi Mart Apps
    'core',
    'inventory',
    'orders',
    'customers',
    'suppliers',
    'expenses',
    'offers',
    'analytics',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.gzip.GZipMiddleware',
    'core.middleware.DatabasePerformanceMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

try:
    import whitenoise
    MIDDLEWARE.insert(2, 'whitenoise.middleware.WhiteNoiseMiddleware')
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'
except ImportError:
    pass

ROOT_URLCONF = 'tulsimart_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'tulsimart_backend.wsgi.application'

# Database Configuration (Aiven PostgreSQL / MySQL Cloud & Local Dev support)
import urllib.parse
from django.core.exceptions import ImproperlyConfigured
try:
    import dj_database_url
except ImportError:
    dj_database_url = None

IS_RENDER = os.getenv('RENDER') is not None or os.getenv('RENDER_EXTERNAL_HOSTNAME') is not None

db_url = os.getenv('DATABASE_URL') or os.getenv('MYSQL_URL')
ssl_env = os.getenv('DB_SSL_MODE', os.getenv('MYSQL_SSL_MODE', '')).upper()
require_ssl = ssl_env in ('REQUIRED', 'TRUE', '1') or (db_url and 'aivencloud.com' in db_url) or (os.getenv('DB_HOST', '') and 'aivencloud.com' in os.getenv('DB_HOST', ''))

if os.getenv('USE_SQLITE', 'False').lower() in ('true', '1'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'tulsimart.sqlite3',
            'CONN_MAX_AGE': 600,
            'OPTIONS': {
                'timeout': 20,
            }
        }
    }
elif db_url and dj_database_url:
    ssl_require_param = True if require_ssl else False
    DATABASES = {
        'default': dj_database_url.config(
            default=db_url,
            conn_max_age=600,
            conn_health_checks=True,
            ssl_require=ssl_require_param,
        )
    }
    # Sanitize query parameters extracted by dj_database_url to prevent driver keyword parameter errors
    options = DATABASES['default'].get('OPTIONS', {})
    for key in list(options.keys()):
        if key in ('ssl-mode', 'ssl_mode', 'sslmode', 'ssl_require'):
            options.pop(key, None)

    if 'mysql' in DATABASES['default'].get('ENGINE', ''):
        DATABASES['default'].setdefault('OPTIONS', {})
        DATABASES['default']['OPTIONS']['charset'] = 'utf8mb4'
        DATABASES['default']['OPTIONS']['init_command'] = "SET sql_mode='STRICT_TRANS_TABLES'"
        if require_ssl:
            DATABASES['default']['OPTIONS']['ssl'] = {'ssl_mode': 'REQUIRED'}
    elif 'postgresql' in DATABASES['default'].get('ENGINE', '') and require_ssl:
        DATABASES['default'].setdefault('OPTIONS', {})
        DATABASES['default']['OPTIONS']['sslmode'] = 'require'

else:
    DB_ENGINE = os.getenv('DB_ENGINE', 'django.db.backends.postgresql' if (db_url and 'postgres' in db_url) else 'django.db.backends.mysql')
    DB_NAME = os.getenv('DB_NAME', os.getenv('MYSQL_DATABASE', 'defaultdb'))
    DB_USER = os.getenv('DB_USER', os.getenv('MYSQL_USER', 'avnadmin'))
    DB_PASSWORD = os.getenv('DB_PASSWORD', os.getenv('MYSQL_PASSWORD', ''))
    DB_HOST = os.getenv('DB_HOST', os.getenv('MYSQL_HOST', '' if IS_RENDER else '127.0.0.1'))
    DB_PORT = os.getenv('DB_PORT', os.getenv('MYSQL_PORT', '18925'))

    if IS_RENDER and (not DB_HOST or DB_HOST in ('127.0.0.1', 'localhost')):
        raise ImproperlyConfigured(
            "\n[Render Deployment Error] Cannot connect to database on '127.0.0.1' or empty host in production on Render.\n"
            "Please add DATABASE_URL or DB_HOST, DB_USER, DB_PASSWORD, DB_NAME to your Render Web Service Environment Variables dashboard.\n"
        )

    db_options = {}
    if 'mysql' in DB_ENGINE:
        db_options = {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        }
        if require_ssl:
            db_options['ssl'] = {'ssl_mode': 'REQUIRED'}
    elif 'postgresql' in DB_ENGINE and require_ssl:
        db_options['sslmode'] = 'require'

    DATABASES = {
        'default': {
            'ENGINE': DB_ENGINE,
            'NAME': DB_NAME,
            'USER': DB_USER,
            'PASSWORD': DB_PASSWORD,
            'HOST': DB_HOST,
            'PORT': DB_PORT,
            'OPTIONS': db_options,
            'CONN_MAX_AGE': 600,
            'CONN_HEALTH_CHECKS': True,
        }
    }

# Enable SQLite WAL mode & High Speed Memory Caching Pragmas
from django.db.backends.signals import connection_created
from django.dispatch import receiver

@receiver(connection_created)
def configure_sqlite_pragmas(sender, connection, **kwargs):
    if connection.vendor == 'sqlite':
        try:
            cursor = connection.cursor()
            cursor.execute('PRAGMA journal_mode = WAL;')
            cursor.execute('PRAGMA synchronous = NORMAL;')
            cursor.execute('PRAGMA cache_size = -64000;')
            cursor.execute('PRAGMA temp_store = MEMORY;')
        except Exception:
            pass



# High Performance In-Memory Caching (LocMemCache)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'tulsimart-fast-locmem-cache',
        'TIMEOUT': 300,
    }
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'EXCEPTION_HANDLER': 'tulsimart_backend.exceptions.custom_exception_handler',
}

# SimpleJWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

# Reverse Proxy SSL Configuration for Render/Production
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True

# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = os.getenv('CORS_ALLOW_ALL_ORIGINS', 'False').lower() in ('true', '1')
CORS_ALLOW_CREDENTIALS = True

# Helper to normalize origins (no trailing slashes)
def _clean_origins(origin_list):
    cleaned = []
    for origin in origin_list:
        if not origin:
            continue
        item = origin.strip().rstrip('/')
        if item and item not in cleaned:
            cleaned.append(item)
    return cleaned

default_cors_origins = [
    'https://tulsi-mart.vercel.app',
    'https://tulsimart.vercel.app',
    'https://tulsimart.onrender.com',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
extra_cors_origins = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')
CORS_ALLOWED_ORIGINS = _clean_origins(default_cors_origins + extra_cors_origins)

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
    r"^https://.*\.onrender\.com$",
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

default_csrf_origins = [
    'https://tulsi-mart.vercel.app',
    'https://tulsimart.vercel.app',
    'https://tulsimart.onrender.com',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
extra_csrf = os.getenv('CSRF_TRUSTED_ORIGINS', '').split(',')
CSRF_TRUSTED_ORIGINS = _clean_origins(default_csrf_origins + extra_csrf)



# Email SMTP Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '').replace(' ', '').replace('\t', '').strip('"\'')
DEFAULT_FROM_EMAIL = os.getenv('EMAIL_FROM', EMAIL_HOST_USER)



