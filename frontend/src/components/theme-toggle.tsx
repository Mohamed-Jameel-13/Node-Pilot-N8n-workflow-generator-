"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { usePostHog } from "@posthog/react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const posthog = usePostHog();

  const handleToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    posthog.capture("theme_toggled", { theme: newTheme });
  };

  return (
    <button
      onClick={handleToggle}
      title="Toggle Theme"
      className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center relative w-8 h-8"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
