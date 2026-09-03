import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rooms: defineTable({
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
    status: v.union(
      v.literal("Available"),
      v.literal("Occupied"),
      v.literal("Maintenance"),
      v.literal("Dirty"),
    ),
  })
    .index("by_status", ["status"])
    .index("by_roomNumber", ["roomNumber"]),
  reservations: defineTable({
    roomId: v.id("rooms"),
    guestTokenIdentifier: v.string(),
    guestName: v.optional(v.string()),
    guestEmail: v.optional(v.string()),
    checkIn: v.string(),
    checkOut: v.string(),
    guestCount: v.number(),
    totalAmount: v.number(),
    status: v.union(v.literal("confirmed"), v.literal("cancelled"), v.literal("completed")),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_checkIn", ["roomId", "checkIn"])
    .index("by_room_status_and_checkIn", ["roomId", "status", "checkIn"])
    .index("by_room_status_and_checkOut", ["roomId", "status", "checkOut"])
    .index("by_guest", ["guestTokenIdentifier"]),
  payments: defineTable({
    reservationId: v.id("reservations"),
    guestTokenIdentifier: v.string(),
    amount: v.number(),
    method: v.union(v.literal("card"), v.literal("mobile_money")),
    status: v.literal("mock_succeeded"),
    createdAt: v.number(),
  }).index("by_reservationId", ["reservationId"]),
  serviceRequests: defineTable({
    reservationId: v.id("reservations"),
    guestTokenIdentifier: v.string(),
    category: v.union(
      v.literal("housekeeping"),
      v.literal("maintenance"),
      v.literal("amenities"),
      v.literal("other"),
    ),
    details: v.string(),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved")),
    completedByTokenIdentifier: v.optional(v.string()),
    completedByName: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_guest", ["guestTokenIdentifier"])
    .index("by_status", ["status"]),
});
