"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      setIsError(!res.ok);
      if (res.ok) {
        const dest =
          data.role === "ADMIN"
            ? "/admin"
            : data.role === "ACCOUNTS"
            ? "/accounts"
            : "/dashboard";
        window.location.href = dest;
        return;
      }
      setMessage(data.error ?? "Something went wrong.");
    } catch {
      setIsError(true);
      setMessage("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-4"
      >
        <h1 className="text-xl font-semibold text-gray-900">Login</h1>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Email</label>
          <input
            type="email"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Password</label>
          <input
            type="password"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-md py-2 font-medium disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {message && (
          <p className={isError ? "text-sm text-red-600" : "text-sm text-green-700"}>
            {message}
          </p>
        )}
      </form>
    </main>
  );
}