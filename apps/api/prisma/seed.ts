import { faker } from '@faker-js/faker';
import { PrismaClient } from '../src/generated/prisma/client';
import type { User, Recipe } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'

// 1. Setup the Postgres driver
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });

const prisma = new PrismaClient({adapter});

async function main() {
  console.log('🌱 Starting seeding...');

  // 1. DỌN DẸP DB (Xóa dữ liệu cũ để tránh trùng lặp)
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.step.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned up database');

  // 2. TẠO USERS
  const users: User[] = [];
  const passwordHash = '$argon2id$v=19$m=65536,t=3,p=4$VV6tfD8Z4G5IK0CJXWFOXQ$hDlaheVA2vJ7I8Svl9TKHwvMjrK4dERSjqnY2LHizxU'; 
  const numberOfUsers = 100;
  
  for (let i = 0; i < numberOfUsers; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        username: faker.internet.username(),
        password: passwordHash,
        avatar_url: faker.image.avatar(),
        bio: faker.person.bio(),
        role: 'USER',
      },
    });
    users.push(user);
  }
  console.log(`👤 Created ${users.length} users`);

  // 3. TẠO RECIPES & TƯƠNG TÁC
  const recipes: Recipe[] = [];
  for (const user of users) {
    for (let j = 0; j < 5; j++) {
      // Tạo ingredient names khác nhau
      let ingredientName1 = faker.food.ingredient().toLowerCase();
      let ingredientName2 = faker.food.ingredient().toLowerCase();
      
      // Đảm bảo 2 ingredient khác nhau
      while (ingredientName2 === ingredientName1) {
        ingredientName2 = faker.food.ingredient().toLowerCase();
      }

      const ingredient1 = await prisma.ingredient.upsert({
        where: { name: ingredientName1 },
        update: {},
        create: { name: ingredientName1 },
      });
      const ingredient2 = await prisma.ingredient.upsert({
        where: { name: ingredientName2 },
        update: {},
        create: { name: ingredientName2 },
      });

      const recipe = await prisma.recipe.create({
        data: {
          title: faker.food.dish(),
          description: faker.lorem.paragraph(),
          cooking_time: faker.number.int({ min: 15, max: 120 }),
          servings: faker.number.int({ min: 1, max: 6 }),
          thumbnail_url: faker.image.url(),
          author_id: user.id,
          status: 'PUBLISHED',
          ingredients: {
            create: [
              { ingredient_id: ingredient1.id, quantity: 200, unit: 'g' },
              { ingredient_id: ingredient2.id, quantity: 1, unit: 'tsp' },
            ],
          },
          steps: {
            create: [
              { order_index: 1, content: faker.lorem.sentence() },
              { order_index: 2, content: faker.lorem.sentence() },
            ],
          },
        },
      });
      recipes.push(recipe);

      // Random Likes
      const randomUsers = users.filter(() => Math.random() > 0.5);
      for (const liker of randomUsers) {
        await prisma.like.create({
          data: { user_id: liker.id, recipe_id: recipe.id }
        });
      }

      // Random Comments
      for (let k = 0; k < 3; k++) {
        const randomUser = users[Math.floor(Math.random() * users.length)]!;
        await prisma.comment.create({
          data: {
            content: faker.lorem.sentence(),
            user_id: randomUser.id,
            recipe_id: recipe.id,
            rating: faker.number.int({ min: 1, max: 5 }),
          }
        });
      }
    }
  }
  console.log(`🍲 Created ${recipes.length} recipes with likes & comments`);

  // 4. TẠO FOLLOW
  const mainUser = users[0]!;
  for (let i = 1; i < users.length; i++) {
    const followingUser = users[i]!;
    await prisma.follow.create({
      data: {
        follower_id: mainUser.id,
        following_id: followingUser.id
      }
    });
  }
  console.log('🤝 Created follow relationships');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });