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
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load users"));
  }, [listUsers]);

  async function handleRoleChange(userId: string, role: Role) {
    setPendingId(userId);
    setError(null);
    try {
      await setUserRole({ userId, role });
      setUsers((prev) => (prev ? prev.map((u) => (u.id === userId ? { ...u, role } : u)) : prev));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">Access</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold">Roles</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Admins can manage hotel operations. Only the primary admin can add or remove admins.
          </p>
        </div>
        <div className="grid gap-6">
          {error && <p className="text-destructive text-sm">{error}</p>}
          {users === null ? (
            <Skeleton className="h-40 w-full" />
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <Card className="mt-2 overflow-hidden py-0 shadow-sm">
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
                    const isProtectedAdmin = u.isPrimaryAdmin || (u.role === "admin" && !canManageAdmins);
                    return (
                      <TableRow key={u.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {name}
                            {u.isPrimaryAdmin ? <Badge variant="secondary">Primary admin</Badge> : null}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground text-xs">
                          {u.email ?? "Not provided"}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={u.role}
                            disabled={pendingId === u.id || isProtectedAdmin}
                            onValueChange={(v) => {
                              if (v) {
                                void handleRoleChange(u.id, v as Role);
                              }
                            }}
                          >
                            <SelectTrigger size="sm" className="w-32">
                            <SelectValue>{u.role.charAt(0).toUpperCase() + u.role.slice(1)}</SelectValue>
                            </SelectTrigger>
                            <SelectContent><SelectGroup>
                              {ROLES.map((r) => (
                                <SelectItem
                                  key={r}
                                  value={r}
                                  disabled={r === "admin" && !canManageAdmins}
                                >
                                  {r.charAt(0).toUpperCase() + r.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectGroup></SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
