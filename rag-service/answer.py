import os
import sys
import time

from dotenv import load_dotenv
from google import genai
from google.genai import errors, types

from search import search

load_dotenv()

MODELS = ["gemini-flash-lite-latest", "gemini-flash-latest"]

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY"),
    http_options=types.HttpOptions(timeout=20000),  # 20 seconds
)

SYSTEM = """You are a fee-information assistant for MUET students.
Rules:
- Answer ONLY from the CONTEXT provided. Never use outside knowledge or guess.
- Answer only what the student asked. Do not add extra fields or details they did not ask for.
- State the fee category and its frequency (once, per year, per semester) for every amount you give.
- Say an amount is refundable ONLY if the CONTEXT marks it as Refundable. If the CONTEXT does not say so, do not mention refund status at all. Never write "not refundable" or "not mentioned".
- Do not add one-time and recurring fees together unless the student asks for a total.
- If the answer is not in the CONTEXT (for example late fee, last date, clearance rules), say you do not have that information and tell the student to ask the accounts office.
- LANGUAGE: look at the QUESTION. If it is written in English, answer in English only. If it is written in Roman Urdu (Urdu in Latin letters), answer in Roman Urdu only. Never mix the two languages in one answer.
- In Roman Urdu use simple, correct words and start directly with the answer. Do not use filler or greeting words.
- Keep the answer short, one or two sentences."""

_cache = {}


def generate(contents):
    last_error = None
    for model in MODELS:
        for attempt in range(2):
            print(f"[gemini] trying {model}, attempt {attempt + 1}", flush=True)
            started = time.time()
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=contents,
                    config=types.GenerateContentConfig(system_instruction=SYSTEM),
                )
                print(f"[gemini] ok in {time.time() - started:.1f}s", flush=True)
                return response
            except Exception as e:
                last_error = e
                code = getattr(e, "code", None)
                print(
                    f"[gemini] {model} failed after {time.time() - started:.1f}s: "
                    f"{type(e).__name__} {code}",
                    flush=True,
                )
                if code == 429:
                    break  # is model ki quota khatam, agle model par jao
                if isinstance(e, errors.ClientError):
                    raise  # galat request, dobara koshish ka faida nahi
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