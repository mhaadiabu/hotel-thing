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
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message:
        "Convex did not receive a Clerk identity. The Clerk JWT is not reaching Convex. In the Clerk dashboard, create a JWT template named 'convex' (audience 'convex') that maps the 'role' claim from user.publicMetadata.role. In the Convex dashboard, set the environment variable CLERK_JWT_ISSUER_DOMAIN to your Clerk Frontend API URL (for example https://clerk.your-app.com, no trailing slash).",
    });
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
