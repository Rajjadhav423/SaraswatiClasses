import React from "react";

interface NavAvatarProps {
  initials?: string;
  bg?: string;
  title?: string;
}

export function NavAvatar({ initials = "SC", bg = "#5243AA", title = "Saraswati Classes" }: NavAvatarProps) {
  return (
    <div
      title={title}
      aria-label={title}
      style={{
        width: 32, height: 32,
        borderRadius: "50%",
        background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, color: "#FFFFFF",
        flexShrink: 0, userSelect: "none", cursor: "default",
        letterSpacing: "0.03em",
      }}
    >
      {initials}
    </div>
  );
}
