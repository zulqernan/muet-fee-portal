"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";

const NAV = [{ label: "Mark challan paid", href: "/accounts" }];

export default function AccountsPage() {
  const [email, setEmail] = useState("");
  const [blocked, setBlocked] = useState("");
  const [ready, setReady] = useState(false);

  const [challanNo, setChallanNo] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then(async (res) => {
        if (!res.ok) {
          setBlocked("Please log in first.");
          return;
        }
        const me = await res.json();
        if (me.role !== "ACCOUNTS" && me.role !== "ADMIN") {
          setBlocked("This page is for the accounts office only.");
          return;
        }
        setEmail(me.email);
      })
      .catch(() => setBlocked("Could not reach the server."))
      .finally(() => setReady(true));
  }, []);

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

  if (!ready) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (blocked) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-6 text-center space-y-3">
          <p className="text-red-700">{blocked}</p>
          <a href="/login" className="text-brand underline text-sm">
            Go to login
          </a>
        </div>
      </main>
    );
  }

  return (
    <AppShell nav={NAV} userLabel={email}>
      <div className="max-w-md mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-md border border-gray-100 p-8 space-y-5"
        >
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-navy-900">
              Mark challan as paid
            </h1>
            <p className="text-sm text-gray-500">
              Enter the challan number from the bank slip.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Challan number
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              value={challanNo}
              onChange={(e) => setChallanNo(e.target.value)}
              placeholder="CH-XXXXXXXXXX"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark text-white rounded-lg py-2.5 font-semibold transition-colors disabled:opacity-60"
          >
            {loading ? "Saving..." : "Mark as Paid"}
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
        </form>
      </div>
    </AppShell>
  );
}