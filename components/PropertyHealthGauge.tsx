import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PropertyHealthGaugeProps {
  score: number;
  title?: string;
}

const PropertyHealthGauge = ({
  score,
  title = "AI Property Health Index",
}: PropertyHealthGaugeProps) => {
  const getColor = (value: number) => {
    if (value >= 75) return "hsl(var(--success))";
    if (value >= 50) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  const getLabel = (value: number) => {
    if (value >= 75) return "Utmärkt";
    if (value >= 50) return "Bra";
    if (value >= 30) return "Godkänd";
    return "Risk";
  };

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="relative w-48 h-48">
          <svg className="transform -rotate-90" width="192" height="192">
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke="hsl(var(--muted))"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke={getColor(score)}
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-5xl font-bold"
              style={{ color: getColor(score) }}
            >
              {score}
            </span>
            <span className="text-sm text-muted-foreground">av 100</span>
          </div>
        </div>
        <div className="text-center">
          <p
            className="text-lg font-semibold"
            style={{ color: getColor(score) }}
          >
            {getLabel(score)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Baserat på{" "}
            {score >= 75 ? "stark" : score >= 50 ? "god" : "begränsad"} teknisk
            och ekonomisk analys
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyHealthGauge;
