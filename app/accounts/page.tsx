"use client";

import { useState } from "react";

export default function AccountsPage() {
  const [challanNo, setChallanNo] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const no = challanNo.trim().toUpperCase();
    if (!window.confirm(`Mark challan ${no} as PAID?`)) return;

    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/accounts/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challanNo: no }),
      });
      const data = await res.json();
      setIsError(!res.ok);
      setMessage(data.message ?? data.error ?? "Something went wrong.");
      if (res.ok) setChallanNo("");
    } catch {
      setIsError(true);
      setMessage("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm space-y-3">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow p-6 space-y-4"
        >
          <h1 className="text-xl font-semibold text-gray-900">Accounts Office</h1>
          <p className="text-sm text-gray-600">
            Enter the challan number from the bank slip and mark it as paid.
          </p>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Challan number</label>
            <input
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              value={challanNo}
              onChange={(e) => setChallanNo(e.target.value)}
              placeholder="CH-XXXXXXXXXX"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-md py-2 font-medium disabled:opacity-60"
          >
            {loading ? "Saving..." : "Mark as Paid"}
          </button>

          {message && (
            <p className={isError ? "text-sm text-red-600" : "text-sm text-green-700"}>
              {message}
            </p>
          )}
        </form>

        <button onClick={logout} className="text-sm text-blue-600 underline">
          Logout
        </button>
      </div>
    </main>
  );
}