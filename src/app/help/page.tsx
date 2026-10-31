import { helplines } from "../../../content/helplines";
import { GhostButton, SupportButton } from "@/components/aeris-primitives";

export default function HelpPage() {
  return (
    <main className="app-main" aria-labelledby="help-heading">
      <h1 id="help-heading" className="screen-heading font-serif">
        Help is available now.
      </h1>

      <ul className="support-list" aria-label="Support options">
        <li>
          <SupportButton
            label={`Call ${helplines.emergencyNumber}`}
            number={helplines.emergencyNumber}
          />
        </li>
        <li>
          <SupportButton
            label={`Call or text ${helplines.crisisLine}`}
            number={helplines.crisisLine}
            mode="call-or-text"
          />
        </li>
        <li>
          <SupportButton
            label={`Call ${helplines.abuseLine}`}
            number={helplines.abuseLine}
          />
        </li>
      </ul>

      <p className="screen-caption">These are free and confidential.</p>

      <div className="route-actions">
        <GhostButton href="/reset">Back</GhostButton>
      </div>
    </main>
  );
}
