"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ArrowLeft, Download, PlusCircle, Save, Trash2,
  Loader2, Eye, Pencil, Search, X, Settings,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { buildExcel } from "@/lib/excel";

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
}
interface Student {
  _id: string;
  name: string;
  attendance: number;
  marks: (number | string)[];
}

// ── Row type ──────────────────────────────────────────────────────────────────
type Row = {
  _id: string | null;
  name: string;
  attendance: string;
  marks: string[];
  saving: boolean;
  dirty: boolean;
  editing: boolean; // true = show inputs; false = show plain text
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalizeMark(v: string) {
  return v.trim().toUpperCase() === "AB" ? "AB" : v;
}
function markNum(v: string) {
  if (v.trim().toUpperCase() === "AB") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function blankRow(subjectCount: number): Row {
  return {
    _id: null, name: "", attendance: "",
    marks: Array(subjectCount).fill(""),
    saving: false, dirty: false, editing: true, // new rows always in edit mode
  };
}
function studentToRow(s: Student): Row {
  return {
    _id: s._id,
    name: s.name,
    attendance: String(s.attendance ?? ""),
    marks: (s.marks as Array<number | string>).map(String),
    saving: false, dirty: false, editing: false, // loaded rows start in view mode
  };
}

// ── Cell display (view mode) ───────────────────────────────────────────────────
function ViewCell({ value, className = "" }: { value: string; className?: string }) {
  const isAB = value.trim().toUpperCase() === "AB";
  return (
    <span className={`text-sm font-mono ${isAB ? "font-bold text-orange-500" : ""} ${className}`}>
      {value === "" ? <span className="text-muted-foreground/40">—</span> : value}
    </span>
  );
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [rows, setRows]           = useState<Row[]>([]);
  const [loading, setLoading]     = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch]       = useState("");

  // ── Session meta edit state ─────────────────────────────────────────────────
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaForm, setMetaForm] = useState({ month: "", year: "", totalDays: "" });
  const [savingMeta, setSavingMeta]   = useState(false);

  const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    const [sr, studR] = await Promise.all([
      fetch(`/api/sessions/${id}`),
      fetch(`/api/sessions/${id}/students`),
    ]);
    if (!sr.ok) { router.push("/"); return; }
    const sess: Session   = await sr.json();
    const students: Student[] = await studR.json();
    setSession(sess);
    setMetaForm({ month: sess.month, year: sess.year, totalDays: String(sess.totalDays) });
    setRows(students.map(studentToRow));
    setLoading(false);
  }, [id, router]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  // ── Save session metadata (month / year / totalDays) ───────────────────────
  async function saveSessionMeta() {
    if (!session) return;
    setSavingMeta(true);
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: metaForm.month,
          year:  metaForm.year,
          totalDays: Number(metaForm.totalDays) || session.totalDays,
        }),
      });
      if (!res.ok) throw new Error();
      const updated: Session = await res.json();
      setSession(updated);
      setEditingMeta(false);
      toast.success(`Updated to ${updated.month} ${updated.year}`);
    } catch {
      toast.error("Failed to update session");
    } finally {
      setSavingMeta(false);
    }
  }

  // ── Row helpers ────────────────────────────────────────────────────────────
  function patchRow(i: number, patch: Partial<Row>) {
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch, dirty: true } : r));
  }
  function setMark(rowIdx: number, subjIdx: number, val: string) {
    const normalized = normalizeMark(val);
    setRows(rs => rs.map((r, i) => {
      if (i !== rowIdx) return r;
      const marks = [...r.marks];
      marks[subjIdx] = normalized;
      return { ...r, marks, dirty: true };
    }));
  }
  function toggleEdit(i: number) {
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, editing: !r.editing } : r));
  }
  function addRow() {
    setRows(rs => [...rs, blankRow(session!.subjects.length)]);
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function saveRow(i: number) {
    const row = rows[i];
    if (!row.name.trim()) { toast.error("Student name required"); return; }
    const payload = {
      name: row.name.trim(),
      attendance: Number(row.attendance) || 0,
      marks: row.marks.map(m => m.trim().toUpperCase() === "AB" ? "AB" : (Number(m) || 0)),
    };
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, saving: true } : r));
    try {
      if (row._id) {
        const res = await fetch(`/api/sessions/${id}/students/${row._id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const updated: Student = await res.json();
        setRows(rs => rs.map((r, idx) => idx === i ? { ...studentToRow(updated), editing: false } : r));
      } else {
        const res = await fetch(`/api/sessions/${id}/students`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const created: Student = await res.json();
        setRows(rs => rs.map((r, idx) => idx === i ? { ...studentToRow(created), editing: false } : r));
      }
      toast.success(`${payload.name} saved`);
    } catch {
      toast.error("Save failed");
      setRows(rs => rs.map((r, idx) => idx === i ? { ...r, saving: false } : r));
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function deleteRow(i: number) {
    const row = rows[i];
    if (!confirm(`Remove "${row.name || "this student"}"?`)) return;
    if (row._id) {
      await fetch(`/api/sessions/${id}/students/${row._id}`, { method: "DELETE" });
      toast.success("Student removed");
    }
    setRows(rs => rs.filter((_, idx) => idx !== i));
  }

  // ── Export ────────────────────────────────────────────────────────────────
  async function handleExport() {
    if (!session) return;
    setExporting(true);
    try {
      await buildExcel(session, rows.map(r => ({
        name: r.name,
        attendance: Number(r.attendance) || 0,
        marks: r.marks.map(m => m.trim().toUpperCase() === "AB" ? "AB" : (Number(m) || 0)),
      })));
      toast.success("Excel downloaded!");
    } catch (e) {
      toast.error("Export failed: " + String(e));
    } finally {
      setExporting(false);
    }
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const totalOutOf = session?.subjects.reduce((s, sub) => s + sub.outOf, 0) ?? 0;
  function rowTotal(r: Row) { return r.marks.reduce((s, m) => s + markNum(m), 0); }

  const rankedRows = rows
    .map((row, originalIdx) => ({
      row,
      originalIdx,
      total: rowTotal(row),
      percentage: totalOutOf > 0 ? (rowTotal(row) / totalOutOf) * 100 : 0,
    }))
    .filter(({ row }) => row.name.trim())
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.row.name.localeCompare(b.row.name);
    });

  const toppers = rankedRows.slice(0, 3);

  // ── Filter by search ──────────────────────────────────────────────────────
  const q = search.toLowerCase().trim();
  const visibleRows = rows
    .map((r, originalIdx) => ({ row: r, originalIdx }))
    .filter(({ row }) => !q || row.name.toLowerCase().includes(q));

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
  if (!session) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Image src="/image.png" alt="Logo" width={36} height={36} className="shrink-0 rounded-full" style={{ width: 36, height: 36 }} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight">{session.className}</p>
            <p className="truncate text-xs text-muted-foreground">
              {session.month} {session.year} • {session.subjects.length} subjects • out of {totalOutOf}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={addRow} className="hidden gap-1.5 sm:flex">
            <PlusCircle className="h-4 w-4" /> Add Student
          </Button>
          <Button variant="outline" size="sm" className="hidden gap-1.5 sm:flex"
            onClick={() => window.open(`/preview/${id}`, "_blank")}>
            <Eye className="h-4 w-4" /> Preview
          </Button>
          <Button size="sm" onClick={handleExport} disabled={exporting} className="gap-1.5">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span className="hidden sm:inline">Download Excel</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        {/* ── Info + Search bar ── */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Badges + edit button */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{session.instituteName}</Badge>
            <Badge variant="outline">{session.className}</Badge>
            <Badge
              variant="outline"
              className="cursor-pointer select-none hover:bg-primary/10 hover:border-primary/40 transition-colors"
              onClick={() => { setMetaForm({ month: session.month, year: session.year, totalDays: String(session.totalDays) }); setEditingMeta(true); }}
            >
              {session.month} {session.year}
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer select-none hover:bg-primary/10 hover:border-primary/40 transition-colors"
              onClick={() => { setMetaForm({ month: session.month, year: session.year, totalDays: String(session.totalDays) }); setEditingMeta(true); }}
            >
              Days: {session.totalDays}
            </Badge>
            <Badge variant="secondary">{rows.length} Student{rows.length !== 1 ? "s" : ""}</Badge>
            <button
              title="Edit month / year / total days"
              onClick={() => { setMetaForm({ month: session.month, year: session.year, totalDays: String(session.totalDays) }); setEditingMeta(v => !v); }}
              className="ml-1 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* ── Inline meta editor ─────────────────────────────────────── */}
          {editingMeta && (
            <div className="w-full rounded-xl border bg-muted/40 px-4 py-3 mt-1">
              <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Edit Month / Year / Total Days
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <div className="grid gap-1">
                  <label className="text-xs text-muted-foreground">Month</label>
                  <Select
                    value={metaForm.month}
                    onValueChange={v => setMetaForm(f => ({ ...f, month: v ?? f.month }))}
                  >
                    <SelectTrigger className="h-8 w-36 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <label className="text-xs text-muted-foreground">Year</label>
                  <input
                    value={metaForm.year}
                    onChange={e => setMetaForm(f => ({ ...f, year: e.target.value }))}
                    className="h-8 w-20 rounded-md border border-input bg-background px-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="2026"
                    maxLength={4}
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs text-muted-foreground">Total Days</label>
                  <input
                    type="number" min={1} max={31}
                    value={metaForm.totalDays}
                    onChange={e => setMetaForm(f => ({ ...f, totalDays: e.target.value }))}
                    className="h-8 w-20 rounded-md border border-input bg-background px-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="25"
                  />
                </div>
                <div className="flex gap-2 pb-0.5">
                  <Button size="sm" className="h-8 gap-1.5" onClick={saveSessionMeta} disabled={savingMeta}>
                    {savingMeta ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingMeta(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                💡 Students stay the same — just update month/year to generate next month&apos;s marksheet.
              </p>
            </div>
          )}

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search student…"
              className="pl-8 pr-8 h-9"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile: Add button */}
        <Button variant="outline" className="mb-4 w-full gap-2 sm:hidden" onClick={addRow}>
          <PlusCircle className="h-4 w-4" /> Add Student
        </Button>

        {/* ── Search result info ── */}
        {q && (
          <p className="mb-3 text-xs text-muted-foreground">
            {visibleRows.length} result{visibleRows.length !== 1 ? "s" : ""} for &quot;{search}&quot;
          </p>
        )}

        {toppers.length > 0 && (
          <div className="mb-3 rounded-xl border bg-card/70 p-3 shadow-sm print:hidden">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Top 3 Toppers</p>
                <p className="text-xs text-muted-foreground">Automatically ranked from total marks</p>
              </div>
              <Badge variant="secondary" className="h-6 px-2 text-[10px]">
                {toppers.length} detected
              </Badge>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              {toppers.map(({ row, total, percentage }, index) => (
                <div
                  key={`${row._id ?? row.name}-${index}`}
                  className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                      <p className="truncate text-sm font-semibold">{row.name}</p>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{percentage.toFixed(1)}% of {totalOutOf}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 px-2 py-0.5 text-[10px] font-mono">
                    {total}/{totalOutOf}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-muted-foreground">No students yet. Add your first student above.</p>
          </div>
        ) : visibleRows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Search className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground">No student found for &quot;{search}&quot;</p>
            <Button variant="ghost" size="sm" onClick={() => setSearch("")}>Clear search</Button>
          </div>
        ) : (
          <>
            {/* ── Desktop table ── */}
            <div className="hidden overflow-x-auto rounded-2xl border bg-card shadow-sm sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 text-left font-semibold w-8">#</th>
                    <th className="px-4 py-3 text-left font-semibold min-w-40">Student Name</th>
                    {session.subjects.map((sub, i) => (
                      <th key={i} className="px-3 py-3 text-center font-semibold">
                        {sub.name}<br /><span className="font-normal normal-case">/{sub.outOf}</span>
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center font-semibold">
                      Presenty<br /><span className="font-normal normal-case">/{session.totalDays}</span>
                    </th>
                    <th className="px-3 py-3 text-center font-semibold">
                      Total<br /><span className="font-normal normal-case">/{totalOutOf}</span>
                    </th>
                    <th className="px-3 py-3 text-center font-semibold w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map(({ row, originalIdx: i }) => {
                    const total = rowTotal(row);
                    const pct   = totalOutOf > 0 ? (total / totalOutOf) * 100 : 0;
                    return (
                      <tr key={i}
                        className={`border-b last:border-0 transition-colors ${
                          row.editing ? "bg-blue-50/40 dark:bg-blue-950/20" : "hover:bg-muted/20"
                        }`}
                      >
                        <td className="px-4 py-2 text-muted-foreground text-xs">{i + 1}</td>

                        {/* Name */}
                        <td className="px-3 py-2">
                          {row.editing ? (
                            <Input value={row.name}
                              onChange={e => patchRow(i, { name: e.target.value })}
                              placeholder="Student name"
                              className="h-8 min-w-35 text-sm"
                            />
                          ) : (
                            <span className="font-medium text-sm">{row.name || <span className="text-muted-foreground">—</span>}</span>
                          )}
                        </td>

                        {/* Marks */}
                        {session.subjects.map((_, si) => (
                          <td key={si} className="px-2 py-2 text-center">
                            {row.editing ? (
                              <Input type="text"
                                value={row.marks[si] ?? ""}
                                onChange={e => setMark(i, si, e.target.value)}
                                placeholder="0"
                                maxLength={5}
                                className={`h-8 w-14 text-center text-sm font-mono ${
                                  row.marks[si]?.toUpperCase() === "AB" ? "text-orange-500 font-bold" : ""
                                }`}
                              />
                            ) : (
                              <ViewCell value={row.marks[si] ?? ""} />
                            )}
                          </td>
                        ))}

                        {/* Presenty */}
                        <td className="px-2 py-2 text-center">
                          {row.editing ? (
                            <Input type="number" min={0} max={session.totalDays}
                              value={row.attendance}
                              onChange={e => patchRow(i, { attendance: e.target.value })}
                              placeholder="0"
                              className="h-8 w-14 text-center text-sm"
                            />
                          ) : (
                            <ViewCell value={row.attendance} />
                          )}
                        </td>

                        {/* Total badge */}
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold min-w-13 ${
                            pct >= 60 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {total}/{totalOutOf}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-center gap-1">
                            {row.editing ? (
                              <Button size="icon" variant="ghost"
                                className="h-8 w-8 text-primary hover:bg-primary/10"
                                onClick={() => saveRow(i)} disabled={row.saving}>
                                {row.saving
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Save className="h-3.5 w-3.5" />}
                              </Button>
                            ) : (
                              <Button size="icon" variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() => toggleEdit(i)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button size="icon" variant="ghost"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => deleteRow(i)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards ── */}
            <div className="space-y-3 sm:hidden">
              {visibleRows.map(({ row, originalIdx: i }) => {
                const total = rowTotal(row);
                const pct   = totalOutOf > 0 ? (total / totalOutOf) * 100 : 0;
                return (
                  <Card key={i} className={`overflow-hidden transition-colors ${
                    row.editing ? "border-primary/30 bg-blue-50/30 dark:bg-blue-950/20" : ""
                  }`}>
                    <CardContent className="p-4 space-y-3">
                      {/* Row header */}
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                          {i + 1}
                        </span>
                        {row.editing ? (
                          <Input value={row.name}
                            onChange={e => patchRow(i, { name: e.target.value })}
                            placeholder="Student name" className="flex-1 h-9" />
                        ) : (
                          <span className="flex-1 font-semibold text-sm">{row.name || "—"}</span>
                        )}
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                          pct >= 60 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {total}/{totalOutOf}
                        </span>
                      </div>

                      {/* Marks grid */}
                      <div className="grid grid-cols-3 gap-2">
                        {session.subjects.map((sub, si) => (
                          <div key={si} className="grid gap-1">
                            <span className="truncate text-xs text-muted-foreground">{sub.name}/{sub.outOf}</span>
                            {row.editing ? (
                              <Input type="text"
                                value={row.marks[si] ?? ""}
                                onChange={e => setMark(i, si, e.target.value)}
                                placeholder="0" maxLength={5}
                                className={`h-8 text-center text-sm font-mono ${
                                  row.marks[si]?.toUpperCase() === "AB" ? "text-orange-500 font-bold" : ""
                                }`}
                              />
                            ) : (
                              <div className="h-8 flex items-center justify-center rounded border border-border/40 bg-muted/30">
                                <ViewCell value={row.marks[si] ?? ""} />
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="grid gap-1">

                      {toppers.length > 0 && (
                        <div className="mb-4 rounded-2xl border bg-card/70 p-4 shadow-sm print:hidden">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Top 3 Toppers</p>
                              <p className="text-sm text-muted-foreground">Automatically ranked from total marks</p>
                            </div>
                            <Badge variant="secondary">{toppers.length} detected</Badge>
                          </div>
                          <div className="grid gap-3 md:grid-cols-3">
                            {toppers.map(({ row, total, percentage }, index) => (
                              <div
                                key={`${row._id ?? row.name}-${index}`}
                                className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                      {index + 1}
                                    </span>
                                    <p className="truncate font-semibold">{row.name}</p>
                                  </div>
                                  <p className="mt-1 text-xs text-muted-foreground">{percentage.toFixed(1)}% of {totalOutOf}</p>
                                </div>
                                <Badge variant="outline" className="shrink-0 font-mono">
                                  {total}/{totalOutOf}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                          <span className="text-xs text-muted-foreground">Presenty/{session.totalDays}</span>
                          {row.editing ? (
                            <Input type="number" min={0}
                              value={row.attendance}
                              onChange={e => patchRow(i, { attendance: e.target.value })}
                              placeholder="0" className="h-8 text-center text-sm" />
                          ) : (
                            <div className="h-8 flex items-center justify-center rounded border border-border/40 bg-muted/30">
                              <ViewCell value={row.attendance} />
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Mobile actions */}
                      <div className="flex items-center justify-end gap-2">
                        {row.editing ? (
                          <Button size="sm" className="h-8 gap-1.5"
                            onClick={() => saveRow(i)} disabled={row.saving}>
                            {row.saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            Save
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="h-8 gap-1.5"
                            onClick={() => toggleEdit(i)}>
                            <Pencil className="h-3 w-3" /> Edit
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-8 text-destructive"
                          onClick={() => deleteRow(i)}>
                          <Trash2 className="h-3 w-3 mr-1" /> Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* ── Download footer ── */}
        {rows.length > 0 && (
          <div className="mt-6 flex flex-col items-center gap-3 print:hidden">
            <Separator />
            <p className="text-sm text-muted-foreground">
              {rows.filter(r => r.dirty && !r._id).length > 0
                ? "⚠ Save unsaved rows before downloading."
                : `${rows.length} student${rows.length !== 1 ? "s" : ""} ready to export.`}
            </p>
            <Button size="lg" onClick={handleExport} disabled={exporting} className="w-full max-w-xs gap-2">
              {exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
              Download Excel Sheet
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
