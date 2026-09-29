import re
from typing import Optional


def validate_phone(phone: Optional[str]) -> bool:
    if not phone:
        return False
    # Accepts 10 to 15 digits, optional + prefix
    pattern = r"^\+?[0-9]{10,15}$"
    clean_phone = phone.replace(" ", "").replace("-", "")
    return bool(re.match(pattern, clean_phone))


def validate_email(email: Optional[str]) -> bool:
    if not email:
        return False
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    return bool(re.match(pattern, email))


def validate_sku(sku: Optional[str]) -> bool:
    if not sku:
        return False
    return len(sku.strip()) >= 3
