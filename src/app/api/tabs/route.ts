import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/server/session";

export async function GET(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const tabs = await prisma.tab.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(
    tabs.map((t) => ({
      id: t.id,
      name: t.name,
      merchant: t.merchant,
      category: t.category,
      dueDay: t.dueDay,
      limit: t.limit,
      currentAmount: t.currentAmount,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const payload = (await req.json()) as {
    name?: string;
    merchant?: string;
    category?: string;
    dueDay?: number;
    limit?: number;
    currentAmount?: number;
  };

  if (!payload.name || !payload.merchant || !payload.category) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  const tab = await prisma.tab.create({
    data: {
      userId,
      name: payload.name,
      merchant: payload.merchant,
      category: payload.category as any,
      dueDay: payload.dueDay ?? 30,
      limit: payload.limit ?? 0,
      currentAmount: payload.currentAmount ?? 0,
      status: "open",
    },
  });

  return NextResponse.json(tab);
}
