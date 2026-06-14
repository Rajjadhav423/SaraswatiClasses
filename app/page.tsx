"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  PlusCircle,
  Trash2,
  BookOpen,
  Calendar,
  ChevronRight,
  Users,
  ClipboardList,
  Hash,
  UserPlus,
} from "lucide-react";

/* ── DS Components ── */
import { DSButton }     from "@/ui/components/Button";
import { DSCard }       from "@/ui/components/Card";
import { DSLozenge }    from "@/ui/components/Lozenge";
import { DSEmptyState } from "@/ui/components/EmptyState";
import { DSPageHeader } from "@/ui/components/PageHeader";
import { ThemeToggle }  from "@/ui/components/ThemeToggle";
import { NavAvatar }    from "@/ui/components/NavAvatar";
import { TopNavigation }  from "@/ui/layout/TopNavigation";
import { PageContainer }  from "@/ui/layout/PageContainer";
import { ConfirmDialog }  from "@/ui/components/ConfirmDialog";

/* ── Constants ── */
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

/* ── Types ── */
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
    { name: "Physics",   outOf: 20 },
    { name: "Chemistry", outOf: 20 },
    { name: "Math",      outOf: 20 },
    { name: "Biology",   outOf: 20 },
    { name: "English",   outOf: 20 },
  ] as Subject[],
};

/* ════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [delConfirm, setDelConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  const loadSessions = useCallback(async () => {
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
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

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

  function deleteSession(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setDelConfirm({ open: true, id });
  }

  async function doDeleteSession() {
    if (!delConfirm.id) return;
    const id = delConfirm.id;
    setDelConfirm({ open: false, id: null });
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    toast.success("Session deleted");
    loadSessions();
  }

  const totalOutOf = (subjects: Subject[]) => subjects.reduce((s, sub) => s + sub.outOf, 0);

  const count = sessions.length;
  const description = loading
    ? "Loading sessions…"
    : count === 0
      ? "No sessions yet. Create your first one to get started."
      : `${count} exam session${count !== 1 ? "s" : ""}`;

  return (
    <div style={{ minHeight: "100vh", background: "var(--ds-background)" }}>

      {/* ── Top Navigation ─────────────────────────────────────── */}
      <TopNavigation>
        <Image
          src="/image.png"
          alt="Saraswati Classes Logo"
          width={36} height={36}
          style={{ width: 36, height: 36, objectFit: "cover", borderRadius: "50%", border: "2px solid var(--ds-border)", flexShrink: 0 }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--ds-text)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Shree Saraswati Classes, Kannad
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--ds-text-subtle)" }}>
            Mark Memo Management System
          </p>
        </div>

        <div className="hidden sm:block">
          <DSButton
            variant="default"
            size="default"
            iconBefore={<UserPlus style={{ width: 15, height: 15 }} />}
            onClick={() => router.push("/admissions")}
          >
            Admissions
          </DSButton>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <DSButton variant="primary" size="default" iconBefore={<PlusCircle style={{ width: 16, height: 16 }} />}>
                <span className="hidden sm:inline">New Session</span>
                <span className="sm:hidden">New</span>
              </DSButton>
            }
          />

          {/* ── Create Session Modal ── */}
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Exam Session</DialogTitle>
            </DialogHeader>

            <div style={{ padding: "20px 24px 24px", overflowY: "auto", flex: 1 }}>
              {/* Institute */}
              <div className="ds-field" style={{ marginBottom: 16 }}>
                <label className="ds-field__label">Institute Name</label>
                <input
                  className="ds-textfield"
                  value={form.instituteName}
                  onChange={(e) => setField("instituteName", e.target.value)}
                />
              </div>

              {/* Class + Year */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div className="ds-field">
                  <label className="ds-field__label">
                    Class <span className="ds-field__required">*</span>
                  </label>
                  <input
                    className="ds-textfield"
                    placeholder="e.g. 11th Science"
                    value={form.className}
                    onChange={(e) => setField("className", e.target.value)}
                  />
                </div>
                <div className="ds-field">
                  <label className="ds-field__label">Year</label>
                  <input
                    className="ds-textfield"
                    placeholder="2026"
                    value={form.year}
                    onChange={(e) => setField("year", e.target.value)}
                  />
                </div>
              </div>

              {/* Month + Days */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div className="ds-field">
                  <label className="ds-field__label">Month</label>
                  <Select value={form.month} onValueChange={(v) => setField("month", v ?? form.month)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="ds-field">
                  <label className="ds-field__label">Total Days</label>
                  <input
                    className="ds-textfield"
                    type="number"
                    placeholder="25"
                    value={form.totalDays}
                    onChange={(e) => setField("totalDays", e.target.value)}
                  />
                </div>
              </div>

              {/* Manager */}
              <div className="ds-field" style={{ marginBottom: 20 }}>
                <label className="ds-field__label">Manager / Footer Name</label>
                <input
                  className="ds-textfield"
                  value={form.managerName}
                  onChange={(e) => setField("managerName", e.target.value)}
                />
              </div>

              <div className="ds-separator" style={{ marginBottom: 20 }} />

              {/* Subjects */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--ds-text)" }}>
                      Subjects &amp; Marks
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ds-text-subtle)" }}>
                      Total out of:{" "}
                      <strong style={{ color: "var(--ds-primary)" }}>
                        {form.subjects.reduce((s, sub) => s + sub.outOf, 0)}
                      </strong>
                    </p>
                  </div>
                  <DSButton variant="default" size="compact" onClick={addSubject}>
                    + Add Subject
                  </DSButton>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {form.subjects.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        className="ds-textfield"
                        placeholder="Subject name"
                        value={s.name}
                        onChange={(e) => setSubject(i, "name", e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <input
                        className="ds-textfield center"
                        type="number"
                        placeholder="20"
                        value={s.outOf}
                        onChange={(e) => setSubject(i, "outOf", e.target.value)}
                        style={{ width: 72 }}
                      />
                      <button
                        className="ds-icon-btn danger"
                        onClick={() => removeSubject(i)}
                        title="Remove subject"
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <DSButton
                  variant="primary"
                  size="large"
                  loading={saving}
                  iconBefore={!saving ? <ClipboardList style={{ width: 16, height: 16 }} /> : undefined}
                  onClick={createSession}
                  style={{ width: "100%" }}
                >
                  {saving ? "Creating…" : "Create Session"}
                </DSButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <ThemeToggle />
        <NavAvatar />
      </TopNavigation>

      {/* ── Page Content ──────────────────────────────────────── */}
      <PageContainer>
        <DSPageHeader title="Exam Sessions" description={description} />

        {/* Loading skeletons */}
        {loading && (
          <div className="ds-grid-cards">
            {[1, 2, 3].map((k) => (
              <div key={k} className="ds-skeleton" style={{ height: 188 }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && sessions.length === 0 && (
          <DSEmptyState
            icon={<BookOpen style={{ width: 28, height: 28, color: "var(--ds-primary)" }} />}
            title="No sessions yet"
            description="Create your first exam session to start recording student marks and attendance."
            action={
              <DSButton
                variant="primary"
                size="default"
                iconBefore={<PlusCircle style={{ width: 16, height: 16 }} />}
                onClick={() => setOpen(true)}
              >
                Create First Session
              </DSButton>
            }
          />
        )}

        {/* Session cards */}
        {!loading && sessions.length > 0 && (
          <div className="ds-grid-cards">
            {sessions.map((s) => (
              <DSCard
                key={s._id}
                onClick={() => router.push(`/session/${s._id}`)}
                accent
              >
                <DSCard.Body>
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--ds-text)", lineHeight: 1.3 }}>
                      {s.className}
                    </h3>
                    <button
                      className="ds-icon-btn compact danger ds-card__delete-btn"
                      style={{ marginTop: -2, marginRight: -4 }}
                      onClick={(e) => deleteSession(e, s._id)}
                      title="Delete session"
                      aria-label="Delete session"
                    >
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>

                  <p style={{ margin: "0 0 16px", fontSize: 12, color: "var(--ds-text-subtle)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.instituteName}
                  </p>

                  {/* Info pills */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                    <div className="ds-info-pill">
                      <Calendar style={{ width: 13, height: 13, color: "var(--ds-primary)", flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.month} {s.year}
                      </span>
                    </div>
                    <div className="ds-info-pill">
                      <Users style={{ width: 13, height: 13, color: "var(--ds-primary)", flexShrink: 0 }} />
                      {s.totalDays} days
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--ds-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Hash style={{ width: 12, height: 12, color: "var(--ds-text-subtlest)" }} />
                      <span style={{ fontSize: 12, color: "var(--ds-text-subtle)" }}>
                        {s.subjects.length} subjects
                      </span>
                      <span style={{ fontSize: 12, color: "var(--ds-text-subtlest)" }}>·</span>
                      <DSLozenge appearance="primary">
                        {totalOutOf(s.subjects)} marks
                      </DSLozenge>
                    </div>
                    <ChevronRight style={{ width: 15, height: 15, color: "var(--ds-text-subtlest)" }} />
                  </div>
                </DSCard.Body>
              </DSCard>
            ))}
          </div>
        )}
      </PageContainer>

      <ConfirmDialog
        open={delConfirm.open}
        title="Delete Session"
        message="Delete this session and all its student data? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={doDeleteSession}
        onCancel={() => setDelConfirm({ open: false, id: null })}
      />
    </div>
  );
}
