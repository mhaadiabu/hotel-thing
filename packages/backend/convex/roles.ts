"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { createClerkClient } from "@clerk/backend";

import { ConvexError } from "convex/values";

const VALID_ROLES = ["admin", "staff", "guest"] as const;
type Role = (typeof VALID_ROLES)[number];

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
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const roleClaim = (identity?.publicMetadata as { role?: string } | null)?.role;
    if (!identity || roleClaim !== "admin") {
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
    const roleClaim = (identity?.publicMetadata as { role?: string } | null)?.role;
    if (!identity || roleClaim !== "admin") {
      throw new ConvexError({ code: "FORBIDDEN", message: "Admin required." });
    }
    const clerk = getClerk();
    const currentUserId = identity.subject;
    const target = await clerk.users.getUser(args.userId);
    const targetRole = readRole((target.publicMetadata as { role?: unknown } | null)?.role);

    if (targetRole === "admin" && args.role !== "admin") {
      throw new ConvexError({
        code: "SOLE_ADMIN",
        message: "The only admin account cannot be reassigned.",
      });
    }

    if (args.role === "admin" && args.userId !== currentUserId) {
      throw new ConvexError({
        code: "SOLE_ADMIN",
        message: "This hotel is configured for one admin account.",
      });
    }
    await clerk.users.updateUserMetadata(args.userId, {
      publicMetadata: { role: args.role },
    });
    return null;
  },
});
