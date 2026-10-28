import { Moon, Sun } from "lucide-react";
import { setTheme, useTheme } from "@/lib/theme";

/** 44px icon button beside the map search. */
export function ThemeToggle() {
  const theme = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:bg-surface-2 hover:text-fg"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {theme === "dark" ? (
        <Sun className="size-[18px]" aria-hidden />
      ) : (
        <Moon className="size-[18px]" aria-hidden />
      )}
    </button>
  );
}

/** Text variant for the footer link row. */
export function ThemeToggleLink({ className }: { className?: string }) {
  const theme = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button type="button" onClick={() => setTheme(next)} className={className}>
      {next === "light" ? "Light mode" : "Dark mode"}
    </button>
  );
}
