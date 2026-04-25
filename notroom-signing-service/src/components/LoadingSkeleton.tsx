import { memo } from "react";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "text" | "card" | "avatar" | "button";
  lines?: number;
}

const LoadingSkeleton = memo(({ className, variant = "text", lines = 1 }: LoadingSkeletonProps) => {
  const baseClasses = "animate-pulse bg-muted rounded";
  
  if (variant === "text") {
    return (
      <div className={cn("space-y-2", className)} role="status" aria-label="Loading content">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(baseClasses, "h-4 w-full", i === lines - 1 && lines > 1 && "w-3/4")}
            aria-hidden="true"
          />
        ))}
        <span className="sr-only">Loading content...</span>
      </div>
    );
  }
  
  if (variant === "card") {
    return (
      <div className={cn("p-6 space-y-4", baseClasses, className)} role="status" aria-label="Loading card">
        <div className="h-8 w-3/4 bg-muted-foreground/20 rounded" aria-hidden="true" />
        <div className="space-y-2">
          <div className="h-4 bg-muted-foreground/20 rounded" aria-hidden="true" />
          <div className="h-4 w-5/6 bg-muted-foreground/20 rounded" aria-hidden="true" />
        </div>
        <span className="sr-only">Loading card content...</span>
      </div>
    );
  }
  
  if (variant === "avatar") {
    return (
      <div 
        className={cn(baseClasses, "w-12 h-12 rounded-full", className)} 
        role="status" 
        aria-label="Loading avatar"
      >
        <span className="sr-only">Loading avatar...</span>
      </div>
    );
  }
  
  if (variant === "button") {
    return (
      <div 
        className={cn(baseClasses, "h-10 w-24", className)} 
        role="status" 
        aria-label="Loading button"
      >
        <span className="sr-only">Loading button...</span>
      </div>
    );
  }
  
  return null;
});

LoadingSkeleton.displayName = 'LoadingSkeleton';

export default LoadingSkeleton;
