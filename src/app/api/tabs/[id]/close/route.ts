import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/server/session";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = params;
  await prisma.tab.updateMany({
    where: { id, userId },
    data: { status: "closed", currentAmount: 0 },
  });
  return NextResponse.json({ ok: true });
}
