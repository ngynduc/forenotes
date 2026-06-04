import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--color-primary)] text-white",
        secondary: "border-transparent bg-[var(--color-surface-muted)] text-[var(--color-text)]",
        destructive: "border-transparent bg-[var(--color-danger)] text-white",
        outline: "border-[var(--color-border)] text-[var(--color-text)]",
        success: "border-transparent bg-[var(--color-success-soft)] text-[var(--color-primary-strong)]",
        warning: "border-transparent bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
        danger: "border-transparent bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
