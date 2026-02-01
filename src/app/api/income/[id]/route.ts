import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/server/session";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  await prisma.incomeSchedule.deleteMany({ where: { id: params.id, userId } });
  return NextResponse.json({ ok: true });
}
