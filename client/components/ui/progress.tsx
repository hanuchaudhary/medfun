"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-none",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all animate-progress-stripes"
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
          backgroundSize: '40px 40px',
        }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
