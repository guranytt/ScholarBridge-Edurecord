import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:/app/applet/prisma/dev.db"
    }
  }
});

async function main() {
  await prisma.$connect();
  const users = await prisma.user.findMany();
  console.log("Connected successfully! Found users:", users.length);
  console.log("First user email:", users[0]?.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
