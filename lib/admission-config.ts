export const INSTITUTE_INFO = {
  name: "Shree Saraswati Classes",
  city: "Kannad",
  address: "Boldhane Aaba Building, Hiwarkheda Road, Kannad, Dist Chhatrapati Sambhajinagar",
  nagarDirector: { name: "Vijaykumar Mande", contact: "9421314040" },
  director: { name: "Dasharath Somase", contact: "9423705300" },
};

export const STANDARDS = ["7th", "8th", "9th", "10th", "11th", "12th", "MHT-CET", "NEET"] as const;
export type Standard = (typeof STANDARDS)[number];

export const SUBJECTS_BY_STANDARD: Record<Standard, string[]> = {
  "7th":     ["Math", "Science", "English", "Hindi", "Marathi", "Social Science"],
  "8th":     ["Math", "Science", "English", "Hindi", "Marathi", "Social Science"],
  "9th":     ["Math", "Science", "English", "Hindi", "Marathi", "Social Science"],
  "10th":    ["Math", "Science", "English", "Hindi", "Marathi", "Social Science"],
  "11th":    ["Physics", "Chemistry", "Math", "Biology", "English", "Marathi"],
  "12th":    ["Physics", "Chemistry", "Math", "Biology", "English", "Marathi"],
  "MHT-CET": ["Physics", "Chemistry", "Math", "Biology"],
  "NEET":    ["Physics", "Chemistry", "Biology"],
};

export interface FeeEntry {
  total: number;
  installments?: { label: string; amount: number }[];
}

export const FEE_STRUCTURE: Record<Standard, FeeEntry> = {
  "7th":     { total: 8000 },
  "8th":     { total: 10000 },
  "9th":     { total: 15000 },
  "10th":    { total: 18000, installments: [{ label: "March", amount: 10000 }, { label: "June", amount: 8000 }] },
  "11th":    { total: 45000 },
  "12th":    { total: 45000 },
  "MHT-CET": { total: 45000 },
  "NEET":    { total: 45000 },
};

export function getAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const startYear = now.getMonth() >= 5 ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(2)}`;
}

export function fmtINR(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}
