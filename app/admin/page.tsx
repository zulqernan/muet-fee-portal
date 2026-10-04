"use client";

import { useEffect, useState } from "react";

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

export default function AdminPage() {
  const [stats, setStats] = useState<Stat[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [searchError, setSearchError] = useState("");

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
    const res = await fetch(`/api/admin/students?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (!res.ok) {
      setSearchError(data.error ?? "Search failed.");
      return;
    }
    setResults(data.results);
  }
  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
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

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
               <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
          <button onClick={logout} className="text-sm text-blue-600 underline">
            Logout
          </button>
        </div>

        <section className="bg-white rounded-xl shadow p-5 space-y-4">
          <h2 className="font-medium text-gray-900">Fee status by department</h2>
          <div className="flex gap-4 text-xs text-gray-600">
            <span><span className="inline-block w-3 h-3 bg-green-500 mr-1" />Paid</span>
            <span><span className="inline-block w-3 h-3 bg-red-500 mr-1" />Unpaid</span>
            <span><span className="inline-block w-3 h-3 bg-gray-300 mr-1" />No challan yet</span>
          </div>

          {!stats && <p className="text-sm text-gray-500">Loading...</p>}

          {stats?.map((d) => {
            const total = d.totalStudents || 1;
            return (
              <div key={d.department} className="space-y-1">
                <div className="flex justify-between text-sm text-gray-800">
                  <span>{d.department}</span>
                  <span>
                    {d.paid} paid / {d.unpaid} unpaid / {d.noChallan} none
                  </span>
                </div>
                <div className="flex h-5 w-full overflow-hidden rounded bg-gray-100">
                  <div className="bg-green-500" style={{ width: `${(d.paid / total) * 100}%` }} />
                  <div className="bg-red-500" style={{ width: `${(d.unpaid / total) * 100}%` }} />
                  <div className="bg-gray-300" style={{ width: `${(d.noChallan / total) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </section>

        <section className="bg-white rounded-xl shadow p-5 space-y-4">
          <h2 className="font-medium text-gray-900">Search student</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="Roll number or name"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              required
              minLength={2}
            />
            <button className="bg-blue-600 text-white rounded-md px-4 py-2 font-medium">
              Search
            </button>
          </form>

          {searchError && <p className="text-sm text-red-600">{searchError}</p>}
          {results && results.length === 0 && (
            <p className="text-sm text-gray-500">No students found.</p>
          )}

          {results && results.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-800">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="py-2 pr-3">Roll no</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Sem</th>
                    <th className="py-2 pr-3">Paid (Rs.)</th>
                    <th className="py-2">Clearance</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.rollNo} className="border-b border-gray-100">
                      <td className="py-2 pr-3">{r.rollNo}</td>
                      <td className="py-2 pr-3">{r.name}</td>
                      <td className="py-2 pr-3">{r.semester}</td>
                      <td className="py-2 pr-3">{r.paidTotal}</td>
                      <td className="py-2">
                        <span className={r.cleared ? "text-green-700" : "text-red-600"}>
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
    </main>
  );
}