import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

type RiskLevel = "low" | "medium" | "high";

interface RiskLevelCardProps {
  level: RiskLevel;
  factors: string[];
}

const RiskLevelCard = ({ level, factors }: RiskLevelCardProps) => {
  const config = {
    low: {
      icon: CheckCircle,
      title: "Låg Risk",
      color: "success",
      bgClass: "bg-success-light",
      textClass: "text-success",
      description: "Fastigheten uppvisar starka tekniska och ekonomiska värden",
    },
    medium: {
      icon: AlertCircle,
      title: "Medel Risk",
      color: "warning",
      bgClass: "bg-warning-light",
      textClass: "text-warning",
      description: "Vissa faktorer kräver uppmärksamhet eller planering",
    },
    high: {
      icon: AlertTriangle,
      title: "Hög Risk",
      color: "destructive",
      bgClass: "bg-destructive-light",
      textClass: "text-destructive",
      description: "Betydande riskfaktorer identifierade som kräver åtgärd",
    },
  };

  const { icon: Icon, title, bgClass, textClass, description } = config[level];

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${textClass}`} />
          Risknivå
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className={`${bgClass} rounded-lg p-4`}>
            <p className={`text-2xl font-bold ${textClass}`}>{title}</p>
            <p className="text-sm text-foreground/80 mt-1">{description}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">
              Identifierade faktorer:
            </p>
            <ul className="space-y-2">
              {factors.map((factor, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      textClass === "text-success"
                        ? "bg-success"
                        : textClass === "text-warning"
                        ? "bg-warning"
                        : "bg-destructive"
                    } mt-1.5 flex-shrink-0`}
                  />
                  <span className="text-sm text-foreground/90">{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskLevelCard;
