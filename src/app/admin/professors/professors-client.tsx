"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Prof = { id: string; name: string; email: string; role: string; banned: boolean };

export function ProfessorsClient({ users }: { users: Prof[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "professor" });
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!form.name || !form.email || form.password.length < 8) {
      return toast.error("Name, email, and an 8+ char password are required");
    }
    setBusy(true);
    const { error } = await authClient.admin.createUser({
      name: form.name,
      email: form.email.trim().toLowerCase(),
      password: form.password,
      // Server config defines the custom "professor" role; the client types only
      // know the built-in union, so cast (runtime sends the real string).
      role: form.role as unknown as "admin",
    });
    setBusy(false);
    if (error) return toast.error(error.message ?? "Failed to create");
    toast.success("Professor created");
    setForm({ name: "", email: "", password: "", role: "professor" });
    router.refresh();
  }

  async function setRole(id: string, role: string) {
    const { error } = await authClient.admin.setRole({ userId: id, role: role as unknown as "admin" });
    if (error) return toast.error(error.message ?? "Failed");
    toast.success("Role updated");
    router.refresh();
  }

  async function toggleActive(p: Prof) {
    const fn = p.banned
      ? authClient.admin.unbanUser({ userId: p.id })
      : authClient.admin.banUser({ userId: p.id, banReason: "Deactivated by admin" });
    const { error } = await fn;
    if (error) return toast.error(error.message ?? "Failed");
    toast.success(p.banned ? "Activated" : "Deactivated");
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this professor account?")) return;
    const { error } = await authClient.admin.removeUser({ userId: id });
    if (error) return toast.error(error.message ?? "Failed");
    toast.success("Deleted");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add professor</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Temporary password (8+ chars)</Label>
            <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => v && setForm({ ...form, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="professor">Professor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Button onClick={create} disabled={busy}>{busy ? "Creating…" : "Create"}</Button>
          </div>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>{p.email}</TableCell>
              <TableCell>
                <Select value={p.role} onValueChange={(v) => v && setRole(p.id, v)}>
                  <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professor">Professor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                {p.banned ? <Badge variant="destructive">Inactive</Badge> : <Badge>Active</Badge>}
              </TableCell>
              <TableCell className="space-x-2 text-right">
                <Button variant="outline" size="sm" onClick={() => toggleActive(p)}>
                  {p.banned ? "Activate" : "Deactivate"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => remove(p.id)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
