"use client";

import React from "react";

export interface TopNavigationProps {
  children: React.ReactNode;
}

export function TopNavigation({ children }: TopNavigationProps) {
  return (
    <>
      <div className="ds-top-accent" aria-hidden="true" />
      <header className="ds-nav print:hidden">
        <div className="ds-nav-inner">{children}</div>
      </header>
    </>
  );
}
