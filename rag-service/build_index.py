import json
import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

from chunk import load_text, split_sections

load_dotenv()

EMBED_MODEL = "gemini-embedding-001"

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

chunks = split_sections(load_text("docs/muet-fee-structure.pdf"))
print("Chunks:", len(chunks))

result = client.models.embed_content(
    model=EMBED_MODEL,
    contents=chunks,
    config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
)

index = [
    {"text": text, "embedding": e.values}
    for text, e in zip(chunks, result.embeddings)
]

with open("index.json", "w", encoding="utf-8") as f:
    json.dump(index, f)

print("Saved", len(index), "chunks to index.json")
print("Numbers per embedding:", len(index[0]["embedding"]))