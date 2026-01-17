-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "owner_id" TEXT NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CollectionToRecipe" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CollectionToRecipe_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CollectionToRecipe_B_index" ON "_CollectionToRecipe"("B");

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollectionToRecipe" ADD CONSTRAINT "_CollectionToRecipe_A_fkey" FOREIGN KEY ("A") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollectionToRecipe" ADD CONSTRAINT "_CollectionToRecipe_B_fkey" FOREIGN KEY ("B") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
