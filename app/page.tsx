import Link from "next/link";
import { Building2, Shield, Sparkles, TrendingUp } from "lucide-react";
import PropertySearch from "@/components/PropertySearch";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Page() {
  const features = [
    {
      icon: Building2,
      title: "Teknisk Analys",
      description: "Bedömning av energiklass, OVK, radon och renoveringsstatus",
    },
    {
      icon: TrendingUp,
      title: "Värdeanalys",
      description: "AI-baserat intervall för marknadsvärde och konfidens",
    },
    {
      icon: Shield,
      title: "Risk & Hälsa",
      description: "Samlad risknivå baserat på byggnad, ekonomi och miljö",
    },
    {
      icon: Sparkles,
      title: "Faktordrivare",
      description: "Visualisering av vilka faktorer som påverkar värdet mest",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-radial from-primary/15 via-accent/10 to-background">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              AI-driven Fastighetsvärdering & Riskindex
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Sök adress, få värdeintervall, risknivå och viktigaste faktordrivare – uppdaterat på begäran.
            </p>

            <div className="mt-8">
              <PropertySearch />
            </div>

            <div className="mt-6 flex gap-3">
              <Button size="lg" className="bg-primary text-primary-foreground">
                Börja analysera
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border text-foreground"
              >
                Lär dig mer
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-primary/15 p-3">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {f.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {f.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Strip */}
      <section className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Vill du se ett exempel?
            </h2>
            <p className="text-sm text-muted-foreground">
              Öppna dashboarden för en demo av visualiseringar och risknivåer.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard">
              <Button className="bg-primary text-primary-foreground">
                Visa dashboard
              </Button>
            </Link>
            <Link href="/realform">
              <Button
                variant="outline"
                className="border-border text-foreground"
              >
                Manuell värdering
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>AI-driven Fastighetsvärdering © 2024 – Demo</p>
        </div>
      </footer>
    </div>
  );
}