import React from "react";

export interface DSCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  accent?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function DSCard({ children, onClick, accent = true, className = "", style }: DSCardProps) {
  const isInteractive = !!onClick;
  return (
    <div
      className={`ds-card${isInteractive ? " interactive" : ""}${accent ? " accent" : ""} ${className}`}
      style={style}
      onClick={onClick}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e) => { if (e.key === "Enter" || e.key === " ") onClick?.(); }
          : undefined
      }
    >
      {children}
    </div>
  );
}

DSCard.Body = function DSCardBody({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`ds-card__body ${className}`} style={style}>
      {children}
    </div>
  );
};

DSCard.Header = function DSCardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`ds-card__header ${className}`}>{children}</div>;
};

DSCard.Footer = function DSCardFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`ds-card__footer ${className}`}>{children}</div>;
};
