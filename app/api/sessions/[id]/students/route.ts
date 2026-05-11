import { connectDB } from "@/lib/mongoose";
import { Student } from "@/lib/models";
import mongoose from "mongoose";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid id" }, { status: 400 });
  const students = await Student.find({ sessionId: id }).sort({ createdAt: 1 }).lean();
  return Response.json(students);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid id" }, { status: 400 });
  const body = await req.json();
  // Upsert by name within the session, or always create — here we always create
  const student = await Student.create({ ...body, sessionId: id });
  return Response.json(student, { status: 201 });
}
