import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { readSession, SESSION_COOKIE } from "../../../lib/session";

const schema = z.object({ question: z.string().trim().min(3).max(500) });

export async function POST(req: Request) {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = token ? await readSession(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ask a question between 3 and 500 characters." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `${process.env.RAG_URL ?? "http://localhost:8000"}/ask`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: parsed.data.question }),
        signal: AbortSignal.timeout(30000),
      }
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: "The assistant could not answer right now." },
        { status: 502 }
      );
    }
    const data = await res.json();
    return NextResponse.json({ answer: data.answer, sources: data.sources });
  } catch {
    return NextResponse.json(
      { error: "The assistant is unavailable right now." },
      { status: 503 }
    );
  }
}