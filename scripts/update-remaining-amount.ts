import { prisma } from "../lib/prisma";

async function updateRemainingAmount() {
  console.log("Updating SellerRequest remainingAmount...");
  const sellers = await prisma.sellerRequest.findMany();
  for (const seller of sellers) {
    await prisma.sellerRequest.update({
      where: { id: seller.id },
      data: { remainingAmount: seller.amount },
    });
  }
  console.log(`Updated ${sellers.length} seller requests`);

  console.log("Updating BuyerRequest remainingAmount...");
  const buyers = await prisma.buyerRequest.findMany();
  for (const buyer of buyers) {
    await prisma.buyerRequest.update({
      where: { id: buyer.id },
      data: { remainingAmount: buyer.amount },
    });
  }
  console.log(`Updated ${buyers.length} buyer requests`);

  console.log("Done!");
}

updateRemainingAmount()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
