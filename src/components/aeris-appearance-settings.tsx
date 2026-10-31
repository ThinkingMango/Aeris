"use client";

import { CaretDown, Check, Monitor, Moon, SlidersHorizontal, Sun } from "@phosphor-icons/react";

type Appearance = "system" | "light" | "dark";

export function AppearanceSettings({
  appearance,
  onChange,
}: {
  appearance: Appearance;
  onChange: (appearance: Appearance) => void;
}) {
  const choices: { value: Appearance; label: string; icon: typeof Monitor }[] = [
    { value: "system", label: "System", icon: Monitor },
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ];

  return (
    <details className="appearance-settings">
      <summary>
        <SlidersHorizontal aria-hidden="true" />
        <span>Appearance</span>
        <CaretDown aria-hidden="true" className="appearance-caret" />
      </summary>
      <div className="appearance-options" role="group" aria-label="Color theme">
        {choices.map(({ value, label, icon: Icon }) => (
          <button
            type="button"
            key={value}
            aria-pressed={appearance === value}
            className={`appearance-choice${appearance === value ? " is-selected" : ""}`}
            onClick={() => onChange(value)}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
            {appearance === value ? <Check aria-hidden="true" weight="bold" /> : null}
          </button>
        ))}
      </div>
    </details>
  );
}
