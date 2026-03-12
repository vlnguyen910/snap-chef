/*
  Warnings:

  - The `status` column on the `Report` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'REPORT';

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_handler_id_fkey";

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "status",
ADD COLUMN     "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "handler_id" DROP NOT NULL;

-- DropEnum
DROP TYPE "ReportSatus";

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_handler_id_fkey" FOREIGN KEY ("handler_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
