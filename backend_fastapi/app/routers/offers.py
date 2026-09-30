from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import LoginAccount
from app.services.offer_service import OfferService
from app.schemas.offer import CouponCreate, CouponResponse, ValidateCouponRequest, FestivalOfferCreate, FestivalOfferResponse
from app.utils.response import success_response
from app.utils.pagination import get_pagination_meta

router = APIRouter(tags=["Offers & Coupons"])

# --- COUPONS ---

@router.get("/offers/coupons/")
def list_coupons(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    service = OfferService(db)
    coupons, total = service.list_coupons(page=page, limit=limit)
    data = [CouponResponse.model_validate(c).model_dump() for c in coupons]
    pagination = get_pagination_meta(total, page, limit)
    return success_response(data=data, pagination=pagination, message="Coupons fetched")


@router.post("/offers/coupons/")
def create_coupon(
    data: CouponCreate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = OfferService(db)
    coupon = service.create_coupon(data)
    return success_response(data=CouponResponse.model_validate(coupon).model_dump(), message="Coupon created", status_code=201)


@router.delete("/offers/coupons/{coupon_id}/")
def delete_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = OfferService(db)
    service.delete_coupon(coupon_id)
    return success_response(data=None, message="Coupon deleted")


@router.post("/offers/coupons/validate_code/")
def validate_coupon(
    data: ValidateCouponRequest,
    db: Session = Depends(get_db)
):
    service = OfferService(db)
    res = service.validate_coupon(data)
    return success_response(data=res, message="Coupon validated successfully")


# --- FESTIVAL OFFERS ---

@router.get("/offers/festival-offers/")
def list_festival_offers(db: Session = Depends(get_db)):
    service = OfferService(db)
    offers = service.list_festival_offers()
    data = [FestivalOfferResponse.model_validate(f).model_dump() for f in offers]
    return success_response(data=data, message="Festival offers fetched")


@router.post("/offers/festival-offers/")
def create_festival_offer(
    data: FestivalOfferCreate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = OfferService(db)
    offer = service.create_festival_offer(data)
    return success_response(data=FestivalOfferResponse.model_validate(offer).model_dump(), message="Festival offer created", status_code=201)
