-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE', 'FACEBOOK');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
ADD COLUMN     "provider_id" TEXT,
ALTER COLUMN "password" DROP NOT NULL;
