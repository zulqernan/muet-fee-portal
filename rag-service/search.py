import json
import os
import sys
import time

import numpy as np
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

EMBED_MODEL = "gemini-embedding-001"

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY"),
    http_options=types.HttpOptions(timeout=15000),  # 15 seconds
)

with open("index.json", encoding="utf-8") as f:
    index = json.load(f)

matrix = np.array([item["embedding"] for item in index])
matrix = matrix / np.linalg.norm(matrix, axis=1, keepdims=True)


def embed_question(question):
    last_error = None
    for attempt in range(2):
        started = time.time()
        try:
            result = client.models.embed_content(
                model=EMBED_MODEL,
                contents=question,
                config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
            )
            print(f"[embed] ok in {time.time() - started:.1f}s", flush=True)
            return np.array(result.embeddings[0].values)
        except Exception as e:
            last_error = e
            print(
                f"[embed] attempt {attempt + 1} failed after "
                f"{time.time() - started:.1f}s: {type(e).__name__}",
                flush=True,
            )
            time.sleep(1)
    raise last_error


def search(question, top_k=3):
    q = embed_question(question)
    q = q / np.linalg.norm(q)
    scores = matrix @ q
    best = np.argsort(scores)[::-1][:top_k]
    return [(float(scores[i]), index[i]["text"]) for i in best]


if __name__ == "__main__":
    question = " ".join(sys.argv[1:]) or "What is the tuition fee per semester?"
    print("Question:", question)
    for score, text in search(question):
        print(f"\nscore {score:.3f} | {text.splitlines()[0]}")