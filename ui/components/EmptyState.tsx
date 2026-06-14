import React from "react";

export interface DSEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function DSEmptyState({ icon, title, description, action }: DSEmptyStateProps) {
  return (
    <div className="ds-empty">
      <div className="ds-empty__icon">{icon}</div>
      <div>
        <p className="ds-empty__title">{title}</p>
        {description && <p className="ds-empty__desc">{description}</p>}
      </div>
      {action}
    </div>
  );
}
