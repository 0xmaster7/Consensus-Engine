# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.council import router

app = FastAPI(title="Council of Experts API")

# Allow the Flask frontend (port 5000) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8001", "http://127.0.0.1:8001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/council")
