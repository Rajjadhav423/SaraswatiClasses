import React from "react";

export interface DSPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function DSPageHeader({ title, description, actions }: DSPageHeaderProps) {
  return (
    <div className="ds-page-header">
      <div>
        <h1 className="ds-page-header__title">{title}</h1>
        {description && <p className="ds-page-header__desc">{description}</p>}
      </div>
      {actions && <div className="ds-page-header__actions">{actions}</div>}
    </div>
  );
}
