from typing import Any, Optional, Dict
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder


def success_response(
    data: Any = None,
    message: str = "Operation successful",
    pagination: Optional[Dict[str, Any]] = None,
    status_code: int = 200
) -> JSONResponse:
    content = {
        "success": True,
        "message": message,
        "data": jsonable_encoder(data) if data is not None else []
    }
    if pagination is not None:
        content["pagination"] = jsonable_encoder(pagination)
    return JSONResponse(status_code=status_code, content=content)


def error_response(
    message: str = "An error occurred",
    data: Any = None,
    status_code: int = 400
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
            "data": jsonable_encoder(data)
        }
    )
