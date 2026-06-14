"use client";

import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export type DSButtonVariant =
  | "primary"
  | "default"
  | "subtle"
  | "danger"
  | "subtle-danger"
  | "link"
  | "warning";

export type DSButtonSize = "compact" | "default" | "large" | "icon" | "icon-compact";

export interface DSButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: DSButtonVariant;
  size?: DSButtonSize;
  loading?: boolean;
  iconBefore?: React.ReactNode;
  iconAfter?: React.ReactNode;
}

const VARIANT_MAP: Record<DSButtonVariant, string> = {
  "primary":       "ds-btn--primary",
  "default":       "ds-btn--default",
  "subtle":        "ds-btn--subtle",
  "danger":        "ds-btn--danger",
  "subtle-danger": "ds-btn--subtle-danger",
  "link":          "ds-btn--link",
  "warning":       "ds-btn--warning",
};

const SIZE_MAP: Record<DSButtonSize, string> = {
  "compact":       "ds-btn--compact",
  "default":       "ds-btn--md",
  "large":         "ds-btn--lg",
  "icon":          "ds-btn--icon",
  "icon-compact":  "ds-btn--icon-compact",
};

export const DSButton = forwardRef<HTMLButtonElement, DSButtonProps>(
  function DSButton(
    {
      variant = "default",
      size = "default",
      loading = false,
      iconBefore,
      iconAfter,
      children,
      disabled,
      className = "",
      style,
      type = "button",
      ...rest
    },
    ref
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={`ds-btn ${VARIANT_MAP[variant]} ${SIZE_MAP[size]} ${className}`}
        style={style}
        {...rest}
      >
        {loading ? (
          <Loader2
            style={{ width: 14, height: 14, animation: "spin 1s linear infinite", flexShrink: 0 }}
          />
        ) : (
          iconBefore && (
            <span style={{ display: "inline-flex", flexShrink: 0, alignItems: "center" }}>
              {iconBefore}
            </span>
          )
        )}
        {children !== undefined && children !== null && (
          <span style={{ display: "contents" }}>{children}</span>
        )}
        {!loading && iconAfter && (
          <span style={{ display: "inline-flex", flexShrink: 0, alignItems: "center" }}>
            {iconAfter}
          </span>
        )}
      </button>
    );
  }
);
