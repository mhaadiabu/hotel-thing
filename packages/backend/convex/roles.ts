"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { createClerkClient } from "@clerk/backend";

import { ConvexError } from "convex/values";

const VALID_ROLES = ["admin", "staff", "guest"] as const;
type Role = (typeof VALID_ROLES)[number];

function readIdentityRole(identity: Record<string, unknown> | null): Role {
  return readRole(identity?.hotel_role ?? identity?.role);
}

function isPrimaryAdmin(identity: Record<string, unknown> | null): boolean {
  return identity?.hotel_primary_admin === true;
}

function readRole(value: unknown): Role {
  if (value === "admin" || value === "staff" || value === "guest") {
    return value;
  }
  return "guest";
}

function getClerk() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY is not set");
  }
  return createClerkClient({ secretKey });
}

export const list = action({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.optional(v.string()),
      role: v.string(),
      isPrimaryAdmin: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || readIdentityRole(identity) !== "admin") {
      throw new ConvexError({ code: "FORBIDDEN", message: "Admin required." });
    }
    const clerk = getClerk();
    const res = await clerk.users.getUserList({ limit: 100 });
    return res.data.map((u) => ({
      id: u.id,
      firstName: u.firstName ?? undefined,
      lastName: u.lastName ?? undefined,
      email: u.emailAddresses[0]?.emailAddress ?? undefined,
      role: readRole((u.publicMetadata as { role?: unknown } | null)?.role),
      isPrimaryAdmin:
        (u.publicMetadata as { primaryAdmin?: unknown } | null)?.primaryAdmin === true,
    }));
  },
});

export const setRole = action({
  args: {
    userId: v.string(),
    role: v.union(v.literal("admin"), v.literal("staff"), v.literal("guest")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || readIdentityRole(identity) !== "admin") {
      throw new ConvexError({ code: "FORBIDDEN", message: "Admin required." });
    }
    const clerk = getClerk();
    const target = await clerk.users.getUser(args.userId);
    const targetRole = readRole((target.publicMetadata as { role?: unknown } | null)?.role);
    const targetIsPrimary =
      (target.publicMetadata as { primaryAdmin?: unknown } | null)?.primaryAdmin === true;
    const actorIsPrimary = isPrimaryAdmin(identity);

    if (targetIsPrimary && args.role !== "admin") {
      throw new ConvexError({
        code: "PRIMARY_ADMIN",
        message: "The primary admin cannot be reassigned.",
      });
    }

    if ((args.role === "admin" || targetRole === "admin") && !actorIsPrimary) {
      throw new ConvexError({
        code: "PRIMARY_ADMIN_REQUIRED",
        message: "Only the primary admin can manage admin access.",
      });
    }
    await clerk.users.updateUserMetadata(args.userId, {
      publicMetadata: {
        ...target.publicMetadata,
        role: args.role,
      },
    });
    return null;
  },
});
