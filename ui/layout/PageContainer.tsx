import React from "react";

export interface PageContainerProps {
  children: React.ReactNode;
  size?: "default" | "sm";
}

export function PageContainer({ children, size = "default" }: PageContainerProps) {
  return (
    <main className={size === "sm" ? "ds-page--sm" : "ds-page"}>
      {children}
    </main>
  );
}
