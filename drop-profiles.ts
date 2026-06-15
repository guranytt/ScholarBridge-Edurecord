import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "public"."profiles" CASCADE;`);
  console.log("Dropped profiles table.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
