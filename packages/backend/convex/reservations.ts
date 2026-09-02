import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireAuth, requireRole } from "./lib/auth";

const reservationStatus = v.union(
  v.literal("confirmed"),
  v.literal("cancelled"),
  v.literal("completed"),
);
const paymentMethod = v.union(v.literal("card"), v.literal("mobile_money"));

const reservationValidator = v.object({
  _id: v.id("reservations"),
  _creationTime: v.number(),
  roomId: v.id("rooms"),
  guestTokenIdentifier: v.string(),
  guestName: v.optional(v.string()),
  guestEmail: v.optional(v.string()),
  checkIn: v.string(),
  checkOut: v.string(),
  guestCount: v.number(),
  totalAmount: v.number(),
  status: reservationStatus,
  createdAt: v.number(),
});

const paymentValidator = v.object({
  _id: v.id("payments"),
  _creationTime: v.number(),
  reservationId: v.id("reservations"),
  guestTokenIdentifier: v.string(),
  amount: v.number(),
  method: paymentMethod,
  status: v.literal("succeeded"),
  createdAt: v.number(),
});

function parseDate(value: string): number {
  return Date.parse(`${value}T12:00:00Z`);
}

export const create = mutation({
  args: {
    roomId: v.id("rooms"),
    checkIn: v.string(),
    checkOut: v.string(),
    guestCount: v.number(),
    paymentMethod,
  },
  returns: v.id("reservations"),
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const room = await ctx.db.get("rooms", args.roomId);

    if (!room || room.status !== "Available") {
      throw new ConvexError({
        code: "ROOM_UNAVAILABLE",
        message: "This room is no longer available.",
      });
    }

    const checkInTime = parseDate(args.checkIn);
    const checkOutTime = parseDate(args.checkOut);
    const nights = Math.round((checkOutTime - checkInTime) / 86_400_000);
    const capacity = room.capacity ?? 2;

    if (!Number.isFinite(checkInTime) || !Number.isFinite(checkOutTime) || nights < 1) {
      throw new ConvexError({
        code: "INVALID_DATES",
        message: "Check-out must be at least one night after check-in.",
      });
    }

    if (!Number.isInteger(args.guestCount) || args.guestCount < 1 || args.guestCount > capacity) {
      throw new ConvexError({
        code: "INVALID_GUEST_COUNT",
        message: `This room accommodates up to ${capacity} guests.`,
      });
    }

    const existing = await ctx.db
      .query("reservations")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .take(200);
    const overlaps = existing.some((reservation) => {
      if (reservation.status === "cancelled") return false;
      return args.checkIn < reservation.checkOut && args.checkOut > reservation.checkIn;
    });

    if (overlaps) {
      throw new ConvexError({
        code: "DATES_UNAVAILABLE",
        message: "Those dates are already reserved. Choose another stay.",
      });
    }

    const createdAt = Date.now();
    const totalAmount = room.nightlyRate * nights;
    const reservationId = await ctx.db.insert("reservations", {
      roomId: args.roomId,
      guestTokenIdentifier: identity.tokenIdentifier,
      guestName: identity.name,
      guestEmail: identity.email,
      checkIn: args.checkIn,
      checkOut: args.checkOut,
      guestCount: args.guestCount,
      totalAmount,
      status: "confirmed",
      createdAt,
    });
    await ctx.db.insert("payments", {
      reservationId,
      guestTokenIdentifier: identity.tokenIdentifier,
      amount: totalAmount,
      method: args.paymentMethod,
      status: "succeeded",
      createdAt,
    });
    return reservationId;
  },
});

export const mine = query({
  args: {},
  returns: v.array(
    v.object({
      reservation: reservationValidator,
      payment: v.union(paymentValidator, v.null()),
      room: v.union(
        v.object({
          _id: v.id("rooms"),
          roomNumber: v.string(),
          type: v.string(),
          name: v.optional(v.string()),
        }),
        v.null(),
      ),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const reservations = await ctx.db
      .query("reservations")
      .withIndex("by_guest", (q) => q.eq("guestTokenIdentifier", identity.tokenIdentifier))
      .order("desc")
      .take(50);
    return await Promise.all(
      reservations.map(async (reservation) => {
        const room = await ctx.db.get("rooms", reservation.roomId);
        const payment = await ctx.db
          .query("payments")
          .withIndex("by_reservationId", (q) => q.eq("reservationId", reservation._id))
          .unique();
        return {
          reservation,
          payment,
          room: room
            ? {
                _id: room._id,
                roomNumber: room.roomNumber,
                type: room.type,
                name: room.name,
              }
            : null,
        };
      }),
    );
  },
});

export const listForAdmin = query({
  args: {},
  returns: v.array(
    v.object({
      reservation: reservationValidator,
      payment: v.union(paymentValidator, v.null()),
      room: v.union(
        v.object({
          _id: v.id("rooms"),
          roomNumber: v.string(),
          type: v.string(),
          name: v.optional(v.string()),
        }),
        v.null(),
      ),
    }),
  ),
  handler: async (ctx) => {
    await requireRole(ctx, ["admin"]);
    const reservations = await ctx.db.query("reservations").order("desc").take(200);
    return await Promise.all(
      reservations.map(async (reservation) => {
        const room = await ctx.db.get("rooms", reservation.roomId);
        const payment = await ctx.db
          .query("payments")
          .withIndex("by_reservationId", (q) => q.eq("reservationId", reservation._id))
          .unique();
        return {
          reservation,
          payment,
          room: room
            ? { _id: room._id, roomNumber: room.roomNumber, type: room.type, name: room.name }
            : null,
        };
      }),
    );
  },
});
