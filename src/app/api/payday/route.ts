import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/server/session";

export async function GET(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const settings = await prisma.paydaySettings.findUnique({ where: { userId } });
  if (!settings) return NextResponse.json(null);
  return NextResponse.json({
    salaryDay: settings.salaryDay,
    currentBalance: settings.currentBalance,
    buffer: settings.buffer,
    mustPayCategories: settings.mustPayCategories,
  });
}

export async function POST(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const payload = (await req.json()) as {
    salaryDay?: number;
    currentBalance?: number;
    buffer?: number;
    mustPayCategories?: string[];
  };

  if (payload.salaryDay == null || payload.currentBalance == null || payload.buffer == null) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  const settings = await prisma.paydaySettings.upsert({
    where: { userId },
    create: {
      userId,
      salaryDay: payload.salaryDay,
      currentBalance: payload.currentBalance,
      buffer: payload.buffer,
      mustPayCategories: (payload.mustPayCategories ?? []) as any,
    },
    update: {
      salaryDay: payload.salaryDay,
      currentBalance: payload.currentBalance,
      buffer: payload.buffer,
      mustPayCategories: (payload.mustPayCategories ?? []) as any,
    },
  });

  return NextResponse.json({
    salaryDay: settings.salaryDay,
    currentBalance: settings.currentBalance,
    buffer: settings.buffer,
    mustPayCategories: settings.mustPayCategories,
  });
}
