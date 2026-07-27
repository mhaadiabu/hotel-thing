import { v } from "convex/values";
import { query } from "./_generated/server";
import { readRole } from "./lib/auth";

export const me = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      tokenIdentifier: v.string(),
      role: v.union(v.literal("guest"), v.literal("staff"), v.literal("admin")),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return {
      tokenIdentifier: identity.tokenIdentifier,
      role: readRole(identity),
    };
  },
});
