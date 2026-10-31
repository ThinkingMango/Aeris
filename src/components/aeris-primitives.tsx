"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type GhostButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
};

export function GhostButton({
  href,
  className = "",
  children,
  type = "button",
  ...buttonProps
}: GhostButtonProps) {
  const classes = `aeris-button aeris-ghost ${className}`.trim();

  if (href) {
    return (
      <Link href={href} prefetch={false} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}

export function TextLink({
  href,
  onClick,
  children,
}: {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  if (href) {
    return (
      <Link className="aeris-text-link" href={href} prefetch={false}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className="aeris-text-link" onClick={onClick}>
      {children}
    </button>
  );
}

export function ProgressDots({ current = 1, total = 5 }: { current?: number; total?: number }) {
  return (
    <div className="progress-dots" role="img" aria-label={`Step ${current} of ${total}`}>
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
    <footer className="help-footer" aria-label="Help links">
      <TextLink href="/help">In danger? Get help now</TextLink>
      <TextLink href="/more">This is about more than work</TextLink>
    </footer>
  );
}

export function SupportButton({
  label = "Call for support",
  number = "",
  mode = "call",
}: {
  label?: string;
  number?: string;
  mode?: "call" | "call-or-text";
}) {
  const dialNumber = number.trim().replace(/[^0-9+]/g, "");
  const unavailable =
    !number.trim() || number.includes("[") || !/^\+?\d+$/.test(dialNumber);

  if (unavailable) {
    return (
      <button type="button" className="support-button" disabled>
        <span>{label}</span>
        <span className="support-status">Number to be confirmed</span>
      </button>
    );
  }

  if (mode === "call-or-text") {
    return (
      <div className="support-button-group" role="group" aria-label={label}>
        <p className="support-group-label">{label}</p>
        <div className="support-actions">
          <a className="support-button" href={`tel:${dialNumber}`}>
            Call
          </a>
          <a className="support-button" href={`sms:${dialNumber}`}>
            Text
          </a>
        </div>
      </div>
    );
  }

  return (
    <a className="support-button" href={`tel:${dialNumber}`}>
      {label}
    </a>
  );
}
