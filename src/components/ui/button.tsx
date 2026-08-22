import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-opacity duration-[var(--motion-quick,150ms)] ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-origin text-bg hover:opacity-90",
        ghost:
          "bg-transparent text-fg hover:bg-surface-2",
        outline:
          "border border-border bg-surface text-fg hover:bg-surface-2",
        chip:
          "border border-border bg-surface text-muted hover:text-fg hover:border-accent/40",
      },
      size: {
        sm: "h-8 rounded-sm px-3 text-xs",
        md: "h-11 rounded-md px-4 text-sm",
        icon: "size-11 rounded-md",
        chip: "h-8 rounded-full px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: Props) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
