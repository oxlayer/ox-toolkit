import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type CornerPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRandomCorners(): CornerPosition[] {
  const allCorners: CornerPosition[] = ["top-left", "top-right", "bottom-left", "bottom-right"];
  const shuffled = [...allCorners].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
}
