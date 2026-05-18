import { Shield, Award, CheckCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

const TrustIndicators = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-4 text-center">
        <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
        <div className="text-sm font-bold text-primary">PA State</div>
        <div className="text-xs text-muted-foreground">Commissioned</div>
      </Card>
      <Card className="p-4 text-center">
        <Award className="w-8 h-8 text-primary mx-auto mb-2" />
        <div className="text-sm font-bold text-primary">Licensed</div>
        <div className="text-xs text-muted-foreground">& Bonded</div>
      </Card>
      <Card className="p-4 text-center">
        <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
        <div className="text-sm font-bold text-primary">RULONA</div>
        <div className="text-xs text-muted-foreground">Compliant</div>
      </Card>
      <Card className="p-4 text-center">
        <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
        <div className="text-sm font-bold text-primary">Same-Day</div>
        <div className="text-xs text-muted-foreground">Available</div>
      </Card>
    </div>
  );
};

export default TrustIndicators;
