import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { readSession, SESSION_COOKIE } from "../../../lib/session";
import { rateLimit } from "../../../lib/rateLimit";

export const maxDuration = 60;

const schema = z.object({ question: z.string().trim().min(3).max(500) });

function tooMany(retryAfter: number, message: string) {
  return NextResponse.json(
    { error: message },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

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

  const perUser = await rateLimit(`chat:user:${session.userId}`, 15, 10 * 60);
  if (!perUser.ok) {
    return tooMany(
      perUser.retryAfter,
      "You are asking too fast. Please wait a few minutes and try again."
    );
  }

  const global = await rateLimit("chat:global", 300, 24 * 60 * 60);
  if (!global.ok) {
    return tooMany(
      global.retryAfter,
      "The assistant has reached its daily limit. Please try again tomorrow."
    );
  }

  try {
    const res = await fetch(
      `${process.env.RAG_URL ?? "http://localhost:8000"}/ask`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rag-secret": process.env.RAG_SECRET ?? "",
        },
        body: JSON.stringify({ question: parsed.data.question }),
        signal: AbortSignal.timeout(55000),
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