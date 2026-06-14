import { connectDB } from "@/lib/mongoose";
import { Admission } from "@/lib/models";
import mongoose from "mongoose";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid id" }, { status: 400 });
  const admission = await Admission.findById(id).lean();
  if (!admission) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(admission);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid id" }, { status: 400 });
  const body = await req.json();
  const admission = await Admission.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
  if (!admission) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(admission);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid id" }, { status: 400 });
  await Admission.findByIdAndDelete(id);
  return Response.json({ ok: true });
}
