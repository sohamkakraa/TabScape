import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/server/session";

export async function GET(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const tabId = searchParams.get("tabId");
  if (!tabId) return new NextResponse("Missing tabId", { status: 400 });

  const tab = await prisma.tab.findFirst({ where: { id: tabId, userId } });
  if (!tab) return new NextResponse("Not found", { status: 404 });

  const shares = await prisma.tabShare.findMany({
    where: { tabId },
    include: { member: true },
  });

  return NextResponse.json(
    shares.map((s) => ({
      id: s.id,
      memberId: s.memberId,
      memberName: s.member.name,
      sharePercent: s.sharePercent,
      shareAmount: s.shareAmount ?? undefined,
      paidAmount: s.paidAmount ?? 0,
      status: s.status,
    }))
  );
}

export async function POST(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const payload = (await req.json()) as {
    tabId?: string;
    shares?: { memberId: string; sharePercent: number }[];
  };
  if (!payload.tabId || !payload.shares) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  const tab = await prisma.tab.findFirst({ where: { id: payload.tabId, userId } });
  if (!tab) return new NextResponse("Not found", { status: 404 });

  await prisma.tabShare.deleteMany({ where: { tabId: payload.tabId } });
  if (payload.shares.length > 0) {
    await prisma.tabShare.createMany({
      data: payload.shares.map((s) => ({
        tabId: payload.tabId as string,
        memberId: s.memberId,
        sharePercent: s.sharePercent,
        shareAmount: Math.round((tab.currentAmount * s.sharePercent) / 100 * 100) / 100,
        status: "pending",
      })),
    });
  }

  return NextResponse.json({ ok: true });
}
