"use client";

import { Check, Minus, CaretDown } from "@phosphor-icons/react";
import { useId, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type KeyboardEventHandler, type ReactNode, type Ref } from "react";
import resetContent from "../../content/reset_content.json";
import { helplines } from "../../content/helplines";
import { AppearanceSettings } from "./aeris-appearance-settings";
import {
  GhostButton,
  HelpFooter,
  ProgressDots,
  StopButton,
  SupportButton,
  TextLink,
} from "./aeris-primitives";

type Appearance = "system" | "light" | "dark";
type SortValue = "mine" | "not-mine" | null;

const exampleType = resetContent.types[0];
const worryChoices = resetContent.worries;

export function PrimaryButton({
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`aeris-button aeris-primary ${className}`} {...props}>
      {children}
    </button>
  );
}

export function ChoiceButton({
  children,
  selected = false,
  onClick,
  role,
  tabIndex,
  onKeyDown,
  ref,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  role?: "radio";
  tabIndex?: number;
  onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      type="button"
      className="choice-button"
      role={role}
      aria-pressed={role ? undefined : selected}
      aria-checked={role === "radio" ? selected : undefined}
      tabIndex={role ? tabIndex : undefined}
      onKeyDown={onKeyDown}
      onClick={onClick}
    >
      <span>{children}</span>
      {selected ? <Check aria-hidden="true" weight="bold" /> : null}
    </button>
  );
}

export function Chip({
  children,
  pressed,
  disabled,
  onClick,
}: {
  children: ReactNode;
  pressed: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="chip"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
    >
      {pressed ? <Check aria-hidden="true" weight="bold" /> : null}
      <span>{children}</span>
    </button>
  );
}

export function SortCard({
  text,
  value,
  onChange,
}: {
  text: string;
  value: SortValue;
  onChange: (value: SortValue) => void;
}) {
  return (
    <article className="sort-card">
      <p className="sort-card-copy">{text}</p>
      <div className="sort-actions" aria-label={`Sort ${text}`}>
        <button
          type="button"
          className={`sort-action sort-mine${value === "mine" ? " is-selected" : ""}`}
          aria-pressed={value === "mine"}
          onClick={() => onChange(value === "mine" ? null : "mine")}
        >
          {value === "mine" ? <Check aria-hidden="true" weight="bold" /> : null}
          <span>Mine</span>
        </button>
        <button
          type="button"
          className={`sort-action sort-not-mine${value === "not-mine" ? " is-selected" : ""}`}
          aria-pressed={value === "not-mine"}
          onClick={() => onChange(value === "not-mine" ? null : "not-mine")}
        >
          {value === "not-mine" ? <Minus aria-hidden="true" weight="bold" /> : null}
          <span>Not mine</span>
        </button>
      </div>
    </article>
  );
}

export function OptionCard({
  title,
  detail,
  children,
  selected: selectedProp,
  expanded: expandedProp,
  onSelect,
  role,
  tabIndex,
  onKeyDown,
  ref,
}: {
  title: string;
  detail?: string;
  children?: ReactNode;
  selected?: boolean;
  expanded?: boolean;
  onSelect?: () => void;
  role?: "radio";
  tabIndex?: number;
  onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
  ref?: Ref<HTMLButtonElement>;
}) {
  const [localSelected, setLocalSelected] = useState(false);
  const [localExpanded, setLocalExpanded] = useState(false);
  const panelId = useId();
  const selected = selectedProp ?? localSelected;
  const expanded = expandedProp ?? localExpanded;
  const expandable = children !== undefined && children !== null;

  const handleSelect = () => {
    if (onSelect) {
      onSelect();
      return;
    }
    setLocalSelected((current) => !current);
    if (expandable) setLocalExpanded((current) => !current);
  };

  return (
    <article className={`option-card${selected ? " is-selected" : ""}`}>
      <button
        ref={ref}
        type="button"
        className="option-card-trigger"
        role={role}
        aria-pressed={role ? undefined : selected}
        aria-checked={role === "radio" ? selected : undefined}
        aria-expanded={expandable ? expanded : undefined}
        aria-controls={expandable ? panelId : undefined}
        tabIndex={role ? tabIndex : undefined}
        onKeyDown={onKeyDown}
        onClick={handleSelect}
      >
        <span className="option-card-copy">
          <span className="option-card-title">{title}</span>
          {detail ? <span className="option-card-detail">{detail}</span> : null}
        </span>
        <span className="option-card-icons">
          {selected ? <Check aria-hidden="true" weight="bold" /> : null}
          {expandable ? (
            <CaretDown aria-hidden="true" className={expanded ? "is-open" : ""} />
          ) : null}
        </span>
      </button>
      {expandable ? (
        <div className="option-card-children" id={panelId} hidden={!expanded}>
          {children}
        </div>
      ) : null}
    </article>
  );
}

export function StepCard({ title, detail }: { title: string; detail: string }) {
  return (
    <article className="step-card">
      <span className="step-card-check" aria-hidden="true">
        <Check weight="bold" />
      </span>
      <div className="step-card-copy">
        <h3>{title}</h3>
        <p>{detail}</p>
      </div>
    </article>
  );
}

export function ChoiceRow({
  choices,
  value,
  onChange,
  ariaLabel = "Conversation type",
}: {
  choices: { id: string; label: string }[];
  value: string | null;
  onChange: (value: string) => void;
  ariaLabel?: string;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const moveFocus = (index: number, direction: number) => {
    const nextIndex = (index + direction + choices.length) % choices.length;
    onChange(choices[nextIndex].id);
    buttons.current[nextIndex]?.focus();
  };

  return (
    <div className="choice-row" role="radiogroup" aria-label={ariaLabel}>
      {choices.map((choice, index) => {
        const checked = value === choice.id;
        return (
          <button
            key={choice.id}
            ref={(node) => {
              buttons.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked || (!value && index === 0) ? 0 : -1}
            className={`choice-row-item${checked ? " is-selected" : ""}`}
            onClick={() => onChange(choice.id)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                event.preventDefault();
                moveFocus(index, 1);
              }
              if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                event.preventDefault();
                moveFocus(index, -1);
              }
            }}
          >
            <span>{choice.label}</span>
            {checked ? <Check aria-hidden="true" weight="bold" /> : null}
          </button>
        );
      })}
    </div>
  );
}

export function BreathingCircle({ duration = 10 }: { duration?: number }) {
  return (
    <div className="breathing-demo" aria-label="Breathing pace">
      <div className="breath-orbit" style={{ "--breath-duration": `${duration}s` } as CSSProperties}>
        <div className="breath-orb" />
        <span className="breath-cue breath-cue-in">In...</span>
        <span className="breath-cue breath-cue-out">Out...</span>
      </div>
    </div>
  );
}

function ThemeBoard({ theme }: { theme: "light" | "dark" }) {
  const [chips, setChips] = useState<string[]>([]);
  const [sortValue, setSortValue] = useState<SortValue>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [choiceButtonSelected, setChoiceButtonSelected] = useState(false);
  const [choiceButtonSecond, setChoiceButtonSecond] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const reset = () => {
    setChips([]);
    setSortValue(null);
    setChoice(null);
    setChoiceButtonSelected(false);
    setChoiceButtonSecond(false);
    setResetKey((current) => current + 1);
  };

  return (
    <section className={`theme-board theme-${theme}`} aria-labelledby={`${theme}-board-title`}>
      <header className="theme-board-heading">
        <h2 id={`${theme}-board-title`}>{theme === "light" ? "Light theme" : "Dark theme"}</h2>
        <span>{theme === "light" ? "Light" : "Dark"}</span>
      </header>

      <div className="component-stack">
        <section className="component-section" aria-labelledby={`${theme}-buttons-title`}>
          <h3 id={`${theme}-buttons-title`}>Buttons and links</h3>
          <div className="button-row">
            <PrimaryButton>Continue</PrimaryButton>
            <GhostButton>Back</GhostButton>
          </div>
          <TextLink href="#top">Back to top</TextLink>
        </section>

        <section className="component-section" aria-labelledby={`${theme}-choice-title`}>
          <h3 id={`${theme}-choice-title`}>ChoiceButton</h3>
          <div className="control-stack">
            <ChoiceButton
              selected={choiceButtonSelected}
              onClick={() => setChoiceButtonSelected((value) => !value)}
            >
              {exampleType.label}
            </ChoiceButton>
            <ChoiceButton
              selected={choiceButtonSecond}
              onClick={() => setChoiceButtonSecond((value) => !value)}
            >
              {resetContent.types[1].label}
            </ChoiceButton>
          </div>
        </section>

        <section className="component-section" aria-labelledby={`${theme}-chip-title`}>
          <h3 id={`${theme}-chip-title`}>Chip</h3>
          <div className="chip-row">
            {worryChoices.map((worry) => {
              const pressed = chips.includes(worry.id);
              const capped = chips.length >= 2 && !pressed;
              return (
                <Chip
                  key={worry.id}
                  pressed={pressed}
                  disabled={capped}
                  onClick={() => {
                    setChips((current) => {
                      if (current.includes(worry.id)) {
                        return current.filter((id) => id !== worry.id);
                      }
                      return current.length < 2 ? [...current, worry.id] : current;
                    });
                  }}
                >
                  {worry.label}
                </Chip>
              );
            })}
          </div>
        </section>

        <section className="component-section" aria-labelledby={`${theme}-sort-title`}>
          <h3 id={`${theme}-sort-title`}>SortCard</h3>
          <SortCard text={exampleType.cards[0].text} value={sortValue} onChange={setSortValue} />
        </section>

        <section className="component-section" aria-labelledby={`${theme}-option-title`}>
          <h3 id={`${theme}-option-title`}>OptionCard</h3>
          <OptionCard key={resetKey} title={exampleType.label}>
            <ul className="option-child-list">
              {exampleType.cards.slice(0, 3).map((card) => (
                <li key={card.text}>{card.text}</li>
              ))}
            </ul>
          </OptionCard>
        </section>

        <section className="component-section" aria-labelledby={`${theme}-step-title`}>
          <h3 id={`${theme}-step-title`}>StepCard</h3>
          <StepCard title={exampleType.steps[1].title} detail={exampleType.steps[1].detail} />
        </section>

        <section className="component-section" aria-labelledby={`${theme}-row-title`}>
          <h3 id={`${theme}-row-title`}>ChoiceRow</h3>
          <ChoiceRow
            choices={resetContent.types.slice(0, 3).map(({ id, label }) => ({ id, label }))}
            value={choice}
            onChange={setChoice}
          />
        </section>

        <section className="component-section" aria-labelledby={`${theme}-breath-title`}>
          <h3 id={`${theme}-breath-title`}>BreathingCircle</h3>
          <BreathingCircle duration={10} />
        </section>

        <section className="component-section" aria-labelledby={`${theme}-progress-title`}>
          <h3 id={`${theme}-progress-title`}>ProgressDots</h3>
          <ProgressDots current={2} total={5} />
        </section>

        <section className="component-section" aria-labelledby={`${theme}-support-title`}>
          <h3 id={`${theme}-support-title`}>SupportButton</h3>
          <SupportButton number={helplines.emergencyNumber} />
        </section>

        <section className="component-section" aria-labelledby={`${theme}-stop-title`}>
          <h3 id={`${theme}-stop-title`}>StopButton</h3>
          <StopButton onClick={reset} />
        </section>
      </div>

      <HelpFooter />
    </section>
  );
}

export function DesignSystemGallery() {
  const [appearance, setAppearance] = useState<Appearance>("system");

  return (
    <div className="app-shell" data-theme={appearance}>
      <header className="site-header">
        <a className="brand-mark" href="#top" aria-label="Aeris home">
          <span className="brand-symbol" aria-hidden="true">a</span>
          <span>Aeris</span>
        </a>
        <AppearanceSettings appearance={appearance} onChange={setAppearance} />
      </header>

      <main id="top" className="page-content">
        <section className="page-intro">
          <h1>Aeris design system</h1>
          <p>A private, three-minute, no-typing reset before a difficult work conversation.</p>
        </section>

        <div className="theme-gallery">
          <ThemeBoard theme="light" />
          <ThemeBoard theme="dark" />
        </div>
      </main>

      <footer className="page-footer">
        <p>Each preview is interactive. Changes stay in this page.</p>
      </footer>
    </div>
  );
}
