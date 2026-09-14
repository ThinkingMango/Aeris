"use client";

import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { useCallback, useState } from "react";

export interface PlanPanelProps {
  readonly plan: string;
  readonly isPaid: boolean;
  readonly used: number;
  readonly limit: number | null;
  readonly resetsAt: string;
  readonly renewsAt: string | null;
  readonly cancelAtPeriodEnd: boolean;
  readonly priceId: string | null;
  readonly clientToken: string | null;
  readonly environment: "sandbox" | "production";
  readonly priceLabel: string;
}

/**
 * The plan, and the one button that changes it.
 *
 * Two rules this screen follows, both from `docs/01`. It never implies that
 * someone's wellbeing depends on paying, and it never hides what they still
 * have — which on the free tier is every exercise, the delay timer and every
 * safety path, and always will be.
 *
 * Paddle.js is loaded on demand rather than in the layout, so the checkout
 * script is never fetched by someone who is here to read their usage.
 */
export function PlanPanel(props: PlanPanelProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upgrade = useCallback(async (): Promise<void> => {
    if (props.clientToken === null || props.priceId === null) return;
    setBusy(true);
    setError(null);
    try {
      // The transaction is created server-side so the account it belongs to is
      // decided by the session cookie, not by anything this page could set.
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ priceId: props.priceId }),
      });
      if (!response.ok) throw new Error("checkout");
      const body = (await response.json()) as { transactionId?: string };
      if (body.transactionId === undefined) throw new Error("checkout");

      const paddle: Paddle | undefined = await initializePaddle({
        environment: props.environment,
        token: props.clientToken,
      });
      if (paddle === undefined) throw new Error("paddle");
      paddle.Checkout.open({ transactionId: body.transactionId });
    } catch {
      setError("Checkout couldn't open. Nothing has been charged.");
    } finally {
      setBusy(false);
    }
  }, [props.clientToken, props.priceId, props.environment]);

  const manage = useCallback(async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      if (!response.ok) throw new Error("portal");
      const body = (await response.json()) as { url?: string };
      if (body.url === undefined) throw new Error("portal");
      window.location.href = body.url;
    } catch {
      setError("Couldn't open billing just now. Your plan hasn't changed.");
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <div className="panel">
      <h2>Your plan</h2>
      <p className="plan-name">{props.isPaid ? "Aeris Plus" : "Free"}</p>

      {props.limit === null ? (
        <p>Guided conversations: unlimited.</p>
      ) : (
        <p>
          Guided conversations this month: {props.used} of {props.limit}. Resets{" "}
          {formatDate(props.resetsAt)}.
        </p>
      )}

      {props.cancelAtPeriodEnd && props.renewsAt !== null ? (
        <p className="confirm">
          Cancelled. You keep everything until {formatDate(props.renewsAt)}.
        </p>
      ) : null}

      {props.isPaid && !props.cancelAtPeriodEnd && props.renewsAt !== null ? (
        <p className="note">Renews {formatDate(props.renewsAt)}.</p>
      ) : null}

      <div className="row">
        {props.isPaid ? (
          <button className="primary" onClick={manage} disabled={busy}>
            Manage billing
          </button>
        ) : props.clientToken !== null && props.priceId !== null ? (
          <button className="primary" onClick={upgrade} disabled={busy}>
            {busy ? "Opening…" : `Upgrade — ${props.priceLabel}`}
          </button>
        ) : null}
      </div>

      {error !== null ? <p className="note">{error}</p> : null}

      <p className="note">
        Every exercise, the delay timer and every way of reaching support are on the free plan and
        always will be. Plus adds unlimited guided conversations, your full history and the
        anxiety map.
      </p>
    </div>
  );
}

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "soon";
  return parsed.toLocaleDateString(undefined, { day: "numeric", month: "long" });
}
