from fastapi import APIRouter, status

router = APIRouter(tags=["Health Check & Keep-Alive"])


@router.get("/health", status_code=status.HTTP_200_OK)
@router.get("/health/", status_code=status.HTTP_200_OK)
def health_check():
    """
    Production-safe health check endpoint for external uptime monitors and keep-alive.
    Returns status: ok
    """
    return {"status": "ok"}


@router.get("/health/light", status_code=status.HTTP_200_OK)
def lightweight_health_check():
    """
    Lightweight ping endpoint for external uptime monitors.
    """
    return {"status": "ok"}

