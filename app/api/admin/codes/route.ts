import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Function to generate OCR-XXXX-XXXX formatted random code
function generateRandomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `OCR-${part1}-${part2}`;
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user || !user.isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const codes = await prisma.redeemCode.findMany({
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to recent 100 codes to maintain performance
    });

    return NextResponse.json({ codes });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();

  if (!user || !user.isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { tokenValue, count = 1 } = body;

    if (!tokenValue || isNaN(Number(tokenValue)) || Number(tokenValue) <= 0) {
      return NextResponse.json({ message: "Nilai token harus berupa angka positif" }, { status: 400 });
    }

    const createdCodes: string[] = [];
    const val = Number(tokenValue);
    const loopCount = Math.min(Math.max(Number(count) || 1, 1), 50); // limit batch to max 50

    for (let i = 0; i < loopCount; i++) {
      let unique = false;
      let newCode = "";
      
      // Retry logic in case of collision
      let retries = 0;
      while (!unique && retries < 10) {
        newCode = generateRandomCode();
        const existing = await prisma.redeemCode.findUnique({
          where: { code: newCode },
        });
        if (!existing) {
          unique = true;
        }
        retries++;
      }

      if (!unique) {
        throw new Error("Gagal membuat kode unik setelah beberapa percobaan.");
      }

      await prisma.redeemCode.create({
        data: {
          code: newCode,
          tokenValue: val,
        },
      });

      createdCodes.push(newCode);
    }

    return NextResponse.json({ message: "Kode redeem berhasil dibuat", codes: createdCodes });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
