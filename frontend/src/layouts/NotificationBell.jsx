import React from "react";

export default function NotificationBell() {
  return (
    <button
      type="button"
      aria-label="Notifications"
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "22px",
      }}
    >
      🔔
    </button>
  );
}