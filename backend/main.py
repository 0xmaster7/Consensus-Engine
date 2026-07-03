# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.council import router

app = FastAPI(title="Council of Experts API")

# Allow local dev ports to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8001", "http://127.0.0.1:8001", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/council")

# Serve the static frontend
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
