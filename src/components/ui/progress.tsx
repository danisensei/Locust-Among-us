import * as React from "react"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="progress"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cn("relative w-full", className)}
        {...props}
      >
        {children ? (
          children
        ) : (
          <div
            data-slot="progress-track"
            className="bg-primary/20 w-full h-2 overflow-hidden rounded-full"
          >
            <div
              data-slot="progress-indicator"
              className="bg-primary h-full transition-all"
              style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
            />
          </div>
        )}
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
