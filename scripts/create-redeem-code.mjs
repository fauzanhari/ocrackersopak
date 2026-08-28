import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const [, , rawCode, rawTokenValue] = process.argv;

if (!rawCode || !rawTokenValue) {
  console.error("Usage: npm run code:create -- OCR-XXXX-XXXX 100");
  process.exit(1);
}

const code = rawCode.trim().toUpperCase();
const tokenValue = Number.parseInt(rawTokenValue, 10);

if (!Number.isInteger(tokenValue) || tokenValue <= 0) {
  console.error("Token value harus berupa angka positif.");
  process.exit(1);
}

try {
  const redeemCode = await prisma.redeemCode.create({
    data: {
      code,
      tokenValue
    }
  });

  console.log(`Kode ${redeemCode.code} dibuat dengan nilai ${redeemCode.tokenValue} token.`);
} finally {
  await prisma.$disconnect();
}
