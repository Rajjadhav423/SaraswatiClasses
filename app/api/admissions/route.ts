import { connectDB } from "@/lib/mongoose";
import { Admission } from "@/lib/models";

export async function GET() {
  await connectDB();
  const admissions = await Admission.find().sort({ createdAt: -1 }).lean();
  return Response.json(admissions);
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  const admission = await Admission.create(body);
  return Response.json(admission, { status: 201 });
}
