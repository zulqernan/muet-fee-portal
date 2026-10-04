"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";

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

const NAV = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Challan PDF", href: "/api/challan/pdf", external: true },
  { label: "Assistant", href: "#assistant" },
];

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
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-6 text-center space-y-3">
          <p className="text-red-700">{error}</p>
          <a href="/login" className="text-brand underline text-sm">
            Go to login
          </a>
        </div>
      </main>
    );
  }

  if (!me) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  const student = me.student;
  const initials = student
    ? student.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  return (
    <AppShell nav={NAV} userLabel={student ? student.rollNo : me.email}>
      <div className="max-w-3xl mx-auto space-y-6">
        {!student && (
          <section className="bg-white rounded-xl shadow-md p-6 text-gray-800">
            <p className="text-sm">
              Logged in as {me.email} ({me.role}). This page is for students.
            </p>
          </section>
        )}

        {student && (
          <>
            <section className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy-900 text-accent text-lg font-semibold">
                {initials}
              </span>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-navy-900 truncate">
                  {student.name}
                </h1>
                <p className="text-sm text-gray-600">
                  {student.rollNo} · {student.department}
                </p>
                <p className="text-sm text-gray-500">
                  Batch {student.batch} · Semester {student.semester}
                </p>
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-md border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-navy-900">Fee challan</h2>
                {challan && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      challan.status === "PAID"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {challan.status}
                  </span>
                )}
              </div>

              {challanError && (
                <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
                  {challanError}
                </p>
              )}

              {challan && (
                <>
                  <p className="text-sm text-gray-600">
                    Challan {challan.challanNo} · Semester {challan.semester} ·
                    Session {challan.session}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg bg-surface p-4">
                      <p className="text-xs text-gray-500">Fee</p>
                      <p className="text-lg font-semibold text-navy-900">
                        Rs. {challan.amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface p-4">
                      <p className="text-xs text-gray-500">Late fee</p>
                      <p className="text-lg font-semibold text-navy-900">
                        Rs. {challan.lateFee.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg bg-navy-900 p-4">
                      <p className="text-xs text-blue-200">Total payable</p>
                      <p className="text-lg font-semibold text-accent">
                        Rs. {challan.totalPayable.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">
                    Due date: {challan.dueDate.slice(0, 10)}
                  </p>

                  <a
                    href="/api/challan/pdf"
                    target="_blank"
                    className="inline-block bg-brand hover:bg-brand-dark text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
                  >
                    Download challan PDF
                  </a>
                </>
              )}
            </section>

            <section
              id="assistant"
              className="bg-white rounded-xl shadow-md border border-gray-100 p-6 space-y-3"
            >
              <h2 className="font-semibold text-navy-900">
                Ask about MUET fees
              </h2>
              <p className="text-xs text-gray-500">
                Answers come from the MUET fee structure document. For your due
                date and late fee, use the challan above.
              </p>

              <form onSubmit={ask} className="flex flex-col sm:flex-row gap-2">
                <input
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                  placeholder="e.g. What is the tuition fee per semester?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  minLength={3}
                  maxLength={500}
                  required
                />
                <button
                  disabled={asking}
                  className="bg-brand hover:bg-brand-dark text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  {asking ? "Thinking..." : "Ask"}
                </button>
              </form>

              {chatError && (
                <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
                  {chatError}
                </p>
              )}

              {answer && (
                <div className="rounded-lg bg-surface p-4 space-y-2">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {answer}
                  </p>
                  {sources.length > 0 && (
                    <p className="text-xs text-gray-500">
                      Based on: {sources.join(" · ")}
                    </p>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}