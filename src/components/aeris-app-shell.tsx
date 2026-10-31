"use client";

import { useState, type ReactNode } from "react";
import { AppearanceSettings } from "./aeris-appearance-settings";
import { HelpFooter } from "./aeris-primitives";

type Appearance = "system" | "light" | "dark";

export function AerisAppShell({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState<Appearance>("system");

  return (
    <div className="app-shell" data-theme={appearance}>
      <header className="app-shell-header">
        <AppearanceSettings appearance={appearance} onChange={setAppearance} />
      </header>
      {children}
      <HelpFooter />
    </div>
  );
}
