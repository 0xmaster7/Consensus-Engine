# backend/config.py
import os
from dotenv import load_dotenv

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")

# Default model IDs. Access depends on the user's Hugging Face account,
# provider availability, and any gated-model terms.
MODELS = {
    "mistral": "HuggingFaceH4/zephyr-7b-beta",
    "llama":   "meta-llama/Meta-Llama-3.1-8B-Instruct",
    "qwen":    "Qwen/Qwen2.5-7B-Instruct",
    "gemma":   "google/gemma-2-9b-it",
}

# Generation parameters — tune these if responses are too long or too short
GENERATION_CONFIG = {
    "max_tokens": 512,
    "temperature": 0.7,
}
