import {
  AlignmentType,
  BorderStyle,
  convertMillimetersToTwip,
  Document,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";

import { FEE_STRUCTURE, STANDARDS, type Standard } from "./admission-config";

/* ── helpers ─────────────────────────────────────────────────── */

const MM = convertMillimetersToTwip;
const PG_W = MM(210) - MM(16); // A4 minus 8mm L+R margins

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const THIN = (color = "000000") => ({ style: BorderStyle.SINGLE, size: 6, color });
const allNone = { top: NO_BORDER, left: NO_BORDER, right: NO_BORDER, bottom: NO_BORDER };

function sp(n = 1) {
  return new Paragraph({ children: [new TextRun({ text: " ".repeat(n) })] });
}

/** A paragraph that looks like an underlined blank line */
function underlinePara(label: string, bold = true): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: label, bold, size: 22, font: "Arial" }),
      new TextRun({ text: "  ", size: 22 }),
    ],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" } },
  });
}

/** Label cell (no borders) */
function labelCell(text: string, widthMM: number, bold = true): TableCell {
  return new TableCell({
    width: { size: MM(widthMM), type: WidthType.DXA },
    borders: allNone,
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold, size: 22, font: "Arial" })],
        spacing: { after: 0 },
      }),
    ],
    verticalAlign: VerticalAlign.BOTTOM,
  });
}

/** Blank underline cell (bottom border only) */
function blankCell(widthMM: number, text = ""): TableCell {
  return new TableCell({
    width: { size: MM(widthMM), type: WidthType.DXA },
    borders: { ...allNone, bottom: THIN() },
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 22, font: "Arial" })],
        spacing: { after: 0 },
      }),
    ],
    verticalAlign: VerticalAlign.BOTTOM,
  });
}

/** Spacer cell */
function gapCell(widthMM: number): TableCell {
  return new TableCell({
    width: { size: MM(widthMM), type: WidthType.DXA },
    borders: allNone,
    children: [new Paragraph({ children: [new TextRun({ text: "" })] })],
  });
}

/** Simple row: [label cell] [blank fill cell] */
function fieldRow(label: string, labelW: number, totalW: number, gap = 3): TableRow {
  const fillW = totalW - MM(labelW) - MM(gap);
  return new TableRow({
    children: [
      labelCell(label, labelW),
      gapCell(gap),
      new TableCell({
        width: { size: fillW, type: WidthType.DXA },
        borders: { ...allNone, bottom: THIN() },
        children: [new Paragraph({ children: [new TextRun({ text: "", size: 22 })], spacing: { after: 0 } })],
        verticalAlign: VerticalAlign.BOTTOM,
      }),
    ],
    height: { value: MM(7), rule: "atLeast" },
  });
}

/* ── PAGE 1 ───────────────────────────────────────────────────── */

function headerTable(logoData: ArrayBuffer | null): Table {
  // 15 mm × 15 mm logo in EMU (1 mm = 36000 EMU)
  const logoChild = logoData
    ? new ImageRun({ type: "png", data: logoData, transformation: { width: 15 * 36000, height: 15 * 36000 } })
    : new TextRun({ text: "", size: 16 });

  return new Table({
    width: { size: PG_W, type: WidthType.DXA },
    borders: { top: NO_BORDER, left: NO_BORDER, right: NO_BORDER, bottom: THIN(), insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
    rows: [
      new TableRow({
        children: [
          // Logo cell
          new TableCell({
            width: { size: MM(20), type: WidthType.DXA },
            borders: { top: NO_BORDER, left: NO_BORDER, right: NO_BORDER, bottom: NO_BORDER },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [logoChild],
                spacing: { before: 0, after: 0 },
              }),
            ],
            verticalAlign: VerticalAlign.CENTER,
          }),
          // Institute info
          new TableCell({
            width: { size: PG_W - MM(22), type: WidthType.DXA },
            borders: allNone,
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: "SHREE SARASWATI CLASSES",
                    bold: true,
                    size: 40,
                    font: "Arial Black",
                    characterSpacing: 40,
                  }),
                ],
                spacing: { after: 20 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Address:- Boldhane Aaba Building Hiwarkheda Road, Kannad Dist Chhatrapati Sambhaji.",
                    size: 18,
                    font: "Arial",
                    color: "333333",
                  }),
                ],
                spacing: { after: 10 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Nagar Director: Vijaykumar Mande 9421314040    Director: Dasharath Somase 9423705300",
                    size: 18,
                    font: "Arial",
                    color: "333333",
                  }),
                ],
                spacing: { after: 0 },
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function namePhotoTable(): Table {
  const photoW = MM(25);
  const mainW  = PG_W - photoW - MM(5);

  return new Table({
    width: { size: PG_W, type: WidthType.DXA },
    borders: { top: NO_BORDER, left: NO_BORDER, right: NO_BORDER, bottom: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
    rows: [
      new TableRow({
        children: [
          // Left column
          new TableCell({
            width: { size: mainW, type: WidthType.DXA },
            borders: allNone,
            children: [
              // Name rows
              new Table({
                width: { size: mainW, type: WidthType.DXA },
                borders: { top: NO_BORDER, left: NO_BORDER, right: NO_BORDER, bottom: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
                rows: [
                  fieldRow("Name Of Student :-", 44, mainW),
                  // continuation blank line
                  new TableRow({
                    children: [
                      gapCell(44),
                      gapCell(3),
                      new TableCell({
                        width: { size: mainW - MM(44) - MM(3), type: WidthType.DXA },
                        borders: { ...allNone, bottom: THIN() },
                        children: [new Paragraph({ children: [new TextRun({ text: "" })], spacing: { after: 0 } })],
                      }),
                    ],
                    height: { value: MM(7), rule: "atLeast" },
                  }),
                  fieldRow("ADDRESS         :-", 44, mainW),
                  new TableRow({
                    children: [
                      gapCell(44),
                      gapCell(3),
                      new TableCell({
                        width: { size: mainW - MM(44) - MM(3), type: WidthType.DXA },
                        borders: { ...allNone, bottom: THIN() },
                        children: [new Paragraph({ children: [new TextRun({ text: "" })], spacing: { after: 0 } })],
                      }),
                    ],
                    height: { value: MM(7), rule: "atLeast" },
                  }),
                ],
              }),
            ],
          }),
          gapCell(5),
          // Photo box
          new TableCell({
            width: { size: photoW, type: WidthType.DXA },
            borders: { top: THIN(), left: THIN(), right: THIN(), bottom: THIN() },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "PASTE", size: 18, font: "Arial", color: "888888" }),
                ],
                spacing: { before: MM(8), after: 0 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "PASSPORT", size: 18, font: "Arial", color: "888888" })],
                spacing: { after: 0 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "SIZE", size: 18, font: "Arial", color: "888888" })],
                spacing: { after: 0 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "PHOTO", size: 18, font: "Arial", color: "888888" })],
                spacing: { after: 0, before: 0 },
              }),
            ],
            verticalAlign: VerticalAlign.CENTER,
            rowSpan: 1,
          }),
        ],
        height: { value: MM(32), rule: "exact" },
      }),
    ],
  });
}

function twoColRow(
  label1: string, w1: number, label2: string, w2: number, gap = 10
): TableRow {
  const fill1 = (PG_W / 2) - MM(w1) - MM(gap / 2);
  const fill2 = (PG_W / 2) - MM(w2) - MM(gap / 2);
  return new TableRow({
    children: [
      labelCell(label1, w1), gapCell(gap / 2),
      new TableCell({ width: { size: fill1, type: WidthType.DXA }, borders: { ...allNone, bottom: THIN() }, children: [new Paragraph({ children: [new TextRun({ text: "" })], spacing: { after: 0 } })], verticalAlign: VerticalAlign.BOTTOM }),
      gapCell(gap / 2),
      labelCell(label2, w2), gapCell(gap / 2),
      new TableCell({ width: { size: fill2, type: WidthType.DXA }, borders: { ...allNone, bottom: THIN() }, children: [new Paragraph({ children: [new TextRun({ text: "" })], spacing: { after: 0 } })], verticalAlign: VerticalAlign.BOTTOM }),
    ],
    height: { value: MM(7), rule: "atLeast" },
  });
}

function twoColTable(...rows: TableRow[]): Table {
  return new Table({
    width: { size: PG_W, type: WidthType.DXA },
    borders: { top: NO_BORDER, left: NO_BORDER, right: NO_BORDER, bottom: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
    rows,
  });
}

function subjectTable(): Table {
  const colW = [MM(10), MM(70), MM(25), MM(25)];
  const headerBg = "1A56DB";

  function hCell(text: string, w: number): TableCell {
    return new TableCell({
      width: { size: w, type: WidthType.DXA },
      borders: { top: THIN(), left: THIN(), right: THIN(), bottom: THIN() },
      shading: { type: "clear", color: "auto", fill: headerBg },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text, bold: true, size: 22, font: "Arial", color: "FFFFFF" })],
          spacing: { before: 40, after: 40 },
        }),
      ],
    });
  }

  function bodyRow(i: number): TableRow {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: colW[0], type: WidthType.DXA },
          borders: { top: THIN(), left: THIN(), right: THIN(), bottom: THIN() },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(i), size: 22, font: "Arial" })], spacing: { before: 30, after: 30 } })],
        }),
        new TableCell({
          width: { size: colW[1], type: WidthType.DXA },
          borders: { top: THIN(), left: THIN(), right: THIN(), bottom: THIN() },
          children: [new Paragraph({ children: [new TextRun({ text: "", size: 22 })], spacing: { before: 30, after: 30 } })],
        }),
        new TableCell({
          width: { size: colW[2], type: WidthType.DXA },
          borders: { top: THIN(), left: THIN(), right: THIN(), bottom: THIN() },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "", size: 22 })], spacing: { before: 30, after: 30 } })],
        }),
        new TableCell({
          width: { size: colW[3], type: WidthType.DXA },
          borders: { top: THIN(), left: THIN(), right: THIN(), bottom: THIN() },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "", size: 22 })], spacing: { before: 30, after: 30 } })],
        }),
      ],
    });
  }

  return new Table({
    width: { size: PG_W, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          hCell("S/N", colW[0]),
          hCell("SUBJECT", colW[1]),
          hCell("YES", colW[2]),
          hCell("NO", colW[3]),
        ],
      }),
      ...[1, 2, 3, 4, 5, 6, 7, 8].map(bodyRow),
    ],
  });
}

function feeTable(): Table {
  function feeRow(std: Standard): TableRow {
    const f = FEE_STRUCTURE[std];
    const instStr = f.installments
      ? f.installments.map((i) => `${i.label}: ₹${i.amount.toLocaleString("en-IN")}`).join("  +  ")
      : "—";
    return new TableRow({
      children: [
        new TableCell({
          width: { size: MM(30), type: WidthType.DXA },
          borders: { top: THIN(), left: THIN(), right: THIN(), bottom: THIN() },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: std, bold: true, size: 22, font: "Arial" })], spacing: { before: 30, after: 30 } })],
        }),
        new TableCell({
          width: { size: MM(40), type: WidthType.DXA },
          borders: { top: THIN(), left: THIN(), right: THIN(), bottom: THIN() },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `₹${f.total.toLocaleString("en-IN")}/-`, bold: true, size: 22, font: "Arial" })], spacing: { before: 30, after: 30 } })],
        }),
        new TableCell({
          width: { size: PG_W - MM(30) - MM(40), type: WidthType.DXA },
          borders: { top: THIN(), left: THIN(), right: THIN(), bottom: THIN() },
          children: [new Paragraph({ children: [new TextRun({ text: instStr, size: 20, font: "Arial" })], spacing: { before: 30, after: 30 } })],
        }),
      ],
    });
  }

  const headerBg = "1A56DB";
  function hCell(text: string, w: number): TableCell {
    return new TableCell({
      width: { size: w, type: WidthType.DXA },
      borders: { top: THIN(), left: THIN(), right: THIN(), bottom: THIN() },
      shading: { type: "clear", color: "auto", fill: headerBg },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 22, font: "Arial", color: "FFFFFF" })], spacing: { before: 40, after: 40 } })],
    });
  }

  return new Table({
    width: { size: PG_W, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          hCell("STD", MM(30)),
          hCell("TOTAL FEES", MM(40)),
          hCell("FEES WITH INSTALLMENT", PG_W - MM(30) - MM(40)),
        ],
      }),
      ...(STANDARDS as readonly Standard[]).map(feeRow),
    ],
  });
}

/* ── PAGE 2 ───────────────────────────────────────────────────── */

const RULES = [
  "क्लासेसला दररोज उपस्थित राहणे अनिवार्य आहे.",
  "सोबत रोज येताना वही 3 आणणे बंधनकारक आहे.",
  "3 पुस्तके आणण बंधनकारक आहे.",
  "क्लास मध्ये मोबाईल वापरण्यास सक्त मनाई आहे.",
  "ई 8 वी ते 12 वी MHT-CET NEET यांची फीस 2 टप्यात 4 महिण्याच्या अंतरात भरणे बंधनकारक आहे.",
  "फीस वेळेवर न भरल्यास क्लास मध्ये बसू दिले जाणार नाही वेळोवेळी क्लासला गैरहजर राहिल्यास व नियमांचे उलंघन केल्यास क्लासमधून काढून टाकण्यात येईल.",
  "पालक मेळाव्यात विद्यार्थ्यां सोबत माता - पिता उपस्थित राहणे बंधनकारक आहे.",
  "क्लास मध्ये आणलेल्या वस्तू सांभाळण्याची जवाबदारी विद्यार्थ्यांची आहे.",
  "क्लास मधील अभ्यास होमवर्क व पाठांतर नियमितपणे करावा लागेल.",
  "कुठल्याही कारणास्तव क्लास सोडल्यास / अथवा विद्यार्थ्याच्या गैरवर्तृणूकीच्या कारणास्तव क्लास मधून काढून टाकल्यास भरलेली फीस परत मिळणार नाही.",
];

function signatureTable(): Table {
  function sigCell(marathi: string, english: string): TableCell {
    return new TableCell({
      width: { size: PG_W / 2, type: WidthType.DXA },
      borders: { top: THIN(), left: THIN(), right: THIN(), bottom: THIN() },
      children: [
        new Paragraph({ children: [new TextRun({ text: " " })], spacing: { before: 0, after: MM(15) } }),
        new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 6, color: "333333" } },
          children: [new TextRun({ text: marathi, bold: true, size: 22, font: "Arial" })],
          spacing: { before: 60, after: 0 },
        }),
        new Paragraph({
          children: [new TextRun({ text: english, size: 18, font: "Arial", color: "555555" })],
          spacing: { after: 30 },
        }),
      ],
    });
  }

  return new Table({
    width: { size: PG_W, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          sigCell("पालकांची सही", "Parent / Guardian Signature"),
          sigCell("विद्यार्थ्यांची सही", "Student's Signature"),
        ],
      }),
      new TableRow({
        children: [
          sigCell("संचालक सही", "Director's Signature"),
          sigCell("मॅनेजरची सही", "Manager's Signature"),
        ],
      }),
    ],
  });
}

/* ── PUBLIC EXPORT ────────────────────────────────────────────── */

export async function buildBlankAdmissionWordDoc(): Promise<Blob> {
  // Fetch the logo; fall back to null (omit image) if unavailable
  let logoData: ArrayBuffer | null = null;
  try {
    const res = await fetch("/image.png");
    if (res.ok) logoData = await res.arrayBuffer();
  } catch { /* logo not available, proceed without it */ }

  const mottoRun = new TextRun({ text: "|| विद्या विनयेन शोभते ||", italics: true, size: 20, font: "Arial", color: "555555" });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: MM(210), height: MM(297) },
            margin: { top: MM(8), right: MM(8), bottom: MM(8), left: MM(8) },
          },
        },
        children: [
          /* ── PAGE 1 ── */
          new Paragraph({ alignment: AlignmentType.CENTER, children: [mottoRun], spacing: { after: 80 } }),
          headerTable(logoData),
          sp(),
          namePhotoTable(),
          sp(),
          twoColTable(
            twoColRow("Father's Name :-", 36, "Mother's Name :-", 36),
          ),
          sp(),
          twoColTable(
            twoColRow("Mo:", 8, "Mo:", 8, 20),
          ),
          sp(),
          twoColTable(
            twoColRow("ADMISSION DATE:-", 40, "DATE OF BIRTH  :-", 40),
          ),
          sp(),
          new Table({
            width: { size: PG_W, type: WidthType.DXA },
            borders: { top: NO_BORDER, left: NO_BORDER, right: NO_BORDER, bottom: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
            rows: [
              fieldRow("NAME OF SCHOOL :-", 44, PG_W),
              fieldRow("", 44, PG_W),
            ],
          }),
          sp(),
          new Paragraph({
            children: [new TextRun({ text: "SUBJECT:-", bold: true, size: 22, font: "Arial" })],
            spacing: { after: 60 },
          }),
          subjectTable(),
          sp(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "FEES STRUCTURE", bold: true, size: 22, font: "Arial" })],
            border: { top: THIN(), left: THIN(), right: THIN(), bottom: THIN() },
            spacing: { before: 60, after: 60 },
          }),
          feeTable(),
          sp(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "*एकदा भरलेली फीस कुठल्याही सबबीवर परत मिळणार नाही*", bold: true, italics: true, size: 24, font: "Arial" })],
            spacing: { after: 0 },
          }),

          /* ── PAGE BREAK ── */
          new Paragraph({ children: [new PageBreak()] }),

          /* ── PAGE 2 ── */
          ...RULES.map(
            (r) =>
              new Paragraph({
                children: [new TextRun({ text: r, size: 24, font: "Arial" })],
                bullet: { level: 0 },
                spacing: { after: 60 },
              })
          ),
          sp(),
          new Paragraph({
            children: [
              new TextRun({
                text: "वरील सर्व नियम व अटी मला मान्य असून मी माझ्या पाळ्याचा प्रवेश निश्चित करत आहे.",
                bold: true,
                size: 24,
                font: "Arial",
              }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" } },
            spacing: { after: 120 },
          }),
          sp(),
          signatureTable(),
        ],
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  return new Blob([new Uint8Array(buf)], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}
