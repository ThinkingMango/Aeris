"use client";

import { Check } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import resetContent from "../../../content/reset_content.json";
import {
  BreathingCircle,
  ChoiceButton,
  Chip,
  OptionCard,
  PrimaryButton,
  SortCard,
  StepCard,
} from "@/components/aeris-design-system";
import { GhostButton, ProgressDots, StopButton, TextLink } from "@/components/aeris-primitives";

type ConversationType = (typeof resetContent.types)[number];
type ResetStep = ConversationType["steps"][number];
type SortValue = "mine" | "not-mine";
type BreathingOrigin = 1 | 5;

const savedSteps = resetContent.types.flatMap(({ steps }) => steps);

export default function ResetPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState<ConversationType | null>(null);
  const [selectedWorries, setSelectedWorries] = useState<string[]>([]);
  const [sortValues, setSortValues] = useState<Record<number, SortValue | null>>({});
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [selectedOpenerIndex, setSelectedOpenerIndex] = useState<number | null>(null);
  const [copiedOpenerIndex, setCopiedOpenerIndex] = useState<number | null>(null);
  const [breathingOrigin, setBreathingOrigin] = useState<BreathingOrigin>(1);
  const [breathingComplete, setBreathingComplete] = useState(false);
  const [savedStep, setSavedStep] = useState<ResetStep | null>(null);
  const typeChoiceButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const optionStepButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const openerButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const copyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const savedStepId = window.localStorage.getItem("aeris.savedStep");
      setSavedStep(savedStepId ? savedSteps.find(({ id }) => id === savedStepId) ?? null : null);
    } catch {
      setSavedStep(null);
    }
  }, []);

  useEffect(() => {
    if (currentStep !== 6) return;

    const timer = window.setTimeout(() => setBreathingComplete(true), 60_000);
    return () => window.clearTimeout(timer);
  }, [currentStep]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) window.clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const clearResetChoices = () => {
    setSelectedType(null);
    setSelectedWorries([]);
    setSortValues({});
    setSelectedStepId(null);
    setSelectedOpenerIndex(null);
    setCopiedOpenerIndex(null);
    if (copyTimeoutRef.current !== null) {
      window.clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = null;
    }
  };

  const stopReset = () => {
    clearResetChoices();
    setCurrentStep(1);
  };

  const startReset = () => {
    clearResetChoices();
    setCurrentStep(2);
  };

  const selectType = (type: ConversationType) => {
    setSelectedType(type);
    setSelectedWorries([]);
    setSortValues({});
    setSelectedStepId(null);
    setSelectedOpenerIndex(null);
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

  const chooseStep = (stepId: string) => {
    if (selectedStepId !== stepId) setSelectedOpenerIndex(null);
    setSelectedStepId(stepId);
  };

  const moveStepFocus = (index: number, event: KeyboardEvent<HTMLButtonElement>) => {
    if (!selectedType) return;
    const lastIndex = selectedType.steps.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % selectedType.steps.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + selectedType.steps.length) % selectedType.steps.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = lastIndex;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      chooseStep(selectedType.steps[nextIndex].id);
      optionStepButtons.current[nextIndex]?.focus();
    }
  };

  const moveOpenerFocus = (index: number, event: KeyboardEvent<HTMLButtonElement>) => {
    if (!selectedType) return;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % selectedType.openers.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + selectedType.openers.length) % selectedType.openers.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = selectedType.openers.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      setSelectedOpenerIndex(nextIndex);
      openerButtons.current[nextIndex]?.focus();
    }
  };

  const openBreathing = (origin: BreathingOrigin) => {
    setBreathingOrigin(origin);
    setBreathingComplete(false);
    setCurrentStep(6);
  };

  const copyOpener = async (index: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (copyTimeoutRef.current !== null) window.clearTimeout(copyTimeoutRef.current);
      setCopiedOpenerIndex(index);
      copyTimeoutRef.current = window.setTimeout(() => {
        setCopiedOpenerIndex(null);
        copyTimeoutRef.current = null;
      }, 1500);
    } catch {
      setCopiedOpenerIndex(null);
    }
  };

  const prioritizedCards = selectedType
    ? [
        ...selectedType.cards
          .map((card, index) => ({ card, index }))
          .filter(({ card }) => card.worries.some((worryId) => selectedWorries.includes(worryId))),
        ...selectedType.cards
          .map((card, index) => ({ card, index }))
          .filter(({ card }) => !card.worries.some((worryId) => selectedWorries.includes(worryId))),
      ]
    : [];
  const everyCardSorted =
    selectedType?.cards.every((_, index) =>
      sortValues[index] === "mine" || sortValues[index] === "not-mine",
    ) ?? false;
  const canChooseStep =
    selectedStepId !== null &&
    (selectedStepId !== "opener" || selectedOpenerIndex !== null);

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
        <ProgressDots current={currentStep === 6 ? breathingOrigin : currentStep} total={5} />
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
              <GhostButton type="button" onClick={() => openBreathing(1)}>
                Breathe first (1 minute)
              </GhostButton>
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
              <PrimaryButton type="button" onClick={() => setCurrentStep(4)}>
                Next
              </PrimaryButton>
              <GhostButton
                type="button"
                onClick={() => {
                  setSelectedWorries([]);
                  setCurrentStep(4);
                }}
              >
                Skip
              </GhostButton>
            </div>
            <div className="reset-navigation">
              <TextLink onClick={() => setCurrentStep(2)}>Back</TextLink>
            </div>
          </section>
        ) : null}

        {currentStep === 4 && selectedType ? (
          <section className="reset-screen">
            <h1 id="reset-heading" className="screen-heading font-serif">
              Which of these can you control?
            </h1>
            <p className="screen-caption">Tap Mine or Not mine for each.</p>
            <div className="reset-sort-list" role="group" aria-labelledby="reset-heading">
              {prioritizedCards.map(({ card, index }) => (
                <SortCard
                  key={`${index}-${card.text}`}
                  text={card.text}
                  value={sortValues[index] ?? null}
                  onChange={(value) => {
                    setSortValues((current) => ({ ...current, [index]: value }));
                  }}
                />
              ))}
            </div>
            <div className="reset-actions reset-actions-equal">
              <PrimaryButton
                type="button"
                disabled={!everyCardSorted}
                onClick={() => setCurrentStep(5)}
              >
                Next
              </PrimaryButton>
              <GhostButton type="button" onClick={() => setCurrentStep(5)}>
                Skip
              </GhostButton>
            </div>
          </section>
        ) : null}

        {currentStep === 5 && selectedType ? (
          <section className="reset-screen">
            <h1 id="reset-heading" className="screen-heading font-serif">
              One first step.
            </h1>
            <div
              className="reset-step-list"
              role="radiogroup"
              aria-labelledby="reset-heading"
            >
              {selectedType.steps.map((step, index) => (
                <OptionCard
                  key={step.id}
                  ref={(node) => {
                    optionStepButtons.current[index] = node;
                  }}
                  title={step.title}
                  detail={step.detail}
                  role="radio"
                  selected={selectedStepId === step.id}
                  expanded={step.id === "opener" && selectedStepId === "opener"}
                  tabIndex={
                    selectedStepId === step.id || (!selectedStepId && index === 0) ? 0 : -1
                  }
                  onSelect={() => chooseStep(step.id)}
                  onKeyDown={(event) => moveStepFocus(index, event)}
                >
                  {step.id === "opener" ? (
                    <div className="opener-choice-list" role="radiogroup" aria-label="Choose an opener">
                      {selectedType.openers.map((opener, openerIndex) => (
                        <div className="opener-choice-row" key={`${step.id}-${openerIndex}`}>
                          <button
                            ref={(node) => {
                              openerButtons.current[openerIndex] = node;
                            }}
                            type="button"
                            className="opener-choice-select"
                            role="radio"
                            aria-checked={selectedOpenerIndex === openerIndex}
                            tabIndex={
                              selectedOpenerIndex === openerIndex ||
                              (selectedOpenerIndex === null && openerIndex === 0)
                                ? 0
                                : -1
                            }
                            onClick={() => setSelectedOpenerIndex(openerIndex)}
                            onKeyDown={(event) => moveOpenerFocus(openerIndex, event)}
                          >
                            <span>{opener}</span>
                            {selectedOpenerIndex === openerIndex ? (
                              <Check aria-hidden="true" weight="bold" />
                            ) : null}
                          </button>
                          <GhostButton
                            className="opener-copy-button"
                            aria-label={
                              copiedOpenerIndex === openerIndex
                                ? `Copied: ${opener}`
                                : `Copy: ${opener}`
                            }
                            aria-live="polite"
                            onClick={() => void copyOpener(openerIndex, opener)}
                          >
                            {copiedOpenerIndex === openerIndex ? "Copied" : "Copy"}
                          </GhostButton>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </OptionCard>
              ))}
            </div>
            <div className="reset-actions reset-actions-stack">
              <PrimaryButton type="button" disabled={!canChooseStep}>
                That&apos;s my step
              </PrimaryButton>
            </div>
            <div className="reset-navigation">
              <TextLink onClick={() => openBreathing(5)}>
                One minute of breathing first
              </TextLink>
            </div>
          </section>
        ) : null}

        {currentStep === 6 ? (
          <section className="reset-screen">
            <h1 id="reset-heading" className="screen-heading font-serif">
              {breathingOrigin === 1 ? "Breathe first (1 minute)" : "One minute of breathing first"}
            </h1>
            {breathingComplete ? (
              <p className="screen-caption" role="status">
                That&apos;s a minute.
              </p>
            ) : (
              <div className="reset-breathing-circle">
                <BreathingCircle duration={10} />
              </div>
            )}
            {breathingComplete ? (
              <div className="reset-breathing-actions">
                <PrimaryButton
                  type="button"
                  onClick={breathingOrigin === 1 ? startReset : () => setCurrentStep(5)}
                >
                  {breathingOrigin === 1 ? "Start the reset" : "Back to your step"}
                </PrimaryButton>
                <GhostButton type="button" onClick={() => setCurrentStep(1)}>
                  Done
                </GhostButton>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
