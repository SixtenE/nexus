// app/temporal/page.tsx
// Route: /temporal → renders the Temporal workflow dashboard

import TemporalState from "./TemporalState";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-radial from-primary/15 via-accent/10 to-background text-foreground">
      <div className="container mx-auto px-4 py-6">
        <TemporalState />
      </div>
    </div>
  );
}