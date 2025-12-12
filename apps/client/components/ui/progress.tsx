"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

function Progress({
  className,
  isGraduated,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  isGraduated?: boolean;
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-3 border border-primary rounded w-full overflow-hidden",
        isGraduated ? "border-yellow-400" : "border-primary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={`h-full w-full flex-1 transition-all animate-progress-stripes ${
          isGraduated ? "bg-yellow-400" : "bg-primary"
        }`}
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`,
          backgroundImage: `linear-gradient(
                                45deg,
                                rgba(0, 0, 0, 0.1) 25%,
                                transparent 25%,
                                transparent 50%,
                                rgba(0, 0, 0, 0.1) 50%,
                                rgba(0, 0, 0, 0.1) 75%,
                                transparent 75%,
                                transparent 100%
                              )`,
          backgroundSize: "40px 40px",
        }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
