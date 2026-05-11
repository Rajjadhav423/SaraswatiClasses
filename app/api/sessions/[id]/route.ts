import { connectDB } from "@/lib/mongoose";
import { Session } from "@/lib/models";
import mongoose from "mongoose";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid id" }, { status: 400 });
  const session = await Session.findById(id).lean();
  if (!session) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(session);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid id" }, { status: 400 });
  const body = await req.json();
  const session = await Session.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
  if (!session) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(session);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid id" }, { status: 400 });
  await Session.findByIdAndDelete(id);
  return Response.json({ ok: true });
}
