"use client";

import { useEffect, useState } from "react";

type Me = {
  email: string;
  role: string;
  student: {
    name: string;
    rollNo: string;
    department: string;
    batch: number;
    semester: number;
  } | null;
};

type Challan = {
  challanNo: string;
  semester: number;
  session: string;
  amount: number;
  dueDate: string;
  status: "UNPAID" | "PAID";
  lateFee: number;
  totalPayable: number;
};

export default function DashboardPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [challan, setChallan] = useState<Challan | null>(null);
  const [error, setError] = useState("");
  const [challanError, setChallanError] = useState("");

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [chatError, setChatError] = useState("");
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    async function load() {
      const meRes = await fetch("/api/me");
      if (!meRes.ok) {
        setError("Please log in first.");
        return;
      }
      setMe(await meRes.json());

      const chRes = await fetch("/api/challan");
      const chData = await chRes.json();
      if (chRes.ok) setChallan(chData);
      else setChallanError(chData.error ?? "Could not load challan.");
    }
    load().catch(() => setError("Could not reach the server."));
  }, []);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setAsking(true);
    setChatError("");
    setAnswer("");
    setSources([]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) {
        setChatError(data.error ?? "Something went wrong.");
      } else {
        setAnswer(String(data.answer).replace(/\*\*/g, ""));
        setSources(data.sources ?? []);
      }
    } catch {
      setChatError("Could not reach the server.");
    } finally {
      setAsking(false);
    }
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow p-6 text-center space-y-3">
          <p className="text-red-600">{error}</p>
          <a href="/login" className="text-blue-600 underline text-sm">
            Go to login
          </a>
        </div>
      </main>
    );
  }

  if (!me) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">My Dashboard</h1>
          <button onClick={logout} className="text-sm text-blue-600 underline">
            Logout
          </button>
        </div>

        {me.student ? (
          <section className="bg-white rounded-xl shadow p-5 space-y-1 text-gray-800">
            <p className="font-medium text-gray-900">{me.student.name}</p>
            <p className="text-sm">Roll no: {me.student.rollNo}</p>
            <p className="text-sm">Department: {me.student.department}</p>
            <p className="text-sm">
              Batch {me.student.batch} · Semester {me.student.semester}
            </p>
          </section>
        ) : (
          <section className="bg-white rounded-xl shadow p-5 text-gray-800">
            <p className="text-sm">
              Logged in as {me.email} ({me.role}). This page is for students.
            </p>
          </section>
        )}

        {me.student && (
          <section className="bg-white rounded-xl shadow p-5 space-y-3 text-gray-800">
            <h2 className="font-medium text-gray-900">Fee challan</h2>

            {challanError && <p className="text-sm text-red-600">{challanError}</p>}

            {challan && (
              <>
                <div className="text-sm space-y-1">
                  <p>Challan no: {challan.challanNo}</p>
                  <p>
                    Semester {challan.semester} · Session {challan.session}
                  </p>
                  <p>Due date: {challan.dueDate.slice(0, 10)}</p>
                  <p>Fee: Rs. {challan.amount}</p>
                  <p>Late fee: Rs. {challan.lateFee}</p>
                  <p className="font-medium">Total payable: Rs. {challan.totalPayable}</p>
                  <p>
                    Status:{" "}
                    <span
                      className={
                        challan.status === "PAID" ? "text-green-700" : "text-red-600"
                      }
                    >
                      {challan.status}
                    </span>
                  </p>
                </div>
                <a
                  href="/api/challan/pdf"
                  target="_blank"
                  className="inline-block bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium"
                >
                  Download challan PDF
                </a>
              </>
            )}
          </section>
        )}

        {me.student && (
          <section className="bg-white rounded-xl shadow p-5 space-y-3 text-gray-800">
            <h2 className="font-medium text-gray-900">Ask about MUET fees</h2>
            <p className="text-xs text-gray-500">
              Answers come from the MUET fee structure document. For your due
              date and late fee, use the challan above.
            </p>

            <form onSubmit={ask} className="flex gap-2">
              <input
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                placeholder="e.g. What is the tuition fee per semester?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                minLength={3}
                maxLength={500}
                required
              />
              <button
                disabled={asking}
                className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                {asking ? "Thinking..." : "Ask"}
              </button>
            </form>

            {chatError && <p className="text-sm text-red-600">{chatError}</p>}

            {answer && (
              <div className="space-y-2">
                <p className="text-sm whitespace-pre-wrap">{answer}</p>
                {sources.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Based on: {sources.join(" · ")}
                  </p>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}