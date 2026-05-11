"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

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

const CELL: React.CSSProperties = {
  border: "1px solid #000",
  fontFamily: "Calibri, Arial, sans-serif",
  fontSize: 11,
  padding: "3px 6px",
  textAlign: "center",
  verticalAlign: "middle",
  backgroundColor: "#fff",
  lineHeight: 1.3,
};

const COL_WIDTHS = {
  logo:    80,
  label:  165,
  obtain:  68,
  total:   68,
  presenty:200,
};
const TABLE_W = COL_WIDTHS.logo + COL_WIDTHS.label + COL_WIDTHS.obtain + COL_WIDTHS.total + COL_WIDTHS.presenty;

function isAB(v: number | string) { return String(v).trim().toUpperCase() === "AB"; }
function markNum(v: number | string) { return isAB(v) ? 0 : (Number(v) || 0); }

function MemoBlock({ session, student }: { session: Session; student: Student }) {
  const N = session.subjects.length;
  const totalOutOf   = session.subjects.reduce((s, sub) => s + sub.outOf, 0);
  const totalObtained = student.marks.reduce((s: number, m) => s + markNum(m), 0);

  const td = (content: React.ReactNode, extra: React.CSSProperties = {}) => (
    <td style={{ ...CELL, ...extra }}>{content}</td>
  );

  return (
    <table
      style={{
        borderCollapse: "collapse",
        width: TABLE_W,
        tableLayout: "fixed",
        fontFamily: "Calibri, Arial, sans-serif",
      }}
    >
      <colgroup>
        <col style={{ width: COL_WIDTHS.logo }} />
        <col style={{ width: COL_WIDTHS.label }} />
        <col style={{ width: COL_WIDTHS.obtain }} />
        <col style={{ width: COL_WIDTHS.total }} />
        <col style={{ width: COL_WIDTHS.presenty }} />
      </colgroup>
      <tbody>
        {/* Header rows 1-3 */}
        <tr style={{ height: 36 }}>
          <td rowSpan={3} style={{ ...CELL, padding: 4 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/image.png" alt="Logo" style={{ width: 68, height: 68, objectFit: "contain" }} />
          </td>
          <td colSpan={4} style={{
            ...CELL,
            fontSize: 14,
            fontWeight: "bold",
            fontFamily: "Algerian, 'Times New Roman', serif",
            letterSpacing: 1,
          }}>
            {session.instituteName.toUpperCase()}
          </td>
        </tr>
        <tr style={{ height: 24 }}>
          <td colSpan={4} style={{
            ...CELL,
            fontFamily: "'Arial Black', Arial, sans-serif",
            fontWeight: 900,
            fontSize: 11,
          }}>
            Name-&nbsp;&nbsp;{student.name}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{session.className}
          </td>
        </tr>
        <tr style={{ height: 24 }}>
          <td colSpan={4} style={{
            ...CELL,
            fontFamily: "Algerian, 'Times New Roman', serif",
            fontWeight: "bold",
            fontSize: 11,
            letterSpacing: 0.5,
          }}>
            MARK-MEMO {session.month.toUpperCase()} {session.year}
          </td>
        </tr>

        {/* Column headers */}
        <tr style={{ height: 22 }}>
          {td("")}
          {td("Test",     { fontWeight: "bold" })}
          {td("Obtain",   { fontWeight: "bold" })}
          {td("Total",    { fontWeight: "bold" })}
          {td("Presenty", { fontWeight: "bold" })}
        </tr>

        {/* Subject rows */}
        {session.subjects.map((sub, si) => (
          <tr key={si} style={{ height: 22 }}>
            {td("")}
            {td(sub.name, { fontWeight: "bold" })}
            {td(
              isAB(student.marks[si] ?? 0)
                ? <strong>AB</strong>
                : markNum(student.marks[si] ?? 0),
              { fontWeight: "bold" }
            )}
            {td(sub.outOf, { fontWeight: "bold" })}
            {si === 0 ? (
              <td
                rowSpan={N}
                style={{ ...CELL, fontWeight: "bold", fontSize: 16 }}
              >
                {student.attendance ?? ""}
              </td>
            ) : null}
          </tr>
        ))}

        {/* Total row */}
        <tr style={{ height: 22 }}>
          {td("")}
          {td("Total",       { fontWeight: "bold" })}
          {td(totalObtained, { fontWeight: "bold" })}
          {td(totalOutOf,    { fontWeight: "bold" })}
          {td(`Total Day ${session.totalDays}`, { fontWeight: "bold" })}
        </tr>

        {/* Manager row */}
        <tr style={{ height: 20 }}>
          <td colSpan={4} style={{ ...CELL }} />
          {td(session.managerName, { fontWeight: "bold" })}
        </tr>

        {/* Signature row */}
        <tr style={{ height: 22 }}>
          <td colSpan={4} style={{ ...CELL, fontWeight: "bold" }}>
            Parents signature
          </td>
          {td(session.instituteName, { fontWeight: "bold", fontSize: 10 })}
        </tr>
      </tbody>
    </table>
  );
}

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession]   = useState<Session | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const load = useCallback(async () => {
    try {
      const [sr, studR] = await Promise.all([
        fetch(`/api/sessions/${id}`),
        fetch(`/api/sessions/${id}/students`),
      ]);
      if (!sr.ok) { setError("Session not found"); setLoading(false); return; }
      setSession(await sr.json());
      setStudents(await studR.json());
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "Calibri" }}>
      Loading preview…
    </div>
  );
  if (error || !session) return (
    <div style={{ padding: 32, fontFamily: "Calibri", color: "red" }}>{error || "No data"}</div>
  );
  if (students.length === 0) return (
    <div style={{ padding: 32, fontFamily: "Calibri" }}>No students added yet.</div>
  );

  const GAP = 24; // px between blocks (≈ 3 rows)

  return (
    <>
      {/* Print / UI toolbar */}
      <div
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: "#1e293b", color: "#fff",
          display: "flex", alignItems: "center", gap: 16,
          padding: "10px 20px",
          fontFamily: "Calibri, sans-serif",
        }}
        className="print:hidden"
      >
        <span style={{ fontWeight: "bold", fontSize: 15 }}>
          📄 Preview — {session.className} {session.month} {session.year}
        </span>
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          {students.length} student{students.length !== 1 ? "s" : ""} × 2 copies
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => window.print()}
          style={{
            background: "#3b82f6", color: "#fff", border: "none",
            borderRadius: 6, padding: "7px 18px", fontWeight: "bold",
            cursor: "pointer", fontSize: 14,
          }}
        >
          🖨 Print
        </button>
        <button
          onClick={() => window.close()}
          style={{
            background: "transparent", color: "#94a3b8", border: "1px solid #475569",
            borderRadius: 6, padding: "7px 14px", cursor: "pointer", fontSize: 14,
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Page content */}
      <div
        style={{
          paddingTop: 60,
          paddingBottom: 40,
          background: "#f1f5f9",
          minHeight: "100vh",
        }}
        className="print:bg-white print:p-0"
      >
        <div style={{ margin: "0 auto", width: TABLE_W + 48 }}>
          {students.map((student) =>
            [0, 1].map((copy) => (
              <div
                key={`${student._id}-${copy}`}
                style={{ marginBottom: GAP }}
              >
                <MemoBlock session={session} student={student} />
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          @page { margin: 12mm; }
        }
      `}</style>
    </>
  );
}
