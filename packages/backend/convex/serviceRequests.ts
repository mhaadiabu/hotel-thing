import { ConvexError, v } from "convex/values";

import { mutation, query, type QueryCtx } from "./_generated/server";
import { requireAuth, requireRole } from "./lib/auth";

const category = v.union(
  v.literal("housekeeping"),
  v.literal("maintenance"),
  v.literal("amenities"),
  v.literal("other"),
);
const status = v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved"));

const requestValidator = v.object({
  _id: v.id("serviceRequests"),
  _creationTime: v.number(),
  reservationId: v.id("reservations"),
  guestTokenIdentifier: v.string(),
  category,
  details: v.string(),
  status,
  completedByTokenIdentifier: v.optional(v.string()),
  completedByName: v.optional(v.string()),
  completedAt: v.optional(v.number()),
  createdAt: v.number(),
});

const guestRequestValidator = v.object({
  _id: v.id("serviceRequests"),
  _creationTime: v.number(),
  reservationId: v.id("reservations"),
  category,
  details: v.string(),
  status,
  completedByName: v.optional(v.string()),
  completedAt: v.optional(v.number()),
  createdAt: v.number(),
});

async function listRequestsWithStay(ctx: QueryCtx) {
  const requests = await ctx.db.query("serviceRequests").order("desc").take(200);
  return await Promise.all(
    requests.map(async (request) => {
      const reservation = await ctx.db.get("reservations", request.reservationId);
      const room = reservation ? await ctx.db.get("rooms", reservation.roomId) : null;
      return {
        request,
        reservation: reservation
          ? {
              guestName: reservation.guestName,
              guestEmail: reservation.guestEmail,
              checkIn: reservation.checkIn,
              checkOut: reservation.checkOut,
            }
          : null,
        roomNumber: room?.roomNumber,
      };
    }),
  );
}

export const create = mutation({
  args: { reservationId: v.id("reservations"), category, details: v.string() },
  returns: v.id("serviceRequests"),
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const reservation = await ctx.db.get("reservations", args.reservationId);
    if (!reservation || reservation.guestTokenIdentifier !== identity.tokenIdentifier) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "This stay is not linked to your account.",
      });
    }
    const today = new Date().toISOString().slice(0, 10);
    if (
      reservation.status !== "confirmed" ||
      reservation.checkIn > today ||
      reservation.checkOut <= today
    ) {
      throw new ConvexError({
        code: "STAY_NOT_ACTIVE",
        message: "Help requests are available between check-in and check-out.",
      });
    }
    const details = args.details.trim();
    if (details.length < 3 || details.length > 500) {
      throw new ConvexError({
        code: "INVALID_DETAILS",
        message: "Enter between 3 and 500 characters.",
      });
    }
    return await ctx.db.insert("serviceRequests", {
      reservationId: args.reservationId,
      guestTokenIdentifier: identity.tokenIdentifier,
      category: args.category,
      details,
      status: "open",
      createdAt: Date.now(),
    });
  },
});

export const mine = query({
  args: {},
  returns: v.array(guestRequestValidator),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const requests = await ctx.db
      .query("serviceRequests")
      .withIndex("by_guest", (q) => q.eq("guestTokenIdentifier", identity.tokenIdentifier))
      .order("desc")
      .take(100);
    return requests.map((request) => ({
      _id: request._id,
      _creationTime: request._creationTime,
      reservationId: request.reservationId,
      category: request.category,
      details: request.details,
      status: request.status,
      completedByName: request.completedByName,
      completedAt: request.completedAt,
      createdAt: request.createdAt,
    }));
  },
});

export const listForAdmin = query({
  args: {},
  returns: v.array(
    v.object({
      request: requestValidator,
      reservation: v.union(
        v.object({
          guestName: v.optional(v.string()),
          guestEmail: v.optional(v.string()),
          checkIn: v.string(),
          checkOut: v.string(),
        }),
        v.null(),
      ),
      roomNumber: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    await requireRole(ctx, ["admin"]);
    return await listRequestsWithStay(ctx);
  },
});

export const listForStaff = query({
  args: {},
  returns: v.array(
    v.object({
      request: requestValidator,
      reservation: v.union(
        v.object({
          guestName: v.optional(v.string()),
          guestEmail: v.optional(v.string()),
          checkIn: v.string(),
          checkOut: v.string(),
        }),
        v.null(),
      ),
      roomNumber: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "staff"]);
    return await listRequestsWithStay(ctx);
  },
});

export const complete = mutation({
  args: { requestId: v.id("serviceRequests") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { identity } = await requireRole(ctx, ["admin", "staff"]);
    const request = await ctx.db.get("serviceRequests", args.requestId);
    if (!request) {
      throw new ConvexError({ code: "REQUEST_NOT_FOUND", message: "Request not found." });
    }
    if (request.status === "resolved") return null;

    const fullName = [identity.givenName, identity.familyName].filter(Boolean).join(" ");
    const completedByName =
      identity.name?.trim() ||
      fullName ||
      identity.preferredUsername ||
      identity.email ||
      `Staff · ${identity.subject.slice(-6)}`;

    await ctx.db.patch("serviceRequests", args.requestId, {
      status: "resolved",
      completedByTokenIdentifier: identity.tokenIdentifier,
      completedByName,
      completedAt: Date.now(),
    });
    return null;
  },
});

export const updateStatus = mutation({
  args: { requestId: v.id("serviceRequests"), status },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const request = await ctx.db.get("serviceRequests", args.requestId);
    if (!request) {
      throw new ConvexError({ code: "REQUEST_NOT_FOUND", message: "Request not found." });
    }
    await ctx.db.patch("serviceRequests", args.requestId, {
      status: args.status,
      ...(args.status === "resolved"
        ? {}
        : {
            completedByTokenIdentifier: undefined,
            completedByName: undefined,
            completedAt: undefined,
          }),
    });
    return null;
  },
});
