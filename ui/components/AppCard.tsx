import React from "react";

interface AppCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  accent?: boolean;
  className?: string;
}

export function AppCard({ children, onClick, accent = true, className = "" }: AppCardProps) {
  const interactiveClass = onClick ? "ds-card-interactive" : "";
  const accentClass = accent ? "ds-card-accent" : "";

  return (
    <div
      className={`ds-card ${interactiveClass} ${accentClass} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
    >
      {children}
    </div>
  );
}

AppCard.Body = function AppCardBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`ds-card-body ${className}`}>{children}</div>;
};
