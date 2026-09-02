import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
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
  createdAt: v.number(),
});

export const create = mutation({
  args: { reservationId: v.id("reservations"), category, details: v.string() },
  returns: v.id("serviceRequests"),
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const reservation = await ctx.db.get("reservations", args.reservationId);
    if (!reservation || reservation.guestTokenIdentifier !== identity.tokenIdentifier) {
      throw new ConvexError({ code: "FORBIDDEN", message: "This stay is not linked to your account." });
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
      throw new ConvexError({ code: "INVALID_DETAILS", message: "Enter between 3 and 500 characters." });
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
  returns: v.array(requestValidator),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("serviceRequests")
      .withIndex("by_guest", (q) => q.eq("guestTokenIdentifier", identity.tokenIdentifier))
      .order("desc")
      .take(100);
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
  },
});

export const updateStatus = mutation({
  args: { requestId: v.id("serviceRequests"), status },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    await ctx.db.patch("serviceRequests", args.requestId, { status: args.status });
    return null;
  },
});
