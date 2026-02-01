import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/server/session";

export async function GET(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const series = await prisma.expensePoint.findMany({
    where: { userId },
    orderBy: { month: "asc" },
  });
  return NextResponse.json(series.map((p) => ({ month: p.month, amount: p.amount })));
}

export async function POST(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { series } = (await req.json()) as { series?: { month: string; amount: number }[] };
  if (!series) return new NextResponse("Missing series", { status: 400 });

  await prisma.expensePoint.deleteMany({ where: { userId } });
  if (series.length > 0) {
    await prisma.expensePoint.createMany({
      data: series.map((p) => ({ userId, month: p.month, amount: p.amount })),
    });
  }

  return NextResponse.json({ ok: true });
}
