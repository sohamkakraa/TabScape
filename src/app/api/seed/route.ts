import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function monthString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function POST() {
  const users = await prisma.user.findMany({ take: 1 });
  if (users.length > 0) {
    return NextResponse.json({ ok: true, seeded: false });
  }

  const demo = await prisma.user.create({
    data: { email: "demo@tabscape.local", password: "demo123" },
  });

  const tabs = await prisma.tab.createMany({
    data: [
      {
        userId: demo.id,
        name: "Monthly groceries",
        merchant: "Local Supermarket",
        category: "Groceries",
        dueDay: 30,
        limit: 240,
        currentAmount: 138.4,
        status: "open",
      },
      {
        userId: demo.id,
        name: "Food delivery",
        merchant: "Delivery App",
        category: "FoodDelivery",
        dueDay: 30,
        limit: 140,
        currentAmount: 58.3,
        status: "open",
      },
      {
        userId: demo.id,
        name: "Utilities",
        merchant: "Energy Provider",
        category: "Utilities",
        dueDay: 28,
        limit: 210,
        currentAmount: 152.1,
        status: "open",
      },
      {
        userId: demo.id,
        name: "Rent",
        merchant: "Landlord",
        category: "Rent",
        dueDay: 1,
        limit: 1100,
        currentAmount: 980,
        status: "open",
      },
      {
        userId: demo.id,
        name: "Gym + Wellness",
        merchant: "Fitness Club",
        category: "Other",
        dueDay: 15,
        limit: 90,
        currentAmount: 45,
        status: "open",
      },
      {
        userId: demo.id,
        name: "Streaming bundle",
        merchant: "StreamCo",
        category: "Other",
        dueDay: 20,
        limit: 30,
        currentAmount: 19.99,
        status: "open",
      },
    ],
  });

  const tabList = await prisma.tab.findMany({ where: { userId: demo.id } });
  const byCategory = Object.fromEntries(tabList.map((t) => [t.category, t]));

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const minusDays = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  };

  const txData = [
    {
      tabId: byCategory.Groceries?.id,
      date: dateStr,
      merchant: "Local Supermarket",
      memo: "Weekly haul",
      amount: 54.2,
      category: "Groceries",
    },
    {
      tabId: byCategory.Groceries?.id,
      date: minusDays(3),
      merchant: "Local Supermarket",
      memo: "Fresh produce",
      amount: 31.7,
      category: "Groceries",
    },
    {
      tabId: byCategory.Groceries?.id,
      date: dateStr,
      merchant: "Local Supermarket",
      memo: "Midweek top-up",
      amount: 28.1,
      category: "Groceries",
    },
    {
      tabId: byCategory.Groceries?.id,
      date: minusDays(10),
      merchant: "Local Supermarket",
      memo: "Household essentials",
      amount: 44.6,
      category: "Groceries",
    },
    {
      tabId: byCategory.FoodDelivery?.id,
      date: dateStr,
      merchant: "Delivery App",
      memo: "Dinner + delivery fee",
      amount: 22.9,
      category: "FoodDelivery",
    },
    {
      tabId: byCategory.FoodDelivery?.id,
      date: minusDays(6),
      merchant: "Delivery App",
      memo: "Lunch delivery",
      amount: 16.4,
      category: "FoodDelivery",
    },
    {
      tabId: byCategory.FoodDelivery?.id,
      date: minusDays(12),
      merchant: "Delivery App",
      memo: "Late-night snacks",
      amount: 14.2,
      category: "FoodDelivery",
    },
    {
      tabId: byCategory.FoodDelivery?.id,
      date: minusDays(8),
      merchant: "Delivery App",
      memo: "Order adjustment refund",
      amount: -6.5,
      category: "FoodDelivery",
      type: "refund",
    },
    {
      tabId: byCategory.Utilities?.id,
      date: dateStr,
      merchant: "Energy Provider",
      memo: "Monthly bill",
      amount: 152.1,
      category: "Utilities",
    },
    {
      tabId: byCategory.Utilities?.id,
      date: minusDays(30),
      merchant: "Energy Provider",
      memo: "Previous cycle",
      amount: 138.6,
      category: "Utilities",
    },
    {
      tabId: byCategory.Rent?.id,
      date: dateStr,
      merchant: "Landlord",
      memo: "Rent for this month",
      amount: 980,
      category: "Rent",
    },
    {
      tabId: byCategory.Rent?.id,
      date: minusDays(31),
      merchant: "Landlord",
      memo: "Last month",
      amount: 980,
      category: "Rent",
    },
    {
      tabId: byCategory.Other?.id,
      date: dateStr,
      merchant: "Fitness Club",
      memo: "Wellness membership",
      amount: 45,
      category: "Other",
    },
    {
      tabId: byCategory.Other?.id,
      date: minusDays(14),
      merchant: "StreamCo",
      memo: "Monthly subscription",
      amount: 19.99,
      category: "Other",
    },
  ].filter((t) => t.tabId);

  if (txData.length > 0) {
    await prisma.tabTransaction.createMany({
      data: txData.map((t) => ({
        ...t,
        tabId: t.tabId as string,
        date: new Date(t.date),
        amount: t.amount,
      })),
    });
  }

  const series = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const amount = 980 + (6 - i) * 32 + (i % 2 === 0 ? 60 : -15);
    series.push({
      userId: demo.id,
      month: monthString(d),
      amount: Math.max(0, Math.round(amount * 100) / 100),
    });
  }
  await prisma.expensePoint.createMany({ data: series });

  await prisma.rule.createMany({
    data: [
      {
        userId: demo.id,
        type: "merchant",
        merchant: "Energy Provider",
        category: "Utilities",
      },
      {
        userId: demo.id,
        type: "merchant",
        merchant: "Delivery App",
        category: "FoodDelivery",
      },
      {
        userId: demo.id,
        type: "recurring",
        title: "Rent due on the 1st",
        category: "Rent",
        dueDay: 1,
        amount: 980,
        mustPay: true,
        rangeLow: 980,
        rangeHigh: 980,
      },
      {
        userId: demo.id,
        type: "recurring",
        title: "Utilities (variable)",
        category: "Utilities",
        dueDay: 28,
        amount: 160,
        mustPay: true,
        rangeLow: 130,
        rangeHigh: 210,
      },
    ],
  });

  await prisma.paydaySettings.create({
    data: {
      userId: demo.id,
      salaryDay: 25,
      currentBalance: 2400,
      buffer: 200,
      mustPayCategories: ["Rent", "Utilities"],
    },
  });
  await prisma.userPreference.create({
    data: {
      userId: demo.id,
      dashboardLayout: "cards",
      currency: "EUR",
      location: "Berlin, DE",
      theme: "light",
    },
  });
  const household = await prisma.household.create({
    data: {
      ownerId: demo.id,
      name: "Apartment 4B",
    },
  });
  const members = await prisma.householdMember.createMany({
    data: [
      { householdId: household.id, name: "Soham", email: "soham@tabscape.local", shareDefault: 50 },
      { householdId: household.id, name: "Alex", email: "alex@tabscape.local", shareDefault: 50 },
    ],
  });

  const memberList = await prisma.householdMember.findMany({
    where: { householdId: household.id },
  });
  const [m1, m2] = memberList;

  const rentTab = tabList.find((t) => t.category === "Rent");
  const utilitiesTab = tabList.find((t) => t.category === "Utilities");
  if (rentTab && m1 && m2) {
    await prisma.tabShare.createMany({
      data: [
        { tabId: rentTab.id, memberId: m1.id, sharePercent: 50, shareAmount: 490 },
        { tabId: rentTab.id, memberId: m2.id, sharePercent: 50, shareAmount: 490 },
      ],
    });
  }
  if (utilitiesTab && m1 && m2) {
    await prisma.tabShare.createMany({
      data: [
        { tabId: utilitiesTab.id, memberId: m1.id, sharePercent: 60, shareAmount: 95 },
        { tabId: utilitiesTab.id, memberId: m2.id, sharePercent: 40, shareAmount: 64 },
      ],
    });
  }

  await prisma.incomeSchedule.createMany({
    data: [
      { userId: demo.id, label: "Main salary", dayOfMonth: 25, amount: 3200 },
      { userId: demo.id, label: "Side contract", dayOfMonth: 12, amount: 750 },
    ],
  });

  return NextResponse.json({ ok: true, seeded: true });
}

export async function GET() {
  return POST();
}
