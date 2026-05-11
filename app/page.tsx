"use client";

import { useState, useMemo } from "react";
import ExcelJS from "exceljs";

// ─── Types ───────────────────────────────────────────────────────────────────
type Subject = { id: string; name: string; outOf: string };
type Student = { id: string; name: string; attendance: string; marks: Record<string, string> };
type Config = {
  instituteName: string;
  className: string;
  month: string;
  year: string;
  totalDays: string;
  managerName: string;
  subjects: Subject[];
};

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const mkSubject = (name = "", outOf = "20"): Subject => ({ id: uid(), name, outOf });
const mkStudent = (subjects: Subject[]): Student => ({
  id: uid(), name: "", attendance: "",
  marks: Object.fromEntries(subjects.map((s) => [s.id, ""])),
});

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const INITIAL_CONFIG: Config = {
  instituteName: "Shree Saraswati Classes, Kannad",
  className: "11th Science",
  month: "March",
  year: "2026",
  totalDays: "25",
  managerName: "Manager",
  subjects: [
    mkSubject("Physics", "20"),
    mkSubject("Chemistry", "20"),
    mkSubject("Math", "20"),
    mkSubject("Biology", "20"),
    mkSubject("English", "20"),
  ],
};

// ─── Excel helpers ────────────────────────────────────────────────────────────
const WHITE_ARGB  = "FFFFFFFF";
const BLACK_ARGB  = "FF000000";

function borderAll() {
  const side = { style: "thin" as const, color: { argb: BLACK_ARGB } };
  return { top: side, bottom: side, left: side, right: side };
}

function applyCell(
  cell: ExcelJS.Cell,
  value: string | number,
  opts: { bold?: boolean; size?: number; fill?: string; halign?: ExcelJS.Alignment["horizontal"] },
) {
  cell.value = value;
  cell.font = { name: "Arial", bold: opts.bold ?? true, size: opts.size ?? 11, color: { argb: BLACK_ARGB } };
  cell.alignment = { horizontal: opts.halign ?? "center", vertical: "middle", wrapText: false };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: opts.fill ?? WHITE_ARGB } };
  cell.border = borderAll();
}

async function generateExcel(config: Config, students: Student[]) {
  const wb = new ExcelJS.Workbook();

  // Try loading logo
  let logoId: number | null = null;
  try {
    const resp = await fetch("/image.png");
    if (resp.ok) {
      const buf = await resp.arrayBuffer();
      logoId = wb.addImage({ buffer: buf, extension: "png" });
    }
  } catch { /* skip logo if unavailable */ }

  const ws = wb.addWorksheet("Mark Memo");
  ws.columns = [
    { width: 13 }, // A – logo
    { width: 22 }, // B – subject/label
    { width: 10 }, // C – obtain
    { width: 10 }, // D – total
    { width: 20 }, // E – presenty
  ];

  const N = config.subjects.length;
  // Per-student block row count:
  // 3 header rows + 1 col-header row + N subject rows + 1 total + 1 manager + 1 signature + 1 spacer
  const BLOCK = 3 + 1 + N + 1 + 1 + 1 + 1;

  students.forEach((student, idx) => {
    const base = 1 + idx * BLOCK; // 1-indexed

    // ── Rows 1-3: title area ─────────────────────────────────────────────────
    // Merge A col for logo (rows base..base+2)
    ws.mergeCells(base, 1, base + 2, 1);
    const logoCell = ws.getCell(base, 1);
    logoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE_ARGB } };
    logoCell.border = borderAll();

    // Row base: Institute name (B-E)
    ws.mergeCells(base, 2, base, 5);
    ws.getRow(base).height = 32;
    applyCell(ws.getCell(base, 2), config.instituteName.toUpperCase(), { bold: true, size: 14, fill: WHITE_ARGB });

    // Row base+1: Name & Class (B-E)
    ws.mergeCells(base + 1, 2, base + 1, 5);
    ws.getRow(base + 1).height = 26;
    applyCell(ws.getCell(base + 1, 2), `Name-  ${student.name || "Student Name"}     ${config.className}`, { bold: true, size: 12, fill: WHITE_ARGB });

    // Row base+2: Mark-Memo (B-E)
    ws.mergeCells(base + 2, 2, base + 2, 5);
    ws.getRow(base + 2).height = 26;
    applyCell(ws.getCell(base + 2, 2), `MARK-MEMO ${config.month.toUpperCase()} ${config.year}`, { bold: true, size: 12, fill: WHITE_ARGB });

    // Add logo image positioned over column A rows 1-3
    if (logoId !== null) {
      ws.addImage(logoId, {
        tl: { col: 0, row: base - 1 },
        br: { col: 1, row: base + 2 },
        editAs: "oneCell",
      });
    }

    // ── Row base+3: Column headers ───────────────────────────────────────────
    const hRow = base + 3;
    ws.getRow(hRow).height = 22;
    applyCell(ws.getCell(hRow, 1), "", { fill: WHITE_ARGB });
    ["Test", "Obtain", "Total", "Presenty"].forEach((h, i) => {
      applyCell(ws.getCell(hRow, i + 2), h, { bold: true, size: 11, fill: WHITE_ARGB });
    });

    // ── Subject rows (base+4 … base+4+N-1) ──────────────────────────────────
    const sStart = base + 4;

    // Merge presenty column across all subject rows
    if (N > 1) ws.mergeCells(sStart, 5, sStart + N - 1, 5);
    const presCell = ws.getCell(sStart, 5);
    applyCell(presCell, student.attendance || "", { bold: true, size: 13, fill: WHITE_ARGB });

    let totalObtained = 0;
    config.subjects.forEach((subj, si) => {
      const r = sStart + si;
      ws.getRow(r).height = 22;
      const obtained = Number(student.marks[subj.id]) || 0;
      totalObtained += obtained;

      applyCell(ws.getCell(r, 1), "", { fill: WHITE_ARGB }); // col A empty
      applyCell(ws.getCell(r, 2), subj.name || `Subject ${si + 1}`, { bold: true, size: 11, fill: WHITE_ARGB });
      applyCell(ws.getCell(r, 3), obtained, { bold: true, size: 11, fill: WHITE_ARGB });
      applyCell(ws.getCell(r, 4), Number(subj.outOf) || 0, { bold: true, size: 11, fill: WHITE_ARGB });
    });

    // ── Total row ────────────────────────────────────────────────────────────
    const totalRow = sStart + N;
    ws.getRow(totalRow).height = 22;
    const totalOutOf = config.subjects.reduce((s, sub) => s + (Number(sub.outOf) || 0), 0);
    applyCell(ws.getCell(totalRow, 1), "", { fill: WHITE_ARGB });
    applyCell(ws.getCell(totalRow, 2), "Total", { bold: true, size: 11, fill: WHITE_ARGB });
    applyCell(ws.getCell(totalRow, 3), totalObtained, { bold: true, size: 11, fill: WHITE_ARGB });
    applyCell(ws.getCell(totalRow, 4), totalOutOf, { bold: true, size: 11, fill: WHITE_ARGB });
    applyCell(ws.getCell(totalRow, 5), `Total Day ${config.totalDays || "-"}`, { bold: true, size: 11, fill: WHITE_ARGB });

    // ── Manager row ──────────────────────────────────────────────────────────
    const mgRow = totalRow + 1;
    ws.getRow(mgRow).height = 20;
    ws.mergeCells(mgRow, 1, mgRow, 4);
    applyCell(ws.getCell(mgRow, 1), "", { fill: WHITE_ARGB });
    applyCell(ws.getCell(mgRow, 5), config.managerName, { bold: true, size: 11, fill: WHITE_ARGB });

    // ── Signature row ────────────────────────────────────────────────────────
    const sigRow = totalRow + 2;
    ws.getRow(sigRow).height = 22;
    ws.mergeCells(sigRow, 1, sigRow, 4);
    applyCell(ws.getCell(sigRow, 1), "Parents signature", { bold: true, size: 11, fill: WHITE_ARGB });
    applyCell(ws.getCell(sigRow, 5), config.instituteName, { bold: true, size: 11, fill: WHITE_ARGB });

    // ── Spacer row ───────────────────────────────────────────────────────────
    ws.getRow(sigRow + 1).height = 10;
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mark-memo-${config.className.replace(/\s+/g, "-")}-${config.month}-${config.year}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Home() {
  const [step, setStep] = useState<"config" | "students">("config");
  const [config, setConfig] = useState<Config>(INITIAL_CONFIG);
  const [students, setStudents] = useState<Student[]>([mkStudent(INITIAL_CONFIG.subjects)]);
  const [exporting, setExporting] = useState(false);

  // ── Config helpers ──────────────────────────────────────────────────────────
  function setConfigField<K extends keyof Config>(key: K, val: Config[K]) {
    setConfig((c) => ({ ...c, [key]: val }));
  }

  function addSubject() {
    const newSubj = mkSubject();
    setConfig((c) => ({ ...c, subjects: [...c.subjects, newSubj] }));
    setStudents((ss) => ss.map((s) => ({ ...s, marks: { ...s.marks, [newSubj.id]: "" } })));
  }

  function removeSubject(id: string) {
    if (config.subjects.length === 1) return;
    setConfig((c) => ({ ...c, subjects: c.subjects.filter((s) => s.id !== id) }));
    setStudents((ss) => ss.map((s) => { const marks = { ...s.marks }; delete marks[id]; return { ...s, marks }; }));
  }

  function updateSubject(id: string, key: "name" | "outOf", val: string) {
    setConfig((c) => ({ ...c, subjects: c.subjects.map((s) => s.id === id ? { ...s, [key]: val } : s) }));
  }

  // ── Student helpers ─────────────────────────────────────────────────────────
  function addStudent() {
    setStudents((ss) => [...ss, mkStudent(config.subjects)]);
  }

  function removeStudent(id: string) {
    if (students.length === 1) return;
    setStudents((ss) => ss.filter((s) => s.id !== id));
  }

  function setStudentField(id: string, key: "name" | "attendance", val: string) {
    setStudents((ss) => ss.map((s) => s.id === id ? { ...s, [key]: val } : s));
  }

  function setMark(studentId: string, subjectId: string, val: string) {
    setStudents((ss) => ss.map((s) => s.id === studentId ? { ...s, marks: { ...s.marks, [subjectId]: val } } : s));
  }

  // Auto total per student
  const studentTotals = useMemo(
    () => Object.fromEntries(students.map((s) => [s.id, config.subjects.reduce((sum, sub) => sum + (Number(s.marks[sub.id]) || 0), 0)])),
    [students, config.subjects],
  );
  const totalOutOf = config.subjects.reduce((s, sub) => s + (Number(sub.outOf) || 0), 0);

  async function handleExport() {
    setExporting(true);
    try { await generateExcel(config, students); }
    finally { setExporting(false); }
  }

  // ── Styles ──────────────────────────────────────────────────────────────────
  const inputCls = "w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100";
  const labelCls = "flex flex-col gap-1.5 text-sm font-medium text-stone-700";
  const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 py-3 text-sm font-bold text-stone-950 shadow-md transition hover:bg-amber-300 active:scale-95 disabled:opacity-60";
  const btnSecondary = "inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-900 hover:text-stone-900 active:scale-95";

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1 – CONFIG
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === "config") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 px-4 py-10">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <div className="text-center">
            <span className="inline-block rounded-full border border-amber-300 bg-amber-100 px-4 py-1 text-xs font-bold uppercase tracking-widest text-amber-800">
              Mark Memo Generator
            </span>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-900">
              Shree Saraswati Classes
            </h1>
            <p className="mt-2 text-stone-500">Step 1 of 2 — Sheet configuration bhariye</p>
          </div>

          {/* Card: Institute */}
          <div className="rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-lg backdrop-blur">
            <h2 className="mb-4 text-base font-bold text-stone-800">🏫 Institute Info</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelCls}>
                Institute Name
                <input className={inputCls} value={config.instituteName} onChange={(e) => setConfigField("instituteName", e.target.value)} />
              </label>
              <label className={labelCls}>
                Class
                <input className={inputCls} placeholder="e.g. 11th Science" value={config.className} onChange={(e) => setConfigField("className", e.target.value)} />
              </label>
              <label className={labelCls}>
                Month
                <select className={inputCls} value={config.month} onChange={(e) => setConfigField("month", e.target.value)}>
                  {MONTHS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </label>
              <label className={labelCls}>
                Year
                <input className={inputCls} placeholder="2026" value={config.year} onChange={(e) => setConfigField("year", e.target.value)} />
              </label>
              <label className={labelCls}>
                Total Days (Presenty max)
                <input className={inputCls} placeholder="25" value={config.totalDays} onChange={(e) => setConfigField("totalDays", e.target.value)} />
              </label>
              <label className={labelCls}>
                Footer / Manager Name
                <input className={inputCls} value={config.managerName} onChange={(e) => setConfigField("managerName", e.target.value)} />
              </label>
            </div>
          </div>

          {/* Card: Subjects */}
          <div className="rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-lg backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-800">📚 Subjects & Out-of Marks</h2>
              <button className={btnSecondary} onClick={addSubject}>+ Add Subject</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    <th className="px-3 text-left">#</th>
                    <th className="px-3 text-left">Subject Name</th>
                    <th className="px-3 text-left">Out of Marks</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {config.subjects.map((subj, i) => (
                    <tr key={subj.id}>
                      <td className="px-3 text-sm text-stone-400">{i + 1}</td>
                      <td className="px-1">
                        <input className={inputCls} placeholder="Subject name" value={subj.name} onChange={(e) => updateSubject(subj.id, "name", e.target.value)} />
                      </td>
                      <td className="px-1 w-32">
                        <input className={inputCls} placeholder="20" type="number" min="1" value={subj.outOf} onChange={(e) => updateSubject(subj.id, "outOf", e.target.value)} />
                      </td>
                      <td className="px-1">
                        <button onClick={() => removeSubject(subj.id)} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-2.5 text-sm">
              <span className="text-stone-600">Total out-of marks:</span>
              <span className="font-bold text-amber-900">{totalOutOf}</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              className={btnPrimary}
              onClick={() => {
                setStudents((ss) =>
                  ss.map((s) => ({
                    ...s,
                    marks: Object.fromEntries(
                      config.subjects.map((sub) => [sub.id, s.marks[sub.id] ?? ""])
                    ),
                  }))
                );
                setStep("students");
              }}
            >
              Next: Enter Student Marks →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2 – STUDENTS TABLE
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 px-4 py-10">
      <div className="mx-auto max-w-full space-y-6" style={{ maxWidth: "min(100%, 1400px)" }}>
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <button className="mb-1 text-sm text-stone-500 hover:text-stone-800 transition" onClick={() => setStep("config")}>← Back to Config</button>
            <h1 className="text-2xl font-bold text-stone-900">Student Marks Entry</h1>
            <p className="text-sm text-stone-500">
              {config.className} &mdash; {config.month} {config.year} &mdash; {config.subjects.length} subjects, out of {totalOutOf}
            </p>
          </div>
          <div className="flex gap-3">
            <button className={btnSecondary} onClick={addStudent}>+ Add Student</button>
            <button className={btnPrimary} onClick={handleExport} disabled={exporting}>
              {exporting ? "Generating…" : "📥 Generate Excel"}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-3xl border border-stone-200 bg-white/90 shadow-xl backdrop-blur overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-400 text-stone-950">
                  <th className="sticky left-0 z-10 bg-amber-400 px-4 py-3 text-left font-bold whitespace-nowrap">#</th>
                  <th className="sticky left-8 z-10 bg-amber-400 px-4 py-3 text-left font-bold whitespace-nowrap min-w-[180px]">Student Name</th>
                  {config.subjects.map((sub) => (
                    <th key={sub.id} className="px-4 py-3 text-center font-bold whitespace-nowrap">
                      <div>{sub.name || "Subject"}</div>
                      <div className="text-xs font-normal opacity-75">/ {sub.outOf}</div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center font-bold whitespace-nowrap">Presenty<div className="text-xs font-normal opacity-75">/ {config.totalDays}</div></th>
                  <th className="px-4 py-3 text-center font-bold whitespace-nowrap">Total<div className="text-xs font-normal opacity-75">/ {totalOutOf}</div></th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, i) => {
                  const total = studentTotals[student.id] ?? 0;
                  return (
                    <tr key={student.id} className={i % 2 === 0 ? "bg-white" : "bg-stone-50/60"}>
                      <td className="px-4 py-2.5 text-stone-400 font-medium">{i + 1}</td>
                      <td className="px-2 py-2">
                        <input
                          className="w-full min-w-[160px] rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                          placeholder="Student name"
                          value={student.name}
                          onChange={(e) => setStudentField(student.id, "name", e.target.value)}
                        />
                      </td>
                      {config.subjects.map((sub) => (
                        <td key={sub.id} className="px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            max={sub.outOf}
                            className="w-full min-w-[70px] rounded-xl border border-stone-200 bg-white px-3 py-2 text-center text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                            placeholder="0"
                            value={student.marks[sub.id] ?? ""}
                            onChange={(e) => setMark(student.id, sub.id, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          className="w-full min-w-[70px] rounded-xl border border-stone-200 bg-white px-3 py-2 text-center text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                          placeholder="0"
                          value={student.attendance}
                          onChange={(e) => setStudentField(student.id, "attendance", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${total >= totalOutOf * 0.6 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {total}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => removeStudent(student.id)}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer summary */}
          <div className="border-t border-stone-100 bg-amber-50 px-6 py-3 flex items-center justify-between">
            <span className="text-sm text-stone-600">{students.length} student{students.length !== 1 ? "s" : ""} • {config.subjects.length} subjects</span>
            <button className={btnPrimary} onClick={handleExport} disabled={exporting}>
              {exporting ? "⏳ Generating…" : "📥 Generate Excel Sheet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
