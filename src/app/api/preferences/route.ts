import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/server/session";

export async function GET(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const prefs = await prisma.userPreference.findUnique({ where: { userId } });
  if (!prefs) {
    return NextResponse.json({
      dashboardLayout: "cards",
      currency: "EUR",
      location: "Berlin, DE",
      theme: "light",
    });
  }

  return NextResponse.json({
    dashboardLayout: prefs.dashboardLayout,
    currency: prefs.currency,
    location: prefs.location,
    theme: prefs.theme,
  });
}

export async function POST(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const payload = (await req.json()) as {
    dashboardLayout?: string;
    currency?: string;
    location?: string;
    theme?: string;
  };

  const prefs = await prisma.userPreference.upsert({
    where: { userId },
    create: {
      userId,
      dashboardLayout: payload.dashboardLayout ?? "cards",
      currency: payload.currency ?? "EUR",
      location: payload.location ?? "Berlin, DE",
      theme: payload.theme ?? "light",
    },
    update: {
      dashboardLayout: payload.dashboardLayout ?? "cards",
      currency: payload.currency ?? "EUR",
      location: payload.location ?? "Berlin, DE",
      theme: payload.theme ?? "light",
    },
  });

  return NextResponse.json({
    dashboardLayout: prefs.dashboardLayout,
    currency: prefs.currency,
    location: prefs.location,
    theme: prefs.theme,
  });
}
