"use client";

import { GENERIC_CRISIS_GUIDANCE, type CrisisResource } from "@/core/copy";

/**
 * Support options, shown when the safety gate has taken over the turn.
 *
 * Never behind a plan, never rate limited, and never showing a number for a
 * country we do not have a verified source for — a wrong emergency number is
 * worse than none, so an uncovered country gets guidance instead of a guess.
 */
export function CrisisPanel({
  resources,
}: {
  resources: readonly CrisisResource[];
}) {
  if (resources.length === 0) {
    return (
      <aside className="crisis">
        <p>{GENERIC_CRISIS_GUIDANCE}</p>
      </aside>
    );
  }

  return (
    <aside className="crisis">
      <h3>People who can help right now</h3>
      <ul>
        {resources.map((resource) => (
          <li key={`${resource.countryCode}-${resource.label}-${resource.value}`}>
            <strong>{resource.label}</strong>
            <span className="crisis-value">{resource.value}</span>
            <span className="muted">{resource.availability}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
