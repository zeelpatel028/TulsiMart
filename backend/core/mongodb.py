"""
MongoDB Database Connector & Synchronization Service for Tulsi Mart
Uses PyMongo to connect directly to MongoDB Atlas / Remote MongoDB servers.
"""

import os
import logging
from dotenv import load_dotenv
from django.conf import settings
from decimal import Decimal
from datetime import date, datetime

# Ensure environment variables are loaded via dotenv
load_dotenv()

logger = logging.getLogger(__name__)


def sanitize_mongo_uri(raw_uri):
    """
    Sanitizes and normalizes MongoDB URIs to prevent PyMongo InvalidURI errors.
    Strips surrounding whitespace, quotes, and fixes query options so options are key=value pairs.
    """
    if not raw_uri or not isinstance(raw_uri, str):
        return ""
    
    uri = raw_uri.strip().strip("'\"")
    if not uri:
        return ""

    if not (uri.startswith("mongodb://") or uri.startswith("mongodb+srv://")):
        return uri

    if "?" in uri:
        base, query = uri.split("?", 1)
        query = query.strip()
        if query:
            query = query.lstrip("?").lstrip("&")
            pairs = []
            for item in query.split("&"):
                item = item.strip()
                if not item:
                    continue
                if "=" in item:
                    k, v = item.split("=", 1)
                    k = k.strip()
                    v = v.strip()
                    if k:
                        pairs.append(f"{k}={v}")
                else:
                    k = item.strip()
                    if k:
                        pairs.append(f"{k}=true")
            if pairs:
                uri = f"{base}?{'&'.join(pairs)}"
            else:
                uri = base
    return uri


def mask_mongodb_uri(uri):
    """
    Masks credentials in MongoDB connection string for safe logging.
    """
    if not uri or '@' not in uri:
        return "mongodb+srv://*****:*****@..."
    try:
        prefix, rest = uri.split('@', 1)
        scheme = prefix.split('://')[0] + '://' if '://' in prefix else 'mongodb://'
        return f"{scheme}*****:*****@{rest}"
    except Exception:
        return "mongodb+srv://*****:*****@..."


class MongoDBManager:
    """
    Singleton connection manager for MongoDB.
    Reuses MongoClient instance across requests to prevent unnecessary connection creation.
    """
    _client = None
    _connection_logged = False

    @classmethod
    def get_uri(cls):
        """
        Retrieves MONGODB_URI from environment variables or Django settings and sanitizes it.
        Does NOT default to localhost:27017 to avoid connection refused errors on Render.
        """
        raw_uri = os.getenv('MONGODB_URI', '')
        if not raw_uri and hasattr(settings, 'MONGODB_URI'):
            raw_uri = getattr(settings, 'MONGODB_URI', '')
        return sanitize_mongo_uri(raw_uri)

    @classmethod
    def get_db_name(cls):
        """
        Retrieves MONGODB_DB_NAME from environment variables with sensible default 'tulsimart_db'.
        """
        db_name = os.getenv('MONGODB_DB_NAME', '').strip()
        if not db_name and hasattr(settings, 'MONGODB_DB_NAME'):
            db_name = getattr(settings, 'MONGODB_DB_NAME', '').strip()
        return db_name if db_name else 'tulsimart_db'

    @classmethod
    def get_client(cls):
        """
        Returns a singleton MongoClient instance.
        If MONGODB_URI is missing or connection fails, logs warning/error and returns None gracefully.
        """
        uri = cls.get_uri()
        if not uri:
            if not cls._connection_logged:
                logger.warning("MONGODB_URI environment variable is missing or empty. Please set MONGODB_URI in Render environment variables.")
                cls._connection_logged = True
            return None

        if '<password>' in uri.lower() or '<db_password>' in uri.lower() or 'username:password' in uri.lower():
            if not cls._connection_logged:
                logger.warning("MONGODB_URI contains unreplaced placeholder credentials. Please set your actual MongoDB Atlas connection string in Render environment variables.")
                cls._connection_logged = True
            return None

        if not (uri.startswith('mongodb://') or uri.startswith('mongodb+srv://')):
            if not cls._connection_logged:
                logger.error(f"Invalid MONGODB_URI format. Must start with 'mongodb://' or 'mongodb+srv://'. Got: {uri[:15]!r}")
                cls._connection_logged = True
            return None

        if cls._client is None:
            try:
                import pymongo

                kwargs = {
                    'serverSelectionTimeoutMS': 10000,
                    'connectTimeoutMS': 10000,
                    'socketTimeoutMS': 20000,
                }

                # Production TLS/SSL certificate handling for MongoDB Atlas (mongodb+srv:// or ssl/tls flags)
                if uri.startswith('mongodb+srv://') or 'ssl=true' in uri.lower() or 'tls=true' in uri.lower():
                    kwargs['tls'] = True
                    try:
                        import certifi
                        kwargs['tlsCAFile'] = certifi.where()
                    except ImportError:
                        logger.warning("certifi module not found. TLS certificate verification may fail for MongoDB Atlas on Linux/Render.")

                cls._client = pymongo.MongoClient(uri, **kwargs)
                # Test connection using admin ping command
                cls._client.admin.command('ping')

                masked_uri = mask_mongodb_uri(uri)
                logger.info(f"MongoDB connected successfully to {masked_uri}")
                cls._connection_logged = True
            except pymongo.errors.InvalidURI as e:
                logger.error(f"MongoDB URI error: {e}. Ensure MONGODB_URI is formatted as: mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE_NAME?retryWrites=true&w=majority")
                cls._client = None
                return None
            except pymongo.errors.PyMongoError as e:
                logger.error(f"MongoDB connection error: {e}")
                cls._client = None
                return None
            except Exception as e:
                logger.error(f"Unexpected error connecting to MongoDB: {e}")
                cls._client = None
                return None

        return cls._client

    @classmethod
    def get_db(cls):
        """
        Returns the MongoDB database object for configured MONGODB_DB_NAME.
        """
        client = cls.get_client()
        if client is not None:
            try:
                return client[cls.get_db_name()]
            except Exception as e:
                logger.error(f"Error accessing MongoDB database '{cls.get_db_name()}': {e}")
        return None

    @classmethod
    def get_collection(cls, collection_name):
        """
        Returns a specific MongoDB collection.
        """
        db = cls.get_db()
        if db is not None:
            return db[collection_name]
        return None

    @classmethod
    def reset_connection(cls):
        """
        Resets cached MongoClient connection.
        """
        if cls._client is not None:
            try:
                cls._client.close()
            except Exception:
                pass
        cls._client = None
        cls._connection_logged = False


def get_mongo_uri():
    return MongoDBManager.get_uri()

def get_mongo_db_name():
    return MongoDBManager.get_db_name()

def get_mongo_client():
    return MongoDBManager.get_client()

def get_mongo_db():
    return MongoDBManager.get_db()

def get_collection(collection_name):
    return MongoDBManager.get_collection(collection_name)

from django.db.models import Model

def _sanitize_for_mongo(obj):
    """
    Converts Models, Decimals, dates, datetimes to MongoDB-compatible BSON/JSON types.
    """
    if isinstance(obj, Model):
        return getattr(obj, 'pk', str(obj))
    elif isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, (date, datetime)):
        return obj.isoformat()
    elif isinstance(obj, dict):
        return {k: _sanitize_for_mongo(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [_sanitize_for_mongo(item) for item in obj]
    return obj

def sync_model_to_mongo(collection_name, queryset, key_field='id'):
    """
    Bulk synchronizes a Django model QuerySet into a MongoDB collection.
    """
    try:
        col = get_collection(collection_name)
        if col is None:
            return {'status': 'error', 'message': 'Could not connect to MongoDB server'}

        docs = []
        for instance in queryset:
            doc = {}
            for field in instance._meta.fields:
                # Use field.attname (e.g. category_id) to avoid querying related models directly
                attname = getattr(field, 'attname', field.name)
                val = getattr(instance, attname, getattr(instance, field.name, None))
                doc[field.name] = _sanitize_for_mongo(val)
            
            # Use Django ID as custom mongo document identifier
            doc['django_id'] = instance.id
            docs.append(doc)

        if docs:
            # Drop old collection or replace
            col.delete_many({})
            col.insert_many(docs)
            logger.info(f"Synced {len(docs)} documents to MongoDB collection '{collection_name}'")

        return {'status': 'success', 'synced_count': len(docs), 'collection': collection_name}
    except Exception as e:
        logger.error(f"Error syncing {collection_name} to MongoDB: {e}")
        return {'status': 'error', 'message': str(e)}

def sync_all_data_to_mongodb():
    """
    Synchronizes all major Tulsi Mart datasets into MongoDB collections:
    - products
    - categories
    - brands
    - units
    - orders
    - order_items
    - customers
    - suppliers
    - purchase_orders
    - expenses
    - coupons
    - festival_offers
    - users
    - store_settings
    """
    results = {}
    db = get_mongo_db()
    if db is None:
        return {
            'status': 'error',
            'message': 'Cannot connect to MongoDB. Please ensure MONGODB_URI is configured correctly in .env or Render Environment Variables.'
        }

    try:
        from core.models import Staff, StoreSetting, LoginAccount
        from inventory.models import Category, Brand, Unit, Product, StockMovement
        from orders.models import Order, OrderItem, PaymentTransaction
        from customers.models import Customer, CustomerFeedback
        from suppliers.models import Supplier, PurchaseOrder
        from expenses.models import ExpenseCategory, Expense
        from offers.models import Coupon, FestivalOffer

        results['store_settings'] = sync_model_to_mongo('store_settings', StoreSetting.objects.all())
        results['login_accounts'] = sync_model_to_mongo('login_accounts', LoginAccount.objects.all())
        results['staff'] = sync_model_to_mongo('staff', Staff.objects.all())

        results['categories'] = sync_model_to_mongo('categories', Category.objects.all())
        results['brands'] = sync_model_to_mongo('brands', Brand.objects.all())
        results['units'] = sync_model_to_mongo('units', Unit.objects.all())
        results['products'] = sync_model_to_mongo('products', Product.objects.all())
        results['stock_movements'] = sync_model_to_mongo('stock_movements', StockMovement.objects.all())

        results['orders'] = sync_model_to_mongo('orders', Order.objects.all())
        results['order_items'] = sync_model_to_mongo('order_items', OrderItem.objects.all())
        results['payments'] = sync_model_to_mongo('payments', PaymentTransaction.objects.all())

        results['customers'] = sync_model_to_mongo('customers', Customer.objects.all())
        results['feedbacks'] = sync_model_to_mongo('feedbacks', CustomerFeedback.objects.all())

        results['suppliers'] = sync_model_to_mongo('suppliers', Supplier.objects.all())
        results['purchase_orders'] = sync_model_to_mongo('purchase_orders', PurchaseOrder.objects.all())

        results['expense_categories'] = sync_model_to_mongo('expense_categories', ExpenseCategory.objects.all())
        results['expenses'] = sync_model_to_mongo('expenses', Expense.objects.all())

        results['coupons'] = sync_model_to_mongo('coupons', Coupon.objects.all())
        results['festival_offers'] = sync_model_to_mongo('festival_offers', FestivalOffer.objects.all())

        return {
            'status': 'success',
            'message': 'All Tulsi Mart data successfully synchronized to MongoDB collections!',
            'database': get_mongo_db_name(),
            'collections': list(results.keys()),
            'details': results
        }
    except Exception as e:
        return {'status': 'error', 'message': str(e)}


def get_mongo_store_settings():
    """
    Directly retrieves store settings document from MongoDB collection 'store_settings'.
    """
    try:
        col = get_collection('store_settings')
        if col is not None:
            doc = col.find_one({'django_id': 1}, {'_id': 0})
            if doc:
                return doc
    except Exception as e:
        logger.warning(f"Failed to fetch store settings from MongoDB: {e}")
    return None


def save_mongo_store_settings(settings_dict):
    """
    Directly upserts store settings document into MongoDB collection 'store_settings'.
    """
    try:
        col = get_collection('store_settings')
        if col is not None:
            doc = _sanitize_for_mongo(settings_dict)
            doc['django_id'] = settings_dict.get('id', 1)
            col.replace_one({'django_id': doc['django_id']}, doc, upsert=True)
            return True
    except Exception as e:
        logger.warning(f"Failed to save store settings to MongoDB: {e}")
    return False


