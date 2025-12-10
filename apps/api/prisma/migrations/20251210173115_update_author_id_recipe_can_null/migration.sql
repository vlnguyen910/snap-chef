-- DropForeignKey
ALTER TABLE "Recipe" DROP CONSTRAINT "Recipe_author_id_fkey";

-- AlterTable
ALTER TABLE "Recipe" ALTER COLUMN "author_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
