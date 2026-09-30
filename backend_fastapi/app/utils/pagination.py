import math
from typing import Tuple, Dict, Any
from pydantic import BaseModel, Field


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1, description="Page number starting from 1")
    limit: int = Field(default=500, ge=1, le=1000, description="Items per page (max 1000)")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit


def get_pagination_meta(total_items: int, page: int, limit: int) -> Dict[str, Any]:
    total_pages = math.ceil(total_items / limit) if limit > 0 else 0
    return {
        "total": total_items,
        "total_items": total_items,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1
    }
