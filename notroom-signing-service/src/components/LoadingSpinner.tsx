import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

const LoadingSpinner = ({ size = "md", className, text }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)} role="status" aria-live="polite">
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} aria-hidden="true" />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;