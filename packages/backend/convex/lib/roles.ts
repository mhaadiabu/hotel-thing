export type Role = "guest" | "staff" | "admin";

export const ROLES: readonly Role[] = ["guest", "staff", "admin"] as const;

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

const ROLE_HOME: Record<Role, string> = {
  admin: "/admin",
  staff: "/staff",
  guest: "/guest",
};

export function roleHomePath(role: Role): string {
  return ROLE_HOME[role];
}

const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  staff: "Staff",
  guest: "My Stay",
};

export function roleLabel(role: Role): string {
  return ROLE_LABEL[role];
}
