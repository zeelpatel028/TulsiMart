from typing import List, Tuple, Optional
from datetime import date
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.offer_repository import OfferRepository
from app.models.offer import Coupon, FestivalOffer
from app.schemas.offer import CouponCreate, FestivalOfferCreate, ValidateCouponRequest


class OfferService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = OfferRepository(db)

    async def list_coupons(self, page: int = 1, limit: int = 20) -> Tuple[List[Coupon], int]:
        return await self.repo.list_coupons(page=page, limit=limit)

    async def create_coupon(self, data: CouponCreate) -> Coupon:
        existing = await self.repo.get_coupon_by_code(data.code.upper())
        if existing:
            raise HTTPException(status_code=400, detail=f"Coupon code '{data.code}' already exists")

        coupon = Coupon(
            code=data.code.upper(),
            title=data.title,
            description=data.description,
            offer_type=data.offer_type,
            discount_value=data.discount_value,
            min_order_amount=data.min_order_amount,
            max_discount_amount=data.max_discount_amount,
            valid_from=data.valid_from,
            valid_to=data.valid_to,
            usage_limit=data.usage_limit,
            is_active=data.is_active
        )
        return await self.repo.create_coupon(coupon)

    async def delete_coupon(self, coupon_id: int) -> None:
        coupon = await self.repo.get_coupon_by_id(coupon_id)
        if not coupon:
            raise HTTPException(status_code=404, detail="Coupon not found")
        await self.db.delete(coupon)
        await self.db.flush()

    async def validate_coupon(self, data: ValidateCouponRequest) -> dict:
        coupon = await self.repo.get_coupon_by_code(data.code.upper())
        if not coupon:
            raise HTTPException(status_code=404, detail="Invalid coupon code")

        today = date.today()
        if not coupon.is_active or coupon.valid_from > today or coupon.valid_to < today:
            raise HTTPException(status_code=400, detail="Coupon code is expired or inactive")

        if coupon.used_count >= coupon.usage_limit:
            raise HTTPException(status_code=400, detail="Coupon usage limit reached")

        if data.cart_amount < coupon.min_order_amount:
            raise HTTPException(
                status_code=400,
                detail=f"Minimum order amount of ₹{coupon.min_order_amount} required for this coupon"
            )

        # Calculate discount
        if coupon.offer_type == "PERCENTAGE":
            discount = (data.cart_amount * float(coupon.discount_value)) / 100.0
            if coupon.max_discount_amount:
                discount = min(discount, float(coupon.max_discount_amount))
        else:
            discount = float(coupon.discount_value)

        return {
            "valid": True,
            "code": coupon.code,
            "discount_amount": discount,
            "message": f"Coupon '{coupon.code}' applied successfully!"
        }

    async def list_festival_offers(self) -> List[FestivalOffer]:
        return await self.repo.list_festival_offers()

    async def create_festival_offer(self, data: FestivalOfferCreate) -> FestivalOffer:
        offer = FestivalOffer(
            title=data.title,
            subtitle=data.subtitle,
            banner_image=data.banner_image,
            tag_text=data.tag_text or "Special Offer",
            discount_info=data.discount_info or "Up to 30% OFF",
            start_date=data.start_date,
            end_date=data.end_date,
            is_active=data.is_active
        )
        return await self.repo.create_festival_offer(offer)
