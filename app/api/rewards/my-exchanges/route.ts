import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { message: "Silakan login terlebih dahulu" },
      { status: 401 }
    );
  }

  try {
    const myExchanges = await prisma.rewardExchange.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        rewardItem: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ exchanges: myExchanges });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
