from typing import Optional, List, Tuple
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.offer import Coupon, FestivalOffer


class OfferRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_coupons(self, page: int = 1, limit: int = 20) -> Tuple[List[Coupon], int]:
        offset = (page - 1) * limit
        count_res = await self.db.execute(select(func.count(Coupon.id)))
        total = count_res.scalar_one()

        query = select(Coupon).order_by(Coupon.id.desc()).offset(offset).limit(limit)
        res = await self.db.execute(query)
        return list(res.scalars().all()), total

    async def get_coupon_by_code(self, code: str) -> Optional[Coupon]:
        res = await self.db.execute(select(Coupon).where(Coupon.code == code))
        return res.scalars().first()

    async def get_coupon_by_id(self, coupon_id: int) -> Optional[Coupon]:
        res = await self.db.execute(select(Coupon).where(Coupon.id == coupon_id))
        return res.scalars().first()

    async def create_coupon(self, coupon: Coupon) -> Coupon:
        self.db.add(coupon)
        await self.db.flush()
        await self.db.refresh(coupon)
        return coupon

    async def list_festival_offers(self) -> List[FestivalOffer]:
        query = select(FestivalOffer).where(FestivalOffer.is_active == True).order_by(FestivalOffer.start_date.desc())
        res = await self.db.execute(query)
        return list(res.scalars().all())

    async def create_festival_offer(self, offer: FestivalOffer) -> FestivalOffer:
        self.db.add(offer)
        await self.db.flush()
        await self.db.refresh(offer)
        return offer
