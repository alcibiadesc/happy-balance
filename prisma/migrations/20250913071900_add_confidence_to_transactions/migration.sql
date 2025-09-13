-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "confidence" INTEGER;

-- Add comment
COMMENT ON COLUMN "transactions"."confidence" IS 'Confidence score for automatic categorization (0-100)';