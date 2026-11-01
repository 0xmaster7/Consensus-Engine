# Consensus Engine

Consensus Engine presents a Council of Experts UI. For each prompt, it streams responses from four selected Hugging Face models, scores completed responses by semantic agreement with a local SentenceTransformer model, and asks a judge model to synthesize a final response.

The FastAPI application serves both the API and static frontend. The UI sends requests to `POST /council/query` and receives Server-Sent Events (SSE).

## Local development

```bash
git clone https://github.com/0xmaster7/Consensus-Engine.git
cd Consensus-Engine
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the repository root and set a Hugging Face access token:

```env
HF_TOKEN=hf_your_token_here
```

`HF_TOKEN` is read by the application and passed to Hugging Face for inference. Set it before submitting queries; access to a model depends on your Hugging Face account, provider availability, and any gated-model terms. Hosted-model access is neither free nor guaranteed by this project.

Start the single FastAPI application:

```bash
uvicorn backend.main:app --reload --port 8000
```

Open <http://127.0.0.1:8000/>. The server mounts `frontend/` at `/`; no separate Flask process is needed.

## Behavior and boundaries

- Model responses are streamed concurrently through `huggingface_hub.AsyncInferenceClient`.
- After the expert streams complete, `all-MiniLM-L6-v2` embeds the responses locally and the highest mean pairwise cosine-similarity score is selected.
- The judge receives the prior conversation plus the expert outputs and streams its synthesis to the UI.
- The judge uses a separate system instruction and is told to treat expert output as data rather than instructions. The frontend renders Markdown through DOMPurify sanitization. These are mitigations, not a guarantee of immunity from prompt injection or other unsafe output.

`frontend/app.py` and `frontend/base.html` are legacy Flask/template artifacts. They are not used by the FastAPI startup path. In particular, `frontend/index.html` uses a relative backend URL, so the old two-terminal Flask-plus-FastAPI instructions do not route requests to the FastAPI service.

`vercel.json` is repository deployment configuration only. It is not evidence of a working or live Vercel deployment.

## Local model note

`backend.voting` constructs `SentenceTransformer("all-MiniLM-L6-v2")` when the FastAPI app imports. The model must already be available locally or SentenceTransformers may download it during startup. The model is not bundled in this repository.
