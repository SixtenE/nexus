"use client";
import React, { useMemo, useState, useEffect } from "react";

// HusPulse — Dark-theme (Heimverdi tokens) • React + Tailwind only
// Uses: bg-background, text-foreground, bg-card, border-border, text-muted-foreground, bg-primary, etc.

// ---------------- i18n ----------------
const M = {
  sv: {
    appTitle: "HusPulse",
    appSubtitle:
      "En smart, tydlig och innovativ analys av värde, risk och energi för din bostad – orkestrerad med Temporal.",
    address: "Adress",
    area: "Boyta (m²)",
    fee: "Månadsavgift (SEK)",
    includes: "Innehåll",
    water: "Vatten ingår",
    heat: "Värme ingår",
    broadband: "Bredband ingår",
    parking: "Parkering finns",
    run: "Kör värdering",
    workflow: "Workflow (Temporal)",
    kpi_health: "AI Property Health Index",
    kpi_risk: "Risknivå",
    kpi_value: "Värdeintervall",
    kpi_conf: "Konfidens",
    gauges: {
      building: "Byggnadstekniskt (20%)",
      economy: "Ekonomi (30%)",
      location: "Läge & Bekvämlighet (15%)",
      maintenance: "Underhåll & Renovering (15%)",
      environment: "Miljö & Energi (10%)",
      market: "Marknadsindikatorer (10%)",
    },
    panels: {
      energy: "OVK & Energi",
      costs: "Kostnader & Innehåll",
      market: "Marknad & Läge",
      areaAvg: "Områdessnitt (värde)",
      trend: "Trend 3 år",
      transit: "Kollektivtrafik",
      noise: "Buller",
      center: "Avstånd till centrum",
    },
    summary: "AI-förklaring",
    copy: "Kopiera utlåtande",
    genPdf: "Generera rapport (PDF)",
    exportJson: "Exportera API-output (JSON)",
    share: "Dela med mäklare/bank",
    demo: {
      high: "Stockholm – Hög Poäng",
      med: "Göteborg – Medel Poäng",
    },
  },
  en: {
    appTitle: "HusPulse",
    appSubtitle:
      "A clear, innovative view of value, risk and energy for your home — reliably orchestrated with Temporal.",
    address: "Address",
    area: "Living area (m²)",
    fee: "Monthly fee (SEK)",
    includes: "Includes",
    water: "Water included",
    heat: "Heating included",
    broadband: "Broadband included",
    parking: "Parking available",
    run: "Run valuation",
    workflow: "Workflow (Temporal)",
    kpi_health: "AI Property Health Index",
    kpi_risk: "Risk level",
    kpi_value: "Value range",
    kpi_conf: "Confidence",
    gauges: {
      building: "Building (20%)",
      economy: "Economy (30%)",
      location: "Location & Convenience (15%)",
      maintenance: "Maintenance & Renovation (15%)",
      environment: "Environment & Energy (10%)",
      market: "Market indicators (10%)",
    },
    panels: {
      energy: "OVK & Energy",
      costs: "Costs & Inclusions",
      market: "Market & Location",
      areaAvg: "Area average (value)",
      trend: "3-year trend",
      transit: "Transit",
      noise: "Noise",
      center: "Distance to center",
    },
    summary: "AI explanation",
    copy: "Copy opinion",
    genPdf: "Generate report (PDF)",
    exportJson: "Export API output (JSON)",
    share: "Share with broker/bank",
    demo: {
      high: "Stockholm – High Score",
      med: "Gothenburg – Medium Score",
    },
  },
} as const;

type Lang = keyof typeof M;

// ---------------- Logo ----------------
const Logo = ({ className = "h-10 w-10" }: { className?: string }) => (
  <div className={className} aria-hidden={true}>
    <style>{`
      @keyframes dashMove { from { stroke-dashoffset: 140; } to { stroke-dashoffset: 0; } }
      @keyframes glowBeat { 0%, 100% { opacity: .5; } 50% { opacity: 1; } }
      @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
      .hp-glow { filter: drop-shadow(0 0 6px rgba(59,130,246,.5)); }
    `}</style>
    <svg
      viewBox="0 0 64 64"
      className="h-full w-full"
      style={{ animation: "breathe 3s ease-in-out infinite" }}
      role="img"
      aria-label="HusPulse logo"
    >
      <defs>
        <linearGradient id="pulseGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
      <path d="M8 28 L32 10 L56 28" fill="none" stroke="white" strokeWidth="4.5" strokeLinejoin="round" />
      <path d="M14 28 L14 50 H50 V28" fill="none" stroke="white" strokeWidth="4.5" />
      <path
        d="M10 44 H20 L26 30 L32 46 L38 36 L42 44 H54"
        fill="none"
        stroke="url(#pulseGrad)"
        strokeWidth="4"
        strokeLinecap="round"
        className="hp-glow"
        style={{ strokeDasharray: 140, strokeDashoffset: 140, animation: "dashMove 2.4s ease-in-out infinite, glowBeat 2.4s ease-in-out infinite" }}
      />
    </svg>
  </div>
);

// ---------------- Tiny UI atoms ----------------
const Tag = ({ label }: { label: string }) => (
  <span className="px-2 py-0.5 rounded-full text-xs border border-border bg-card/60 text-muted-foreground">
    {label}
  </span>
);

const StatCard = ({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) => (
  <div className="rounded-2xl p-4 bg-card shadow-sm border border-border">
    <div className="text-sm text-muted-foreground">{title}</div>
    <div className="text-2xl font-semibold mt-1 text-foreground">{value}</div>
    {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
  </div>
);

const Gauge = ({ label, value, color = "" }: { label: string; value: number; color?: string }) => (
  <div className="rounded-2xl p-4 bg-card shadow-sm border border-border">
    <div className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
      <span>{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
    <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
      <div className={`h-3 ${color || "bg-primary"}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  </div>
);

const InfoRow = ({ left, right }: { left: string; right: string | React.ReactNode }) => (
  <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
    <div className="text-sm text-muted-foreground">{left}</div>
    <div className="text-sm font-medium text-foreground">{right}</div>
  </div>
);

// -------- Visual helpers --------
const EnergyIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M13 2L3 14h6l-2 8 10-12h-6l2-8z" />
  </svg>
);
const CostIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M12 1v22M7 5h7a4 4 0 010 8H8a4 4 0 000 8h8" strokeLinecap="round" />
  </svg>
);
const MarketIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M3 19h18M5 15l3-4 3 3 5-7 3 4" strokeLinecap="round" />
  </svg>
);

const PanelHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div className="font-semibold text-foreground">{title}</div>
    </div>
    <div className="h-2 w-24 rounded-full bg-gradient-to-r from-primary/30 to-accent/30" />
  </div>
);

const Badge = ({ text, tone = "gray" }: { text: string; tone?: "gray" | "green" | "red" | "amber" | "blue" }) => {
  const tones: Record<string, string> = {
    gray: "bg-muted text-muted-foreground border-border",
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-600/40",
    red: "bg-red-500/15 text-red-300 border-red-600/40",
    amber: "bg-amber-500/15 text-amber-300 border-amber-600/40",
    blue: "bg-primary/15 text-primary border-primary/40",
  };
  return <span className={`px-2 py-0.5 text-xs rounded-full border ${tones[tone]}`}>{text}</span>;
};

const Sparkline = ({ a = [], b = [] as number[] }: { a?: number[]; b?: number[] }) => {
  const width = 160, height = 40, pad = 4;
  const all = [...a, ...b];
  const min = Math.min(...all, 0.99);
  const max = Math.max(...all, 1.01);
  const sx = (i: number, len: number) => pad + (i / (len - 1 || 1)) * (width - 2 * pad);
  const sy = (v: number) => pad + (1 - (v - min) / (max - min || 1)) * (height - 2 * pad);
  const path = (s: number[]) => s.map((v, i) => `${i ? "L" : "M"}${sx(i, s.length)},${sy(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" aria-hidden="true">
      <path d={`${path(a)}`} stroke="hsl(var(--primary))" strokeWidth="2" fill="none" />
      <path d={`${path(b)}`} stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" fill="none" />
    </svg>
  );
};

const energyColor = (cls?: string) => {
  switch ((cls || "").toUpperCase()) {
    case "A":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-600/40";
    case "B":
      return "bg-green-500/15 text-green-300 border-green-600/40";
    case "C":
      return "bg-lime-500/15 text-lime-300 border-lime-600/40";
    case "D":
      return "bg-amber-500/15 text-amber-300 border-amber-600/40";
    case "E":
      return "bg-orange-500/15 text-orange-300 border-orange-600/40";
    case "F":
      return "bg-rose-500/15 text-rose-300 border-rose-600/40";
    case "G":
      return "bg-red-500/15 text-red-300 border-red-600/40";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

// ---------------- Extra visualizations ----------------
function EnergyScale({ current }: { current?: string }) {
  const classes = ["A", "B", "C", "D", "E", "F", "G"] as const;
  const cur = (current || "").toUpperCase();
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
        <span>Högre effektivitet</span>
        <span>Lägre effektivitet</span>
      </div>
      <div className="flex gap-2">
        {classes.map((c) => (
          <span
            key={c}
            className={`px-2 py-1 rounded-md border ${energyColor(c)} ${cur === c ? "ring-2 ring-offset-2 ring-primary/80 ring-offset-background" : ""}`}
            title={`Energiklass ${c}`}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

type Segment = { key: string; label: string; amount: number };

function CostBreakdownBar({ segments }: { segments: Segment[] }) {
  const total = Math.max(1, segments.reduce((s, x) => s + x.amount, 0));
  const palette = [
    "bg-primary",
    "bg-accent",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-muted-foreground",
  ];
  const fmt = (n: number) => `${Math.round(n).toLocaleString("sv-SE")} kr`;
  return (
    <div>
      <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
        {segments.map((s, i) => (
          <div key={s.key} className={`${palette[i % palette.length]} h-3`} style={{ width: `${(s.amount / total) * 100}%` }} />
        ))}
      </div>
      <div className="mt-2 grid sm:grid-cols-3 gap-2">
        {segments.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`inline-block h-2.5 w-2.5 rounded ${palette[i % palette.length]}`} />
            <span className="font-medium text-foreground">{s.label}</span>
            <span className="text-muted-foreground">— {fmt(s.amount)}</span>
            <span className="text-muted-foreground/70">({Math.round((s.amount / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Creative visualization ----------------
const Dial = ({ label, value, suffix = "%" }: { label: string; value: number; suffix?: string }) => {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const r = 42;
  const c = 2 * Math.PI * r;
  const dash = (1 - pct / 100) * c;
  return (
    <div className="rounded-2xl p-4 bg-card shadow-sm border border-border flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="h-24 w-24" role="img" aria-label={`${label}: ${Math.round(pct)}${suffix}`}>
        <circle cx="50" cy="50" r={r} stroke="hsl(var(--muted-foreground))" strokeWidth="10" fill="none" />
        <circle
          cx="50"
          cy="50"
          r={r}
          stroke="hsl(var(--primary))"
          strokeWidth="10"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={dash}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="54" textAnchor="middle" fontSize="16" fontWeight="700" fill="hsl(var(--foreground))">
          {Math.round(pct)}
        </text>
      </svg>
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-xl font-semibold text-foreground">
          {Math.round(pct)}
          {suffix}
        </div>
      </div>
    </div>
  );
};

// Lightweight SVG line chart
function LineChart({ seriesA, seriesB, height = 140 }: { seriesA: number[]; seriesB: number[]; height?: number }) {
  const width = 520;
  const padding = 24;
  const all = [...seriesA, ...seriesB];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const scaleX = (i: number) => padding + (i / (seriesA.length - 1)) * (width - padding * 2);
  const scaleY = (v: number) => padding + (1 - (v - min) / (max - min || 1)) * (height - padding * 2);
  const path = (s: number[]) => s.map((v, i) => `${i ? "L" : "M"}${scaleX(i)},${scaleY(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[160px]" aria-label="Price trend">
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${path(seriesA)} L ${scaleX(seriesA.length - 1)},${height - padding} L ${scaleX(0)},${height - padding} Z`}
        fill="url(#grad)"
      />
      <path d={path(seriesA)} stroke="hsl(var(--primary))" strokeWidth={2.5} fill="none" />
      <path d={path(seriesB)} stroke="hsl(var(--muted-foreground))" strokeWidth={2} fill="none" />
    </svg>
  );
}

// ---------------- Dev Smoke Tests ----------------
function SmokeTests() {
  useEffect(() => {
    try {
      const el = <Tag label="test" />;
      if (!el) throw new Error("Tag component did not create an element");
      if (typeof M.sv.gauges.building !== "string" || typeof M.en.gauges.building !== "string") {
        throw new Error("i18n gauges keys missing");
      }
      if (typeof M.sv.panels.energy !== "string" || typeof M.en.panels.market !== "string") {
        throw new Error("i18n panels keys missing");
      }
      const logo = <Logo />;
      if (!logo) throw new Error("Logo did not create an element");
      const dial = <Dial label="t" value={50} />;
      const gauge = <Gauge label="t" value={75} />;
      const panel = <PanelHeader title="x" icon={<span />} />;
      const spark = <Sparkline a={[1, 1.1, 1.2]} b={[1, 1.05, 1.1]} />;
      if (!dial || !gauge || !panel || !spark) throw new Error("Core components failed to create elements");
      console.log("HusPulse smoke tests passed ✅");
    } catch (e) {
      console.error("HusPulse smoke tests failed ❌", e);
    }
  }, []);
  return null;
}

export default function App() {
  const [lang, setLang] = useState<Lang>("sv");
  const t = (k: any) => (M as any)[lang][k] ?? k;
  const T = M[lang];

  const [addr, setAddr] = useState("Strandvägen 45, Stockholm");
  const [area, setArea] = useState(64);
  const [fee, setFee] = useState(3950);
  const [includes, setIncludes] = useState({ water: true, heat: true, broadband: false, parking: false });
  const [start, setStart] = useState(false);

  const seriesA = useMemo(
    () => (start ? [1.0, 1.01, 1.015, 1.02, 1.03, 1.035, 1.04, 1.05, 1.06, 1.07, 1.08, 1.09] : new Array(12).fill(1)),
    [start]
  );
  const seriesB = useMemo(
    () => (start ? [1.0, 1.005, 1.01, 1.015, 1.02, 1.025, 1.03, 1.035, 1.04, 1.045, 1.055, 1.07] : new Array(12).fill(1)),
    [start]
  );

  const parseClampInt = (v: string, min: number, max: number, step = 1) => {
    const n = Math.round((parseInt(v || "0", 10) || 0) / step) * step;
    return Math.max(min, Math.min(max, n));
  };

  const mock = {
    healthIndex: 78,
    riskLevel: lang === "sv" ? "Låg" : "Low",
    valueRange: lang === "sv" ? "3,2 – 3,6 M SEK" : "SEK 3.2–3.6M",
    conf: lang === "sv" ? "87%" : "87%",
    ovk: { performed: "2023", approved: true },
    energy: { declared: "2022", cls: "C" },
    costs: { fee, ops: 850, parking: includes.parking ? (lang === "sv" ? "Ja" : "Yes") : lang === "sv" ? "Nej" : "No" },
    loc: { transit: "200 m", noise: lang === "sv" ? "Låg" : "Low", center: "1,2 km" },
    market: { areaAvg: lang === "sv" ? "3,0–3,4 M" : "SEK 3.0–3.4M", trend: "+2,1%/år" },
  };

  const breakdown: Segment[] = useMemo(() => {
    const base = fee;
    const shares = {
      water: includes.water ? 0.05 : 0,
      heat: includes.heat ? 0.12 : 0,
      broadband: includes.broadband ? 0.06 : 0,
      parking: includes.parking ? 0.1 : 0,
    };
    const water = base * shares.water;
    const heat = base * shares.heat;
    const broadband = base * shares.broadband;
    const parking = base * shares.parking;
    const other = Math.max(0, base - (water + heat + broadband + parking));
    const segs: Segment[] = [
      { key: "water", label: lang === "sv" ? "Vatten" : "Water", amount: water },
      { key: "heat", label: lang === "sv" ? "Värme" : "Heat", amount: heat },
      { key: "broadband", label: lang === "sv" ? "Bredband" : "Broadband", amount: broadband },
      { key: "parking", label: lang === "sv" ? "Parkering" : "Parking", amount: parking },
      { key: "ops", label: lang === "sv" ? "Drift" : "Ops", amount: mock.costs.ops },
      { key: "other", label: lang === "sv" ? "Övrigt" : "Other", amount: other },
    ].filter((s) => s.amount > 0.5);
    return segs;
  }, [fee, includes, lang, mock.costs.ops]);

  return (
    <div className="min-h-screen bg-gradient-radial from-primary/15 via-accent/10 to-background text-foreground">
      <SmokeTests />

      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo className="h-10 w-10" />
            <div>
              <h1 className="text-lg font-bold leading-5">{t("appTitle")}</h1>
              <p className="text-xs text-muted-foreground">{t("appSubtitle")}</p>
            </div>
            <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
              beta
            </span>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setLang("sv")}
              className={`px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                lang === "sv" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/80"
              }`}
              aria-pressed={lang === "sv"}
            >
              SV
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                lang === "en" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/80"
              }`}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Inputs */}
        <section className="rounded-2xl p-4 bg-card shadow-sm border border-border">
          <div className="grid md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm text-muted-foreground mb-1">
                {lang === "sv" ? "Adress (fritext – valfri giltig adress)" : "Address (free text – any valid address)"}
              </label>
              <input
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
                placeholder={t("address")}
                title={lang === "sv" ? "Skriv en giltig svensk adress" : "Enter a valid Swedish address"}
                className="w-full rounded-xl px-3 py-2 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                {lang === "sv" ? "Boyta (m²) – typiskt 10–400" : "Living area (m²) – typical 10–400"}
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={10}
                max={400}
                step={1}
                value={area}
                onChange={(e) => setArea(parseClampInt(e.target.value, 10, 400, 1))}
                placeholder={t("area")}
                title={lang === "sv" ? "Ange ett heltal mellan 10 och 400 m²" : "Enter an integer between 10 and 400 m²"}
                className="w-full rounded-xl px-3 py-2 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                {lang === "sv" ? "Månadsavgift (SEK) – 0–10 000" : "Monthly fee (SEK) – 0–10,000"}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={10000}
                  step={50}
                  value={fee}
                  onChange={(e) => setFee(parseClampInt(e.target.value, 0, 10000, 50))}
                  placeholder={t("fee")}
                  title={lang === "sv" ? "Ange belopp 0–10 000 SEK" : "Enter amount 0–10,000 SEK"}
                  className="flex-1 rounded-xl px-3 py-2 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button onClick={() => setStart(true)} className="rounded-xl bg-primary text-primary-foreground font-medium px-4 hover:opacity-90">
                  {t("run")}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Includes toggles */}
        <section className="rounded-2xl p-4 bg-card shadow-sm border border-border">
          <div className="text-sm text-muted-foreground mb-2">{t("includes")}</div>
          <div className="grid sm:grid-cols-4 gap-3">
            {[
              { k: "water", l: t("water") },
              { k: "heat", l: t("heat") },
              { k: "broadband", l: t("broadband") },
              { k: "parking", l: t("parking") },
            ].map((opt) => (
              <label key={opt.k} className="flex items-center gap-2 p-3 border border-border rounded-xl cursor-pointer bg-background">
                <input
                  type="checkbox"
                  checked={(includes as any)[opt.k as any]}
                  onChange={(e) => setIncludes((p) => ({ ...p, [opt.k]: e.target.checked }))}
                />
                <span className="text-sm text-foreground">{opt.l}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Visual highlights */}
        <section className="grid md:grid-cols-3 gap-4">
          {(() => {
            const conf = start ? parseInt((mock.conf || "0").toString()) : 0;
            return <Dial label={lang === "sv" ? "Modellkonfidens" : "Model confidence"} value={conf} />;
          })()}
          <Dial label={lang === "sv" ? "Hälsa (index)" : "Health (index)"} value={start ? mock.healthIndex : 0} />
          {(() => {
            const map: any = { Låg: 80, Low: 80, Medel: 50, Medium: 50, Hög: 20, High: 20 };
            const v = start ? map[mock.riskLevel] ?? 50 : 0;
            return <Dial label={lang === "sv" ? "Risk (omvänt)" : "Risk (inverse)"} value={v} />;
          })()}
        </section>

        {/* KPIs */}
        <section className="grid md:grid-cols-4 gap-4">
          <StatCard title={t("kpi_health")} value={start ? `${mock.healthIndex}/100` : "–"} subtitle={lang === "sv" ? "Samlad kvalitetsindikator" : "Composite quality indicator"} />
          <StatCard title={t("kpi_risk")} value={start ? mock.riskLevel : "–"} subtitle={lang === "sv" ? "Låg / Medel / Hög" : "Low / Medium / High"} />
          <StatCard title={t("kpi_value")} value={start ? mock.valueRange : "–"} subtitle={lang === "sv" ? "Marknadsjusterat" : "Market-adjusted"} />
          <StatCard title={t("kpi_conf")} value={start ? mock.conf : "–"} subtitle={lang === "sv" ? "Modellosäkerhet" : "Model uncertainty"} />
        </section>

        {/* Chart + Gauges */}
        <section className="grid xl:grid-cols-2 gap-4">
          <div className="rounded-2xl p-4 bg-card shadow-sm border border-border">
            <div className="font-semibold mb-1 text-foreground">{lang === "sv" ? "Prisutveckling" : "Price development"}</div>
            <LineChart seriesA={seriesA} seriesB={seriesB} />
            <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-primary inline-block" /> {lang === "sv" ? "Denna fastighet" : "This property"}
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground inline-block" /> {lang === "sv" ? "Områdessnitt" : "Area average"}
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Gauge label={T.gauges.building} value={start ? 85 : 0} />
            <Gauge label={T.gauges.economy} value={start ? 72 : 0} />
            <Gauge label={T.gauges.location} value={start ? 90 : 0} />
            <Gauge label={T.gauges.maintenance} value={start ? 80 : 0} />
            <Gauge label={T.gauges.environment} value={start ? 88 : 0} />
            <Gauge label={T.gauges.market} value={start ? 75 : 0} />
          </div>
        </section>

        {/* Detail panels */}
        <section className="grid xl:grid-cols-3 gap-4">
          {/* OVK & Energi */}
          <div className="rounded-2xl p-4 bg-card shadow-sm border border-border">
            <PanelHeader title={T.panels.energy} icon={<EnergyIcon />} />
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 text-xs rounded-full border ${energyColor(mock.energy.cls)}`}>
                {lang === "sv" ? "Energiklass" : "Energy class"} {start ? mock.energy.cls : "–"}
              </span>
              <Badge text={start ? (mock.ovk.approved ? (lang === "sv" ? "OVK godkänd" : "OVK approved") : lang === "sv" ? "OVK ej godkänd" : "OVK not approved") : "OVK –"} tone={start ? (mock.ovk.approved ? "green" : "red") : "gray"} />
              <Badge text={start ? `${lang === "sv" ? "Deklarerad" : "Declared"} ${mock.energy.declared}` : lang === "sv" ? "Deklaration –" : "Declaration –"} tone="blue" />
            </div>
            <InfoRow left={lang === "sv" ? "Energideklaration" : "Energy declaration"} right={start ? mock.energy.declared : "–"} />
            <InfoRow left={lang === "sv" ? "Energiklass" : "Energy class"} right={start ? mock.energy.cls : "–"} />
            <div className="mt-3">
              <EnergyScale current={start ? mock.energy.cls : undefined} />
            </div>
          </div>

          {/* Kostnader & Innehåll */}
          <div className="rounded-2xl p-4 bg-card shadow-sm border border-border">
            <PanelHeader title={T.panels.costs} icon={<CostIcon />} />
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="rounded-xl border border-border p-2 text-center bg-background">
                <div className="text-[10px] text-muted-foreground">{t("fee")}</div>
                <div className="text-sm font-semibold text-foreground">{start ? `${mock.costs.fee} kr` : "–"}</div>
              </div>
              <div className="rounded-xl border border-border p-2 text-center bg-background">
                <div className="text-[10px] text-muted-foreground">{lang === "sv" ? "Drift" : "Ops"}</div>
                <div className="text-sm font-semibold text-foreground">{start ? `${mock.costs.ops} kr` : "–"}</div>
              </div>
              <div className="rounded-xl border border-border p-2 text-center bg-background">
                <div className="text-[10px] text-muted-foreground">{t("parking")}</div>
                <div className="text-sm font-semibold text-foreground">{start ? mock.costs.parking : "–"}</div>
              </div>
            </div>
            <div className="mt-1 h-2 w-full bg-muted rounded-full overflow-hidden">
              {start && (
                <div className="h-2 flex">
                  <div className="bg-primary" style={{ width: `${(mock.costs.fee / (mock.costs.fee + mock.costs.ops)) * 100}%` }} />
                  <div className="bg-accent" style={{ width: `${(mock.costs.ops / (mock.costs.fee + mock.costs.ops)) * 100}%` }} />
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{lang === "sv" ? "Avgift vs drift (månad)" : "Fee vs ops (monthly)"}</div>

            {/* NEW: Detailed breakdown bar */}
            <div className="mt-4">
              <div className="text-xs text-muted-foreground mb-1">{lang === "sv" ? "Detaljerad kostnadsfördelning" : "Detailed cost breakdown"}</div>
              {start ? <CostBreakdownBar segments={breakdown} /> : <div className="text-xs text-muted-foreground/70">{lang === "sv" ? "Kör värdering för att se fördelningen." : "Run valuation to view the breakdown."}</div>}
            </div>

            <div className="mt-3 flex gap-2 flex-wrap">
              <Badge text={includes.water ? (lang === "sv" ? "Vatten" : "Water") : lang === "sv" ? "Vatten: nej" : "Water: no"} tone={includes.water ? "green" : "gray"} />
              <Badge text={includes.heat ? (lang === "sv" ? "Värme" : "Heat") : lang === "sv" ? "Värme: nej" : "Heat: no"} tone={includes.heat ? "green" : "gray"} />
              <Badge text={includes.broadband ? (lang === "sv" ? "Bredband" : "Broadband") : lang === "sv" ? "Bredband: nej" : "Broadband: no"} tone={includes.broadband ? "green" : "gray"} />
              <Badge text={includes.parking ? (lang === "sv" ? "Parkering" : "Parking") : lang === "sv" ? "Parkering: nej" : "Parking: no"} tone={includes.parking ? "green" : "gray"} />
            </div>
          </div>

          {/* Marknad & Läge */}
          <div className="rounded-2xl p-4 bg-card shadow-sm border border-border">
            <PanelHeader title={T.panels.market} icon={<MarketIcon />} />
            <InfoRow left={T.panels.areaAvg} right={start ? mock.market.areaAvg : "–"} />
            <InfoRow left={T.panels.trend} right={start ? mock.market.trend : "–"} />
            <div className="mt-2">
              <Sparkline a={seriesA as any} b={seriesB as any} />
            </div>
            <div className="my-2 border-t border-border" />
            <div className="flex gap-2 flex-wrap">
              <Badge text={`${T.panels.transit}: ${start ? mock.loc.transit : "–"}`} tone="blue" />
              <Badge text={`${T.panels.noise}: ${start ? mock.loc.noise : "–"}`} tone="amber" />
              <Badge text={`${T.panels.center}: ${start ? mock.loc.center : "–"}`} tone="gray" />
            </div>
          </div>
        </section>

        {/* AI summary */}
        <section className="rounded-2xl p-4 bg-card shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">{t("summary")}</h3>
            <button className="rounded-xl border border-border px-3 py-1.5 text-sm hover:bg-muted text-foreground">
              {t("copy")}
            </button>
          </div>
          <p className="text-sm text-foreground/90 mt-2">
            {start
              ? lang === "sv"
                ? "Avgiften per m² är ~25% högre än områdessnittet vilket sänker Ekonomi. Energiklass C och godkänd OVK höjer indexet. Marknadstrenden är svagt positiv (+2,1%/år)."
                : "Fee per sqm is ~25% above the area average which lowers Economy. Energy class C and approved OVK raise the index. Market trend is mildly positive (+2.1%/yr)."
              : lang === "sv"
              ? "Kör värdering för att generera ett AI-utlåtande."
              : "Run valuation to generate an AI explanation."}
          </p>
        </section>

        {/* Actions */}
        <section className="flex flex-wrap gap-3 pb-10">
          <button className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 hover:opacity-90">
            {t("genPdf")}
          </button>
          <button className="rounded-xl border border-border px-4 py-2.5 hover:bg-muted text-foreground">
            {t("exportJson")}
          </button>
          <button className="rounded-xl border border-border px-4 py-2.5 hover:bg-muted text-foreground">
            {t("share")}
          </button>
        </section>
      </main>
    </div>
  );
}