"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@hotel/backend/convex/_generated/api";
import { Button } from "@hotel/ui/components/button";
import { Card, CardContent } from "@hotel/ui/components/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@hotel/ui/components/dialog";
import { Input } from "@hotel/ui/components/input";
import { Label } from "@hotel/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hotel/ui/components/select";
import { Skeleton } from "@hotel/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@hotel/ui/components/table";
import { formatRate } from "@/lib/format";

import { RoleGate } from "@/components/role-gate";

const STATUSES = ["Available", "Occupied", "Maintenance", "Dirty"] as const;
type Status = (typeof STATUSES)[number];

function statusBar(s: Status): string {
  if (s === "Available") return "bg-primary";
  if (s === "Maintenance") return "bg-destructive";
  if (s === "Occupied") return "bg-foreground/50";
  return "bg-foreground/25";
}

export default function AdminPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AdminHome />
    </RoleGate>
  );
}

function AdminHome() {
  const { user } = useUser();
  const rooms = useQuery(api.rooms.list);
  const createRoom = useMutation(api.rooms.create);
  const updateStatus = useMutation(api.rooms.updateStatus);
  const removeRoom = useMutation(api.rooms.remove);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ roomNumber: "", type: "", rateGHS: "" });
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setForm({ roomNumber: "", type: "", rateGHS: "" });
    setError(null);
  }

  async function handleCreate() {
    setError(null);
    const rate = parseFloat(form.rateGHS);
    if (!form.roomNumber.trim() || !form.type.trim() || !Number.isFinite(rate) || rate <= 0) {
      setError("Fill all fields with a valid rate.");
      return;
    }
    await createRoom({
      roomNumber: form.roomNumber.trim(),
      type: form.type.trim(),
      nightlyRate: Math.round(rate * 100),
    });
    reset();
    setOpen(false);
  }

  return (
    <>
      <header className="border-b px-8 py-6">
        <h1 className="font-heading font-semibold text-2xl tracking-tight">Rooms</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as {user?.fullName ?? user?.username ?? "admin"}.
        </p>
      </header>
      <div className="px-8 py-8">
        <div className="grid gap-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs tabular-nums text-muted-foreground">
              {rooms === undefined
                ? "Loading"
                : `${rooms.length} room${rooms.length === 1 ? "" : "s"}`}
            </p>
            <Dialog
              open={open}
              onOpenChange={(o) => {
                setOpen(o);
                if (!o) reset();
              }}
            >
              <DialogTrigger render={<Button>Add room</Button>} />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add room</DialogTitle>
                  <DialogDescription>Enter the room details.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="roomNumber">Room number</Label>
                    <Input
                      id="roomNumber"
                      value={form.roomNumber}
                      onChange={(e) => setForm((f) => ({ ...f, roomNumber: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="type">Type</Label>
                    <Input
                      id="type"
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="rate">Nightly rate (GHS)</Label>
                    <Input
                      id="rate"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={form.rateGHS}
                      onChange={(e) => setForm((f) => ({ ...f, rateGHS: e.target.value }))}
                    />
                  </div>
                  {error && <p className="text-destructive text-sm">{error}</p>}
                </div>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline">Cancel</Button>} />
                  <Button onClick={handleCreate}>Add room</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {rooms === undefined ? (
            <Skeleton className="h-64 w-full" />
          ) : rooms.length === 0 ? (
            <Card>
              <CardContent className="py-6">
                <p className="text-muted-foreground text-sm">No rooms yet. Add the first one.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden rounded-xl py-0 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((r) => (
                    <TableRow key={r._id} className="hover:bg-muted/50">
                      <TableCell className="font-medium font-mono tabular-nums">
                        {r.roomNumber}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{r.type}</TableCell>
                      <TableCell className="tabular-nums text-right">
                        {formatRate(r.nightlyRate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            aria-hidden
                            className={`inline-block h-4 w-0.5 ${statusBar(r.status)}`}
                          />
                          <Select
                            value={r.status}
                            onValueChange={(v) => {
                              if (v) updateStatus({ roomId: r._id, status: v as Status });
                            }}
                          >
                            <SelectTrigger className="w-32 border-0 pl-0 shadow-none" size="sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Delete room ${r.roomNumber}?`)) {
                              void removeRoom({ roomId: r._id });
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
