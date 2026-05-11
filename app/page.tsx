"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { PlusCircle, Trash2, BookOpen, Calendar, Users, ChevronRight } from "lucide-react";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

interface Subject { name: string; outOf: number }
interface Session {
  _id: string;
  instituteName: string;
  className: string;
  month: string;
  year: string;
  totalDays: number;
  managerName: string;
  subjects: Subject[];
  createdAt: string;
}

const EMPTY_FORM = {
  instituteName: "Shree Saraswati Classes, Kannad",
  className: "",
  month: "March",
  year: new Date().getFullYear().toString(),
  totalDays: "25",
  managerName: "Manager",
  subjects: [
    { name: "Physics", outOf: 20 },
    { name: "Chemistry", outOf: 20 },
    { name: "Math", outOf: 20 },
    { name: "Biology", outOf: 20 },
    { name: "English", outOf: 20 },
  ] as Subject[],
};

export default function HomePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function loadSessions() {
    try {
      const res = await fetch("/api/sessions");
      if (!res.ok) {
        toast.error("Database connection failed. Please set MONGODB_URI in .env.local");
        setLoading(false);
        return;
      }
      setSessions(await res.json());
    } catch {
      toast.error("Cannot reach server. Is the dev server running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSessions(); }, []);

  function setField<K extends keyof typeof EMPTY_FORM>(k: K, v: (typeof EMPTY_FORM)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function setSubject(i: number, key: "name" | "outOf", val: string) {
    setForm((f) => {
      const subjects = f.subjects.map((s, idx) =>
        idx === i ? { ...s, [key]: key === "outOf" ? Number(val) || 0 : val } : s
      );
      return { ...f, subjects };
    });
  }

  function addSubject() {
    setForm((f) => ({ ...f, subjects: [...f.subjects, { name: "", outOf: 20 }] }));
  }

  function removeSubject(i: number) {
    if (form.subjects.length === 1) return;
    setForm((f) => ({ ...f, subjects: f.subjects.filter((_, idx) => idx !== i) }));
  }

  async function createSession() {
    if (!form.className.trim()) { toast.error("Class name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, totalDays: Number(form.totalDays) }),
      });
      if (!res.ok) throw new Error("Failed");
      const session: Session = await res.json();
      toast.success("Session created!");
      setOpen(false);
      setForm(EMPTY_FORM);
      router.push(`/session/${session._id}`);
    } catch {
      toast.error("Could not create session. Check MongoDB connection.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSession(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Delete this session and all its student data?")) return;
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    toast.success("Session deleted");
    loadSessions();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="border-b bg-card shadow-sm print:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6">
          <Image src="/image.png" alt="Logo" width={52} height={52} className="rounded-full" style={{ width: 52, height: 52 }} />
          <div className="flex-1">
            <h1 className="text-xl font-bold leading-tight text-foreground">
              Shree Saraswati Classes
            </h1>
            <p className="text-sm text-muted-foreground">Mark Memo Management System</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">New Session</span>
                  <span className="sm:hidden">New</span>
                </Button>
              }
            />
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Exam Session</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Institute */}
                <div className="grid gap-1.5">
                  <Label>Institute Name</Label>
                  <Input value={form.instituteName} onChange={(e) => setField("instituteName", e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Class *</Label>
                    <Input placeholder="11th Science" value={form.className} onChange={(e) => setField("className", e.target.value)} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Year</Label>
                    <Input placeholder="2026" value={form.year} onChange={(e) => setField("year", e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Month</Label>
                    <Select value={form.month} onValueChange={(v) => setField("month", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Total Days</Label>
                    <Input type="number" placeholder="25" value={form.totalDays} onChange={(e) => setField("totalDays", e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label>Manager / Footer Name</Label>
                  <Input value={form.managerName} onChange={(e) => setField("managerName", e.target.value)} />
                </div>

                <Separator />

                {/* Subjects */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="text-sm font-semibold">Subjects &amp; Out-of Marks</Label>
                    <Button variant="outline" size="sm" onClick={addSubject}>+ Add</Button>
                  </div>
                  <div className="space-y-2">
                    {form.subjects.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          placeholder="Subject name"
                          value={s.name}
                          onChange={(e) => setSubject(i, "name", e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="20"
                          value={s.outOf}
                          onChange={(e) => setSubject(i, "outOf", e.target.value)}
                          className="w-20 text-center"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeSubject(i)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="mt-1.5 text-right text-xs text-muted-foreground">
                    Total out of: {form.subjects.reduce((s, sub) => s + sub.outOf, 0)}
                  </p>
                </div>

                <Button className="w-full" onClick={createSession} disabled={saving}>
                  {saving ? "Creating…" : "Create Session & Add Students"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* ── Sessions list ── */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((k) => (
              <div key={k} className="h-40 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <BookOpen className="h-14 w-14 text-muted-foreground/40" />
            <div>
              <p className="text-lg font-semibold text-foreground">No sessions yet</p>
              <p className="text-sm text-muted-foreground">Create your first exam session to get started.</p>
            </div>
            <Button onClick={() => setOpen(true)} className="gap-2">
              <PlusCircle className="h-4 w-4" /> Create Session
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{sessions.length} session{sessions.length !== 1 ? "s" : ""} found</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((s) => (
                <Card
                  key={s._id}
                  className="group cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
                  onClick={() => router.push(`/session/${s._id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate text-base">{s.className}</CardTitle>
                        <CardDescription className="mt-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {s.month} {s.year}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="shrink-0">{s.subjects.length} sub</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="mb-3 truncate text-xs text-muted-foreground">{s.instituteName}</p>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {s.totalDays} days total
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={(e) => deleteSession(e, s._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
