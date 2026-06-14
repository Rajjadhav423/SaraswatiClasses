import React from "react";

type DSBadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "bold";

interface DSBadgeProps {
  children: React.ReactNode;
  variant?: DSBadgeVariant;
  className?: string;
}

export function DSBadge({ children, variant = "default", className = "" }: DSBadgeProps) {
  return (
    <span className={`ds-lozenge ds-lozenge-${variant} ${className}`}>
      {children}
    </span>
  );
}
