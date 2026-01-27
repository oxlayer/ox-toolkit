"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { head } from "es-toolkit/array";
import { Monitor, Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "../../lib/utils";

const themes = [
  {
    key: "system",
    icon: Monitor,
    label: "System theme",
  },
  {
    key: "light",
    icon: Sun,
    label: "Light theme",
  },
  {
    key: "dark",
    icon: Moon,
    label: "Dark theme",
  },
];

export type ThemeSwitcherProps = {
  value?: "light" | "dark" | "system";
  onChange?: (theme: "light" | "dark" | "system") => void;
  defaultValue?: "light" | "dark" | "system";
  className?: string;
  size?: "icon";
};

export const ThemeSwitcher = ({
  value,
  onChange,
  defaultValue = "system",
  className,
  size = "icon",
}: ThemeSwitcherProps) => {
  const [theme, setTheme] = useControllableState({
    defaultProp: defaultValue,
    ...(value !== undefined ? { prop: value } : {}),
    ...(onChange !== undefined ? { onChange } : {}),
  });
  const [mounted, setMounted] = useState(false);

  const cycleTheme = useCallback(() => {
    const currentIndex = themes.findIndex(t => t.key === theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    if (!nextTheme) return;
    setTheme(nextTheme.key as "light" | "dark" | "system");
  }, [theme, setTheme]);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const fallbackTheme = head(themes);
  if (!fallbackTheme) {
    return null;
  }

  const currentTheme = themes.find(t => t.key === theme) ?? fallbackTheme;
  const Icon = currentTheme.icon;

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground",
        size === "icon" && "size-7",
        className
      )}
      onClick={cycleTheme}
      aria-label={`Switch to ${currentTheme.label}`}
    >
      <Icon className="h-4.5 w-4.5" strokeWidth={1.5} />
    </button>
  );
};
