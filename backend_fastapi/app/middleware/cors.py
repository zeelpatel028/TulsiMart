from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings


def setup_cors(app: FastAPI) -> None:
    origins = settings.FRONTEND_URL
    if isinstance(origins, str):
        origins = [origins]
    elif not isinstance(origins, list):
        origins = [str(origins)]

    # Ensure production Vercel frontend and local development hosts are included
    default_origins = [
        "https://tulsi-mart.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]

    clean_origins = set()
    for o in list(origins) + default_origins:
        if isinstance(o, str) and o.strip():
            url = o.strip()
            clean_origins.add(url)
            if url.endswith("/"):
                clean_origins.add(url.rstrip("/"))
            else:
                clean_origins.add(url + "/")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(clean_origins),
        allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|.*\.vercel\.app)(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

