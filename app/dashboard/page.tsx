"use client";

import { useRouter } from "next/navigation";
import PropertyHealthGauge from "@/components/PropertyHealthGauge";
import ValueConfidenceInterval from "@/components/ValueConfidenceInterval";
import RiskLevelCard from "@/components/RiskLevelCard";
import PriceChart from "@/components/PriceChart";
import FactorAnalysis from "@/components/FactorAnalysis";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Home } from "lucide-react";

const propertyData = {
  address: "Storgatan 1, Stockholm",
  healthScore: 78,
  valueInterval: {
    min: 4500000,
    max: 5500000,
    confidence: 85,
  },
  riskLevel: "medium" as "low" | "medium" | "high",
  riskFactors: [
    "Behöver uppgradering av elinstallationer",
    "Närhet till planerad byggarbetsplats",
    "Hög energiförbrukning jämfört med liknande fastigheter",
  ],
  priceHistory: [
    { date: "2021-01", price: 4000000 },
    { date: "2021-06", price: 4200000 },
    { date: "2022-01", price: 4300000 },
    { date: "2022-06", price: 4400000 },
    { date: "2023-01", price: 4600000 },
    { date: "2023-06", price: 4800000 },
    { date: "2024-01", price: 5000000 },
  ],
  factors: [
    {
      name: "Läge",
      score: 85,
      weight: 20,
      description:
          "Fastigheten har ett utmärkt läge med närhet till kollektivtrafik och service.",
      details:
          "Läget påverkar fastighetsvärdet positivt med god tillgänglighet till stadskärnan.",
    },
    {
      name: "Byggnadens skick",
      score: 70,
      weight: 15,
      description: "Byggnaden är i gott skick men har vissa renoveringsbehov.",
      details:
          "Vissa delar av fastigheten behöver uppgraderas, särskilt elinstallationer.",
    },
    {
      name: "Marknadsförhållanden",
      score: 65,
      weight: 10,
      description: "Marknaden är stabil med måttlig efterfrågan i området.",
      details:
          "Priserna i området har ökat stadigt men i långsammare takt än i centrala Stockholm.",
    },
    {
      name: "Ekonomiska faktorer",
      score: 60,
      weight: 8,
      description: "Ekonomiska indikatorer visar på stabil utveckling.",
      details:
          "Ränteutveckling och inflation har måttlig påverkan på fastighetens värde.",
    },
  ],
};

const Dashboard = () => {
  const router = useRouter();

  const handleGoBack = () => {
    router.push("/");
  };

  return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleGoBack}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Fastighetsanalys
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {propertyData.address}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportera PDF
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <PropertyHealthGauge score={propertyData.healthScore} />
            <ValueConfidenceInterval
                minValue={propertyData.valueInterval.min}
                maxValue={propertyData.valueInterval.max}
                confidence={propertyData.valueInterval.confidence}
            />
            <RiskLevelCard
                level={propertyData.riskLevel}
                factors={propertyData.riskFactors}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <PriceChart
                data={propertyData.priceHistory.map(({ date, price }) => ({
                  month: date,
                  price,
                  avgPrice: price,
                }))}
            />
            <FactorAnalysis factors={propertyData.factors} />
          </div>

          <div className="bg-gradient-primary rounded-xl p-8 text-primary-foreground shadow-lg">
            <h2 className="text-2xl font-bold mb-4">
              AI-genererad Sammanfattning
            </h2>
            <p className="text-lg leading-relaxed opacity-95">
              Denna fastighet visar <strong>goda värden</strong> med ett
              hälsoindex på {propertyData.healthScore}/100. Det uppskattade värdet
              ligger mellan{" "}
              {(propertyData.valueInterval.min / 1000000).toFixed(1)}-
              {(propertyData.valueInterval.max / 1000000).toFixed(1)} M SEK med{" "}
              {propertyData.valueInterval.confidence}% tillförlitlighet.
              {propertyData.riskLevel === "low" &&
                  " Risknivån bedöms som låg tack vare starka tekniska och ekonomiska faktorer."}
              {propertyData.riskLevel === "medium" &&
                  " Risknivån är måttlig med vissa faktorer som bör beaktas."}
              {propertyData.riskLevel === "high" &&
                  " Observera att risknivån är hög och flera faktorer kräver uppmärksamhet."}
            </p>
          </div>
        </main>
      </div>
  );
};

export default Dashboard;