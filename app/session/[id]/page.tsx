"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, Download, PlusCircle, Save, Trash2,
  Loader2, Eye, Pencil, Search, X, Settings,
  Trophy, Users, BarChart3, CheckCircle, XCircle,
} from "lucide-react";
import { buildExcel } from "@/lib/excel";

/* ── DS Components ── */
import { DSButton }    from "@/ui/components/Button";
import { DSLozenge }   from "@/ui/components/Lozenge";
import { DSStatCard }  from "@/ui/components/StatCard";
import { DSEmptyState } from "@/ui/components/EmptyState";
import { ThemeToggle } from "@/ui/components/ThemeToggle";
import { NavAvatar }   from "@/ui/components/NavAvatar";
import { TopNavigation }  from "@/ui/layout/TopNavigation";
import { PageContainer }  from "@/ui/layout/PageContainer";

/* ── Types ── */
interface Subject { name: string; outOf: number }
interface Session {
  _id: string; instituteName: string; className: string;
  month: string; year: string; totalDays: number;
  managerName: string; subjects: Subject[];
}
interface Student {
  _id: string; name: string; attendance: number;
  marks: (number | string)[];
}
type Row = {
  _id: string | null; name: string; attendance: string;
  marks: string[]; saving: boolean; dirty: boolean; editing: boolean;
};

/* ── Helpers ── */
function normalizeMark(v: string) {
  return v.trim().toUpperCase() === "AB" ? "AB" : v;
}
function markNum(v: string) {
  if (v.trim().toUpperCase() === "AB") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function blankRow(n: number): Row {
  return { _id: null, name: "", attendance: "", marks: Array(n).fill(""), saving: false, dirty: false, editing: true };
}
function studentToRow(s: Student): Row {
  return {
    _id: s._id, name: s.name, attendance: String(s.attendance ?? ""),
    marks: (s.marks as Array<number | string>).map(String),
    saving: false, dirty: false, editing: false,
  };
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MEDAL  = ["🥇", "🥈", "🥉"];

/* ── View cell (read-only display) ── */
function ViewCell({ value }: { value: string }) {
  const isAB = value.trim().toUpperCase() === "AB";
  if (!value) return <span style={{ color: "var(--ds-text-subtlest)", fontSize: 13 }}>—</span>;
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: 13,
      fontVariantNumeric: "tabular-nums",
      fontWeight: isAB ? 700 : 400,
      color: isAB ? "#B45309" : "var(--ds-text)",
    }}>
      {value}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════ */
export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [session, setSession]       = useState<Session | null>(null);
  const [rows, setRows]             = useState<Row[]>([]);
  const [loading, setLoading]       = useState(true);
  const [exporting, setExporting]   = useState(false);
  const [search, setSearch]         = useState("");
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaForm, setMetaForm]     = useState({ month: "", year: "", totalDays: "" });
  const [savingMeta, setSavingMeta] = useState(false);

  const load = useCallback(async () => {
    const [sr, studR] = await Promise.all([
      fetch(`/api/sessions/${id}`),
      fetch(`/api/sessions/${id}/students`),
    ]);
    if (!sr.ok) { router.push("/"); return; }
    const sess: Session      = await sr.json();
    const students: Student[] = await studR.json();
    setSession(sess);
    setMetaForm({ month: sess.month, year: sess.year, totalDays: String(sess.totalDays) });
    setRows(students.map(studentToRow));
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  async function saveSessionMeta() {
    if (!session) return;
    setSavingMeta(true);
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: metaForm.month, year: metaForm.year,
          totalDays: Number(metaForm.totalDays) || session.totalDays,
        }),
      });
      if (!res.ok) throw new Error();
      const updated: Session = await res.json();
      setSession(updated);
      setEditingMeta(false);
      toast.success(`Updated to ${updated.month} ${updated.year}`);
    } catch { toast.error("Failed to update session"); }
    finally   { setSavingMeta(false); }
  }

  function patchRow(i: number, patch: Partial<Row>) {
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch, dirty: true } : r));
  }
  function setMark(ri: number, si: number, val: string) {
    setRows(rs => rs.map((r, i) => {
      if (i !== ri) return r;
      const marks = [...r.marks]; marks[si] = normalizeMark(val);
      return { ...r, marks, dirty: true };
    }));
  }
  function toggleEdit(i: number) {
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, editing: !r.editing } : r));
  }
  function addRow() {
    setRows(rs => [...rs, blankRow(session!.subjects.length)]);
  }

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
        const res  = await fetch(`/api/sessions/${id}/students/${row._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const updated: Student = await res.json();
        setRows(rs => rs.map((r, idx) => idx === i ? { ...studentToRow(updated), editing: false } : r));
      } else {
        const res  = await fetch(`/api/sessions/${id}/students`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const created: Student = await res.json();
        setRows(rs => rs.map((r, idx) => idx === i ? { ...studentToRow(created), editing: false } : r));
      }
      toast.success(`${payload.name} saved`);
    } catch {
      toast.error("Save failed");
      setRows(rs => rs.map((r, idx) => idx === i ? { ...r, saving: false } : r));
    }
  }

  async function deleteRow(i: number) {
    const row = rows[i];
    if (!confirm(`Remove "${row.name || "this student"}"?`)) return;
    if (row._id) {
      await fetch(`/api/sessions/${id}/students/${row._id}`, { method: "DELETE" });
      toast.success("Student removed");
    }
    setRows(rs => rs.filter((_, idx) => idx !== i));
  }

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
    } catch (e) { toast.error("Export failed: " + String(e)); }
    finally     { setExporting(false); }
  }

  /* ── Derived values ── */
  const totalOutOf = session?.subjects.reduce((s, sub) => s + sub.outOf, 0) ?? 0;
  const rowTotal   = (r: Row) => r.marks.reduce((s, m) => s + markNum(m), 0);

  const namedRows  = rows.filter(r => r.name.trim());
  const rankedRows = namedRows
    .map((row) => ({ row, total: rowTotal(row), pct: totalOutOf > 0 ? (rowTotal(row) / totalOutOf) * 100 : 0 }))
    .sort((a, b) => b.total !== a.total ? b.total - a.total : a.row.name.localeCompare(b.row.name));

  const toppers   = rankedRows.slice(0, 3);
  const passCount = namedRows.filter(r => totalOutOf > 0 && (rowTotal(r) / totalOutOf) * 100 >= 35).length;
  const failCount = namedRows.length - passCount;
  const classAvg  = namedRows.length > 0
    ? (namedRows.reduce((s, r) => s + rowTotal(r), 0) / namedRows.length / totalOutOf * 100)
    : 0;

  const subjectAvgs = session?.subjects.map((_, si) => {
    const vals = namedRows
      .filter(r => r.marks[si]?.toString().toUpperCase() !== "AB")
      .map(r => markNum(r.marks[si] ?? ""));
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }) ?? [];

  const q = search.toLowerCase().trim();
  const visibleRows = rows
    .map((row, originalIdx) => ({ row, originalIdx }))
    .filter(({ row }) => !q || row.name.toLowerCase().includes(q));

  const unsavedCount = rows.filter(r => r.dirty && !r._id).length;

  /* ── Loading ── */
  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "var(--ds-background)" }}>
      <div style={{ textAlign: "center" }}>
        <Loader2 style={{ width: 32, height: 32, color: "var(--ds-primary)", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 14, color: "var(--ds-text-subtle)", margin: 0 }}>Loading session…</p>
      </div>
    </div>
  );
  if (!session) return null;

  /* ── Render ── */
  return (
    <div style={{ minHeight: "100vh", background: "var(--ds-background)" }}>

      {/* ── Navigation ── */}
      <TopNavigation>
        <button
          className="ds-icon-btn"
          onClick={() => router.push("/")}
          aria-label="Back"
          style={{ border: "1px solid var(--ds-border)", flexShrink: 0 }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
        </button>

        <Image
          src="/image.png" alt="Logo" width={32} height={32}
          style={{ width: 32, height: 32, objectFit: "cover", borderRadius: "50%", border: "2px solid var(--ds-border)", flexShrink: 0 }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--ds-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {session.className}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--ds-text-subtle)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {session.month} {session.year} · {session.subjects.length} subjects · {totalOutOf} marks
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <DSButton
            variant="default" size="default"
            iconBefore={<PlusCircle style={{ width: 14, height: 14 }} />}
            onClick={addRow}
            className="hidden sm:inline-flex"
          >
            Add Student
          </DSButton>
          <DSButton
            variant="default" size="default"
            iconBefore={<Eye style={{ width: 14, height: 14 }} />}
            onClick={() => window.open(`/preview/${id}`, "_blank")}
            className="hidden sm:inline-flex"
          >
            Preview
          </DSButton>
          <DSButton
            variant="primary" size="default"
            loading={exporting}
            iconBefore={!exporting ? <Download style={{ width: 14, height: 14 }} /> : undefined}
            onClick={handleExport}
          >
            <span className="hidden sm:inline">Export Excel</span>
          </DSButton>
        </div>

        <ThemeToggle />
        <NavAvatar />
      </TopNavigation>

      <PageContainer>

        {/* ── Session meta chips ── */}
        <div className="ds-meta-row">
          <span className="ds-meta-chip">{session.instituteName}</span>
          <span className="ds-meta-chip">{session.className}</span>
          <button
            className="ds-meta-chip clickable"
            onClick={() => { setMetaForm({ month: session.month, year: session.year, totalDays: String(session.totalDays) }); setEditingMeta(true); }}
          >
            {session.month} {session.year}
          </button>
          <button
            className="ds-meta-chip clickable"
            onClick={() => { setMetaForm({ month: session.month, year: session.year, totalDays: String(session.totalDays) }); setEditingMeta(true); }}
          >
            {session.totalDays} days
          </button>
          <DSLozenge appearance="default">
            {rows.length} student{rows.length !== 1 ? "s" : ""}
          </DSLozenge>
          <button
            className="ds-icon-btn compact"
            title="Edit session details"
            onClick={() => { setMetaForm({ month: session.month, year: session.year, totalDays: String(session.totalDays) }); setEditingMeta(v => !v); }}
          >
            <Settings style={{ width: 13, height: 13 }} />
          </button>
        </div>

        {/* ── Meta edit panel ── */}
        {editingMeta && (
          <div className="ds-edit-panel">
            <p className="ds-caption" style={{ marginBottom: 12 }}>Edit Session Details</p>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 12 }}>
              <div className="ds-field">
                <label className="ds-field__label">Month</label>
                <Select value={metaForm.month} onValueChange={v => setMetaForm(f => ({ ...f, month: v ?? f.month }))}>
                  <SelectTrigger style={{ width: 148 }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="ds-field">
                <label className="ds-field__label">Year</label>
                <input
                  className="ds-textfield center"
                  style={{ width: 80 }}
                  value={metaForm.year}
                  onChange={e => setMetaForm(f => ({ ...f, year: e.target.value }))}
                  placeholder="2026" maxLength={4}
                />
              </div>
              <div className="ds-field">
                <label className="ds-field__label">Total Days</label>
                <input
                  className="ds-textfield center"
                  style={{ width: 80 }}
                  type="number" min={1} max={31}
                  value={metaForm.totalDays}
                  onChange={e => setMetaForm(f => ({ ...f, totalDays: e.target.value }))}
                  placeholder="25"
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <DSButton
                  variant="primary" size="default"
                  loading={savingMeta}
                  iconBefore={!savingMeta ? <Save style={{ width: 14, height: 14 }} /> : undefined}
                  onClick={saveSessionMeta}
                >
                  Save
                </DSButton>
                <DSButton variant="subtle" size="default" onClick={() => setEditingMeta(false)}>
                  Cancel
                </DSButton>
              </div>
            </div>
            <p style={{ marginTop: 8, fontSize: 12, color: "var(--ds-text-subtle)" }}>
              Students stay the same — update month/year to reuse this class for next month.
            </p>
          </div>
        )}

        {/* ── Stats ── */}
        {namedRows.length > 0 && (
          <div className="ds-grid-stats print:hidden" style={{ marginBottom: 20 }}>
            <DSStatCard
              label="Students"
              value={namedRows.length}
              icon={<Users style={{ width: 18, height: 18, color: "#0052CC" }} />}
              iconBg="var(--ds-brand-bg)"
            />
            <DSStatCard
              label="Class Avg"
              value={`${classAvg.toFixed(1)}%`}
              icon={<BarChart3 style={{ width: 18, height: 18, color: "#0052CC" }} />}
              iconBg="var(--ds-brand-bg)"
            />
            <DSStatCard
              label="Passed"
              value={passCount}
              icon={<CheckCircle style={{ width: 18, height: 18, color: "#1F845A" }} />}
              iconBg="var(--ds-success-bg)"
              valueColor="#1F845A"
            />
            <DSStatCard
              label="Failed"
              value={failCount}
              icon={<XCircle style={{ width: 18, height: 18, color: "var(--ds-danger)" }} />}
              iconBg="var(--ds-danger-bg)"
              valueColor="var(--ds-danger)"
            />
          </div>
        )}

        {/* ── Toppers ── */}
        {toppers.length > 0 && (
          <div className="ds-toppers print:hidden">
            <div className="ds-section-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Trophy style={{ width: 15, height: 15, color: "#F5A623" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ds-text)" }}>Top Performers</span>
              </div>
              <span style={{ fontSize: 12, color: "var(--ds-text-subtle)" }}>{session.month} {session.year}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              {toppers.map(({ row, total, pct }, idx) => (
                <div
                  key={`${row._id ?? row.name}-${idx}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 16px",
                    borderRight: idx < toppers.length - 1 ? "1px solid var(--ds-border)" : "none",
                  }}
                >
                  <span style={{ fontSize: 24, lineHeight: 1, userSelect: "none" }}>{MEDAL[idx]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, color: "var(--ds-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.name}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="ds-progress">
                        <div className="ds-progress__fill" style={{ width: `${Math.round(pct)}%` }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ds-text-subtle)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                        {total}/{totalOutOf}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="ds-toolbar">
          <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
            <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--ds-text-subtlest)", pointerEvents: "none" }} />
            <input
              className="ds-textfield compact"
              style={{ paddingLeft: 32, paddingRight: 32 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search student…"
            />
            {search && (
              <button
                className="ds-icon-btn compact"
                style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)" }}
                onClick={() => setSearch("")}
              >
                <X style={{ width: 13, height: 13 }} />
              </button>
            )}
          </div>
          {q && (
            <span style={{ fontSize: 12, color: "var(--ds-text-subtle)", flexShrink: 0 }}>
              {visibleRows.length} of {rows.length}
            </span>
          )}
          <DSButton
            variant="default" size="compact"
            iconBefore={<PlusCircle style={{ width: 13, height: 13 }} />}
            onClick={addRow}
            className="ml-auto sm:hidden"
          >
            Add
          </DSButton>
        </div>

        {/* ── Empty states ── */}
        {rows.length === 0 ? (
          <DSEmptyState
            icon={<Users style={{ width: 24, height: 24, color: "var(--ds-primary)" }} />}
            title="No students added yet"
            description="Add your first student to start entering marks."
            action={
              <DSButton
                variant="default" size="default"
                iconBefore={<PlusCircle style={{ width: 16, height: 16 }} />}
                onClick={addRow}
              >
                Add First Student
              </DSButton>
            }
          />
        ) : visibleRows.length === 0 ? (
          <div className="ds-empty" style={{ padding: "40px 32px" }}>
            <Search style={{ width: 28, height: 28, color: "var(--ds-text-subtlest)" }} />
            <p style={{ margin: 0, fontSize: 14, color: "var(--ds-text-subtle)" }}>
              No student found for &quot;{search}&quot;
            </p>
            <DSButton variant="subtle" size="compact" onClick={() => setSearch("")}>
              Clear search
            </DSButton>
          </div>
        ) : (
          <>
            {/* ── Desktop table ── */}
            <div className="hidden sm:block" style={{ background: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: 8, overflow: "hidden", boxShadow: "var(--shadow-xs)" }}>
              <div style={{ overflowX: "auto" }}>
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40, textAlign: "center" }}>#</th>
                      <th style={{ minWidth: 180 }}>Student Name</th>
                      {session.subjects.map((sub, i) => (
                        <th key={i} className="center">
                          <span style={{ display: "block" }}>{sub.name}</span>
                          <span style={{ display: "block", fontSize: 10, fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--ds-text-subtlest)" }}>
                            /{sub.outOf}
                          </span>
                        </th>
                      ))}
                      <th className="center">
                        <span style={{ display: "block" }}>Presenty</span>
                        <span style={{ display: "block", fontSize: 10, fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--ds-text-subtlest)" }}>
                          /{session.totalDays}
                        </span>
                      </th>
                      <th className="center">
                        <span style={{ display: "block" }}>Total</span>
                        <span style={{ display: "block", fontSize: 10, fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--ds-text-subtlest)" }}>
                          /{totalOutOf}
                        </span>
                      </th>
                      <th className="center" style={{ width: 88 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map(({ row, originalIdx: i }) => {
                      const total = rowTotal(row);
                      const pct   = totalOutOf > 0 ? (total / totalOutOf) * 100 : 0;
                      const isPass = pct >= 35;
                      return (
                        <tr key={i} className={row.editing ? "is-editing" : ""}>
                          {/* # */}
                          <td style={{ textAlign: "center", fontSize: 12, color: "var(--ds-text-subtlest)", fontVariantNumeric: "tabular-nums" }}>
                            {i + 1}
                          </td>

                          {/* Name */}
                          <td>
                            {row.editing ? (
                              <input
                                className="ds-textfield compact"
                                style={{ minWidth: 140 }}
                                value={row.name}
                                onChange={e => patchRow(i, { name: e.target.value })}
                                placeholder="Student name"
                              />
                            ) : (
                              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ds-text)" }}>
                                {row.name || <span style={{ color: "var(--ds-text-subtlest)" }}>—</span>}
                              </span>
                            )}
                          </td>

                          {/* Subject marks */}
                          {session.subjects.map((_, si) => (
                            <td key={si} style={{ textAlign: "center" }}>
                              {row.editing ? (
                                <input
                                  className={`ds-textfield compact center mono${row.marks[si]?.toUpperCase() === "AB" ? "" : ""}`}
                                  style={{
                                    width: 56,
                                    color: row.marks[si]?.toUpperCase() === "AB" ? "#B45309" : undefined,
                                    fontWeight: row.marks[si]?.toUpperCase() === "AB" ? 700 : undefined,
                                  }}
                                  value={row.marks[si] ?? ""}
                                  onChange={e => setMark(i, si, e.target.value)}
                                  placeholder="—"
                                  maxLength={5}
                                />
                              ) : (
                                <ViewCell value={row.marks[si] ?? ""} />
                              )}
                            </td>
                          ))}

                          {/* Presenty */}
                          <td style={{ textAlign: "center" }}>
                            {row.editing ? (
                              <input
                                className="ds-textfield compact center"
                                style={{ width: 56 }}
                                type="number" min={0} max={session.totalDays}
                                value={row.attendance}
                                onChange={e => patchRow(i, { attendance: e.target.value })}
                                placeholder="0"
                              />
                            ) : (
                              <ViewCell value={row.attendance} />
                            )}
                          </td>

                          {/* Total */}
                          <td style={{ textAlign: "center" }}>
                            {row.name.trim() ? (
                              <DSLozenge appearance={isPass ? "success" : "danger"}>
                                {total}/{totalOutOf}
                              </DSLozenge>
                            ) : (
                              <span style={{ color: "var(--ds-text-subtlest)", fontSize: 13 }}>—</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                              {row.editing ? (
                                <button
                                  className="ds-icon-btn brand active"
                                  onClick={() => saveRow(i)}
                                  disabled={row.saving}
                                  title="Save"
                                >
                                  {row.saving
                                    ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                                    : <Save style={{ width: 14, height: 14 }} />
                                  }
                                </button>
                              ) : (
                                <button
                                  className="ds-icon-btn brand"
                                  onClick={() => toggleEdit(i)}
                                  title="Edit"
                                >
                                  <Pencil style={{ width: 14, height: 14 }} />
                                </button>
                              )}
                              <button
                                className="ds-icon-btn danger"
                                onClick={() => deleteRow(i)}
                                title="Delete"
                              >
                                <Trash2 style={{ width: 14, height: 14 }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Class average footer */}
                  {namedRows.length >= 2 && !q && (
                    <tfoot>
                      <tr>
                        <td />
                        <td>
                          <span className="ds-caption">Class Avg</span>
                        </td>
                        {subjectAvgs.map((avg, si) => (
                          <td key={si} style={{ textAlign: "center" }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ds-text-subtle)", fontVariantNumeric: "tabular-nums" }}>
                              {avg !== null ? avg.toFixed(1) : "—"}
                            </span>
                          </td>
                        ))}
                        <td style={{ textAlign: "center" }}>
                          <span style={{ fontSize: 12, color: "var(--ds-text-subtle)" }}>—</span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <DSLozenge appearance="primary" isBold>
                            {classAvg.toFixed(1)}%
                          </DSLozenge>
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* ── Mobile cards ── */}
            <div className="sm:hidden flex flex-col gap-3">
              {visibleRows.map(({ row, originalIdx: i }) => {
                const total = rowTotal(row);
                const pct   = totalOutOf > 0 ? (total / totalOutOf) * 100 : 0;
                const isPass = pct >= 35;
                return (
                  <div
                    key={i}
                    style={{
                      background: "var(--ds-surface)",
                      border: `1px solid ${row.editing ? "#4C9AFF" : "var(--ds-border)"}`,
                      borderLeft: `4px solid ${row.editing ? "var(--ds-primary)" : "var(--ds-border)"}`,
                      borderRadius: 8,
                      padding: 16,
                      boxShadow: "var(--shadow-xs)",
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 4, background: "var(--ds-neutral)", fontSize: 12, fontWeight: 700, color: "var(--ds-text-subtle)", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                        {i + 1}
                      </span>
                      {row.editing ? (
                        <input
                          className="ds-textfield compact"
                          style={{ flex: 1 }}
                          value={row.name}
                          onChange={e => patchRow(i, { name: e.target.value })}
                          placeholder="Student name"
                        />
                      ) : (
                        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--ds-text)" }}>
                          {row.name || "—"}
                        </span>
                      )}
                      {row.name.trim() && (
                        <DSLozenge appearance={isPass ? "success" : "danger"}>
                          {total}/{totalOutOf}
                        </DSLozenge>
                      )}
                    </div>

                    {/* Mark inputs */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
                      {session.subjects.map((sub, si) => (
                        <div key={si} style={{ display: "grid", gap: 4 }}>
                          <span style={{ fontSize: 11, color: "var(--ds-text-subtle)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {sub.name}/{sub.outOf}
                          </span>
                          {row.editing ? (
                            <input
                              className="ds-textfield compact center mono"
                              value={row.marks[si] ?? ""}
                              onChange={e => setMark(i, si, e.target.value)}
                              placeholder="—" maxLength={5}
                            />
                          ) : (
                            <div style={{ height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 3, border: "1px solid var(--ds-border)", background: "var(--ds-surface-sunken)" }}>
                              <ViewCell value={row.marks[si] ?? ""} />
                            </div>
                          )}
                        </div>
                      ))}
                      <div style={{ display: "grid", gap: 4 }}>
                        <span style={{ fontSize: 11, color: "var(--ds-text-subtle)" }}>Presenty/{session.totalDays}</span>
                        {row.editing ? (
                          <input
                            className="ds-textfield compact center"
                            type="number" min={0}
                            value={row.attendance}
                            onChange={e => patchRow(i, { attendance: e.target.value })}
                            placeholder="0"
                          />
                        ) : (
                          <div style={{ height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 3, border: "1px solid var(--ds-border)", background: "var(--ds-surface-sunken)" }}>
                            <ViewCell value={row.attendance} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, paddingTop: 12, borderTop: "1px solid var(--ds-border)" }}>
                      {row.editing ? (
                        <DSButton
                          variant="primary" size="compact"
                          loading={row.saving}
                          iconBefore={!row.saving ? <Save style={{ width: 12, height: 12 }} /> : undefined}
                          onClick={() => saveRow(i)}
                        >
                          Save
                        </DSButton>
                      ) : (
                        <DSButton
                          variant="default" size="compact"
                          iconBefore={<Pencil style={{ width: 12, height: 12 }} />}
                          onClick={() => toggleEdit(i)}
                        >
                          Edit
                        </DSButton>
                      )}
                      <DSButton
                        variant="subtle-danger" size="compact"
                        iconBefore={<Trash2 style={{ width: 12, height: 12 }} />}
                        onClick={() => deleteRow(i)}
                      >
                        Remove
                      </DSButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Export footer ── */}
        {rows.length > 0 && (
          <div className="ds-export-footer print:hidden">
            {unsavedCount > 0 ? (
              <div className="ds-alert ds-alert--warning">
                {unsavedCount} unsaved row{unsavedCount !== 1 ? "s" : ""} — please save before exporting.
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: 14, color: "var(--ds-text-subtle)" }}>
                {rows.length} student{rows.length !== 1 ? "s" : ""} ready to export.
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 400 }}>
              <DSButton
                variant="primary" size="large"
                loading={exporting}
                iconBefore={!exporting ? <Download style={{ width: 18, height: 18 }} /> : undefined}
                onClick={handleExport}
                style={{ width: "100%" }}
              >
                Download Excel Sheet
              </DSButton>
              <DSButton
                variant="default" size="large"
                iconBefore={<Eye style={{ width: 18, height: 18 }} />}
                onClick={() => window.open(`/preview/${id}`, "_blank")}
                style={{ width: "100%" }}
              >
                Print Preview
              </DSButton>
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
