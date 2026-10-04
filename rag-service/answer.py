import os
import sys
import time

from dotenv import load_dotenv
from google import genai
from google.genai import errors, types

from search import search

load_dotenv()

MODELS = ["gemini-flash-latest", "gemini-flash-lite-latest"]

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM = """You are a fee-information assistant for MUET students.
Rules:
- Answer ONLY from the CONTEXT provided. Never use outside knowledge or guess.
- Always state the fee category and its frequency (once, per year, per semester).
- Clearly say when an amount is refundable.
- Do not add one-time and recurring fees together unless the student asks for a total.
- If the answer is not in the CONTEXT (for example late fee, last date, clearance rules), say you do not have that information and tell the student to ask the accounts office.
- Reply in the same language the student wrote in (English or Roman Urdu).
- Keep the answer short."""

_cache = {}


def generate(contents):
    last_error = None
    for model in MODELS:
        for attempt in range(3):
            try:
                return client.models.generate_content(
                    model=model,
                    contents=contents,
                    config=types.GenerateContentConfig(system_instruction=SYSTEM),
                )
            except errors.ClientError as e:
                # 429 = is model ki quota khatam, agle model par jao
                if e.code == 429:
                    last_error = e
                    break
                raise
            except errors.ServerError as e:
                last_error = e
                time.sleep(2 * (attempt + 1))
    raise last_error


def answer(question):
    key = " ".join(question.lower().split())
    if key in _cache:
        return _cache[key]

    hits = search(question, top_k=3)
    context = "\n\n---\n\n".join(text for _, text in hits)
    response = generate(f"CONTEXT:\n{context}\n\nQUESTION: {question}")
    sources = [text.splitlines()[0] for _, text in hits]

    if len(_cache) >= 200:
        _cache.clear()
    _cache[key] = (response.text, sources)
    return response.text, sources


if __name__ == "__main__":
    q = " ".join(sys.argv[1:]) or "What is the tuition fee per semester?"
    text, sources = answer(q)
    print("Question:", q)
    print("\nAnswer:\n" + text)
    print("\nSources:")
    for s in sources:
        print(" -", s)