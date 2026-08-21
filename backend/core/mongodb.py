"""
MongoDB Database Connector & Synchronization Service for Tulsi Mart
Uses PyMongo to connect directly to MongoDB (Local MongoDB Community / MongoDB Atlas).
"""

import os
import logging
from django.conf import settings
from decimal import Decimal
from datetime import date, datetime

logger = logging.getLogger(__name__)

_mongo_client = None

def get_mongo_uri():
    return os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')

def get_mongo_db_name():
    return os.getenv('MONGODB_DB_NAME', 'tulsimart_db')

def get_mongo_client():
    """
    Returns a singleton MongoClient instance.
    """
    global _mongo_client
    if _mongo_client is None:
        try:
            import pymongo
            uri = get_mongo_uri()
            _mongo_client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=3000)
            # Test connection
            _mongo_client.server_info()
            logger.info("Successfully connected to MongoDB server.")
        except Exception as e:
            logger.warning(f"MongoDB connection warning: {e}")
            return None
    return _mongo_client

def get_mongo_db():
    """
    Returns the MongoDB database object.
    """
    client = get_mongo_client()
    if client:
        return client[get_mongo_db_name()]
    return None

def get_collection(collection_name):
    """
    Helper to get a specific MongoDB collection.
    """
    db = get_mongo_db()
    if db is not None:
        return db[collection_name]
    return None

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
            'message': 'Cannot connect to MongoDB. Ensure MongoDB is running on localhost:27017 or check MONGODB_URI.'
        }

    try:
        from core.models import User, StoreSetting, SmartNotification
        from inventory.models import Category, Brand, Unit, Product, StockMovement
        from orders.models import Order, OrderItem, PaymentTransaction
        from customers.models import Customer, CustomerFeedback
        from suppliers.models import Supplier, PurchaseOrder
        from expenses.models import ExpenseCategory, Expense
        from offers.models import Coupon, FestivalOffer

        results['users'] = sync_model_to_mongo('users', User.objects.all())
        results['store_settings'] = sync_model_to_mongo('store_settings', StoreSetting.objects.all())
        results['notifications'] = sync_model_to_mongo('notifications', SmartNotification.objects.all())

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
