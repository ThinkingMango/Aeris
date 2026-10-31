"use client";

import {
  Check,
  Minus,
  Moon,
  Sun,
  Monitor,
  CaretDown,
  SlidersHorizontal,
} from "@phosphor-icons/react";
import { useId, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import resetContent from "@/content/reset_content.json";

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

export function GhostButton({
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`aeris-button aeris-ghost ${className}`} {...props}>
      {children}
    </button>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="aeris-text-link" href={href}>
      {children}
    </a>
  );
}

export function ChoiceButton({
  children,
  selected = false,
  onClick,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="choice-button"
      aria-pressed={selected}
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
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [selected, setSelected] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  return (
    <article className={`option-card${selected ? " is-selected" : ""}`}>
      <button
        type="button"
        className="option-card-trigger"
        aria-pressed={selected}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => {
          setSelected((current) => !current);
          setExpanded((current) => !current);
        }}
      >
        <span className="option-card-title">{title}</span>
        <span className="option-card-icons">
          {selected ? <Check aria-hidden="true" weight="bold" /> : null}
          <CaretDown aria-hidden="true" className={expanded ? "is-open" : ""} />
        </span>
      </button>
      <div className="option-card-children" id={panelId} hidden={!expanded}>
        {children}
      </div>
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
}: {
  choices: { id: string; label: string }[];
  value: string | null;
  onChange: (value: string) => void;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const moveFocus = (index: number, direction: number) => {
    const nextIndex = (index + direction + choices.length) % choices.length;
    onChange(choices[nextIndex].id);
    buttons.current[nextIndex]?.focus();
  };

  return (
    <div className="choice-row" role="radiogroup" aria-label="Conversation type">
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

export function ProgressDots({ current = 2, total = 5 }: { current?: number; total?: number }) {
  return (
    <div className="progress-dots" aria-label={`Step ${current} of ${total}`}>
      <span className="progress-label">Step {current} of {total}</span>
      <div className="progress-dot-row" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={`progress-dot${index + 1 === current ? " is-current" : index + 1 < current ? " is-complete" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}

export function StopButton({ onClick }: { onClick: () => void }) {
  return <GhostButton onClick={onClick}>Stop</GhostButton>;
}

export function HelpFooter() {
  return (
    <footer className="help-footer">
      <TextLink href="/help">In danger? Get help now</TextLink>
      <TextLink href="/more">This is about more than work</TextLink>
    </footer>
  );
}

export function SupportButton({ number = "" }: { number?: string }) {
  const digits = number.replace(/[^0-9+]/g, "");
  const unavailable = !number.trim() || number.includes("[") || !/\d/.test(digits);

  if (unavailable) {
    return (
      <button type="button" className="support-button" disabled>
        Number to be confirmed
      </button>
    );
  }

  return (
    <a className="support-button" href={`tel:${digits}`}>
      Call for support
    </a>
  );
}

function AppearanceSettings({
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
          <SupportButton />
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
