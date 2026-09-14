"use client";

import { getIntervention, type InterventionSlug } from "@/core/interventions/catalog";

/**
 * The offer.
 *
 * Declining is a plain button of equal weight, not a link hidden underneath.
 * An exercise someone felt pushed into is worse than no exercise, and it
 * poisons the effectiveness data that "what helps you" is built from.
 */
export function InterventionCard({
  slug,
  helpedBefore,
  onStart,
  onDecline,
}: {
  slug: InterventionSlug;
  helpedBefore: boolean;
  onStart: () => void;
  onDecline: () => void;
}) {
  const intervention = getIntervention(slug);

  return (
    <aside className="offer">
      <h3>{intervention.title}</h3>
      <p>{intervention.intro}</p>
      <p className="muted">{intervention.duration}</p>
      {helpedBefore ? <p className="evidence">This one has helped you before.</p> : null}
      <div className="row">
        <button type="button" className="primary" onClick={onStart}>
          Start
        </button>
        <button type="button" className="ghost" onClick={onDecline}>
          Not this
        </button>
      </div>
    </aside>
  );
}
