import type { FeatureKey, PlanId } from "@/domain";

/** Paywalls are decided here, never by checking plan names in feature code. */
export const PLAN_FEATURES: Record<PlanId, readonly FeatureKey[]> = {
  free: [],
  pro: ["multiProfile", "userMarkers", "cloudSync", "adFree", "customImages", "netWorth"],
};

export function can(plan: PlanId, feature: FeatureKey): boolean {
  return PLAN_FEATURES[plan].includes(feature);
}
