import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get(SESSION_COOKIE)?.value ?? null;
    if (!userId) return NextResponse.json(null);
    return NextResponse.json({ userId });
  } catch {
    return NextResponse.json(null);
  }
}
