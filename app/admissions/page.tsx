"use client";

import { useEffect, useState, useCallback } from "react";
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
import { toast } from "sonner";
import {
  PlusCircle,
  Trash2,
  Users,
  Search,
  ExternalLink,
  Phone,
  Calendar,
  School,
} from "lucide-react";

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

import {
  STANDARDS,
  SUBJECTS_BY_STANDARD,
  FEE_STRUCTURE,
  getAcademicYear,
  fmtINR,
  type Standard,
} from "@/lib/admission-config";

/* ── Types ── */
interface Admission {
  _id: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  mobile: string;
  altMobile?: string;
  address: string;
  dob: string;
  admissionDate: string;
  schoolName?: string;
  standard: string;
  academicYear: string;
  subjects: string[];
  totalFee: number;
  installments?: { label: string; amount: number; paid: boolean }[];
  createdAt: string;
}

const EMPTY_FORM = {
  studentName:   "",
  fatherName:    "",
  motherName:    "",
  mobile:        "",
  altMobile:     "",
  address:       "",
  dob:           "",
  admissionDate: new Date().toISOString().slice(0, 10),
  schoolName:    "",
  standard:      "" as Standard | "",
  academicYear:  getAcademicYear(),
  subjects:      [] as string[],
};

/* ════════════════════════════════════════════════════════════ */
export default function AdmissionsPage() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading]       = useState(true);
  const [open, setOpen]             = useState(false);
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState("");
  const [delConfirm, setDelConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  const loadAdmissions = useCallback(async () => {
    try {
      const res = await fetch("/api/admissions");
      if (!res.ok) {
        toast.error("Database connection failed. Check MONGODB_URI.");
        setLoading(false);
        return;
      }
      setAdmissions(await res.json());
    } catch {
      toast.error("Cannot reach server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAdmissions(); }, [loadAdmissions]);

  function setField<K extends keyof typeof EMPTY_FORM>(k: K, v: (typeof EMPTY_FORM)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onStandardChange(std: string | null) {
    if (!std) return;
    const s = std as Standard;
    const fee = FEE_STRUCTURE[s];
    setForm((f) => ({
      ...f,
      standard:      s,
      subjects:      [],
      totalFee:      fee?.total ?? 0,
    }));
  }

  function toggleSubject(sub: string) {
    setForm((f) => {
      const has = f.subjects.includes(sub);
      return { ...f, subjects: has ? f.subjects.filter((s) => s !== sub) : [...f.subjects, sub] };
    });
  }

  async function createAdmission() {
    if (!form.studentName.trim()) { toast.error("Student name is required"); return; }
    if (!form.fatherName.trim())  { toast.error("Father's name is required"); return; }
    if (!form.mobile.trim())      { toast.error("Mobile number is required"); return; }
    if (!form.address.trim())     { toast.error("Address is required"); return; }
    if (!form.standard)           { toast.error("Standard is required"); return; }
    if (!form.dob)                { toast.error("Date of birth is required"); return; }

    setSaving(true);
    try {
      const fee = form.standard ? FEE_STRUCTURE[form.standard as Standard] : null;
      const payload = {
        ...form,
        altMobile:    form.altMobile || undefined,
        schoolName:   form.schoolName || undefined,
        totalFee:     fee?.total ?? 0,
        installments: fee?.installments?.map((i) => ({ ...i, paid: false })),
      };
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Admission created!");
      setOpen(false);
      setForm({ ...EMPTY_FORM });
      loadAdmissions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Could not save admission: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  function deleteAdmission(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setDelConfirm({ open: true, id });
  }

  async function doDeleteAdmission() {
    if (!delConfirm.id) return;
    const id = delConfirm.id;
    setDelConfirm({ open: false, id: null });
    await fetch(`/api/admissions/${id}`, { method: "DELETE" });
    toast.success("Deleted");
    loadAdmissions();
  }

  const filtered = admissions.filter((a) => {
    const q = search.toLowerCase();
    return !q || a.studentName.toLowerCase().includes(q) || a.standard.toLowerCase().includes(q) || a.mobile.includes(q);
  });

  const availableSubjects = form.standard ? SUBJECTS_BY_STANDARD[form.standard as Standard] ?? [] : [];
  const feeEntry = form.standard ? FEE_STRUCTURE[form.standard as Standard] : null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--ds-background)" }}>

      {/* ── Top Navigation ── */}
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
            Admission Management
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <DSButton variant="primary" size="default" iconBefore={<PlusCircle style={{ width: 16, height: 16 }} />}>
                <span className="hidden sm:inline">New Admission</span>
                <span className="sm:hidden">New</span>
              </DSButton>
            }
          />

          {/* ── Create Admission Dialog ── */}
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Student Admission</DialogTitle>
            </DialogHeader>

            <div style={{ padding: "16px 24px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Standard + Academic Year */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="ds-field">
                  <label className="ds-field__label">Standard <span className="ds-field__required">*</span></label>
                  <Select value={form.standard} onValueChange={onStandardChange}>
                    <SelectTrigger><SelectValue placeholder="Select standard" /></SelectTrigger>
                    <SelectContent>
                      {STANDARDS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="ds-field">
                  <label className="ds-field__label">Academic Year</label>
                  <input
                    className="ds-textfield"
                    value={form.academicYear}
                    onChange={(e) => setField("academicYear", e.target.value)}
                  />
                </div>
              </div>

              {/* Fee preview */}
              {feeEntry && (
                <div style={{ background: "var(--ds-brand-bg)", border: "1px solid var(--ds-border-bold)", borderRadius: 6, padding: "10px 14px" }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--ds-primary)" }}>
                    Total Fee: {fmtINR(feeEntry.total)}
                  </p>
                  {feeEntry.installments && (
                    <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--ds-text-subtle)" }}>
                      {feeEntry.installments.map((i) => `${i.label}: ${fmtINR(i.amount)}`).join("  +  ")}
                    </p>
                  )}
                </div>
              )}

              <div className="ds-separator" />

              {/* Student Name */}
              <div className="ds-field">
                <label className="ds-field__label">Student Name <span className="ds-field__required">*</span></label>
                <input className="ds-textfield" placeholder="Full name" value={form.studentName} onChange={(e) => setField("studentName", e.target.value)} />
              </div>

              {/* Father + Mother */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="ds-field">
                  <label className="ds-field__label">Father's Name <span className="ds-field__required">*</span></label>
                  <input className="ds-textfield" placeholder="Father's name" value={form.fatherName} onChange={(e) => setField("fatherName", e.target.value)} />
                </div>
                <div className="ds-field">
                  <label className="ds-field__label">Mother's Name</label>
                  <input className="ds-textfield" placeholder="Mother's name" value={form.motherName} onChange={(e) => setField("motherName", e.target.value)} />
                </div>
              </div>

              {/* Mobile + Alt Mobile */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="ds-field">
                  <label className="ds-field__label">Mobile <span className="ds-field__required">*</span></label>
                  <input className="ds-textfield" type="tel" placeholder="10-digit number" value={form.mobile} onChange={(e) => setField("mobile", e.target.value)} />
                </div>
                <div className="ds-field">
                  <label className="ds-field__label">Alt Mobile</label>
                  <input className="ds-textfield" type="tel" placeholder="Optional" value={form.altMobile} onChange={(e) => setField("altMobile", e.target.value)} />
                </div>
              </div>

              {/* Address */}
              <div className="ds-field">
                <label className="ds-field__label">Address <span className="ds-field__required">*</span></label>
                <textarea className="ds-textfield" rows={2} placeholder="Full address" value={form.address} onChange={(e) => setField("address", e.target.value)} style={{ resize: "vertical" }} />
              </div>

              {/* DOB + Admission Date */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="ds-field">
                  <label className="ds-field__label">Date of Birth <span className="ds-field__required">*</span></label>
                  <input className="ds-textfield" type="date" value={form.dob} onChange={(e) => setField("dob", e.target.value)} />
                </div>
                <div className="ds-field">
                  <label className="ds-field__label">Admission Date</label>
                  <input className="ds-textfield" type="date" value={form.admissionDate} onChange={(e) => setField("admissionDate", e.target.value)} />
                </div>
              </div>

              {/* School Name */}
              <div className="ds-field">
                <label className="ds-field__label">School / College Name</label>
                <input className="ds-textfield" placeholder="Student's current school" value={form.schoolName} onChange={(e) => setField("schoolName", e.target.value)} />
              </div>

              {/* Subjects */}
              {availableSubjects.length > 0 && (
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "var(--ds-text)" }}>
                    Subjects
                    {form.subjects.length > 0 && (
                      <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: "var(--ds-text-subtle)" }}>
                        ({form.subjects.length} selected)
                      </span>
                    )}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {availableSubjects.map((sub) => {
                      const checked = form.subjects.includes(sub);
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => toggleSubject(sub)}
                          style={{
                            padding: "5px 12px",
                            borderRadius: 20,
                            border: `1.5px solid ${checked ? "var(--ds-primary)" : "var(--ds-border)"}`,
                            background: checked ? "var(--ds-primary)" : "var(--ds-surface)",
                            color: checked ? "#fff" : "var(--ds-text)",
                            fontSize: 13,
                            fontWeight: checked ? 600 : 400,
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 4 }}>
                <DSButton
                  variant="primary"
                  size="large"
                  loading={saving}
                  onClick={createAdmission}
                  style={{ width: "100%" }}
                >
                  {saving ? "Saving…" : "Save Admission"}
                </DSButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <ThemeToggle />
        <NavAvatar />
      </TopNavigation>

      {/* ── Page Content ── */}
      <PageContainer>
        <DSPageHeader
          title="Admissions"
          description={loading ? "Loading…" : `${admissions.length} admission${admissions.length !== 1 ? "s" : ""} recorded`}
        />

        {/* Search */}
        {!loading && admissions.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ position: "relative", maxWidth: 360 }}>
              <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--ds-text-subtlest)" }} />
              <input
                className="ds-textfield"
                placeholder="Search by name, standard, mobile…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 32 }}
              />
            </div>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="ds-grid-cards">
            {[1, 2, 3].map((k) => <div key={k} className="ds-skeleton" style={{ height: 170 }} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && admissions.length === 0 && (
          <DSEmptyState
            icon={<Users style={{ width: 28, height: 28, color: "var(--ds-primary)" }} />}
            title="No admissions yet"
            description="Add your first student admission to get started."
            action={
              <DSButton variant="primary" size="default" iconBefore={<PlusCircle style={{ width: 16, height: 16 }} />} onClick={() => setOpen(true)}>
                Add First Admission
              </DSButton>
            }
          />
        )}

        {/* Admissions grid */}
        {!loading && filtered.length > 0 && (
          <div className="ds-grid-cards">
            {filtered.map((a) => (
              <DSCard key={a._id} accent>
                <DSCard.Body>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--ds-text)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.studentName}
                      </h3>
                      <p style={{ margin: "1px 0 0", fontSize: 12, color: "var(--ds-text-subtle)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.fatherName} / {a.motherName}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button
                        className="ds-icon-btn compact"
                        title="Print admission form"
                        onClick={() => window.open(`/admissions/${a._id}/print`, "_blank")}
                      >
                        <ExternalLink style={{ width: 13, height: 13 }} />
                      </button>
                      <button
                        className="ds-icon-btn compact danger"
                        onClick={(e) => deleteAdmission(e, a._id)}
                        title="Delete admission"
                      >
                        <Trash2 style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                  </div>

                  {/* Pills */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, margin: "10px 0" }}>
                    <div className="ds-info-pill">
                      <School style={{ width: 12, height: 12, color: "var(--ds-primary)", flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.standard} · {a.academicYear}
                      </span>
                    </div>
                    <div className="ds-info-pill">
                      <Phone style={{ width: 12, height: 12, color: "var(--ds-primary)", flexShrink: 0 }} />
                      <span>{a.mobile}</span>
                    </div>
                    <div className="ds-info-pill">
                      <Calendar style={{ width: 12, height: 12, color: "var(--ds-primary)", flexShrink: 0 }} />
                      <span>{new Date(a.admissionDate).toLocaleDateString("en-IN")}</span>
                    </div>
                    <div className="ds-info-pill">
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ds-primary)" }}>
                        {fmtINR(a.totalFee)}
                      </span>
                    </div>
                  </div>

                  {/* Subjects */}
                  {a.subjects.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, paddingTop: 8, borderTop: "1px solid var(--ds-border)" }}>
                      {a.subjects.map((s) => (
                        <DSLozenge key={s} appearance="primary">{s}</DSLozenge>
                      ))}
                    </div>
                  )}
                </DSCard.Body>
              </DSCard>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && admissions.length > 0 && (
          <DSEmptyState
            icon={<Search style={{ width: 24, height: 24, color: "var(--ds-text-subtlest)" }} />}
            title="No results"
            description={`No admissions match "${search}"`}
          />
        )}
      </PageContainer>

      {/* FAB */}
      <button className="ds-fab print:hidden" onClick={() => setOpen(true)} aria-label="Add admission">
        <PlusCircle style={{ width: 22, height: 22 }} />
      </button>

      <ConfirmDialog
        open={delConfirm.open}
        title="Delete Admission"
        message="Delete this admission record? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={doDeleteAdmission}
        onCancel={() => setDelConfirm({ open: false, id: null })}
      />
    </div>
  );
}
