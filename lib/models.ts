import mongoose, { Schema, model, models } from "mongoose";

// ─── Subject sub-schema ───────────────────────────────────────────────────────
const SubjectSchema = new Schema(
  { name: { type: String, required: true }, outOf: { type: Number, required: true } },
  { _id: false }
);

// ─── Session (exam configuration) ────────────────────────────────────────────
export interface ISession {
  _id: mongoose.Types.ObjectId;
  instituteName: string;
  className: string;
  month: string;
  year: string;
  totalDays: number;
  managerName: string;
  subjects: { name: string; outOf: number }[];
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    instituteName: { type: String, default: "Shree Saraswati Classes, Kannad" },
    className:     { type: String, required: true },
    month:         { type: String, required: true },
    year:          { type: String, required: true },
    totalDays:     { type: Number, default: 25 },
    managerName:   { type: String, default: "Manager" },
    subjects:      [SubjectSchema],
  },
  { timestamps: true }
);

export const Session = models.Session ?? model<ISession>("Session", SessionSchema);

// ─── Student ──────────────────────────────────────────────────────────────────
export interface IStudent {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  name: string;
  attendance: number;
  marks: number[];    // parallel array to session.subjects
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    sessionId:  { type: Schema.Types.ObjectId, ref: "Session", required: true, index: true },
    name:       { type: String, required: true },
    attendance: { type: Number, default: 0 },
    marks:      [{ type: Schema.Types.Mixed, default: 0 }],
  },
  { timestamps: true }
);

export const Student = models.Student ?? model<IStudent>("Student", StudentSchema);
