"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/ui/context/theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="ds-icon-btn"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      style={{ flexShrink: 0 }}
    >
      {isDark
        ? <Sun  style={{ width: 16, height: 16 }} />
        : <Moon style={{ width: 16, height: 16 }} />
      }
    </button>
  );
}
