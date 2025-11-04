"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Home } from "lucide-react";
// Dark-theme friendly React mockup using Tailwind tokens that match your Heimverdi theme.
// No external libs. Swedish labels.

const Tag = ({ label }: { label: string }) => (
  <span className="px-2 py-0.5 rounded-full text-xs border border-border bg-card/60 text-muted-foreground">
    {label}
  </span>
);

const StatCard = ({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) => (
  <div className="rounded-2xl p-4 bg-card shadow-sm border border-border">
    <div className="text-sm text-muted-foreground">{title}</div>
    <div className="text-2xl font-semibold mt-1 text-foreground">{value}</div>
    {subtitle && (
      <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
    )}
  </div>
);

const Step = ({
  index,
  title,
  status,
  desc,
}: {
  index: number;
  title: string;
  status: "klar" | "pågår" | "väntar" | "fel";
  desc?: string;
}) => {
  const chipMap: Record<string, string> = {
    klar: "bg-green-500/15 text-green-300 border-green-600/40",
    pågår: "bg-primary/15 text-primary border-primary/40",
    väntar: "bg-muted text-muted-foreground border-border",
    fel: "bg-red-500/15 text-red-300 border-red-600/40",
  };
  const dotMap: Record<string, string> = {
    klar: "bg-green-600 text-white border-green-700",
    pågår: "bg-primary text-primary-foreground border-primary/70",
    fel: "bg-red-600 text-white border-red-700",
    väntar: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="flex gap-3 items-start">
      <div
        className={`h-8 w-8 min-w-8 flex items-center justify-center rounded-xl border ${dotMap[status]}`}
      >
        {index}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="font-medium text-foreground">{title}</div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full border ${chipMap[status]}`}
          >
            {status.toUpperCase()}
          </span>
        </div>
        {desc && <div className="text-sm text-muted-foreground mt-1">{desc}</div>}
      </div>
    </div>
  );
};

const Gauge = ({
  label,
  value,
  color = "",
}: {
  label: string;
  value: number;
  color?: string;
}) => (
  <div className="rounded-2xl p-4 bg-card shadow-sm border border-border">
    <div className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
      <span>{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
    <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
      <div
        className={`h-3 ${color || "bg-primary"}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  </div>
);

const InfoRow = ({
  left,
  right,
}: {
  left: string;
  right: string | React.ReactNode;
}) => (
  <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
    <div className="text-sm text-muted-foreground">{left}</div>
    <div className="text-sm font-medium text-foreground">{right}</div>
  </div>
);

export default function App() {
  const [addr, setAddr] = useState("Storgatan 12, 3 tr");
  const [area, setArea] = useState(64);
  const [fee, setFee] = useState(3950);
  const [includes, setIncludes] = useState({
    vatten: true,
    värme: true,
    bredband: false,
    parkering: false,
  });
  const [startValuation, setStartValuation] = useState(false);

  const workflow = [
    {
      title: "Hämta basdata (lägenhet/fastighet)",
      status: startValuation ? "klar" : "väntar",
      desc: "Adress, m², upplåtelseform",
    },
    {
      title: "Hämta marknadsdata (Booli/Hemnet, SCB)",
      status: startValuation ? "pågår" : "väntar",
      desc: "Senaste försäljningar, prisnivåer",
    },
    {
      title: "Hämta kostnadsdata",
      status: startValuation ? "väntar" : "väntar",
      desc: "Månadsavgift, drift, parkering",
    },
    {
      title: "OVK & Energideklaration",
      status: startValuation ? "väntar" : "väntar",
      desc: "OVK-status, energiklass, radon",
    },
    {
      title: "AI Värdering (XGBoost/Reg.)",
      status: startValuation ? "väntar" : "väntar",
      desc: "Värdeintervall",
    },
    {
      title: "AI Riskmodell",
      status: startValuation ? "väntar" : "väntar",
      desc: "Hälsa & riskindex",
    },
    {
      title: "Sammanfattning + Rapport",
      status: startValuation ? "väntar" : "väntar",
      desc: "PDF & API-utdata",
    },
  ];

  // Mock results after "Kör värdering"
  const mock = {
    healthIndex: 78,
    riskLevel: "Medel",
    valueRange: "3,2 – 3,6 M SEK",
    ovk: { utförd: "Ja (2023)", godkänd: "Ja" },
    energi: { deklaration: "Ja (2022)", klass: "C" },
    kostnader: { avgift: fee, drift: 850, parkering: includes.parkering ? "Ja" : "Nej" },
    läge: { kollektivtrafik: "200 m", buller: "Låg", centrum: "1,2 km" },
    marknad: { områdeSnitt: "3,0–3,4 M", trend: "+2,1%/år" },
  };

  const router = useRouter();
  const handleGoBack = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-radial from-primary/15 via-accent/10 to-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-primary text-primary-foreground grid place-items-center font-bold">
              AI
            </div>
            <Button
                variant="ghost"
                size="icon"
                onClick={handleGoBack}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="text-xs text-muted-foreground">Temporal • Serverless</div>
              <div className="font-semibold text-foreground">Fastighetsvärdering & Risk</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tag label="Open Data" />
            <Tag label="AI Model" />
            <Tag label="Workflow" />
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar: Temporal Steps */}
        <aside className="col-span-12 lg:col-span-4 xl:col-span-3">
          <div className="rounded-2xl p-4 bg-card shadow-sm border border-border">
            <div className="font-semibold mb-3 text-foreground">Workflow (Temporal)</div>
            <div className="space-y-4">
              {workflow.map((s, i) => (
                <Step
                  key={i}
                  index={i + 1}
                  title={s.title}
                  status={s.status as any}
                  desc={s.desc}
                />
              ))}
            </div>
            <button
              onClick={() => setStartValuation(true)}
              className="mt-4 w-full rounded-xl bg-primary text-primary-foreground py-2.5 hover:opacity-90 transition"
            >
              Kör värdering
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-6">
          {/* Search & Inputs */}
          <section className="rounded-2xl p-4 bg-card shadow-sm border border-border">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Sök & Grunddata</h2>
              <div className="text-xs text-muted-foreground">
                Fyll i eller auto-fyll via API
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-3">
              <div>
                <label className="text-sm text-muted-foreground">Adress</label>
                <input
                  value={addr}
                  onChange={(e) => setAddr(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Boyta (m²)</label>
                <input
                  type="number"
                  value={area}
                  onChange={(e) => setArea(parseInt(e.target.value || "0"))}
                  className="mt-1 w-full rounded-xl border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Månadsavgift (SEK)</label>
                <input
                  type="number"
                  value={fee}
                  onChange={(e) => setFee(parseInt(e.target.value || "0"))}
                  className="mt-1 w-full rounded-xl border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-4 gap-4 mt-3">
              {[
                { key: "vatten", label: "Vatten ingår" },
                { key: "värme", label: "Värme ingår" },
                { key: "bredband", label: "Bredband ingår" },
                { key: "parkering", label: "Parkering finns" },
              ].map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-center gap-2 p-3 border border-border rounded-xl cursor-pointer bg-background"
                >
                  <input
                    type="checkbox"
                    checked={(includes as any)[opt.key]}
                    onChange={(e) =>
                      setIncludes((prev) => ({ ...prev, [opt.key]: e.target.checked }))
                    }
                  />
                  <span className="text-sm text-foreground">{opt.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Result overview */}
          <section className="grid md:grid-cols-4 gap-4">
            <StatCard
              title="AI Property Health Index"
              value={startValuation ? `${mock.healthIndex}/100` : "–"}
              subtitle="Samlad kvalitetsindikator"
            />
            <StatCard
              title="Risknivå"
              value={startValuation ? mock.riskLevel : "–"}
              subtitle="Låg / Medel / Hög"
            />
            <StatCard
              title="Värdeintervall"
              value={startValuation ? mock.valueRange : "–"}
              subtitle="Marknadsjusterat"
            />
            <StatCard
              title="Konfidens"
              value={startValuation ? "±6%" : "–"}
              subtitle="Modellosäkerhet"
            />
          </section>

          {/* Gauges */}
          <section className="grid md:grid-cols-3 gap-4">
            <Gauge label="Byggnadstekniskt (20%)" value={startValuation ? 72 : 0} />
            <Gauge label="Ekonomi (30%)" value={startValuation ? 65 : 0} />
            <Gauge label="Läge & Bekvämlighet (15%)" value={startValuation ? 84 : 0} />
            <Gauge label="Underhåll & Renovering (15%)" value={startValuation ? 70 : 0} />
            <Gauge label="Miljö & Energi (10%)" value={startValuation ? 76 : 0} />
            <Gauge label="Marknadsindikatorer (10%)" value={startValuation ? 80 : 0} />
          </section>

          {/* Detail panels */}
          <section className="grid xl:grid-cols-3 gap-4">
            <div className="rounded-2xl p-4 bg-card shadow-sm border border-border">
              <div className="font-semibold mb-2 text-foreground">OVK & Energi</div>
              <InfoRow left="OVK utförd" right={startValuation ? mock.ovk.utförd : "–"} />
              <InfoRow left="OVK godkänd" right={startValuation ? mock.ovk.godkänd : "–"} />
              <div className="my-2 border-t border-border" />
              <InfoRow
                left="Energideklaration"
                right={startValuation ? mock.energi.deklaration : "–"}
              />
              <InfoRow left="Energiklass" right={startValuation ? mock.energi.klass : "–"} />
              <p className="text-xs text-muted-foreground mt-2">
                Källa: Boverket • OVK-register • Energideklaration.
              </p>
            </div>

            <div className="rounded-2xl p-4 bg-card shadow-sm border border-border">
              <div className="font-semibold mb-2 text-foreground">Kostnader & Innehåll</div>
              <InfoRow
                left="Avgift"
                right={startValuation ? `${mock.kostnader.avgift} kr/mån` : "–"}
              />
              <InfoRow
                left="Driftskostnad"
                right={startValuation ? `${mock.kostnader.drift} kr/mån` : "–"}
              />
              <InfoRow left="Vatten" right={includes.vatten ? "Ingår" : "Ingår ej"} />
              <InfoRow left="Värme" right={includes.värme ? "Ingår" : "Ingår ej"} />
              <InfoRow left="Bredband" right={includes.bredband ? "Ingår" : "Ingår ej"} />
              <InfoRow
                left="Parkering"
                right={startValuation ? mock.kostnader.parkering : "–"}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Jämförs mot områdessnitt per m².
              </p>
            </div>

            <div className="rounded-2xl p-4 bg-card shadow-sm border border-border">
              <div className="font-semibold mb-2 text-foreground">Marknad & Läge</div>
              <InfoRow
                left="Områdessnitt (värde)"
                right={startValuation ? mock.marknad.områdeSnitt : "–"}
              />
              <InfoRow left="Trend 3 år" right={startValuation ? mock.marknad.trend : "–"} />
              <div className="my-2 border-t border-border" />
              <InfoRow
                left="Kollektivtrafik"
                right={startValuation ? mock.läge.kollektivtrafik : "–"}
              />
              <InfoRow left="Buller" right={startValuation ? mock.läge.buller : "–"} />
              <InfoRow
                left="Avstånd till centrum"
                right={startValuation ? mock.läge.centrum : "–"}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Källa: SCB • Trafikverket • kommunal GIS-data.
              </p>
            </div>
          </section>

          {/* AI Explanation */}
          <section className="rounded-2xl p-4 bg-card shadow-sm border border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">AI-förklaring</h3>
              <button className="rounded-xl border border-border px-3 py-1.5 text-sm hover:bg-muted">
                Kopiera utlåtande
              </button>
            </div>
            <p className="text-sm text-foreground mt-2">
              {startValuation
                ? "Avgiften per m² är ~25% högre än områdessnittet vilket sänker betyget inom Ekonomi. Energiklass C och godkänd OVK höjer Hälsa-index. Marknadstrenden är svagt positiv (+2,1%/år)."
                : "Kör värdering för att generera ett AI-utlåtande."}
            </p>
          </section>

          {/* Actions */}
          <section className="flex flex-wrap gap-3">
            <button className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 hover:opacity-90">
              Generera rapport (PDF)
            </button>
            <button className="rounded-xl border border-border px-4 py-2.5 hover:bg-muted">
              Exportera API-output (JSON)
            </button>
            <button className="rounded-xl border border-border px-4 py-2.5 hover:bg-muted">
              Dela med mäklare/bank
            </button>
          </section>

          {/* Footnotes / API integration hints */}
          <section className="rounded-2xl p-4 bg-card/70 border border-dashed border-border">
            <div className="text-xs text-muted-foreground">
              <div className="font-semibold mb-1 text-foreground">API & Datakällor (exempel)</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Hemnet/Booli jämförbara försäljningar (projekt/sales endpoint)</li>
                <li>Boverket OVK & energideklaration</li>
                <li>SCB områdesstatistik (prisnivåer, demografi)</li>
                <li>Kommunala GIS: buller, kollektivtrafik, centrumavstånd</li>
              </ul>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}