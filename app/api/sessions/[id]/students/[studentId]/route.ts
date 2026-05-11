import { connectDB } from "@/lib/mongoose";
import { Student } from "@/lib/models";
import mongoose from "mongoose";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; studentId: string }> }
) {
  await connectDB();
  const { studentId } = await params;
  if (!mongoose.isValidObjectId(studentId)) return Response.json({ error: "Invalid id" }, { status: 400 });
  const body = await req.json();
  const student = await Student.findByIdAndUpdate(studentId, body, { new: true, runValidators: true }).lean();
  if (!student) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(student);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; studentId: string }> }
) {
  await connectDB();
  const { studentId } = await params;
  if (!mongoose.isValidObjectId(studentId)) return Response.json({ error: "Invalid id" }, { status: 400 });
  await Student.findByIdAndDelete(studentId);
  return Response.json({ ok: true });
}
