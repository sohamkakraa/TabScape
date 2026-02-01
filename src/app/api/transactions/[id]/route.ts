import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/server/session";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = params;
  const tx = await prisma.tabTransaction.findUnique({
    where: { id },
    include: { tags: true },
  });
  if (!tx) return new NextResponse("Not found", { status: 404 });

  const tab = await prisma.tab.findFirst({ where: { id: tx.tabId, userId } });
  if (!tab) return new NextResponse("Not found", { status: 404 });

  await prisma.$transaction([
    prisma.transactionTag.deleteMany({ where: { transactionId: id } }),
    prisma.tabTransaction.delete({ where: { id } }),
    prisma.tab.update({
      where: { id: tab.id },
      data: { currentAmount: Math.max(0, tab.currentAmount - tx.amount) },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
