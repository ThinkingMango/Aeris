"use client";

import { useRef, useState } from "react";

import { LIMITS } from "@/lib/limits";

/**
 * Where someone types.
 *
 * Enter sends and Shift+Enter makes a new line, which is what every messaging
 * app has taught people to expect. The field grows to a few lines and then
 * scrolls, so a long message never pushes the conversation off screen.
 */
export function Composer({
  disabled,
  placeholder,
  onSend,
}: {
  disabled: boolean;
  placeholder: string;
  onSend: (message: string) => void;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = (): void => {
    const message = value.trim();
    if (message.length === 0 || disabled) return;
    onSend(message);
    setValue("");
    if (ref.current !== null) ref.current.style.height = "auto";
  };

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <textarea
        ref={ref}
        value={value}
        rows={1}
        maxLength={LIMITS.maxInputChars}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="What's going on?"
        onChange={(event) => {
          setValue(event.target.value);
          const element = event.target;
          element.style.height = "auto";
          element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
      />
      <button type="submit" className="primary" disabled={disabled || value.trim().length === 0}>
        Send
      </button>
    </form>
  );
}
