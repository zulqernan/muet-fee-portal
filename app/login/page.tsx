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
    <div className="min-h-screen flex flex-col">
      <header className="bg-navy-900 border-b-4 border-accent">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-navy-900 font-bold">
            FP
          </span>
          <div className="leading-tight">
            <p className="text-white font-semibold">MUET Fee Portal</p>
            <p className="text-xs text-blue-200">Fee challans and clearance</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm bg-white rounded-xl shadow-md border border-gray-100 p-8 space-y-5"
        >
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-semibold text-navy-900">Login</h1>
            <p className="text-sm text-gray-500">Access your account</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark text-white rounded-lg py-2.5 font-semibold transition-colors disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {message && (
            <p
              className={
                isError
                  ? "text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2"
                  : "text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2"
              }
            >
              {message}
            </p>
          )}

          <p className="text-center text-sm text-gray-600">
            New student?{" "}
            <a href="/register" className="text-brand font-medium hover:underline">
              Register here
            </a>
          </p>
        </form>
      </main>

      <footer className="text-center text-xs text-gray-500 py-4">
        Demo project. Not an official MUET portal.
      </footer>
    </div>
  );
}