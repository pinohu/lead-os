import { prisma } from "@/lib/db";

async function main() {
  const result = await prisma.directoryListing.updateMany({
    where: { isActive: false },
    data: { isActive: true },
  });
  console.log(`Activated ${result.count} listings`);
  await prisma.$disconnect();
}

main();
