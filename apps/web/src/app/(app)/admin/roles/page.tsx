"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useAction } from "convex/react";
import { api } from "@hotel/backend/convex/_generated/api";
import { Badge } from "@hotel/ui/components/badge";
import { Card } from "@hotel/ui/components/card";
import { Skeleton } from "@hotel/ui/components/skeleton";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hotel/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@hotel/ui/components/table";
import { type Role } from "@hotel/backend/convex/lib/roles";

import { InlineAlert } from "@/components/inline-alert";
import { getAppError } from "@/lib/app-error";
import { RoleGate } from "@/components/role-gate";

const ROLES = ["admin", "staff", "guest"] as const;

type UserRow = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: string;
  isPrimaryAdmin: boolean;
};

export default function RolesPage() {
  return (
    <RoleGate allow={["admin"]}>
      <RolesView />
    </RoleGate>
  );
}

function RolesView() {
  const { user } = useUser();
  const listUsers = useAction(api.roles.list);
  const setUserRole = useAction(api.roles.setRole);
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentUser = users?.find((item) => item.id === user?.id);
  const canManageAdmins = currentUser?.isPrimaryAdmin === true;

  useEffect(() => {
    void listUsers({})
      .then((result) => setUsers(result as UserRow[]))
      .catch((error: unknown) =>
        setError(getAppError(error, "The user list could not be loaded. Try again.").message),
      );
  }, [listUsers]);

  async function handleRoleChange(userId: string, role: Role) {
    setPendingId(userId);
    setError(null);
    try {
      await setUserRole({ userId, role });
      setUsers((prev) => (prev ? prev.map((u) => (u.id === userId ? { ...u, role } : u)) : prev));
    } catch (error: unknown) {
      setError(getAppError(error, "The role could not be updated. Try again.").message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">Access</p>
          <h1 className="mt-1 text-balance font-heading text-3xl font-semibold">Roles</h1>
          <p className="mt-2 max-w-2xl text-pretty text-sm text-muted-foreground">
            Admins can manage hotel operations. Only the primary admin can add or remove admins.
          </p>
        </div>
        <div className="grid gap-6">
          {error ? <InlineAlert title="Access was not updated" description={error} /> : null}
          {users === null ? (
            <Skeleton className="h-40 w-full" />
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <>
              <div className="grid gap-3 md:hidden">
                {users.map((userRow) => {
                  const name =
                    `${userRow.firstName ?? ""} ${userRow.lastName ?? ""}`.trim() || "Not provided";
                  const isProtectedAdmin =
                    userRow.isPrimaryAdmin || (userRow.role === "admin" && !canManageAdmins);

                  return (
                    <Card key={userRow.id} size="sm" className="shadow-sm">
                      <div className="min-w-0 px-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{name}</p>
                          {userRow.isPrimaryAdmin ? (
                            <Badge variant="secondary">Primary admin</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 break-all text-xs text-muted-foreground">
                          {userRow.email ?? "Not provided"}
                        </p>
                      </div>
                      <div className="border-t px-4 pt-4">
                        <RoleSelect
                          userRow={userRow}
                          disabled={pendingId === userRow.id || isProtectedAdmin}
                          canManageAdmins={canManageAdmins}
                          onChange={handleRoleChange}
                          className="w-full"
                        />
                      </div>
                    </Card>
                  );
                })}
              </div>
              <Card className="mt-2 hidden overflow-hidden py-0 shadow-sm md:flex">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => {
                        const name =
                          `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Not provided";
                        const isProtectedAdmin =
                          u.isPrimaryAdmin || (u.role === "admin" && !canManageAdmins);
                        return (
                          <TableRow key={u.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {name}
                                {u.isPrimaryAdmin ? (
                                  <Badge variant="secondary">Primary admin</Badge>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground text-xs">
                              {u.email ?? "Not provided"}
                            </TableCell>
                            <TableCell>
                              <RoleSelect
                                userRow={u}
                                disabled={pendingId === u.id || isProtectedAdmin}
                                canManageAdmins={canManageAdmins}
                                onChange={handleRoleChange}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function RoleSelect({
  userRow,
  disabled,
  canManageAdmins,
  onChange,
  className = "w-32",
}: {
  userRow: UserRow;
  disabled: boolean;
  canManageAdmins: boolean;
  onChange: (userId: string, role: Role) => Promise<void>;
  className?: string;
}) {
  return (
    <Select
      value={userRow.role}
      disabled={disabled}
      onValueChange={(value) => {
        if (value) void onChange(userRow.id, value as Role);
      }}
    >
      <SelectTrigger
        size="sm"
        className={className}
        aria-label={`Role for ${userRow.email ?? "user"}`}
      >
        <SelectValue>{userRow.role.charAt(0).toUpperCase() + userRow.role.slice(1)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {ROLES.map((role) => (
            <SelectItem key={role} value={role} disabled={role === "admin" && !canManageAdmins}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
