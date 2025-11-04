"use client";
import React, { useEffect, useState } from "react";

type WorkflowItem = {
  workflow_id: string;
  run_id: string;
  start_time: string | null;
  status: string;
  type: string;
  task_queue: string;
  search_attributes: Record<string, any>;
};

export default function TemporalState() {
  const [items, setItems] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [riskLevel, setRiskLevel] = useState("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/temporal/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId || undefined,
          municipality: municipality || undefined,
          risk_level: riskLevel || undefined,
        }),
      });
      const data = await res.json();
      setItems(data.items || []);
    } catch (e: any) {
      setErr(e.message || "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function startDemo() {
    const res = await fetch("/api/temporal/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        property_id: `demo-${Date.now()}`,
        address: "Demo St 1",
        area_m2: 62,
        year_built: 1999,
        municipality: "Stockholm",
      }),
    });
    if (res.ok) await load();
  }

  async function revalueNow(id: string) {
    const res = await fetch("/api/temporal/revalue-now", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflow_id: id, overrides: { monthly_fee_sek: 4800 } }),
    });
    if (res.ok) alert("Revalued");
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-2">
        <input className="border px-2 py-1" placeholder="Property ID" value={propertyId} onChange={(e)=>setPropertyId(e.target.value)} />
        <input className="border px-2 py-1" placeholder="Municipality" value={municipality} onChange={(e)=>setMunicipality(e.target.value)} />
        <input className="border px-2 py-1" placeholder="Risk level" value={riskLevel} onChange={(e)=>setRiskLevel(e.target.value)} />
        <button className="border px-3 py-1" onClick={load}>Search</button>
        <button className="border px-3 py-1" onClick={startDemo}>Start Demo Workflow</button>
      </div>
      {loading && <div>Loading…</div>}
      {err && <div className="text-red-600">{err}</div>}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-2">Workflow ID</th>
            <th className="text-left p-2">Start</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Risk</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => {
            const sa = it.search_attributes || {};
            const risk = (sa["RiskLevel"] && sa["RiskLevel"][0]) || "";
            return (
              <tr key={it.workflow_id} className="border-t">
                <td className="p-2">{it.workflow_id}</td>
                <td className="p-2">{it.start_time}</td>
                <td className="p-2">{it.status}</td>
                <td className="p-2">{risk}</td>
                <td className="p-2">
                  <button className="border px-2 py-1 mr-2" onClick={()=>revalueNow(it.workflow_id)}>Revalue</button>
                  <a className="underline" href={`/api/temporal/last-result?workflow_id=${encodeURIComponent(it.workflow_id)}`} target="_blank" rel="noreferrer">Last result</a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
