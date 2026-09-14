import Link from "next/link";

import { usageAndAccessFor } from "@/server/billing/access";
import { billingConfig } from "@/server/billing/config";
import { PAID_STATUSES } from "@/core/entitlements";
import { IdentityForm } from "@/components/account/identity-form";
import { PlanPanel } from "@/components/account/plan-panel";
import { isSupabaseConfigured } from "@/server/supabase/config";
import { currentUser, supabaseReadOnlyClient } from "@/server/supabase/server";
import { viewerId } from "@/server/http";

export const dynamic = "force-dynamic";

/**
 * The account.
 *
 * Read-only and never creates anything: someone who has not used Aeris yet
 * sees a way in rather than an account minted by visiting a URL.
 */
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const userId = await viewerId();

  if (userId === null) {
    return (
      <main>
        <h1>Your account</h1>
        <p>There is nothing here yet. An account is created the first time you use Aeris.</p>
        <div className="row">
          <Link className="primary" href="/help">
            Help me now
          </Link>
        </div>
      </main>
    );
  }

  const user = isSupabaseConfigured() ? await currentUser(await supabaseReadOnlyClient()) : null;
  const { plan, status, usage, subscription } = await usageAndAccessFor(userId);
  const config = billingConfig();

  const isPaid = plan !== "free" && PAID_STATUSES.includes(status);
  const priceId = process.env["PADDLE_PRICE_PLUS_MONTHLY"] ?? null;

  return (
    <main>
      <h1>Your account</h1>

      {query["verified"] === "1" ? (
        <p className="confirm">Email confirmed. This account is yours now.</p>
      ) : null}
      {query["verified"] === "failed" ? (
        <p className="note">That link didn&rsquo;t work — it may have expired. Try sending another.</p>
      ) : null}

      <IdentityForm
        hasEmail={user?.email != null && user.isAnonymous === false}
        email={user?.email ?? null}
      />

      <PlanPanel
        plan={plan}
        isPaid={isPaid}
        used={usage.used}
        limit={usage.limit}
        resetsAt={usage.resetsAt}
        renewsAt={subscription?.currentPeriodEnd?.toISOString() ?? null}
        cancelAtPeriodEnd={subscription?.cancelAtPeriodEnd ?? false}
        priceId={priceId}
        clientToken={config.enabled && config.clientToken.length > 0 ? config.clientToken : null}
        environment={config.environment}
        priceLabel={process.env["NEXT_PUBLIC_PLUS_PRICE_LABEL"] ?? "US$12/month"}
      />

      <div className="panel">
        <h2>Your data</h2>
        <p>
          Exporting everything and deleting your account are on every plan, including after a
          subscription ends. They are never behind a payment.
        </p>
      </div>

      <p className="note">
        <Link href="/">Back to Aeris</Link>
      </p>
    </main>
  );
}
