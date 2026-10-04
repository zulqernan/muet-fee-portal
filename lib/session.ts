import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "session";

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function createSession(payload: { userId: number; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function readSession(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as { userId: number; role: string };
  } catch {
    return null;
  }
}