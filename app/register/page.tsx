"use client";

import { useState } from "react";
import AuthShell from "../../components/AuthShell";

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

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

  return (
    <AuthShell>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-xl shadow-md border border-gray-100 p-8 space-y-5"
      >
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-navy-900">
            Student Registration
          </h1>
          <p className="text-sm text-gray-500">
            Use the roll number and email registered with the university
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Roll number
          </label>
          <input
            className={inputClass}
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
            placeholder="e.g. 24SW003"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Official email
          </label>
          <input
            type="email"
            className={inputClass}
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
            className={inputClass}
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
          className="w-full bg-brand hover:bg-brand-dark text-white rounded-lg py-2.5 font-semibold transition-colors disabled:opacity-60"
        >
          {loading ? "Registering..." : "Register"}
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
          Already registered?{" "}
          <a href="/login" className="text-brand font-medium hover:underline">
            Login
          </a>
        </p>
      </form>
    </AuthShell>
  );
}