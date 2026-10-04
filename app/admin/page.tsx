"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";

type Stat = {
  department: string;
  totalStudents: number;
  paid: number;
  unpaid: number;
  noChallan: number;
};

type Result = {
  rollNo: string;
  name: string;
  department: string;
  semester: number;
  challans: number;
  paidTotal: number;
  cleared: boolean;
};

const NAV = [
  { label: "Dashboard", href: "/admin" },
  { label: "Search students", href: "#search" },
];

export default function AdminPage() {
  const [stats, setStats] = useState<Stat[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load.");
        setStats(data.stats);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchError("");
    setResults(null);
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/students?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error ?? "Search failed.");
        return;
      }
      setResults(data.results);
    } finally {
      setSearching(false);
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

  const totals = (stats ?? []).reduce(
    (t, d) => ({
      students: t.students + d.totalStudents,
      paid: t.paid + d.paid,
      unpaid: t.unpaid + d.unpaid,
      none: t.none + d.noChallan,
    }),
    { students: 0, paid: 0, unpaid: 0, none: 0 }
  );

  const cards = [
    { label: "Students", value: totals.students, style: "bg-navy-900 text-white", sub: "text-blue-200" },
    { label: "Paid", value: totals.paid, style: "bg-white text-green-700", sub: "text-gray-500" },
    { label: "Unpaid", value: totals.unpaid, style: "bg-white text-red-700", sub: "text-gray-500" },
    { label: "No challan yet", value: totals.none, style: "bg-white text-gray-700", sub: "text-gray-500" },
  ];

  return (
    <AppShell nav={NAV} userLabel="Administrator">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-navy-900">Admin Dashboard</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map((c) => (
            <div
              key={c.label}
              className={`rounded-xl shadow-md border border-gray-100 p-4 ${c.style}`}
            >
              <p className={`text-xs ${c.sub}`}>{c.label}</p>
              <p className="text-2xl font-semibold">{stats ? c.value : "-"}</p>
            </div>
          ))}
        </div>

        <section className="bg-white rounded-xl shadow-md border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-navy-900">Fee status by department</h2>
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <span><span className="inline-block w-3 h-3 rounded-sm bg-green-500 mr-1" />Paid</span>
            <span><span className="inline-block w-3 h-3 rounded-sm bg-red-500 mr-1" />Unpaid</span>
            <span><span className="inline-block w-3 h-3 rounded-sm bg-gray-300 mr-1" />No challan yet</span>
          </div>

          {!stats && <p className="text-sm text-gray-500">Loading...</p>}

          {stats?.map((d) => {
            const total = d.totalStudents || 1;
            return (
              <div key={d.department} className="space-y-1">
                <div className="flex flex-wrap justify-between gap-1 text-sm text-gray-800">
                  <span className="font-medium">{d.department}</span>
                  <span className="text-gray-600">
                    {d.paid} paid · {d.unpaid} unpaid · {d.noChallan} none
                  </span>
                </div>
                <div className="flex h-5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="bg-green-500" style={{ width: `${(d.paid / total) * 100}%` }} />
                  <div className="bg-red-500" style={{ width: `${(d.unpaid / total) * 100}%` }} />
                  <div className="bg-gray-300" style={{ width: `${(d.noChallan / total) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </section>

        <section
          id="search"
          className="bg-white rounded-xl shadow-md border border-gray-100 p-6 space-y-4"
        >
          <h2 className="font-semibold text-navy-900">Search student</h2>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              placeholder="Roll number or name"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              required
              minLength={2}
            />
            <button
              disabled={searching}
              className="bg-brand hover:bg-brand-dark text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </form>

          {searchError && (
            <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
              {searchError}
            </p>
          )}
          {results && results.length === 0 && (
            <p className="text-sm text-gray-500">No students found.</p>
          )}

          {results && results.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-800">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="py-2 pr-3 font-medium">Roll no</th>
                    <th className="py-2 pr-3 font-medium">Name</th>
                    <th className="py-2 pr-3 font-medium">Sem</th>
                    <th className="py-2 pr-3 font-medium">Paid (Rs.)</th>
                    <th className="py-2 font-medium">Clearance</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.rollNo} className="border-b border-gray-100">
                      <td className="py-2.5 pr-3">{r.rollNo}</td>
                      <td className="py-2.5 pr-3">{r.name}</td>
                      <td className="py-2.5 pr-3">{r.semester}</td>
                      <td className="py-2.5 pr-3">{r.paidTotal.toLocaleString()}</td>
                      <td className="py-2.5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            r.cleared
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {r.cleared ? "Cleared" : "Not cleared"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}