import { useEffect } from "react";

/**
 * Smart Bio GPT ships a single light theme by design. This provider just
 * guarantees no stale `dark` class is left on <html> and renders children.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
    root.style.colorScheme = "light";
  }, []);

  return <>{children}</>;
}
