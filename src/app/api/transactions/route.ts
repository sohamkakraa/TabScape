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

  const transactions = await prisma.tabTransaction.findMany({
    where: { tabId },
    orderBy: { date: "desc" },
    include: { tags: true },
  });
  return NextResponse.json(
    transactions.map((t) => ({
      id: t.id,
      tabId: t.tabId,
      date: t.date.toISOString().slice(0, 10),
      merchant: t.merchant,
      memo: t.memo,
      amount: t.amount,
      category: t.category,
      receiptUrl: t.receiptUrl ?? undefined,
      createdAt: t.createdAt.toISOString(),
      type: t.type,
      tags: t.tags.map((tag) => ({
        id: tag.id,
        label: tag.label,
        color: tag.color ?? undefined,
      })),
    }))
  );
}

export async function POST(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const payload = (await req.json()) as {
    tabId?: string;
    date?: string;
    merchant?: string;
    memo?: string;
    amount?: number;
    category?: string;
    receiptUrl?: string;
    type?: "charge" | "refund" | "payment";
    tags?: { label: string; color?: string }[];
  };

  if (!payload.tabId || !payload.merchant || !payload.date || !payload.category) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  const tab = await prisma.tab.findFirst({ where: { id: payload.tabId, userId } });
  if (!tab) return new NextResponse("Not found", { status: 404 });

  const amount = payload.amount ?? 0;
  const signedAmount =
    payload.type === "refund" || payload.type === "payment" ? -Math.abs(amount) : amount;

  const merchantRules = await prisma.rule.findMany({
    where: { userId, type: "merchant" },
  });
  const normalizedMerchant = payload.merchant.toLowerCase();
  const normalizedMemo = (payload.memo ?? "").toLowerCase();
  const matchedRule = merchantRules.find((r) => {
    const ruleMerchant = (r.merchant ?? "").toLowerCase();
    if (!ruleMerchant) return false;
    return normalizedMerchant.includes(ruleMerchant) || normalizedMemo.includes(ruleMerchant);
  });
  const resolvedCategory = matchedRule?.category ?? payload.category;

  await prisma.$transaction(async (tx) => {
    const created = await tx.tabTransaction.create({
      data: {
        tabId: payload.tabId,
        date: new Date(payload.date),
        merchant: payload.merchant,
        memo: payload.memo ?? "",
        amount: signedAmount,
        category: resolvedCategory as any,
        receiptUrl: payload.receiptUrl,
        type: payload.type ?? "charge",
      },
    });

    const tags = payload.tags?.filter((t) => t.label.trim()) ?? [];
    if (tags.length > 0) {
      await tx.transactionTag.createMany({
        data: tags.map((t) => ({
          transactionId: created.id,
          label: t.label.trim(),
          color: t.color ?? null,
        })),
      });
    }

    await tx.tab.update({
      where: { id: payload.tabId },
      data: { currentAmount: tab.currentAmount + signedAmount },
    });

    if (tab.currentAmount + signedAmount >= tab.limit) {
      await tx.notification.create({
        data: {
          userId,
          type: "limit",
          title: "Tab limit reached",
          message: `${tab.name} has reached its limit.`,
        },
      });
    } else if (tab.currentAmount + signedAmount >= tab.limit * 0.9) {
      await tx.notification.create({
        data: {
          userId,
          type: "limit-warning",
          title: "Tab nearing limit",
          message: `${tab.name} is above 90% of its limit.`,
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
