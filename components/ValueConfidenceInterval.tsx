import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface ValueConfidenceIntervalProps {
  minValue: number;
  maxValue: number;
  confidence: number;
}

const ValueConfidenceInterval = ({
  minValue,
  maxValue,
  confidence,
}: ValueConfidenceIntervalProps) => {
  const formatPrice = (value: number) => {
    return `${(value / 1000000).toFixed(1)} M SEK`;
  };

  const midPoint = (minValue + maxValue) / 2;

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          Värdeintervall
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {formatPrice(midPoint)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Uppskattat värde
            </p>
          </div>

          <div className="relative pt-6 pb-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-primary rounded-full"></div>
            </div>
            <div className="flex justify-between mt-2">
              <div className="text-left">
                <p className="text-lg font-semibold text-foreground">
                  {formatPrice(minValue)}
                </p>
                <p className="text-xs text-muted-foreground">Lägsta</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-foreground">
                  {formatPrice(maxValue)}
                </p>
                <p className="text-xs text-muted-foreground">Högsta</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Tillförlitlighet
              </span>
              <span className="text-sm font-semibold text-success">
                {confidence}%
              </span>
            </div>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-success rounded-full transition-all duration-1000"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ValueConfidenceInterval;
