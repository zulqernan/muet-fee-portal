import hmac
import os

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from answer import answer

load_dotenv()
RAG_SECRET = os.getenv("RAG_SECRET")

app = FastAPI()


class Question(BaseModel):
    question: str = Field(min_length=3, max_length=500)


@app.get("/health")
def health():
    return {"status": "ok", "service": "rag-service"}


@app.post("/ask")
def ask(body: Question, x_rag_secret: str | None = Header(default=None)):
    if RAG_SECRET and not hmac.compare_digest(x_rag_secret or "", RAG_SECRET):
        raise HTTPException(status_code=401, detail="Unauthorized")
    text, sources = answer(body.question)
    return {"answer": text, "sources": sources}