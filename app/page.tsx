import { Building2, Shield, Sparkles, TrendingUp } from "lucide-react";
import PropertySearch from "./components/PropertySearch";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function Page() {
  const features = [
    {
      icon: Building2,
      title: "Teknisk Analys",
      description: "Bedömning av energiklass, OVK, radon och renoveringsstatus",
    },
    {
      icon: TrendingUp,
      title: "Värdeanalys",
      description:
        "AI-driven värdering med konfidensintervall baserat på marknadsdata",
    },
    {
      icon: Shield,
      title: "Riskbedömning",
      description: "Identifiering av ekonomiska och tekniska riskfaktorer",
    },
    {
      icon: Sparkles,
      title: "AI-insikter",
      description:
        "Naturligt språk-förklaringar av värdering och rekommendationer",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-primary">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              AI-driven Fastighetsvärdering
            </h1>
            <p className="text-xl md:text-2xl mb-12 opacity-90">
              Få en komplett analys av din fastighet baserat på tekniska,
              ekonomiska och miljömässiga faktorer
            </p>
            <div className="flex justify-center">
              <PropertySearch />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Avancerad Fastighetsanalys
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Vårt AI-system analyserar över 50 datapunkter för att ge dig den
            mest kompletta bilden av din fastighet
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="shadow-md hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 " />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Demo Section */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Prova Demo-analyser
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Se exempel på hur vårt system analyserar olika fastigheter
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8">
                Stockholm - Hög Poäng
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Göteborg - Medel Poäng
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>AI-driven Fastighetsvärdering © 2024 - Demo Version</p>
        </div>
      </footer>
    </div>
  );
}
