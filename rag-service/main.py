from fastapi import FastAPI
from pydantic import BaseModel, Field

from answer import answer

app = FastAPI()


class Question(BaseModel):
    question: str = Field(min_length=3, max_length=500)


@app.get("/health")
def health():
    return {"status": "ok", "service": "rag-service"}


@app.post("/ask")
def ask(body: Question):
    text, sources = answer(body.question)
    return {"answer": text, "sources": sources}