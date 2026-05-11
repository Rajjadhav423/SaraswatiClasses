import { connectDB } from "@/lib/mongoose";
import { Session } from "@/lib/models";

export async function GET() {
  await connectDB();
  const sessions = await Session.find().sort({ createdAt: -1 }).lean();
  return Response.json(sessions);
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  const session = await Session.create(body);
  return Response.json(session, { status: 201 });
}
