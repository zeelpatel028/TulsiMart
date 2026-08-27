import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .mongodb import get_collection, _sanitize_for_mongo

logger = logging.getLogger(__name__)

# Map models to MongoDB collection names
MODEL_COLLECTION_MAP = {
    'StoreSetting': 'store_settings',
    'LoginAccount': 'login_accounts',
    'Staff': 'staff',
    'Category': 'categories',
    'Brand': 'brands',
    'Unit': 'units',
    'Product': 'products',
    'StockMovement': 'stock_movements',
    'Order': 'orders',
    'OrderItem': 'order_items',
    'PaymentTransaction': 'payments',
    'Customer': 'customers',
    'CustomerFeedback': 'feedbacks',
    'Supplier': 'suppliers',
    'PurchaseOrder': 'purchase_orders',
    'ExpenseCategory': 'expense_categories',
    'Expense': 'expenses',
    'Coupon': 'coupons',
    'FestivalOffer': 'festival_offers',
}



@receiver(post_save)
def auto_sync_to_mongo_on_save(sender, instance, created, **kwargs):
    model_name = sender.__name__
    collection_name = MODEL_COLLECTION_MAP.get(model_name)
    if not collection_name:
        return

    try:
        col = get_collection(collection_name)
        if col is None:
            return

        doc = {}
        for field in instance._meta.fields:
            attname = getattr(field, 'attname', field.name)
            val = getattr(instance, attname, getattr(instance, field.name, None))
            doc[field.name] = _sanitize_for_mongo(val)

        doc['django_id'] = instance.id
        col.replace_one({'django_id': instance.id}, doc, upsert=True)
    except Exception as e:
        logger.debug(f"[MongoDB AutoSync Save Error] {model_name}: {e}")

@receiver(post_delete)
def auto_sync_to_mongo_on_delete(sender, instance, **kwargs):
    model_name = sender.__name__
    collection_name = MODEL_COLLECTION_MAP.get(model_name)
    if not collection_name:
        return

    try:
        col = get_collection(collection_name)
        if col is None:
            return

        col.delete_one({'django_id': instance.id})
    except Exception as e:
        logger.debug(f"[MongoDB AutoSync Delete Error] {model_name}: {e}")
