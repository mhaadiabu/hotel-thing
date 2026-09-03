import { ConvexError } from "convex/values";

const ERROR_MESSAGES = {
  CHECK_IN_IN_PAST: "Choose today or a later date for check-in.",
  DATES_UNAVAILABLE: "Choose different check-in and check-out dates.",
  FORBIDDEN: "You do not have permission to do that.",
  INVALID_DATES: "Choose a valid check-in and check-out date.",
  INVALID_DETAILS: "Enter between 3 and 500 characters.",
  INVALID_GUEST_COUNT: "Choose a guest count that fits this room.",
  PRIMARY_ADMIN: "The primary admin cannot be reassigned.",
  PRIMARY_ADMIN_REQUIRED: "Only the primary admin can manage admin access.",
  ROOM_HAS_RESERVATIONS: "This room has an active or upcoming reservation and cannot be deleted.",
  ROOM_NUMBER_EXISTS: "A room with this number already exists. Choose another room number.",
  ROOM_UNAVAILABLE: "This room is no longer available. Choose another room.",
  STAY_NOT_ACTIVE: "You can request help between check-in and check-out.",
  UNAUTHENTICATED: "Your session has expired. Sign in again and retry.",
} as const;

export type AppErrorCode = keyof typeof ERROR_MESSAGES;

export type AppError = {
  code: AppErrorCode | null;
  message: string;
};

function readErrorCode(error: unknown): AppErrorCode | null {
  if (!(error instanceof ConvexError)) return null;
  if (typeof error.data !== "object" || error.data === null || !("code" in error.data)) return null;

  const code = error.data.code;
  return typeof code === "string" && code in ERROR_MESSAGES ? (code as AppErrorCode) : null;
}

/** Converts backend errors into copy that is safe to show in the interface. */
export function getAppError(error: unknown, fallback: string): AppError {
  const code = readErrorCode(error);
  return {
    code,
    message: code ? ERROR_MESSAGES[code] : fallback,
  };
}
