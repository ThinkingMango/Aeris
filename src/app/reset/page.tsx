"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import resetContent from "../../../content/reset_content.json";
import {
  ChoiceButton,
  Chip,
  PrimaryButton,
  StepCard,
} from "@/components/aeris-design-system";
import { GhostButton, ProgressDots, StopButton, TextLink } from "@/components/aeris-primitives";

type ConversationType = (typeof resetContent.types)[number];
type ResetStep = ConversationType["steps"][number];

const savedSteps = resetContent.types.flatMap(({ steps }) => steps);

export default function ResetPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState<ConversationType | null>(null);
  const [selectedWorries, setSelectedWorries] = useState<string[]>([]);
  const [savedStep, setSavedStep] = useState<ResetStep | null>(null);
  const typeChoiceButtons = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    try {
      const savedStepId = window.localStorage.getItem("aeris.savedStep");
      setSavedStep(savedStepId ? savedSteps.find(({ id }) => id === savedStepId) ?? null : null);
    } catch {
      setSavedStep(null);
    }
  }, []);

  const stopReset = () => {
    setCurrentStep(1);
    setSelectedType(null);
    setSelectedWorries([]);
  };

  const startReset = () => {
    setSelectedType(null);
    setSelectedWorries([]);
    setCurrentStep(2);
  };

  const selectType = (type: ConversationType) => {
    setSelectedType(type);
    setCurrentStep(3);
  };

  const moveTypeChoiceFocus = (
    index: number,
    event: KeyboardEvent<HTMLButtonElement>,
  ) => {
    const lastIndex = resetContent.types.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % resetContent.types.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + resetContent.types.length) % resetContent.types.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = lastIndex;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      setSelectedType(resetContent.types[nextIndex]);
      typeChoiceButtons.current[nextIndex]?.focus();
    }
  };

  const toggleWorry = (worryId: string) => {
    setSelectedWorries((current) => {
      if (current.includes(worryId)) {
        return current.filter((id) => id !== worryId);
      }
      return current.length < 2 ? [...current, worryId] : current;
    });
  };

  const deleteSavedStep = () => {
    setSavedStep(null);
    try {
      window.localStorage.removeItem("aeris.savedStep");
    } catch {
      // The card is still removed from this screen if browser storage is unavailable.
    }
  };

  return (
    <main className="app-main reset-main" aria-labelledby="reset-heading">
      <div className="reset-topbar">
        <StopButton onClick={stopReset} />
        <ProgressDots current={currentStep} total={5} />
      </div>

      <div className="reset-content">
        {currentStep === 1 ? (
          <section className="reset-screen">
            <h1 id="reset-heading" className="screen-heading font-serif">
              A difficult conversation ahead?
            </h1>
            <p className="screen-caption">Private. What you choose stays on this phone.</p>

            {savedStep ? (
              <div className="saved-step-block">
                <StepCard
                  title="Your saved step"
                  detail={`${savedStep.title} — ${savedStep.detail}`}
                />
                <div className="saved-step-actions">
                  <TextLink onClick={deleteSavedStep}>Delete</TextLink>
                </div>
              </div>
            ) : null}

            <div className="reset-actions reset-actions-stack">
              <PrimaryButton type="button" onClick={startReset}>
                Start the 3-minute reset
              </PrimaryButton>
              <GhostButton type="button">Breathe first (1 minute)</GhostButton>
            </div>
          </section>
        ) : null}

        {currentStep === 2 ? (
          <section className="reset-screen">
            <h1 id="reset-heading" className="screen-heading font-serif">
              What kind of conversation?
            </h1>
            <div
              className="reset-choice-list"
              role="radiogroup"
              aria-labelledby="reset-heading"
            >
              {resetContent.types.map((type, index) => (
                <ChoiceButton
                  key={type.id}
                  role="radio"
                  selected={selectedType?.id === type.id}
                  tabIndex={
                    selectedType?.id === type.id || (!selectedType && index === 0) ? 0 : -1
                  }
                  onKeyDown={(event) => moveTypeChoiceFocus(index, event)}
                  onClick={() => selectType(type)}
                  ref={(node) => {
                    typeChoiceButtons.current[index] = node;
                  }}
                >
                  {type.label}
                </ChoiceButton>
              ))}
            </div>
            <div className="reset-navigation">
              <TextLink onClick={() => setCurrentStep(1)}>Back</TextLink>
            </div>
          </section>
        ) : null}

        {currentStep === 3 ? (
          <section className="reset-screen">
            <h1 id="reset-heading" className="screen-heading font-serif">
              What&apos;s weighing on you most?
            </h1>
            <p className="screen-caption">Pick up to two, or skip.</p>
            <div className="reset-worry-list" role="group" aria-labelledby="reset-heading">
              {resetContent.worries.map((worry) => {
                const pressed = selectedWorries.includes(worry.id);
                return (
                  <Chip
                    key={worry.id}
                    pressed={pressed}
                    disabled={selectedWorries.length >= 2 && !pressed}
                    onClick={() => toggleWorry(worry.id)}
                  >
                    {worry.label}
                  </Chip>
                );
              })}
            </div>
            <div className="reset-actions reset-actions-equal">
              <PrimaryButton type="button">Next</PrimaryButton>
              <GhostButton type="button">Skip</GhostButton>
            </div>
            <div className="reset-navigation">
              <TextLink onClick={() => setCurrentStep(2)}>Back</TextLink>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
