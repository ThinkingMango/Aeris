import { helplines } from "../../../content/helplines";
import { GhostButton, TextLink } from "@/components/aeris-primitives";

const supportResources = [
  helplines.workplaceAdvice,
  helplines.unionOrEAP,
  helplines.employmentLaw,
];

export default function MorePage() {
  return (
    <main className="app-main" aria-labelledby="more-heading">
      <h1 id="more-heading" className="screen-heading font-serif">
        This tool helps you prepare. It can&apos;t fix how you&apos;re being treated.
      </h1>

      <p className="screen-copy">
        If you&apos;re facing bullying, discrimination or an unsafe workload, these can help:
      </p>

      <ul className="resource-list" aria-label="Workplace support resources">
        {supportResources.map(({ label, url }) => (
          <li key={label}>
            {url ? (
              <a className="resource-row" href={url}>
                {label}
              </a>
            ) : (
              <span className="resource-row is-unlinked">{label}</span>
            )}
          </li>
        ))}
      </ul>

      <div className="route-actions route-actions-stack">
        <TextLink href="/help">If you&apos;re not safe, get help now</TextLink>
        <GhostButton href="/reset">Back to the reset</GhostButton>
      </div>
    </main>
  );
}
