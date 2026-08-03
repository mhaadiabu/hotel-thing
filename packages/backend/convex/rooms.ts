import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole } from "./lib/auth";

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
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  capacity: v.optional(v.number()),
  bedType: v.optional(v.string()),
  sizeSqm: v.optional(v.number()),
  amenities: v.optional(v.array(v.string())),
  imageUrls: v.optional(v.array(v.string())),
  status: roomStatus,
});

export const listAvailable = query({
  args: {},
  returns: v.array(roomValidator),
  handler: async (ctx) => {
    return await ctx.db
      .query("rooms")
      .withIndex("by_status", (q) => q.eq("status", "Available"))
      .take(100);
  },
});

export const list = query({
  args: {},
  returns: v.array(roomValidator),
  handler: async (ctx) => {
    return await ctx.db.query("rooms").withIndex("by_roomNumber").collect();
  },
});

export const get = query({
  args: { roomId: v.id("rooms") },
  returns: v.union(roomValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get("rooms", args.roomId);
  },
});

export const getAvailable = query({
  args: { roomId: v.id("rooms") },
  returns: v.union(roomValidator, v.null()),
  handler: async (ctx, args) => {
    const room = await ctx.db.get("rooms", args.roomId);
    return room?.status === "Available" ? room : null;
  },
});

export const create = mutation({
  args: {
    roomNumber: v.string(),
    type: v.string(),
    nightlyRate: v.number(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    capacity: v.optional(v.number()),
    bedType: v.optional(v.string()),
    sizeSqm: v.optional(v.number()),
    amenities: v.optional(v.array(v.string())),
  },
  returns: v.id("rooms"),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    return await ctx.db.insert("rooms", {
      roomNumber: args.roomNumber,
      type: args.type,
      nightlyRate: args.nightlyRate,
      name: args.name,
      description: args.description,
      capacity: args.capacity,
      bedType: args.bedType,
      sizeSqm: args.sizeSqm,
      amenities: args.amenities,
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
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    capacity: v.optional(v.number()),
    bedType: v.optional(v.string()),
    sizeSqm: v.optional(v.number()),
    amenities: v.optional(v.array(v.string())),
    imageUrls: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const { roomId, ...updates } = args;
    const patch: typeof updates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        Object.assign(patch, { [key]: value });
      }
    }
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
