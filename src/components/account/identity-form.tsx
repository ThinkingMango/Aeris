"use client";

import { useState } from "react";

/**
 * Adding an email to an account that already exists.
 *
 * Worth being precise about what this is, because it is easy to mistake for a
 * sign-up form. The account is already there — it was created the moment the
 * person first pressed "Help me now" — and this attaches an address to it so
 * they can reach it from another device. The id does not change, so nothing
 * they have recorded moves anywhere.
 */
export function IdentityForm({ hasEmail, email }: { hasEmail: boolean; email: string | null }) {
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (hasEmail) {
    return (
      <div className="panel">
        <h2>Your account</h2>
        <p>
          Signed in as <strong>{email}</strong>.
        </p>
        <p className="note">
          You can open Aeris on another device by asking for a sign-in link at that address.
        </p>
      </div>
    );
  }

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setState("sending");
    const response = await fetch("/api/auth/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: value }),
    });
    setState(response.ok ? "sent" : "error");
  };

  return (
    <div className="panel">
      <h2>Keep this account</h2>
      <p>
        Everything you have recorded is already saved to this device. Adding an email keeps it if
        you clear your browser, and lets you open Aeris on your phone as well.
      </p>
      {state === "sent" ? (
        <p className="confirm">
          Check your inbox. The link confirms the address — nothing changes until you click it.
        </p>
      ) : (
        <form onSubmit={submit} className="row">
          <label className="sr-only" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={state === "sending"}
          />
          <button className="primary" type="submit" disabled={state === "sending"}>
            {state === "sending" ? "Sending…" : "Send link"}
          </button>
        </form>
      )}
      {state === "error" ? (
        <p className="note">That didn&rsquo;t send. Check the address and try again.</p>
      ) : null}
      <p className="note">
        We use it to sign you in and nothing else. No newsletters, and no email about what you
        have written.
      </p>
    </div>
  );
}
