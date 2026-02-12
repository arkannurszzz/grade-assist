-- AlterTable
ALTER TABLE "SessionSettings" ALTER COLUMN "modelName" SET DEFAULT 'gemma-3n-e4b-it';

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "errorMessage" TEXT;
