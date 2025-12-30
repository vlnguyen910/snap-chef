-- CreateTable
CREATE TABLE "Like" (
    "user_id" TEXT NOT NULL,
    "recipe_id" INTEGER NOT NULL,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("user_id","recipe_id")
);

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
