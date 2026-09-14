/**
 * The safety classifier, whichever provider is configured.
 *
 * A dispatcher and nothing else. The rubric, the schema and the parser are
 * shared (`classifier-contract.ts`); only the wire format differs, and each
 * adapter owns exactly that.
 *
 * The contract both adapters must honour: **null on any failure**, which the
 * gate reads as "could not run" and never as "no risk".
 */
import type { ClassifierReading } from "@/core/safety/merge";

import { classifyWithAnthropic } from "./anthropic/classify";
import { classifyWithGoogle } from "./google/classify";
import { aiProvider } from "./models";

export async function classifyMessage(
  message: string,
  requestId: string,
): Promise<ClassifierReading | null> {
  return aiProvider() === "anthropic"
    ? classifyWithAnthropic(message, requestId)
    : classifyWithGoogle(message, requestId);
}
