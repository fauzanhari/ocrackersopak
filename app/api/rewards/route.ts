import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rewards = await prisma.rewardItem.findMany({
      where: { isActive: true },
      orderBy: { pointCost: "asc" },
    });

    return NextResponse.json({ rewards });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
