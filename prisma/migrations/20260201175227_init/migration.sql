-- CreateEnum
CREATE TYPE "TabStatus" AS ENUM ('open', 'closed');

-- CreateEnum
CREATE TYPE "TabCategory" AS ENUM ('Groceries', 'FoodDelivery', 'Utilities', 'Rent', 'Other');

-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('merchant', 'recurring');

-- CreateEnum
CREATE TYPE "TxType" AS ENUM ('charge', 'refund', 'payment');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tab" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "merchant" TEXT NOT NULL,
    "category" "TabCategory" NOT NULL,
    "dueDay" INTEGER NOT NULL,
    "limit" DOUBLE PRECISION NOT NULL,
    "currentAmount" DOUBLE PRECISION NOT NULL,
    "status" "TabStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TabTransaction" (
    "id" TEXT NOT NULL,
    "tabId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "merchant" TEXT NOT NULL,
    "memo" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" "TabCategory" NOT NULL,
    "receiptUrl" TEXT,
    "type" "TxType" NOT NULL DEFAULT 'charge',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TabTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpensePoint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpensePoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "RuleType" NOT NULL,
    "merchant" TEXT,
    "title" TEXT,
    "category" "TabCategory" NOT NULL,
    "dueDay" INTEGER,
    "amount" DOUBLE PRECISION,
    "mustPay" BOOLEAN NOT NULL DEFAULT false,
    "rangeLow" DOUBLE PRECISION,
    "rangeHigh" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaydaySettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "salaryDay" INTEGER NOT NULL,
    "currentBalance" DOUBLE PRECISION NOT NULL,
    "buffer" DOUBLE PRECISION NOT NULL,
    "mustPayCategories" "TabCategory"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaydaySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PaydaySettings_userId_key" ON "PaydaySettings"("userId");

-- AddForeignKey
ALTER TABLE "Tab" ADD CONSTRAINT "Tab_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabTransaction" ADD CONSTRAINT "TabTransaction_tabId_fkey" FOREIGN KEY ("tabId") REFERENCES "Tab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpensePoint" ADD CONSTRAINT "ExpensePoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaydaySettings" ADD CONSTRAINT "PaydaySettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
