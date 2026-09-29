import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.core.logging_config import logger


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.perf_counter()
        
        response = await call_next(request)
        
        process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["X-Process-Time"] = f"{process_time_ms}ms"

        # Log request summary without sensitive details
        path = request.url.path
        method = request.method
        status_code = response.status_code

        logger.info(f"[API] {method} {path} - {status_code} ({process_time_ms} ms)")
        return response
