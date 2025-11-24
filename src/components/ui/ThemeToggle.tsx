"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="bg-muted hover:bg-accent rounded-lg p-3 text-foreground transition-colors">
        <div className="w-5 h-5" />
      </button>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="bg-muted hover:bg-accent rounded-lg p-3 text-foreground transition-colors"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <Sun className="w-5 h-5 transition-transform duration-200 rotate-0 hover:rotate-12" />
      ) : (
        <Moon className="w-5 h-5 transition-transform duration-200 rotate-0 hover:-rotate-12" />
      )}
    </button>
  );
};

export default ThemeToggle;
