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
  marks: (number | string)[];
}

const COL_OFFSET = 2; // A, B = empty margins; table starts at C
const TOP_GAP    = 3; // empty rows at top
const BLOCK_GAP  = 3; // empty rows between every block

const WHITE = "FFFFFFFF";
const BLACK = "FF000000";
const FONT  = "Calibri"; // ← match WPS/Excel default

function border() {
  const s = { style: "thin" as const, color: { argb: BLACK } };
  return { top: s, bottom: s, left: s, right: s };
}

function applyCell(
  c: ExcelJS.Cell,
  value: string | number,
  bold = true,
  size = 11,
  align: ExcelJS.Alignment["horizontal"] = "center",
) {
  c.value      = value;
  c.font       = { name: FONT, bold, size, color: { argb: BLACK } };
  c.alignment  = { horizontal: align, vertical: "middle", wrapText: false };
  c.fill       = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
  c.border     = border();
}

function renderBlock(
  ws: ExcelJS.Worksheet,
  logoId: number | null,
  session: SessionData,
  student: StudentData,
  base: number,    // 1-indexed starting row
  colBase: number, // 1-indexed logo column (C = 3)
) {
  const N  = session.subjects.length;
  const cL = colBase;      // C  – logo
  const cB = colBase + 1;  // D  – label / Test
  const cC = colBase + 2;  // E  – Obtain
  const cD = colBase + 3;  // F  – Total
  const cE = colBase + 4;  // G  – Presenty

  // ── Logo cell (merged 3 rows) ──────────────────────────────────────────────
  ws.mergeCells(base, cL, base + 2, cL);
  const lc = ws.getCell(base, cL);
  lc.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
  lc.border = border();

  if (logoId !== null) {
    ws.addImage(logoId, {
      tl: { col: cL - 1, row: base - 1 },       // 0-indexed
      br: { col: cL,     row: base + 2 },
      editAs: "oneCell",
    });
  }

  // ── Row 1: Institute name ──────────────────────────────────────────────────
  ws.mergeCells(base, cB, base, cE);
  ws.getRow(base).height = 28;
  {
    const c = ws.getCell(base, cB);
    c.value     = session.instituteName.toUpperCase();
    c.font      = { name: "Algerian", bold: true, size: 14, color: { argb: BLACK } };
    c.alignment = { horizontal: "center", vertical: "middle" };
    c.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
    c.border    = border();
  }

  // ── Row 2: Name & class ────────────────────────────────────────────────────
  ws.mergeCells(base + 1, cB, base + 1, cE);
  ws.getRow(base + 1).height = 22;
  {
    const c = ws.getCell(base + 1, cB);
    c.value     = `Name-  ${student.name || "Student"}     ${session.className}`;
    c.font      = { name: "Arial Black", bold: false, size: 11, color: { argb: BLACK } };
    c.alignment = { horizontal: "center", vertical: "middle" };
    c.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
    c.border    = border();
  }

  // ── Row 3: Mark-Memo heading ───────────────────────────────────────────────
  ws.mergeCells(base + 2, cB, base + 2, cE);
  ws.getRow(base + 2).height = 22;
  {
    const c = ws.getCell(base + 2, cB);
    c.value     = `MARK-MEMO ${session.month.toUpperCase()} ${session.year}`;
    c.font      = { name: "Algerian", bold: true, size: 11, color: { argb: BLACK } };
    c.alignment = { horizontal: "center", vertical: "middle" };
    c.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
    c.border    = border();
  }

  // ── Row 4: Column headers ──────────────────────────────────────────────────
  const hRow = base + 3;
  ws.getRow(hRow).height = 20;
  applyCell(ws.getCell(hRow, cL), "");
  (["Test", "Obtain", "Total", "Presenty"] as const).forEach((h, i) =>
    applyCell(ws.getCell(hRow, cB + i), h, true, 11),
  );

  // ── Subject rows ───────────────────────────────────────────────────────────
  const sStart = base + 4;
  if (N > 1) ws.mergeCells(sStart, cE, sStart + N - 1, cE);
  applyCell(ws.getCell(sStart, cE), student.attendance ?? "", true, 14);

  let totalObtained = 0;
  session.subjects.forEach((subj, si) => {
    const r    = sStart + si;
    ws.getRow(r).height = 20;
    const raw  = student.marks[si];
    const isAB = String(raw).trim().toUpperCase() === "AB";
    const obt  = isAB ? 0 : (Number(raw) || 0);
    totalObtained += obt;

    applyCell(ws.getCell(r, cL), "");
    applyCell(ws.getCell(r, cB), subj.name || `Subject ${si + 1}`, true, 11);
    applyCell(ws.getCell(r, cD), subj.outOf, true, 11);

    if (isAB) {
      const c    = ws.getCell(r, cC);
      c.value    = "AB";
      c.font     = { name: FONT, bold: true, size: 11, color: { argb: BLACK } };
      c.alignment = { horizontal: "center", vertical: "middle" };
      c.fill     = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
      c.border   = border();
    } else {
      applyCell(ws.getCell(r, cC), obt, true, 11);
    }
  });

  // ── Total row ──────────────────────────────────────────────────────────────
  const tRow     = sStart + N;
  ws.getRow(tRow).height = 20;
  const totalOutOf = session.subjects.reduce((s, sub) => s + sub.outOf, 0);
  applyCell(ws.getCell(tRow, cL), "");
  applyCell(ws.getCell(tRow, cB), "Total",       true, 11);
  applyCell(ws.getCell(tRow, cC), totalObtained, true, 11);
  applyCell(ws.getCell(tRow, cD), totalOutOf,    true, 11);
  applyCell(ws.getCell(tRow, cE), `Total Day ${session.totalDays}`, true, 11);

  // ── Manager row ────────────────────────────────────────────────────────────
  const mgRow = tRow + 1;
  ws.getRow(mgRow).height = 18;
  ws.mergeCells(mgRow, cL, mgRow, cD);
  applyCell(ws.getCell(mgRow, cL), "");
  applyCell(ws.getCell(mgRow, cE), session.managerName, true, 11);

  // ── Signature row ──────────────────────────────────────────────────────────
  const sigRow = tRow + 2;
  ws.getRow(sigRow).height = 20;
  ws.mergeCells(sigRow, cL, sigRow, cD);
  applyCell(ws.getCell(sigRow, cL), "Parents signature", true, 11);
  applyCell(ws.getCell(sigRow, cE), session.instituteName, true, 11);
}

export async function buildExcel(session: SessionData, students: StudentData[]) {
  const wb = new ExcelJS.Workbook();

  let logoId: number | null = null;
  try {
    const r = await fetch("/image.png");
    if (r.ok) logoId = wb.addImage({ buffer: await r.arrayBuffer(), extension: "png" });
  } catch { /* skip */ }

  const ws = wb.addWorksheet("Mark Memo");

  // ── Column widths (units = Excel character widths ≈ 7 px each) ────────────
  ws.columns = [
    { width: 3  }, // A – left margin
    { width: 3  }, // B – left margin
    { width: 11 }, // C – logo
    { width: 22 }, // D – label / subject name
    { width: 10 }, // E – obtain
    { width: 10 }, // F – total (out-of)
    { width: 30 }, // G – presenty (wide: fits full institute name in signature)
    { width: 3  }, // H – right margin
  ];

  const N       = session.subjects.length;
  const BLOCK_H = 3 + 1 + N + 1 + 1 + 1; // header rows + col-header + subjects + total + mgr + sig
  const UNIT    = BLOCK_H + BLOCK_GAP;    // one block + its trailing gap

  // Top gap
  for (let i = 1; i <= TOP_GAP; i++) ws.getRow(i).height = 8;

  const colBase = COL_OFFSET + 1; // = 3 (column C)

  students.forEach((student, idx) => {
    for (let copy = 0; copy < 2; copy++) {
      const blockIdx = idx * 2 + copy;
      const base     = TOP_GAP + 1 + blockIdx * UNIT;

      renderBlock(ws, logoId, session, student, base, colBase);

      // Gap rows after this block
      const gapStart = base + BLOCK_H;
      for (let g = 0; g < BLOCK_GAP; g++) ws.getRow(gapStart + g).height = 8;
    }
  });

  const buf  = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `mark-memo-${session.className.replace(/\s+/g, "-")}-${session.month}-${session.year}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
