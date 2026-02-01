import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/server/session";

export async function GET(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";

  const notifications = await prisma.notification.findMany({
    where: { userId, readAt: unreadOnly ? null : undefined },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(
    notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      createdAt: n.createdAt.toISOString(),
      readAt: n.readAt?.toISOString() ?? undefined,
    }))
  );
}

export async function POST(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const payload = (await req.json()) as { id?: string };
  if (!payload.id) return new NextResponse("Missing id", { status: 400 });

  await prisma.notification.updateMany({
    where: { id: payload.id, userId },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
