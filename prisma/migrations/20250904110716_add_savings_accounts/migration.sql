/*
  Warnings:

  - You are about to drop the column `field` on the `categorization_rules` table. All the data in the column will be lost.
  - You are about to drop the column `operator` on the `categorization_rules` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `categorization_rules` table. All the data in the column will be lost.
  - Added the required column `pattern` to the `categorization_rules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ruleType` to the `categorization_rules` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."SavingsAccountType" AS ENUM ('EMERGENCY_FUND', 'INVESTMENT_ACCOUNT', 'RETIREMENT_ACCOUNT', 'HIGH_YIELD_SAVINGS', 'OTHER');

-- AlterEnum
ALTER TYPE "public"."CategoryType" ADD VALUE 'OMIT';

-- AlterTable
ALTER TABLE "public"."categorization_rules" DROP COLUMN "field",
DROP COLUMN "operator",
DROP COLUMN "value",
ADD COLUMN     "pattern" TEXT NOT NULL,
ADD COLUMN     "ruleType" TEXT NOT NULL,
ALTER COLUMN "categoryId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."savings_accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."SavingsAccountType" NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "goalAmount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "savings_accounts_pkey" PRIMARY KEY ("id")
);
