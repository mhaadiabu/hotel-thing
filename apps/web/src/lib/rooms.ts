export type PublicRoom = {
  _id: string;
  roomNumber: string;
  type: string;
  nightlyRate: number;
  name?: string;
  description?: string;
  capacity?: number;
  bedType?: string;
  sizeSqm?: number;
  amenities?: string[];
  imageUrls?: string[];
};

const DEFAULT_AMENITIES = [
  "Breakfast included",
  "High-speed Wi-Fi",
  "Air conditioning",
  "Daily housekeeping",
];

export function getRoomPresentation(room: PublicRoom) {
  const normalizedType = room.type.trim().toLowerCase();
  const isSuite = normalizedType.includes("suite");
  const isTwin = normalizedType.includes("twin");
  const isFamily = normalizedType.includes("family");

  return {
    name: room.name?.trim() || `${room.type} ${room.roomNumber}`,
    description:
      room.description?.trim() ||
      "A considered, comfortable room with everything you need for an easy stay.",
    capacity: room.capacity ?? (isFamily ? 4 : isSuite ? 3 : 2),
    bedType: room.bedType?.trim() || (isTwin ? "Two single beds" : "One queen bed"),
    sizeSqm: room.sizeSqm ?? (isSuite ? 44 : isFamily ? 38 : 28),
    amenities: room.amenities?.length ? room.amenities : DEFAULT_AMENITIES,
  };
}

export function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const start = Date.parse(`${checkIn}T12:00:00Z`);
  const end = Date.parse(`${checkOut}T12:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.round((end - start) / 86_400_000));
}
