-- CreateTable
CREATE TABLE "hiding_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hiding_rules_pkey" PRIMARY KEY ("id")
);

-- Add comment
COMMENT ON TABLE "hiding_rules" IS 'Rules for automatically hiding transactions based on patterns';