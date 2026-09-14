import Link from "next/link";

import { AI_DISCLOSURE, BOUNDARY_STATEMENT } from "@/core/copy/index";

/**
 * The landing page.
 *
 * Deliberately thin for now. It exists so the boundary statement and the AI
 * disclosure are rendered from `core/copy` rather than retyped here — the
 * words a person reads about what Aeris is should have exactly one source.
 */
export default function Home() {
  return (
    <main>
      <h1>Aeris learns your anxiety patterns and helps you interrupt them.</h1>
      <p>
        Not a meditation library. A short conversation at the moment it hits, one exercise that
        fits, and over time a plain picture of when your anxiety shows up and what actually helps.
      </p>
      <p>
        It will not tell you everything is fine. It cannot know that, and being told is what keeps
        the loop running.
      </p>
      <div className="row">
        <Link className="primary" href="/help">
          Help me now
        </Link>
      </div>

      <p className="note">
        {BOUNDARY_STATEMENT} {AI_DISCLOSURE}
      </p>
    </main>
  );
}
