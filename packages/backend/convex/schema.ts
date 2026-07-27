import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rooms: defineTable({
    roomNumber: v.string(),
    type: v.string(),
    nightlyRate: v.number(),
    status: v.union(
      v.literal("Available"),
      v.literal("Occupied"),
      v.literal("Maintenance"),
      v.literal("Dirty"),
    ),
  })
    .index("by_status", ["status"])
    .index("by_roomNumber", ["roomNumber"]),
});
