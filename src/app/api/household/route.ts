import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/server/session";

export async function GET(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const household = await prisma.household.findUnique({
    where: { ownerId: userId },
    include: { members: true },
  });

  if (!household) {
    return NextResponse.json({ household: null, members: [] });
  }

  return NextResponse.json({
    household: { id: household.id, name: household.name },
    members: household.members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email ?? undefined,
      shareDefault: m.shareDefault ?? undefined,
    })),
  });
}

export async function POST(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const payload = (await req.json()) as {
    name?: string;
    email?: string;
    shareDefault?: number;
  };

  const household = await prisma.household.findUnique({ where: { ownerId: userId } });
  if (!household) return new NextResponse("Household missing", { status: 404 });

  const member = await prisma.householdMember.create({
    data: {
      householdId: household.id,
      name: payload.name ?? "Member",
      email: payload.email ?? null,
      shareDefault: payload.shareDefault ?? null,
    },
  });

  return NextResponse.json({
    id: member.id,
    name: member.name,
    email: member.email ?? undefined,
    shareDefault: member.shareDefault ?? undefined,
  });
}
