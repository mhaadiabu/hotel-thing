"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@hotel/backend/convex/_generated/api";
import { Card, CardContent } from "@hotel/ui/components/card";
import { Skeleton } from "@hotel/ui/components/skeleton";
import {
  Select,
  SelectContent,
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
};

export default function RolesPage() {
  const listUsers = useAction(api.roles.list);
  const setUserRole = useAction(api.roles.setRole);
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listUsers({})
      .then((result) => setUsers(result as UserRow[]))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to load users")
      );
  }, [listUsers]);

  async function handleRoleChange(userId: string, role: Role) {
    setPendingId(userId);
    setError(null);
    try {
      await setUserRole({ userId, role });
      setUsers((prev) =>
        prev
          ? prev.map((u) => (u.id === userId ? { ...u, role } : u))
          : prev
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <header className="border-b px-8 py-6">
        <h1 className="font-heading font-semibold text-2xl tracking-tight">
          Roles
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Assign roles to users. Changes take effect on their next sign-in.
        </p>
      </header>
      <div className="px-8 py-8">
        <div className="grid gap-6">
          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}
          {users === null ? (
            <Skeleton className="h-40 w-full" />
          ) : users.length === 0 ? (
            <Card>
              <CardContent className="py-6">
                <p className="text-muted-foreground text-sm">No users found.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
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
                      `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "—";
                    return (
                      <TableRow
                        key={u.id}
                        className="border-b-0 hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell className="font-mono text-muted-foreground text-xs">
                          {u.email ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={u.role}
                            onValueChange={(v) => {
                              if (v) {
                                void handleRoleChange(u.id, v as Role);
                              }
                            }}
                          >
                            <SelectTrigger size="sm" className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {r.charAt(0).toUpperCase() + r.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
