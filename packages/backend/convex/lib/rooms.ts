export function inferRoomCapacity(type: string): number {
  const normalizedType = type.trim().toLowerCase();

  if (normalizedType.includes("family")) return 4;
  if (normalizedType.includes("suite")) return 3;
  return 2;
}
