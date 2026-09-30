from typing import Optional, List, Tuple
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.offer import Coupon, FestivalOffer


class OfferRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_coupons(self, page: int = 1, limit: int = 20) -> Tuple[List[Coupon], int]:
        offset = (page - 1) * limit
        total = self.db.query(func.count(Coupon.id)).scalar() or 0
        coupons = self.db.query(Coupon).order_by(Coupon.id.desc()).offset(offset).limit(limit).all()
        return coupons, total

    def get_coupon_by_code(self, code: str) -> Optional[Coupon]:
        return self.db.query(Coupon).filter(Coupon.code == code).first()

    def get_coupon_by_id(self, coupon_id: int) -> Optional[Coupon]:
        return self.db.query(Coupon).filter(Coupon.id == coupon_id).first()

    def create_coupon(self, coupon: Coupon) -> Coupon:
        self.db.add(coupon)
        self.db.commit()
        self.db.refresh(coupon)
        return coupon

    def list_festival_offers(self) -> List[FestivalOffer]:
        return (
            self.db.query(FestivalOffer)
            .filter(FestivalOffer.is_active == True)
            .order_by(FestivalOffer.start_date.desc())
            .all()
        )

    def create_festival_offer(self, offer: FestivalOffer) -> FestivalOffer:
        self.db.add(offer)
        self.db.commit()
        self.db.refresh(offer)
        return offer
