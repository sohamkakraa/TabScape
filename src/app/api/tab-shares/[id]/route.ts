import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/server/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const payload = (await req.json()) as {
    paidAmount?: number;
    status?: "pending" | "paid";
  };

  const share = await prisma.tabShare.findUnique({ where: { id: params.id } });
  if (!share) return new NextResponse("Not found", { status: 404 });

  const tab = await prisma.tab.findFirst({ where: { id: share.tabId, userId } });
  if (!tab) return new NextResponse("Not found", { status: 404 });

  const paidAmount = Math.max(0, payload.paidAmount ?? share.paidAmount);
  const shareAmount = share.shareAmount ?? 0;
  const status =
    payload.status ??
    (shareAmount > 0 && paidAmount >= shareAmount ? "paid" : "pending");

  const updated = await prisma.tabShare.update({
    where: { id: share.id },
    data: { paidAmount, status },
  });

  return NextResponse.json({
    id: updated.id,
    memberId: updated.memberId,
    sharePercent: updated.sharePercent,
    shareAmount: updated.shareAmount ?? undefined,
    paidAmount: updated.paidAmount ?? 0,
    status: updated.status,
  });
}
