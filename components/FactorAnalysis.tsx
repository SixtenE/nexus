import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface Factor {
  name: string;
  score: number;
  weight: number;
  description: string;
  details: string;
}

interface FactorAnalysisProps {
  factors: Factor[];
}

const FactorAnalysis = ({ factors }: FactorAnalysisProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 75) return "bg-success";
    if (score >= 50) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>Detaljerad Faktoranalys</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {factors.map((factor, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {factor.name}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">{factor.details}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Vikt: {factor.weight}%
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {factor.score}
                  </span>
                </div>
              </div>
              <Progress value={factor.score} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {factor.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FactorAnalysis;
