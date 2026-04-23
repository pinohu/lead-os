import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HelpTooltipProps {
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

export const HelpTooltip = ({ 
  content, 
  side = "top",
  className = "" 
}: HelpTooltipProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center rounded-full hover:bg-muted transition-colors ${className}`}
          aria-label="Help information"
        >
          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs">
        <p className="text-sm">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
};
