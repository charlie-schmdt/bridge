// src/components/Toggle.tsx
import React from "react";

type ToggleProps = {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export default function Toggle({ checked, onChange, disabled, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      className={[
        "relative inline-flex h-7 w-12 cursor-pointer items-center rounded-full transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300",
        disabled ? "opacity-40 cursor-not-allowed" : "",
        checked ? "bg-blue-600" : "bg-neutral-300",
        className || "",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
          checked ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}
