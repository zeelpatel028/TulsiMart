from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings


def setup_cors(app: FastAPI) -> None:
    origins = settings.FRONTEND_URL
    if isinstance(origins, str):
        origins = [origins]
    elif not isinstance(origins, list):
        origins = [str(origins)]

    # Ensure local development hosts are included
    dev_origins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
    for d in dev_origins:
        if d not in origins:
            origins.append(d)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Process-Time"],
    )

