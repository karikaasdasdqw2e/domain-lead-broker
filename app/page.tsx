"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Lead, ResearchResponse } from "../lib/types";

type Status = "idle" | "loading" | "drafting" | "done" | "error";

const defaultCategories = [
  "HVAC contractor software",
  "HVAC lead generation",
  "HVAC marketplace",
  "home service CRM",
  "contractor quote platform",
  "local HVAC companies",
].join("\n");

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function exportCsv(leads: Lead[], domain: string) {
  const headers = [
    "Company",
    "Website",
    "Country",
    "Industry",
    "Why fit",
    "Upgrade reason",
    "Email",
    "Phone",
    "WhatsApp",
    "Contact page",
    "LinkedIn",
    "Decision maker",
    "Role",
    "Score",
    "Outreach angle",
  ];
  const rows = leads.map((lead) => [
    lead.companyName,
    lead.website,
    lead.country,
    lead.industry,
    lead.fitReason,
    lead.upgradeReason,
    lead.publicEmail,
    lead.publicPhone,
    lead.whatsapp,
    lead.contactPage,
    lead.linkedin,
    lead.decisionMakerName,
    lead.decisionMakerRole,
    lead.score,
    lead.outreachAngle,
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${domain.replace(/[^a-z0-9.-]/gi, "-")}-leads.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [domain, setDomain] = useState("BaseHvac.com");
  const [categories, setCategories] = useState(defaultCategories);
  const [maxResults, setMaxResults] = useState(20);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [data, setData] = useState<ResearchResponse | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const selectedLeads = useMemo(() => {
    return (data?.leads ?? []).filter((lead) => selected[lead.id]);
  }, [data, selected]);

  async function research(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    setData(null);
    setSelected({});
    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          categories: categories.split("\n").map((c) => c.trim()).filter(Boolean),
          maxResults,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Research failed");
      setData(json);
      setSelected(Object.fromEntries(json.leads.map((lead: Lead) => [lead.id, Boolean(lead.publicEmail)])));
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }

  async function createDrafts() {
    if (!selectedLeads.length) return;
    setStatus("drafting");
    setError("");
    try {
      const response = await fetch("/api/gmail/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, leads: selectedLeads }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Draft creation failed");
      alert(`Created ${json.created} Gmail drafts.`);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Domain Lead Broker</p>
          <h1 className="text-4xl font-black md:text-6xl">Find end-user buyers and create Gmail drafts.</h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            Research public B2B leads for any domain, score buyer likelihood, extract public contact details,
            export CSV, and create reviewable Gmail drafts without sending automatically.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950" href="/api/gmail/auth">Connect Gmail</a>
            {data?.leads?.length ? (
              <button className="rounded-xl border border-white/15 px-5 py-3 font-bold" onClick={() => exportCsv(data.leads, domain)}>Export CSV</button>
            ) : null}
          </div>
        </div>

        <form onSubmit={research} className="grid gap-4 rounded-3xl border border-white/10 bg-slate-900 p-6 md:grid-cols-3">
          <label className="md:col-span-1">
            <span className="mb-2 block text-sm text-slate-300">Domain</span>
            <input className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="BaseHvac.com" />
          </label>
          <label className="md:col-span-1">
            <span className="mb-2 block text-sm text-slate-300">Max leads</span>
            <input className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" type="number" min={5} max={50} value={maxResults} onChange={(e) => setMaxResults(Number(e.target.value))} />
          </label>
          <div className="flex items-end">
            <button disabled={status === "loading"} className="w-full rounded-xl bg-white px-5 py-3 font-black text-slate-950 disabled:opacity-50">
              {status === "loading" ? "Researching..." : "Find leads"}
            </button>
          </div>
          <label className="md:col-span-3">
            <span className="mb-2 block text-sm text-slate-300">Target categories, one per line</span>
            <textarea className="h-36 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" value={categories} onChange={(e) => setCategories(e.target.value)} />
          </label>
        </form>

        {error ? <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">{error}</div> : null}

        {data ? (
          <section className="mt-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">Leads for {domain}</h2>
                <p className="text-slate-400">{data.leads.length} leads found. {selectedLeads.length} selected for Gmail drafts.</p>
              </div>
              <button disabled={!selectedLeads.length || status === "drafting"} onClick={createDrafts} className="rounded-xl bg-emerald-400 px-5 py-3 font-black text-slate-950 disabled:opacity-50">
                {status === "drafting" ? "Creating drafts..." : "Create Gmail drafts"}
              </button>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10">
              <div className="overflow-x-auto">
                <table className="min-w-[1400px] w-full border-collapse text-sm">
                  <thead className="bg-slate-900 text-left text-slate-300">
                    <tr>
                      <th className="p-3">Draft</th><th className="p-3">Score</th><th className="p-3">Company</th><th className="p-3">Website</th><th className="p-3">Industry</th><th className="p-3">Fit</th><th className="p-3">Email</th><th className="p-3">Phone</th><th className="p-3">WhatsApp</th><th className="p-3">Angle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.leads.map((lead) => (
                      <tr key={lead.id} className="border-t border-white/10 align-top hover:bg-white/5">
                        <td className="p-3"><input type="checkbox" checked={Boolean(selected[lead.id])} disabled={!lead.publicEmail} onChange={(e) => setSelected((s) => ({ ...s, [lead.id]: e.target.checked }))} /></td>
                        <td className="p-3 font-black text-cyan-300">{lead.score}/10</td>
                        <td className="p-3 font-bold">{lead.companyName}</td>
                        <td className="p-3"><a className="text-cyan-300" href={lead.website} target="_blank">Open</a></td>
                        <td className="p-3 text-slate-300">{lead.industry}</td>
                        <td className="p-3 text-slate-300">{lead.fitReason}</td>
                        <td className="p-3 text-emerald-300">{lead.publicEmail || "Not found"}</td>
                        <td className="p-3 text-slate-300">{lead.publicPhone || "Not found"}</td>
                        <td className="p-3 text-slate-300">{lead.whatsapp || "Not found"}</td>
                        <td className="p-3 text-slate-300">{lead.outreachAngle}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
