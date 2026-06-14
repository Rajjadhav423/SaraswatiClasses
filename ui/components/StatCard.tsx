import React from "react";

export interface DSStatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;
  valueColor?: string;
}

export function DSStatCard({ label, value, icon, iconBg = "var(--ds-brand-bg)", valueColor }: DSStatCardProps) {
  return (
    <div className="ds-stat-card">
      <div className="ds-stat-card__icon" style={{ background: iconBg }}>
        {icon}
      </div>
      <div>
        <p className="ds-stat-card__label">{label}</p>
        <p className="ds-stat-card__value" style={valueColor ? { color: valueColor } : undefined}>
          {value}
        </p>
      </div>
    </div>
  );
}
