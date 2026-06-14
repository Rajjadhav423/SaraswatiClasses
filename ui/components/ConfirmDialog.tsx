"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DSButton } from "@/ui/components/Button";

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
  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onCancel()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p style={{ margin: "4px 0 16px", fontSize: 14, color: "var(--ds-text-subtle)", lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <DSButton variant="default" size="default" onClick={onCancel}>
            {cancelLabel}
          </DSButton>
          <DSButton
            variant={variant === "danger" ? "danger" : "primary"}
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
