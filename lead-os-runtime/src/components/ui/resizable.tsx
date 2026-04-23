"use client"

import { cn } from "@/lib/cn"

const ResizablePanelGroup = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex h-full w-full", className)} {...props} />
)

const ResizablePanel = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex-1", className)} {...props} />
)

const ResizableHandle = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("w-px bg-border", className)} {...props} />
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
