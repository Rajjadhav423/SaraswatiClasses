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
import { ArrowLeft, Download, PlusCircle, Save, Trash2, Loader2 } from "lucide-react";
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
  marks: number[];
}

// ── local draft row ───────────────────────────────────────────────────────────
type Row = {
  _id: string | null;   // null = unsaved new row
  name: string;
  attendance: string;
  marks: string[];
  saving: boolean;
  dirty: boolean;
};

// ── helpers ──────────────────────────────────────────────────────────────────
/** Normalize user input: "ab"/"AB"/"Ab" → "AB", else keep as-is */
function normalizeMark(v: string) {
  return v.trim().toUpperCase() === "AB" ? "AB" : v;
}
/** Parse a mark value to a number for totals (AB = 0) */
function markNum(v: string) {
  if (v.trim().toUpperCase() === "AB") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function blankRow(subjectCount: number): Row {
  return { _id: null, name: "", attendance: "", marks: Array(subjectCount).fill(""), saving: false, dirty: false };
}

function studentToRow(s: Student): Row {
  return {
    _id: s._id,
    name: s.name,
    attendance: String(s.attendance ?? ""),
    marks: (s.marks as Array<number | string>).map((m) => String(m)),
    saving: false,
    dirty: false,
  };
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loadingSession, setLoadingSession] = useState(true);
  const [exporting, setExporting] = useState(false);

  // ── Load session + students ────────────────────────────────────────────────
  const load = useCallback(async () => {
    const [sr, studR] = await Promise.all([
      fetch(`/api/sessions/${id}`),
      fetch(`/api/sessions/${id}/students`),
    ]);
    if (!sr.ok) { router.push("/"); return; }
    const sess: Session = await sr.json();
    const students: Student[] = await studR.json();
    setSession(sess);
    setRows(students.map(studentToRow));
    setLoadingSession(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  // ── Row helpers ────────────────────────────────────────────────────────────
  function patchRow(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => idx === i ? { ...r, ...patch, dirty: true } : r));
  }

  function setMark(rowIdx: number, subjIdx: number, val: string) {
    const normalized = normalizeMark(val);
    setRows((rs) =>
      rs.map((r, i) => {
        if (i !== rowIdx) return r;
        const marks = [...r.marks];
        marks[subjIdx] = normalized;
        return { ...r, marks, dirty: true };
      })
    );
  }

  function addRow() {
    setRows((rs) => [...rs, blankRow(session!.subjects.length)]);
  }

  // ── Save one row ───────────────────────────────────────────────────────────
  async function saveRow(i: number) {
    const row = rows[i];
    if (!row.name.trim()) { toast.error("Student name required"); return; }

    const payload = {
      name: row.name.trim(),
      attendance: Number(row.attendance) || 0,
      // Keep "AB" as string; convert others to number
      marks: row.marks.map((m) => m.trim().toUpperCase() === "AB" ? "AB" : (Number(m) || 0)),
    };

    setRows((rs) => rs.map((r, idx) => idx === i ? { ...r, saving: true } : r));

    try {
      if (row._id) {
        const res = await fetch(`/api/sessions/${id}/students/${row._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const updated: Student = await res.json();
        setRows((rs) => rs.map((r, idx) => idx === i ? studentToRow(updated) : r));
      } else {
        const res = await fetch(`/api/sessions/${id}/students`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const created: Student = await res.json();
        setRows((rs) => rs.map((r, idx) => idx === i ? studentToRow(created) : r));
      }
      toast.success(`${payload.name} saved`);
    } catch {
      toast.error("Save failed");
      setRows((rs) => rs.map((r, idx) => idx === i ? { ...r, saving: false } : r));
    }
  }

  // ── Delete row ─────────────────────────────────────────────────────────────
  async function deleteRow(i: number) {
    const row = rows[i];
    if (row._id) {
      await fetch(`/api/sessions/${id}/students/${row._id}`, { method: "DELETE" });
      toast.success("Student removed");
    }
    setRows((rs) => rs.filter((_, idx) => idx !== i));
  }

  // ── Excel export ───────────────────────────────────────────────────────────
  async function handleExport() {
    if (!session) return;
    setExporting(true);
    try {
      await buildExcel(session, rows.map((r) => ({
        name: r.name,
        attendance: Number(r.attendance) || 0,
        // Pass "AB" as-is; numbers as numbers
        marks: r.marks.map((m) => m.trim().toUpperCase() === "AB" ? "AB" : (Number(m) || 0)),
      })));
      toast.success("Excel downloaded!");
    } catch (e) {
      toast.error("Export failed: " + String(e));
    } finally {
      setExporting(false);
    }
  }

  // ── Totals ─────────────────────────────────────────────────────────────────
  const totalOutOf = session?.subjects.reduce((s, sub) => s + sub.outOf, 0) ?? 0;
  /** Total obtained — AB counts as 0 */
  function rowTotal(r: Row) { return r.marks.reduce((s, m) => s + markNum(m), 0); }

  if (loadingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!session) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Image src="/image.png" alt="Logo" width={36} height={36} className="shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight text-foreground">
              {session.className}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {session.month} {session.year} • {session.subjects.length} subjects • out of {totalOutOf}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={addRow} className="hidden gap-1.5 sm:flex">
            <PlusCircle className="h-4 w-4" /> Add Student
          </Button>
          <Button size="sm" onClick={handleExport} disabled={exporting} className="gap-1.5">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span className="hidden sm:inline">Download Excel</span>
          </Button>
        </div>
      </header>

      {/* ── Print header (only in print) ── */}
      <div className="hidden print:block px-8 py-4">
        <div className="flex items-center gap-4 border-b pb-3">
          <img src="/image.png" alt="Logo" className="h-14 w-14 rounded-full" />
          <div>
            <h1 className="text-lg font-bold">{session.instituteName}</h1>
            <p className="text-sm">{session.className} — Mark Memo {session.month} {session.year}</p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* ── Session info card ── */}
        <Card className="mb-5 print:hidden">
          <CardContent className="flex flex-wrap gap-3 px-4 py-3">
            <Badge variant="outline" className="gap-1">{session.instituteName}</Badge>
            <Badge variant="outline">{session.className}</Badge>
            <Badge variant="outline">{session.month} {session.year}</Badge>
            <Badge variant="outline">Total Days: {session.totalDays}</Badge>
            <Badge variant="secondary">{rows.length} Student{rows.length !== 1 ? "s" : ""}</Badge>
          </CardContent>
        </Card>

        {/* ── Mobile: Add button ── */}
        <Button variant="outline" className="mb-4 w-full gap-2 sm:hidden print:hidden" onClick={addRow}>
          <PlusCircle className="h-4 w-4" /> Add Student
        </Button>

        {/* ── Students table (responsive scroll) ── */}
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center print:hidden">
            <p className="text-muted-foreground">No students yet. Add your first student above.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-2xl border bg-card shadow-sm sm:block print:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 text-left font-semibold">#</th>
                    <th className="px-4 py-3 text-left font-semibold">Student Name</th>
                    {session.subjects.map((sub, i) => (
                      <th key={i} className="px-3 py-3 text-center font-semibold">
                        {sub.name}<br /><span className="font-normal normal-case">/{sub.outOf}</span>
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center font-semibold">Presenty<br /><span className="font-normal normal-case">/{session.totalDays}</span></th>
                    <th className="px-3 py-3 text-center font-semibold">Total<br /><span className="font-normal normal-case">/{totalOutOf}</span></th>
                    <th className="px-3 py-3 print:hidden"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const total = rowTotal(row);
                    const pct = totalOutOf > 0 ? (total / totalOutOf) * 100 : 0;
                    return (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                        <td className="px-3 py-2">
                          <Input
                            value={row.name}
                            onChange={(e) => patchRow(i, { name: e.target.value })}
                            placeholder="Student name"
                            className="h-9 min-w-[150px] border-transparent bg-transparent px-2 shadow-none hover:border-border focus:border-border"
                          />
                        </td>
                        {session.subjects.map((_, si) => (
                          <td key={si} className="px-2 py-2">
                            <Input
                              type="text"
                              value={row.marks[si] ?? ""}
                              onChange={(e) => setMark(i, si, e.target.value)}
                              placeholder="0 / AB"
                              maxLength={5}
                              className={`h-9 w-16 border-transparent bg-transparent text-center shadow-none hover:border-border focus:border-border font-mono ${
                                row.marks[si]?.toUpperCase() === "AB" ? "text-orange-600 font-bold" : ""
                              }`}
                            />
                          </td>
                        ))}
                        <td className="px-2 py-2">
                          <Input
                            type="number" min={0} max={session.totalDays}
                            value={row.attendance}
                            onChange={(e) => patchRow(i, { attendance: e.target.value })}
                            placeholder="0"
                            className="h-9 w-16 border-transparent bg-transparent text-center shadow-none hover:border-border focus:border-border"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-block min-w-[48px] rounded-full px-2 py-0.5 text-xs font-bold ${
                            pct >= 60 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {total}/{totalOutOf}
                          </span>
                        </td>
                        <td className="px-2 py-2 print:hidden">
                          <div className="flex items-center gap-1">
                            {row.dirty && (
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => saveRow(i)} disabled={row.saving}>
                                {row.saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteRow(i)}>
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

            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden print:hidden">
              {rows.map((row, i) => {
                const total = rowTotal(row);
                const pct = totalOutOf > 0 ? (total / totalOutOf) * 100 : 0;
                return (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                          {i + 1}
                        </span>
                        <Input
                          value={row.name}
                          onChange={(e) => patchRow(i, { name: e.target.value })}
                          placeholder="Student name"
                          className="flex-1 h-9"
                        />
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                          pct >= 60 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {total}/{totalOutOf}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {session.subjects.map((sub, si) => (
                          <div key={si} className="grid gap-1">
                            <span className="truncate text-xs text-muted-foreground">{sub.name} /{sub.outOf}</span>
                            <Input
                              type="text"
                              value={row.marks[si] ?? ""}
                              onChange={(e) => setMark(i, si, e.target.value)}
                              placeholder="0 / AB"
                              maxLength={5}
                              className={`h-8 text-center font-mono ${
                                row.marks[si]?.toUpperCase() === "AB" ? "text-orange-600 font-bold" : ""
                              }`}
                            />
                          </div>
                        ))}
                        <div className="grid gap-1">
                          <span className="text-xs text-muted-foreground">Presenty /{session.totalDays}</span>
                          <Input
                            type="number" min={0}
                            value={row.attendance}
                            onChange={(e) => patchRow(i, { attendance: e.target.value })}
                            placeholder="0"
                            className="h-8 text-center"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-end gap-2">
                        {row.dirty && (
                          <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => saveRow(i)} disabled={row.saving}>
                            {row.saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            Save
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-8 text-destructive" onClick={() => deleteRow(i)}>
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
              {rows.filter(r => r.dirty).length > 0
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
