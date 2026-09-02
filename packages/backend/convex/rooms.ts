import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { requireRole } from "./lib/auth";

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireRole(ctx, ["admin"]);
    return await ctx.storage.generateUploadUrl();
  },
});

export const discardUploads = mutation({
  args: { storageIds: v.array(v.id("_storage")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    for (const id of args.storageIds) await ctx.storage.delete(id);
    return null;
  },
});

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
  imageStorageIds: v.optional(v.array(v.id("_storage"))),
  status: roomStatus,
});

export const listAvailable = query({
  args: {},
  returns: v.array(roomValidator),
  handler: async (ctx) => {
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_status", (q) => q.eq("status", "Available"))
      .take(100);
    return await withImageUrls(ctx, rooms);
  },
});

export const list = query({
  args: {},
  returns: v.array(roomValidator),
  handler: async (ctx) => {
    await requireRole(ctx, ["staff", "admin"]);
    return await withImageUrls(
      ctx,
      await ctx.db.query("rooms").withIndex("by_roomNumber").collect(),
    );
  },
});

export const get = query({
  args: { roomId: v.id("rooms") },
  returns: v.union(roomValidator, v.null()),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["staff", "admin"]);
    const room = await ctx.db.get("rooms", args.roomId);
    return room ? (await withImageUrls(ctx, [room]))[0] : null;
  },
});

export const getAvailable = query({
  args: { roomId: v.string() },
  returns: v.union(roomValidator, v.null()),
  handler: async (ctx, args) => {
    const roomId = ctx.db.normalizeId("rooms", args.roomId);
    if (!roomId) return null;
    const room = await ctx.db.get("rooms", roomId);
    return room?.status === "Available" ? (await withImageUrls(ctx, [room]))[0] : null;
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
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
  },
  returns: v.id("rooms"),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const existing = await ctx.db
      .query("rooms")
      .withIndex("by_roomNumber", (q) => q.eq("roomNumber", args.roomNumber))
      .unique();
    if (existing) throw new Error(`Room ${args.roomNumber} already exists.`);
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
      imageStorageIds: args.imageStorageIds,
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
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const previous = await ctx.db.get("rooms", args.roomId);
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
    if (args.imageStorageIds && previous?.imageStorageIds) {
      for (const id of previous.imageStorageIds) {
        if (!args.imageStorageIds.includes(id)) await ctx.storage.delete(id);
      }
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
    const today = new Date().toISOString().slice(0, 10);
    const reservations = await ctx.db
      .query("reservations")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    if (
      reservations.some(
        (reservation) => reservation.status === "confirmed" && reservation.checkOut > today,
      )
    ) {
      throw new ConvexError({
        code: "ROOM_HAS_RESERVATIONS",
        message: "This room has an active or upcoming reservation and cannot be deleted.",
      });
    }
    const room = await ctx.db.get("rooms", args.roomId);
    for (const id of room?.imageStorageIds ?? []) await ctx.storage.delete(id);
    await ctx.db.delete("rooms", args.roomId);
    return null;
  },
});

async function withImageUrls(ctx: QueryCtx, rooms: Doc<"rooms">[]) {
  return await Promise.all(
    rooms.map(async (room) => ({
      ...room,
      imageUrls: room.imageStorageIds
        ? (await Promise.all(room.imageStorageIds.map((id) => ctx.storage.getUrl(id)))).filter(
            (url): url is string => url !== null,
          )
        : room.imageUrls,
    })),
  );
}
