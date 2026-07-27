import { ConvexError } from "convex/values";
import type { UserIdentity } from "convex/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { isRole, type Role } from "./roles";

type AuthCtx = QueryCtx | MutationCtx;

export function readRole(identity: UserIdentity | null) {
  if (!identity) return "guest" as const;
  const meta = (identity as { publicMetadata?: unknown }).publicMetadata;
  if (meta !== null && typeof meta === "object") {
    const role = (meta as Record<string, unknown>).role;
    if (isRole(role)) return role;
  }
  return "guest" as const;
}

export async function requireAuth(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "You must be signed in." });
  }
  return identity;
}

export async function getRole(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity();
  return readRole(identity);
}

export async function requireRole(ctx: AuthCtx, allowed: readonly Role[]) {
  const identity = await requireAuth(ctx);
  const role = readRole(identity);
  if (!allowed.includes(role)) {
    throw new ConvexError({ code: "FORBIDDEN", message: "You do not have access." });
  }
  return { identity, role };
}
