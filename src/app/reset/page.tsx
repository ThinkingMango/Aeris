"use client";

import { useState } from "react";
import { ProgressDots, StopButton } from "@/components/aeris-primitives";

export default function ResetPage() {
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <main className="app-main reset-main" aria-labelledby="reset-heading">
      <div className="reset-topbar">
        <StopButton onClick={() => setCurrentStep(1)} />
        <ProgressDots current={currentStep} total={5} />
      </div>
      <h1 id="reset-heading" className="sr-only">
        Reset
      </h1>
      <div className="reset-content" />
    </main>
  );
}
