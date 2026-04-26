import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { cn } from "@oxlayer/shared-ui";

export interface StatCardProps {
  title: string;
  value: number | string;
  icon?: ReactNode;
  gradient?: "blue" | "green" | "purple" | "primary" | "orange" | "red";
  href?: string;
  className?: string;
}

const gradients = {
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
  purple: "from-purple-500 to-purple-600",
  primary: "from-primary-500 to-primary-400",
  orange: "from-orange-500 to-orange-600",
  red: "from-red-500 to-red-600",
};

/**
 * Stat card component for displaying metrics with gradient backgrounds.
 * Used in admin dashboards to show key statistics.
 */
export function StatCard({
  title,
  value,
  icon,
  gradient = "primary",
  href,
  className,
}: StatCardProps) {
  const gradientClass = gradients[gradient] ?? gradient;

  const content = (
    <>
      <div className="absolute top-0 right-0 size-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10" />
      <div className="absolute bottom-0 left-0 size-20 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/10" />
      <div className="relative">
        <p className="text-sm font-medium text-white/80">{title}</p>
        <p className="mt-1 text-4xl font-bold text-white">{value}</p>
        {icon && <div className="mt-2">{icon}</div>}
      </div>
    </>
  );

  const cardClass = cn(
    "group relative overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:shadow-lg border border-border",
    "bg-linear-to-br",
    gradientClass,
    className
  );

  if (href) {
    return (
      <Link to={href} className={cardClass}>
        <div className="p-6">{content}</div>
      </Link>
    );
  }

  return (
    <div className={cardClass}>
      <div className="p-6">{content}</div>
    </div>
  );
}
