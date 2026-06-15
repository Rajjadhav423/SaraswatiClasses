"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { DSButton } from "@/ui/components/Button";
import { AlertTriangle, Info } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = "Confirm",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const isDanger = variant === "danger";

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onCancel()} disablePointerDismissal>
      <DialogContent showCloseButton={false} style={{ gap: 0, padding: 0 }}>

        {/* Icon + Title + Message */}
        <div style={{ padding: "24px 24px 20px", display: "flex", gap: 14, alignItems: "flex-start" }}>
          {/* Icon */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: isDanger ? "var(--ds-danger-bg)" : "var(--ds-brand-bg)",
            }}
          >
            {isDanger
              ? <AlertTriangle style={{ width: 20, height: 20, color: "var(--ds-danger)" }} />
              : <Info style={{ width: 20, height: 20, color: "var(--ds-primary)" }} />
            }
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "var(--ds-text)", lineHeight: 1.3 }}>
              {title}
            </p>
            <p style={{ margin: 0, fontSize: 14, color: "var(--ds-text-subtle)", lineHeight: 1.6 }}>
              {message}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--ds-border)", margin: "0 24px" }} />

        {/* Actions */}
        <div style={{ padding: "16px 24px", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <DSButton variant="default" size="default" onClick={onCancel}>
            {cancelLabel}
          </DSButton>
          <DSButton
            variant={isDanger ? "danger" : "primary"}
            size="default"
            onClick={onConfirm}
          >
            {confirmLabel}
          </DSButton>
        </div>

      </DialogContent>
    </Dialog>
  );
}
