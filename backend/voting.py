import numpy as np
from sentence_transformers import SentenceTransformer

# Load once at import time — this is a small model (~80MB)
_model = SentenceTransformer("all-MiniLM-L6-v2")


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-10))


def pick_winner(responses: dict[str, str]) -> dict:
    """
    responses: {"mistral": "...", "llama": "...", "qwen": "...", "gemma": "..."}

    Returns:
    {
        "winner": "qwen",
        "scores": {"mistral": 0.87, "llama": 0.91, "qwen": 0.94, "gemma": 0.88},
        "explanation": "qwen had the highest average agreement with other experts"
    }
    """
    if not responses:
        return {"winner": None, "scores": {}, "explanation": "No responses received"}

    names = list(responses.keys())
    texts = [responses[n] for n in names]

    # Embed all responses at once (batched — faster)
    raw_embeddings = _model.encode(texts, convert_to_numpy=True)
    embeddings = np.asarray(raw_embeddings)

    # Build pairwise similarity matrix
    n = len(names)
    sim_matrix = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            if i != j:
                sim_matrix[i][j] = _cosine_similarity(embeddings[i], embeddings[j])

    # Mean similarity of each response to all others
    mean_sims = sim_matrix.sum(axis=1) / max(n - 1, 1)

    scores = {names[i]: round(float(mean_sims[i]), 4) for i in range(n)}
    winner = names[int(np.argmax(mean_sims))]

    return {
        "winner":      winner,
        "scores":      scores,
        "explanation": f"{winner} had the highest average semantic agreement with other experts",
    }
