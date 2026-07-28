import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireRole } from "./lib/auth";

const roomStatus = v.union(
  v.literal("Available"),
  v.literal("Occupied"),
  v.literal("Maintenance"),
  v.literal("Dirty"),
);

const roomValidator = v.object({
  _id: v.id("rooms"),
  _creationTime: v.number(),
  roomNumber: v.string(),
  type: v.string(),
  nightlyRate: v.number(),
  status: roomStatus,
});

export const list = query({
  args: {},
  returns: v.array(roomValidator),
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.db.query("rooms").withIndex("by_roomNumber").collect();
  },
});

export const get = query({
  args: { roomId: v.id("rooms") },
  returns: v.union(roomValidator, v.null()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get("rooms", args.roomId);
  },
});

export const create = mutation({
  args: {
    roomNumber: v.string(),
    type: v.string(),
    nightlyRate: v.number(),
  },
  returns: v.id("rooms"),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    return await ctx.db.insert("rooms", {
      roomNumber: args.roomNumber,
      type: args.type,
      nightlyRate: args.nightlyRate,
      status: "Available",
    });
  },
});

export const update = mutation({
  args: {
    roomId: v.id("rooms"),
    roomNumber: v.optional(v.string()),
    type: v.optional(v.string()),
    nightlyRate: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const { roomId, roomNumber, type, nightlyRate } = args;
    const patch: { roomNumber?: string; type?: string; nightlyRate?: number } = {};
    if (roomNumber !== undefined) patch.roomNumber = roomNumber;
    if (type !== undefined) patch.type = type;
    if (nightlyRate !== undefined) patch.nightlyRate = nightlyRate;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch("rooms", roomId, patch);
    }
    return null;
  },
});

export const updateStatus = mutation({
  args: {
    roomId: v.id("rooms"),
    status: roomStatus,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    await ctx.db.patch("rooms", args.roomId, { status: args.status });
    return null;
  },
});

export const remove = mutation({
  args: { roomId: v.id("rooms") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    await ctx.db.delete("rooms", args.roomId);
    return null;
  },
});
