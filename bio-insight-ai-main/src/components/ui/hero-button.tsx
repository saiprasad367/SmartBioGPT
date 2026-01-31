import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-soft hover:shadow-medium hover:scale-[1.02] active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground border border-border hover:bg-accent hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "border border-border bg-background hover:bg-secondary hover:scale-[1.02] active:scale-[0.98]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link:
          "text-foreground underline-offset-4 hover:underline",
        hero:
          "bg-primary text-primary-foreground shadow-medium hover:shadow-strong hover:scale-[1.03] active:scale-[0.98]",
        "hero-secondary":
          "bg-secondary text-secondary-foreground border border-border shadow-soft hover:shadow-medium hover:bg-accent hover:scale-[1.03] active:scale-[0.98]",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-8 text-base",
        xl: "h-16 px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface HeroButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const HeroButton = forwardRef<HTMLButtonElement, HeroButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

HeroButton.displayName = "HeroButton";

export { HeroButton, buttonVariants };
