"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { SUBJECTS_BY_STANDARD, FEE_STRUCTURE, type Standard } from "@/lib/admission-config";

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
}

const F = "Arial, Helvetica, sans-serif";
const W = 700;

function fmtDate(s: string) {
  if (!s) return "__ / __ / ____";
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2,"0")} / ${String(d.getMonth()+1).padStart(2,"0")} / ${d.getFullYear()}`;
}

/* ── Full-width underline field (works in flex rows) ── */
function ULine({ value, style }: { value?: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      flex: 1,
      borderBottom: "1px solid #000",
      minHeight: 20,
      paddingLeft: 6,
      fontSize: 12,
      fontFamily: F,
      display: "flex",
      alignItems: "flex-end",
      paddingBottom: 2,
      ...style,
    }}>
      {value || ""}
    </div>
  );
}

/* ── Row with label + underlined value ── */
function FieldRow({ label, value, labelWidth = 150, mb = 10 }: {
  label: string; value?: string; labelWidth?: number; mb?: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", marginBottom: mb, gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: F, whiteSpace: "nowrap", width: labelWidth, flexShrink: 0 }}>
        {label}
      </span>
      <ULine value={value} />
    </div>
  );
}

/* ── Table cell ── */
function TC({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <td style={{ border: "1px solid #000", padding: "4px 8px", fontFamily: F, fontSize: 12, ...style }}>
      {children}
    </td>
  );
}

/* ══════════════ PAGE 1 — STUDENT DETAILS ══════════════════════ */
function FrontPage({ a }: { a: Admission }) {
  const allSubs = SUBJECTS_BY_STANDARD[a.standard as Standard] ?? a.subjects;
  const fee     = FEE_STRUCTURE[a.standard as Standard];
  const yr2     = new Date().getFullYear().toString().slice(2);
  const hasInst = !!(fee?.installments?.length);

  return (
    <div style={{ width: W, background: "#fff", fontFamily: F, padding: "16px 20px", boxSizing: "border-box" }}>

      {/* ── Motto ── */}
      <div style={{ textAlign: "center", fontSize: 11, fontStyle: "italic", color: "#555", marginBottom: 6 }}>
        || विद्या विनयेन शोभते ||
      </div>

      {/* ── Header ── */}
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

      {/* ── Name + Passport Photo ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>

        {/* Left column — name & address */}
        <div style={{ flex: 1 }}>
          {/* Student name */}
          <div style={{ display: "flex", alignItems: "flex-end", marginBottom: 8, gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>Name Of Student :-</span>
            <ULine value={`${a.studentName} ${a.fatherName}`.trim()} style={{ fontSize: 13, fontWeight: 700 }} />
          </div>
          {/* Blank continuation line (physical form has 2 lines for name) */}
          <div style={{ display: "flex", alignItems: "flex-end", marginBottom: 10, gap: 6 }}>
            <span style={{ width: 136, flexShrink: 0 }} />
            <ULine value="" />
          </div>

          {/* Address line 1 */}
          <div style={{ display: "flex", alignItems: "flex-end", marginBottom: 8, gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>ADDRESS&nbsp;&nbsp;&nbsp;&nbsp;:-</span>
            <ULine value={a.address.length > 42 ? a.address.slice(0, 42) : a.address} />
          </div>
          {/* Address line 2 */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <span style={{ width: 136, flexShrink: 0 }} />
            <ULine value={a.address.length > 42 ? a.address.slice(42) : ""} />
          </div>
        </div>

        {/* Passport photo box */}
        <div style={{
          width: 85, height: 105,
          border: "1.5px solid #000", flexShrink: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center", fontSize: 10, color: "#555", lineHeight: 1.6,
        }}>
          PASTE<br />PASSPORT<br />SIZE<br />PHOTO
        </div>
      </div>

      {/* ── Father / Mother — full width below photo ── */}
      <div style={{ display: "flex", gap: 20, marginBottom: 10, marginTop: 6 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>Father&apos;s Name :-</span>
          <ULine value={a.fatherName} />
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>Mother&apos;s Name :-</span>
          <ULine value={a.motherName} />
        </div>
      </div>

      {/* ── Mobile ── */}
      <div style={{ display: "flex", gap: 40, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, flexShrink: 0 }}>Mo:</span>
          <ULine value={a.mobile} style={{ minWidth: 150 }} />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, flexShrink: 0 }}>Mo:</span>
          <ULine value={a.altMobile || ""} style={{ minWidth: 150 }} />
        </div>
      </div>

      {/* ── Dates ── */}
      <div style={{ display: "flex", gap: 24, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>ADMISSION DATE:-</span>
          <ULine value={fmtDate(a.admissionDate)} style={{ minWidth: 120 }} />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>DATE OF BIRTH :-</span>
          <ULine value={fmtDate(a.dob)} style={{ minWidth: 120 }} />
        </div>
      </div>

      {/* ── School ── */}
      <FieldRow label="NAME OF SCHOOL :-" value={a.schoolName} mb={6} />
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 14 }}>
        <span style={{ width: 150, flexShrink: 0 }} />
        <ULine value="" />
      </div>

      {/* ── Subject Table ── */}
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
          {allSubs.map((sub, i) => {
            const sel = a.subjects.includes(sub);
            return (
              <tr key={sub}>
                <TC style={{ textAlign: "center" }}>{i + 1}</TC>
                <TC style={{ fontWeight: 600 }}>{sub.toUpperCase()}</TC>
                <TC style={{ textAlign: "center", fontSize: 15, fontWeight: 900 }}>{sel ? "✓" : ""}</TC>
                <TC style={{ textAlign: "center", fontSize: 15, fontWeight: 900 }}>{!sel ? "✓" : ""}</TC>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ── Fee Structure ── */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <span style={{ display: "inline-block", border: "1px solid #000", padding: "3px 32px", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
          FEES STRUCTURE
        </span>
      </div>

      <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: 16 }}>
        <thead>
          <tr>
            <td rowSpan={2} style={{ border:"1px solid #000", padding:"4px 6px", fontWeight:700, fontSize:12, textAlign:"center", verticalAlign:"middle", width:66 }}>STD</td>
            <td rowSpan={2} style={{ border:"1px solid #000", padding:"4px 6px", fontWeight:700, fontSize:12, textAlign:"center", verticalAlign:"middle", width:100 }}>TOTAL FEES</td>
            <td colSpan={hasInst ? (fee.installments?.length ?? 1) : 1}
                style={{ border:"1px solid #000", padding:"4px 6px", fontWeight:700, fontSize:12, textAlign:"center" }}>
              FEES WITH INSTALLMENT
            </td>
          </tr>
          <tr>
            {hasInst
              ? fee.installments!.map((inst, i) => (
                  <td key={i} style={{ border:"1px solid #000", padding:"4px 6px", fontWeight:700, fontSize:11, textAlign:"center" }}>
                    {i+1}{i===0?"ST":"ND"} INSTALLMENT<br />
                    <span style={{ fontWeight:400, fontSize:10 }}>{inst.label.toUpperCase()}-{yr2}/{inst.amount.toLocaleString("en-IN")}</span>
                  </td>
                ))
              : <td style={{ border:"1px solid #000", padding:"4px 6px", fontSize:11, textAlign:"center" }}>—</td>
            }
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border:"1px solid #000", padding:"6px", fontSize:14, fontWeight:700, textAlign:"center" }}>{a.standard}</td>
            <td style={{ border:"1px solid #000", padding:"6px", fontSize:14, fontWeight:700, textAlign:"center" }}>
              {fee ? `${fee.total.toLocaleString("en-IN")}/-` : "—"}
            </td>
            {hasInst
              ? fee.installments!.map((inst, i) => (
                  <td key={i} style={{ border:"1px solid #000", padding:"6px", fontSize:12, textAlign:"center" }}>
                    {inst.label.toUpperCase()}-{yr2}/{inst.amount.toLocaleString("en-IN")}
                  </td>
                ))
              : <td style={{ border:"1px solid #000", padding:"6px", fontSize:12, textAlign:"center" }}>—</td>
            }
          </tr>
          {[0,1].map(r => (
            <tr key={r}>
              <td style={{ border:"1px solid #000", height:22 }} />
              <td style={{ border:"1px solid #000" }} />
              {hasInst
                ? fee.installments!.map((_,i) => <td key={i} style={{ border:"1px solid #000" }} />)
                : <td style={{ border:"1px solid #000" }} />
              }
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Disclaimer ── */}
      <div style={{ textAlign:"center", fontSize:13, fontWeight:700, fontStyle:"italic" }}>
        *एकदा भरलेली फीस कुठल्याही सबबीवर परत मिळणार नाही*
      </div>
    </div>
  );
}

/* ══════════════ PAGE 2 — TERMS & CONDITIONS ════════════════════ */
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
              { mr: "पालकांची सही",        en: "Parent / Guardian Signature" },
              { mr: "विद्यार्थ्यांची सही",  en: "Student's Signature" },
            ].map(({ mr, en }) => (
              <td key={mr} style={{ border:"1px solid #000", padding:"8px 12px 4px", width:"50%", verticalAlign:"bottom" }}>
                <div style={{ height: 48 }} />
                <hr style={{ border:"none", borderTop:"1px solid #333", margin:"0 0 3px" }} />
                <div style={{ fontSize:12, fontWeight:700 }}>{mr}</div>
                <div style={{ fontSize:10, color:"#555" }}>{en}</div>
              </td>
            ))}
          </tr>
          <tr>
            {[
              { mr: "संचालक सही",    en: "Director's Signature" },
              { mr: "मॅनेजरची सही", en: "Manager's Signature" },
            ].map(({ mr, en }) => (
              <td key={mr} style={{ border:"1px solid #000", padding:"8px 12px 4px", verticalAlign:"bottom" }}>
                <div style={{ height: 48 }} />
                <hr style={{ border:"none", borderTop:"1px solid #333", margin:"0 0 3px" }} />
                <div style={{ fontSize:12, fontWeight:700 }}>{mr}</div>
                <div style={{ fontSize:10, color:"#555" }}>{en}</div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════ MAIN PAGE ══════════════════════════════════════ */
export default function AdmissionPrintPage() {
  const { id }            = useParams<{ id: string }>();
  const [adm, setAdm]     = useState<Admission | null>(null);
  const [loading, setL]   = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch(`/api/admissions/${id}`, { signal: ctrl.signal });
      if (!res.ok) { setError("Admission not found."); setL(false); return; }
      setAdm(await res.json());
    } catch (e: unknown) {
      setError((e instanceof Error && e.name === "AbortError")
        ? "Request timed out. Check MongoDB connection and refresh."
        : "Failed to load. Check your internet connection.");
    } finally {
      clearTimeout(timer);
      setL(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", height:"100vh", fontFamily:F, gap:16, color:"#334155" }}>
      <div style={{ width:40, height:40, border:"4px solid #e2e8f0", borderTopColor:"#3b82f6", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <div style={{ fontSize:15, fontWeight:600 }}>Loading admission form…</div>
      <div style={{ fontSize:12, color:"#94a3b8" }}>Connecting to database</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !adm) return (
    <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", height:"100vh", fontFamily:F, gap:12 }}>
      <div style={{ fontSize:32 }}>⚠️</div>
      <div style={{ fontSize:15, fontWeight:700, color:"#dc2626" }}>Could not load form</div>
      <div style={{ fontSize:13, color:"#64748b", maxWidth:380, textAlign:"center" }}>{error || "No data found."}</div>
      <button onClick={()=>window.location.reload()} style={{ marginTop:8, background:"#3b82f6", color:"#fff", border:"none", borderRadius:6, padding:"8px 20px", fontWeight:600, cursor:"pointer", fontSize:14 }}>
        Retry
      </button>
    </div>
  );

  return (
    <>
      {/* Toolbar — screen only */}
      <div id="tb" style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background:"#1e293b", color:"#fff", display:"flex", alignItems:"center", gap:16, padding:"10px 20px", fontFamily:F }}>
        <span style={{ fontWeight:"bold", fontSize:14 }}>
          Admission Form — {adm.studentName} ({adm.standard})
        </span>
        <div style={{ flex:1 }} />
        <button onClick={()=>window.print()} style={{ background:"#3b82f6", color:"#fff", border:"none", borderRadius:6, padding:"7px 18px", fontWeight:"bold", cursor:"pointer", fontSize:14 }}>
          🖨 Print
        </button>
        <button onClick={()=>window.close()} style={{ background:"transparent", color:"#94a3b8", border:"1px solid #475569", borderRadius:6, padding:"7px 14px", cursor:"pointer", fontSize:14 }}>
          ✕ Close
        </button>
      </div>

      {/* Screen preview — 1 copy, 2 pages */}
      <div id="pv" style={{ paddingTop:64, paddingBottom:40, background:"#94a3b8", minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
        <div style={{ fontSize:11, color:"#1e293b", fontFamily:F, alignSelf:"flex-start", marginLeft:"calc(50% - 350px)", marginTop:8, fontWeight:600 }}>
          Page 1 — Student Details
        </div>
        <div style={{ boxShadow:"0 4px 24px rgba(0,0,0,.25)" }}><FrontPage a={adm} /></div>

        <div style={{ fontSize:11, color:"#1e293b", fontFamily:F, alignSelf:"flex-start", marginLeft:"calc(50% - 350px)", marginTop:8, fontWeight:600 }}>
          Page 2 — Terms &amp; Conditions
        </div>
        <div style={{ boxShadow:"0 4px 24px rgba(0,0,0,.25)" }}><BackPage /></div>
      </div>

      {/* Print: 1 copy = 2 pages */}
      <div id="po" style={{ display:"none" }}>
        <FrontPage a={adm} />
        <div style={{ pageBreakAfter:"always" }} />
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
