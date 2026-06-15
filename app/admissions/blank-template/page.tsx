"use client";

import { FEE_STRUCTURE, STANDARDS, getAcademicYear, type Standard } from "@/lib/admission-config";

const F = "Arial, Helvetica, sans-serif";
const W = 700;

/* ── helpers ── */
function ULine({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      flex: 1, borderBottom: "1px solid #000", minHeight: 20,
      paddingLeft: 6, fontSize: 12, fontFamily: F,
      display: "flex", alignItems: "flex-end", paddingBottom: 2,
      ...style,
    }} />
  );
}

function FieldRow({ label, labelWidth = 150, mb = 10 }: { label: string; labelWidth?: number; mb?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", marginBottom: mb, gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: F, whiteSpace: "nowrap", width: labelWidth, flexShrink: 0 }}>{label}</span>
      <ULine />
    </div>
  );
}

function TC({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <td style={{ border: "1px solid #000", padding: "4px 8px", fontFamily: F, fontSize: 12, ...style }}>
      {children}
    </td>
  );
}

/* ── PAGE 1 — blank student details ── */
function FrontPage() {
  const yr2 = new Date().getFullYear().toString().slice(2);

  return (
    <div style={{ width: W, background: "#fff", fontFamily: F, padding: "16px 20px", boxSizing: "border-box" }}>

      {/* Motto */}
      <div style={{ textAlign: "center", fontSize: 11, fontStyle: "italic", color: "#555", marginBottom: 6 }}>
        || विद्या विनयेन शोभते ||
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/image.png" alt="" style={{ width: 56, height: 56, objectFit: "contain", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 2, fontFamily: "'Arial Black', Arial, sans-serif", lineHeight: 1.2 }}>
            SHREE SARASWATI CLASSES
          </div>
          <div style={{ fontSize: 10, color: "#333", marginTop: 2, lineHeight: 1.4 }}>
            Address:- Boldhane Aaba Building Hiwarkheda Road, Kannad Dist Chhatrapati Sambhaji.
          </div>
          <div style={{ fontSize: 10, color: "#333" }}>
            Nagar Director: Vijaykumar Mande 9421314040&nbsp;&nbsp;Director: Dasharath Somase 9423705300
          </div>
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "2px solid #000", margin: "6px 0 12px" }} />

      {/* Standard + Academic Year row */}
      <div style={{ display: "flex", gap: 24, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>STD / CLASS :-</span>
          <ULine style={{ minWidth: 100 }} />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>ACADEMIC YEAR :-</span>
          <ULine style={{ minWidth: 80 }} />
        </div>
      </div>

      {/* Name + Photo */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-end", marginBottom: 8, gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>Name Of Student :-</span>
            <ULine style={{ fontSize: 13, fontWeight: 700 }} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", marginBottom: 10, gap: 6 }}>
            <span style={{ width: 136, flexShrink: 0 }} />
            <ULine />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", marginBottom: 8, gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>ADDRESS&nbsp;&nbsp;&nbsp;&nbsp;:-</span>
            <ULine />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <span style={{ width: 136, flexShrink: 0 }} />
            <ULine />
          </div>
        </div>
        {/* Photo box */}
        <div style={{ width: 85, height: 105, border: "1.5px solid #000", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: 10, color: "#555", lineHeight: 1.6 }}>
          PASTE<br />PASSPORT<br />SIZE<br />PHOTO
        </div>
      </div>

      {/* Father / Mother */}
      <div style={{ display: "flex", gap: 20, marginBottom: 10, marginTop: 6 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>Father&apos;s Name :-</span>
          <ULine />
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>Mother&apos;s Name :-</span>
          <ULine />
        </div>
      </div>

      {/* Mobile */}
      <div style={{ display: "flex", gap: 40, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, flexShrink: 0 }}>Mobile No:</span>
          <ULine style={{ minWidth: 140 }} />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, flexShrink: 0 }}>Mobile No:</span>
          <ULine style={{ minWidth: 140 }} />
        </div>
      </div>

      {/* Dates */}
      <div style={{ display: "flex", gap: 24, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>ADMISSION DATE:-</span>
          <ULine style={{ minWidth: 120 }} />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>DATE OF BIRTH :-</span>
          <ULine style={{ minWidth: 120 }} />
        </div>
      </div>

      {/* School */}
      <FieldRow label="NAME OF SCHOOL :-" mb={6} />
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 14 }}>
        <span style={{ width: 150, flexShrink: 0 }} />
        <ULine />
      </div>

      {/* Subject Table */}
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>SUBJECT:-</div>
      <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: 14 }}>
        <thead>
          <tr>
            <TC style={{ fontWeight: 700, textAlign: "center", width: 46 }}>S/N</TC>
            <TC style={{ fontWeight: 700 }}>SUBJECT</TC>
            <TC style={{ fontWeight: 700, textAlign: "center", width: 88 }}>YES</TC>
            <TC style={{ fontWeight: 700, textAlign: "center", width: 88 }}>NO</TC>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <tr key={n}>
              <TC style={{ textAlign: "center" }}>{n}</TC>
              <TC style={{ height: 22 }} />
              <TC />
              <TC />
            </tr>
          ))}
        </tbody>
      </table>

      {/* Fee Structure */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <span style={{ display: "inline-block", border: "1px solid #000", padding: "3px 32px", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
          FEES STRUCTURE
        </span>
      </div>

      <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: 16 }}>
        <thead>
          <tr>
            <TC style={{ fontWeight: 700, textAlign: "center", width: 60 }}>STD</TC>
            <TC style={{ fontWeight: 700, textAlign: "center", width: 100 }}>TOTAL FEES</TC>
            <TC style={{ fontWeight: 700, textAlign: "center" }}>FEES WITH INSTALLMENT</TC>
          </tr>
        </thead>
        <tbody>
          {(STANDARDS as readonly Standard[]).map((std) => {
            const f = FEE_STRUCTURE[std];
            const instStr = f.installments
              ? f.installments.map((i) => `${i.label.toUpperCase()}-${yr2}: ₹${i.amount.toLocaleString("en-IN")}`).join("   +   ")
              : "—";
            return (
              <tr key={std}>
                <TC style={{ textAlign: "center", fontWeight: 700 }}>{std}</TC>
                <TC style={{ textAlign: "center", fontWeight: 700 }}>₹{f.total.toLocaleString("en-IN")}/-</TC>
                <TC>{instStr}</TC>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Disclaimer */}
      <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, fontStyle: "italic" }}>
        *एकदा भरलेली फीस कुठल्याही सबबीवर परत मिळणार नाही*
      </div>
    </div>
  );
}

/* ── PAGE 2 — T&C ── */
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

function BackPage() {
  return (
    <div style={{ width: W, background: "#fff", fontFamily: F, padding: "16px 20px 20px", boxSizing: "border-box" }}>
      <ul style={{ paddingLeft: 20, margin: "0 0 16px", listStyleType: "disc" }}>
        {RULES.map((r, i) => (
          <li key={i} style={{ fontSize: 13, lineHeight: 1.65, marginBottom: 3 }}>{r}</li>
        ))}
      </ul>

      <div style={{ fontSize: 13, fontWeight: 700, textDecoration: "underline", marginBottom: 14 }}>
        वरील सर्व नियम व अटी मला मान्य असून मी माझ्या पाळ्याचा प्रवेश निश्चित करत आहे.
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #000", marginBottom: 12 }} />

      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 5 }}>Fees Structure :</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 20px", marginBottom: 20, fontSize: 13 }}>
        <span>7th — ₹8,000</span>
        <span>8th — ₹10,000</span>
        <span>9th — ₹15,000</span>
        <span>10th — ₹18,000</span>
        <span style={{ gridColumn: "1 / -1" }}>11th + 12th + MHT-CET + NEET — ₹45,000</span>
      </div>

      <table style={{ borderCollapse: "collapse", width: "100%", border: "1px solid #000" }}>
        <tbody>
          <tr>
            {[
              { mr: "पालकांची सही",       en: "Parent / Guardian Signature" },
              { mr: "विद्यार्थ्यांची सही", en: "Student's Signature" },
            ].map(({ mr, en }) => (
              <td key={mr} style={{ border: "1px solid #000", padding: "8px 12px 4px", width: "50%", verticalAlign: "bottom" }}>
                <div style={{ height: 48 }} />
                <hr style={{ border: "none", borderTop: "1px solid #333", margin: "0 0 3px" }} />
                <div style={{ fontSize: 12, fontWeight: 700 }}>{mr}</div>
                <div style={{ fontSize: 10, color: "#555" }}>{en}</div>
              </td>
            ))}
          </tr>
          <tr>
            {[
              { mr: "संचालक सही",    en: "Director's Signature" },
              { mr: "मॅनेजरची सही", en: "Manager's Signature" },
            ].map(({ mr, en }) => (
              <td key={mr} style={{ border: "1px solid #000", padding: "8px 12px 4px", verticalAlign: "bottom" }}>
                <div style={{ height: 48 }} />
                <hr style={{ border: "none", borderTop: "1px solid #333", margin: "0 0 3px" }} />
                <div style={{ fontSize: 12, fontWeight: 700 }}>{mr}</div>
                <div style={{ fontSize: 10, color: "#555" }}>{en}</div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ── MAIN ── */
export default function BlankTemplatePage() {
  return (
    <>
      {/* Toolbar — screen only */}
      <div id="tb" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "#1e293b", color: "#fff", display: "flex", alignItems: "center", gap: 16, padding: "10px 20px", fontFamily: F }}>
        <span style={{ fontWeight: "bold", fontSize: 14 }}>Blank Admission Form Template</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => window.print()}
          style={{ background: "#1A56DB", color: "#fff", border: "none", borderRadius: 6, padding: "7px 18px", fontWeight: "bold", cursor: "pointer", fontSize: 14 }}
        >
          🖨 Print / Save as PDF
        </button>
        <button
          onClick={() => window.close()}
          style={{ background: "transparent", color: "#94a3b8", border: "1px solid #475569", borderRadius: 6, padding: "7px 14px", cursor: "pointer", fontSize: 14 }}
        >
          ✕ Close
        </button>
      </div>

      {/* Screen preview */}
      <div id="pv" style={{ paddingTop: 64, paddingBottom: 40, background: "#94a3b8", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 11, color: "#1e293b", fontFamily: F, alignSelf: "flex-start", marginLeft: "calc(50% - 350px)", marginTop: 8, fontWeight: 600 }}>
          Page 1 — Student Details
        </div>
        <div style={{ boxShadow: "0 4px 24px rgba(0,0,0,.25)" }}><FrontPage /></div>

        <div style={{ fontSize: 11, color: "#1e293b", fontFamily: F, alignSelf: "flex-start", marginLeft: "calc(50% - 350px)", marginTop: 8, fontWeight: 600 }}>
          Page 2 — Terms &amp; Conditions
        </div>
        <div style={{ boxShadow: "0 4px 24px rgba(0,0,0,.25)" }}><BackPage /></div>
      </div>

      {/* Print output */}
      <div id="po" style={{ display: "none" }}>
        <FrontPage />
        <div style={{ pageBreakAfter: "always" }} />
        <BackPage />
      </div>

      <style>{`
        @media print {
          #tb, #pv { display: none !important; }
          #po       { display: block !important; }
          body      { background: #fff !important; margin: 0; padding: 0; }
          @page     { margin: 8mm; size: A4 portrait; }
        }
      `}</style>
    </>
  );
}
