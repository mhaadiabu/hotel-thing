"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@hotel/backend/convex/_generated/api";
import { Add01Icon, Delete02Icon, Image01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@hotel/ui/components/button";
import { Card } from "@hotel/ui/components/card";
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@hotel/ui/components/empty";
import { Input } from "@hotel/ui/components/input";
import { Label } from "@hotel/ui/components/label";
import {
  Select,
  SelectContent,
  SelectGroup,
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

import { RoomImage } from "@/components/room-image";
import { formatRate } from "@/lib/format";

const STATUSES = ["Available", "Occupied", "Maintenance", "Dirty"] as const;
type Status = (typeof STATUSES)[number];
const EMPTY_FORM = { roomNumber: "", type: "", rateGHS: "", name: "" };

export default function AdminPage() {
  const rooms = useQuery(api.rooms.list);
  const createRoom = useMutation(api.rooms.create);
  const generateUploadUrl = useMutation(api.rooms.generateUploadUrl);
  const discardUploads = useMutation(api.rooms.discardUploads);
  const updateStatus = useMutation(api.rooms.updateStatus);
  const removeRoom = useMutation(api.rooms.remove);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [files]);

  function reset() {
    setForm(EMPTY_FORM);
    setFiles([]);
    setError(null);
  }

  function chooseFiles(selected: FileList | null) {
    const next = Array.from(selected ?? []).slice(0, 5);
    const invalid = next.find((file) => !file.type.startsWith("image/") || file.size > 8_000_000);
    if (invalid) {
      setError("Use image files up to 8 MB each.");
      return;
    }
    setError(null);
    setFiles(next);
  }

  async function handleCreate() {
    const rate = Number.parseFloat(form.rateGHS);
    if (!form.roomNumber.trim() || !form.type.trim() || !Number.isFinite(rate) || rate <= 0) {
      setError("Enter a room number, type, and valid nightly rate.");
      return;
    }

    setPending(true);
    setError(null);
    const uploaded: string[] = [];
    try {
      for (const file of files) {
        const uploadUrl = await generateUploadUrl({});
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!response.ok) throw new Error("An image could not be uploaded.");
        const { storageId } = (await response.json()) as { storageId: string };
        uploaded.push(storageId);
      }
      await createRoom({
        roomNumber: form.roomNumber.trim(),
        type: form.type.trim(),
        name: form.name.trim() || undefined,
        nightlyRate: Math.round(rate * 100),
        imageStorageIds: uploaded as never[],
      });
      reset();
      setOpen(false);
    } catch (cause) {
      if (uploaded.length) await discardUploads({ storageIds: uploaded as never[] });
      setError(cause instanceof Error ? cause.message : "The room could not be added.");
    } finally {
      setPending(false);
    }
  }

  const roomToDelete = rooms?.find((room) => room._id === deleteId);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">Inventory</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold">Rooms</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage availability, pricing, and room photography.
          </p>
        </div>
        <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) reset(); }}>
          <DialogTrigger render={<Button />}>
            <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
            Add room
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add a room</DialogTitle>
              <DialogDescription>Add the essentials now. You can manage its status afterward.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="roomNumber">Room number</Label>
                <Input id="roomNumber" value={form.roomNumber} onChange={(event) => setForm((value) => ({ ...value, roomNumber: event.target.value }))} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="type">Room type</Label>
                <Input id="type" placeholder="Deluxe king" value={form.type} onChange={(event) => setForm((value) => ({ ...value, type: event.target.value }))} />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="name">Display name <span className="text-muted-foreground">(optional)</span></Label>
                <Input id="name" placeholder="Garden suite" value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="rate">Nightly rate (GHS)</Label>
                <Input id="rate" type="number" inputMode="decimal" step="0.01" min="0" value={form.rateGHS} onChange={(event) => setForm((value) => ({ ...value, rateGHS: event.target.value }))} />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="images">Room images <span className="text-muted-foreground">(up to 5)</span></Label>
                <label htmlFor="images" className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/40 px-4 text-center text-sm text-muted-foreground hover:bg-muted">
                  <HugeiconsIcon icon={Image01Icon} />
                  <span>Choose JPG, PNG, or WebP images</span>
                </label>
                <Input id="images" type="file" accept="image/*" multiple className="sr-only" onChange={(event) => chooseFiles(event.target.files)} />
                {previews.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {previews.map((src, index) => <RoomImage key={src} roomName={`Selected room image ${index + 1}`} imageUrls={[src]} className="min-h-20" />)}
                  </div>
                ) : null}
              </div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter>
              <DialogClose render={<Button variant="outline" disabled={pending} />}>Cancel</DialogClose>
              <Button onClick={handleCreate} disabled={pending}>{pending ? "Adding room..." : "Add room"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-8">
        {rooms === undefined ? <Skeleton className="h-64 w-full" /> : rooms.length === 0 ? (
          <Card className="border-dashed shadow-none">
            <Empty className="min-h-64">
              <EmptyHeader>
                <EmptyMedia variant="icon"><HugeiconsIcon icon={Image01Icon} /></EmptyMedia>
                <EmptyTitle>No rooms in inventory</EmptyTitle>
                <EmptyDescription>Add the first room with its rate and photography.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent><Button onClick={() => setOpen(true)}>Add first room</Button></EmptyContent>
            </Empty>
          </Card>
        ) : (
          <Card className="overflow-hidden py-0 shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Room</TableHead><TableHead>Type</TableHead><TableHead>Rate</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room._id}>
                      <TableCell><div className="flex min-w-44 items-center gap-3"><RoomImage roomName={room.name ?? room.type} imageUrls={room.imageUrls} className="min-h-12 w-16 shrink-0" /><div><div className="font-medium">{room.name ?? `Room ${room.roomNumber}`}</div><div className="text-xs text-muted-foreground">Room {room.roomNumber}</div></div></div></TableCell>
                      <TableCell>{room.type}</TableCell>
                      <TableCell className="tabular-nums">{formatRate(room.nightlyRate)}</TableCell>
                      <TableCell>
                        <Select value={room.status} onValueChange={(value) => { if (value) void updateStatus({ roomId: room._id, status: value as Status }); }}>
                          <SelectTrigger size="sm" className="w-36"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectGroup>{STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectGroup></SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="icon-sm" aria-label={`Delete room ${room.roomNumber}`} onClick={() => setDeleteId(room._id)}><HugeiconsIcon icon={Delete02Icon} /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      <Dialog open={deleteId !== null} onOpenChange={(value) => { if (!value) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete room {roomToDelete?.roomNumber}?</DialogTitle><DialogDescription>This removes the room and its uploaded images. Existing reservation records remain available.</DialogDescription></DialogHeader>
          <DialogFooter><DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><Button variant="destructive" onClick={async () => { if (!roomToDelete) return; await removeRoom({ roomId: roomToDelete._id }); setDeleteId(null); }}>Delete room</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
