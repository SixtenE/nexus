"use client";

import { useState, createContext, useContext, useEffect } from "react";
import Link from "next/link";
import { Building2, Shield, Sparkles, TrendingUp, Sun, Moon } from "lucide-react";
import PropertySearch from "@/components/PropertySearch";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
} | undefined>(undefined);

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const getInitialTheme = (): Theme => {
    if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
      return localStorage.getItem('theme') as Theme;
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };

  const [theme, setThemeState] = useState<Theme>('light');

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
  }, []);

  return (
      <ThemeContext.Provider value={{ theme, setTheme }}>
        {children}
      </ThemeContext.Provider>
  );
};

const features = [
  {
    icon: Building2,
    title: "Teknisk Analys",
    description: "Bedömning av energiklass, OVK, radon och renoveringsstatus",
  },
  {
    icon: TrendingUp,
    title: "Värdeanalys",
    description: "AI-driven värdering med konfidensintervall baserat på marknadsdata",
  },
  {
    icon: Shield,
    title: "Riskbedömning",
    description: "Identifiering av ekonomiska och tekniska riskfaktorer",
  },
  {
    icon: Sparkles,
    title: "AI-insikter",
    description: "Naturligt språk-förklaringar av värdering och rekommendationer",
  },
];


const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
      <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-foreground hover:bg-muted/50 transition-colors"
      >
        {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
        ) : (
            <Moon className="w-5 h-5" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>
  );
};


const HomePageContent = () => {
  const analyzeText = "Analysera";
  const searchPlaceholder = "Ange adress (t.ex. Storgatan 1, Stockholm)";

  // @ts-ignore
  // @ts-ignore
  return (
      <div className="min-h-screen bg-background">
        <header className="absolute top-0 right-0 p-4 z-20 flex gap-2">
          <ThemeSwitcher />
        </header>

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
                <PropertySearch analyzeText={analyzeText} searchPlaceholder={searchPlaceholder} />
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

        <footer className="border-t border-border bg-card py-8">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            <p>AI-driven Fastighetsvärdering © 2024 – Demo</p>
          </div>
        </footer>
      </div>
  );
}

export default function Page() {
  return (
      <ThemeProvider>
        <HomePageContent />
      </ThemeProvider>
  );
}
