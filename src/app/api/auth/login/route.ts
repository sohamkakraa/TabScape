import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/server/session";

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };
    if (!email || !password) {
      return new NextResponse("Missing credentials", { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) {
      return new NextResponse("Invalid credentials", { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return new NextResponse(message, { status: 500 });
  }
}
