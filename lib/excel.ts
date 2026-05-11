import ExcelJS from "exceljs";

export interface SessionData {
  instituteName: string;
  className: string;
  month: string;
  year: string;
  totalDays: number;
  managerName: string;
  subjects: { name: string; outOf: number }[];
}

export interface StudentData {
  name: string;
  attendance: number;
  marks: (number | string)[];  // number or "AB" for absent
}

const WHITE = "FFFFFFFF";
const BLACK = "FF000000";

function border() {
  const s = { style: "thin" as const, color: { argb: BLACK } };
  return { top: s, bottom: s, left: s, right: s };
}

function cell(
  c: ExcelJS.Cell,
  value: string | number,
  bold = true,
  size = 11,
  align: ExcelJS.Alignment["horizontal"] = "center"
) {
  c.value = value;
  c.font = { name: "Arial", bold, size, color: { argb: BLACK } };
  c.alignment = { horizontal: align, vertical: "middle" };
  c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
  c.border = border();
}

export async function buildExcel(session: SessionData, students: StudentData[]) {
  const wb = new ExcelJS.Workbook();

  let logoId: number | null = null;
  try {
    const r = await fetch("/image.png");
    if (r.ok) logoId = wb.addImage({ buffer: await r.arrayBuffer(), extension: "png" });
  } catch { /* skip */ }

  const ws = wb.addWorksheet("Mark Memo");
  ws.columns = [
    { width: 13 }, // A  logo
    { width: 22 }, // B  subject / label
    { width: 10 }, // C  obtain
    { width: 10 }, // D  total
    { width: 20 }, // E  presenty
  ];

  const N = session.subjects.length;
  // block: 3 header + 1 col-header + N subject + 1 total + 1 manager + 1 sign + 1 spacer
  const BLOCK = 3 + 1 + N + 1 + 1 + 1 + 1;

  students.forEach((student, idx) => {
    const base = 1 + idx * BLOCK;

    // ── Logo cell (A, rows base..base+2 merged) ───────────────────────────────
    ws.mergeCells(base, 1, base + 2, 1);
    const lc = ws.getCell(base, 1);
    lc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
    lc.border = border();

    // ── Row 1: Institute name ────────────────────────────────────────────────
    ws.mergeCells(base, 2, base, 5);
    ws.getRow(base).height = 32;
    cell(ws.getCell(base, 2), session.instituteName.toUpperCase(), true, 14);

    // ── Row 2: Name & class ──────────────────────────────────────────────────
    ws.mergeCells(base + 1, 2, base + 1, 5);
    ws.getRow(base + 1).height = 26;
    cell(ws.getCell(base + 1, 2), `Name-  ${student.name || "Student"}     ${session.className}`, true, 12);

    // ── Row 3: Mark-Memo heading ─────────────────────────────────────────────
    ws.mergeCells(base + 2, 2, base + 2, 5);
    ws.getRow(base + 2).height = 26;
    cell(ws.getCell(base + 2, 2), `MARK-MEMO ${session.month.toUpperCase()} ${session.year}`, true, 12);

    if (logoId !== null) {
      ws.addImage(logoId, {
        tl: { col: 0, row: base - 1 },
        br: { col: 1, row: base + 2 },
        editAs: "oneCell",
      });
    }

    // ── Row 4: Column headers ────────────────────────────────────────────────
    const hRow = base + 3;
    ws.getRow(hRow).height = 22;
    cell(ws.getCell(hRow, 1), "");
    ["Test", "Obtain", "Total", "Presenty"].forEach((h, i) =>
      cell(ws.getCell(hRow, i + 2), h, true, 11)
    );

    // ── Subject rows ─────────────────────────────────────────────────────────
    const sStart = base + 4;
    if (N > 1) ws.mergeCells(sStart, 5, sStart + N - 1, 5);
    cell(ws.getCell(sStart, 5), student.attendance ?? "", true, 13);

    let totalObtained = 0;
    session.subjects.forEach((subj, si) => {
      const r = sStart + si;
      ws.getRow(r).height = 22;
      const rawMark = student.marks[si];
      const isAbsent = String(rawMark).trim().toUpperCase() === "AB";
      const obt = isAbsent ? 0 : (Number(rawMark) || 0);
      totalObtained += obt;
      cell(ws.getCell(r, 1), "");
      cell(ws.getCell(r, 2), subj.name || `Subject ${si + 1}`, true, 11);
      // AB shown as text string; numbers shown as numbers
      if (isAbsent) {
        const c = ws.getCell(r, 3);
        c.value = "AB";
        c.font = { name: "Arial", bold: true, size: 11, color: { argb: BLACK } };
        c.alignment = { horizontal: "center", vertical: "middle" };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
        c.border = border();
      } else {
        cell(ws.getCell(r, 3), obt, true, 11);
      }
      cell(ws.getCell(r, 4), subj.outOf, true, 11);
    });

    // ── Total row ────────────────────────────────────────────────────────────
    const tRow = sStart + N;
    ws.getRow(tRow).height = 22;
    const totalOutOf = session.subjects.reduce((s, sub) => s + sub.outOf, 0);
    cell(ws.getCell(tRow, 1), "");
    cell(ws.getCell(tRow, 2), "Total", true, 11);
    cell(ws.getCell(tRow, 3), totalObtained, true, 11);
    cell(ws.getCell(tRow, 4), totalOutOf, true, 11);
    cell(ws.getCell(tRow, 5), `Total Day ${session.totalDays}`, true, 11);

    // ── Manager row ──────────────────────────────────────────────────────────
    const mgRow = tRow + 1;
    ws.getRow(mgRow).height = 20;
    ws.mergeCells(mgRow, 1, mgRow, 4);
    cell(ws.getCell(mgRow, 1), "");
    cell(ws.getCell(mgRow, 5), session.managerName, true, 11);

    // ── Signature row ────────────────────────────────────────────────────────
    const sigRow = tRow + 2;
    ws.getRow(sigRow).height = 22;
    ws.mergeCells(sigRow, 1, sigRow, 4);
    cell(ws.getCell(sigRow, 1), "Parents signature", true, 11);
    cell(ws.getCell(sigRow, 5), session.instituteName, true, 11);

    ws.getRow(sigRow + 1).height = 10;
  });

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mark-memo-${session.className.replace(/\s+/g, "-")}-${session.month}-${session.year}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
