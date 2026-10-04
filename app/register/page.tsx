"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [rollNo, setRollNo] = useState("");
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
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNo, email, password }),
      });
      const data = await res.json();
      setIsError(!res.ok);
      setMessage(data.message ?? data.error ?? "Something went wrong.");
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
        <h1 className="text-xl font-semibold text-gray-900">Student Registration</h1>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Roll number</label>
          <input
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
            placeholder="e.g. 24SW003"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Official email</label>
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
            minLength={8}
            required
          />
          <p className="text-xs text-gray-500 mt-1">At least 8 characters.</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-md py-2 font-medium disabled:opacity-60"
        >
          {loading ? "Registering..." : "Register"}
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