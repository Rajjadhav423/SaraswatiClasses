import React from "react";

export type DSLozengeAppearance =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "inprogress"
  | "moved"
  | "new"
  | "removed";

export interface DSLozengeProps {
  children: React.ReactNode;
  appearance?: DSLozengeAppearance;
  isBold?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function DSLozenge({
  children,
  appearance = "default",
  isBold = false,
  className = "",
  style,
}: DSLozengeProps) {
  return (
    <span
      className={`ds-lozenge ds-lozenge--${appearance}${isBold ? " bold" : ""} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}
