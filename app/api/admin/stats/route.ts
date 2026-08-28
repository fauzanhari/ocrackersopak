import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();

  if (!user || !user.isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const totalUsers = await prisma.user.count();
    
    const sumResult = await prisma.user.aggregate({
      _sum: {
        tokenBalance: true,
      },
    });
    const totalTokenBalance = sumResult._sum.tokenBalance ?? 0;

    const totalRedeemCodes = await prisma.redeemCode.count();
    const totalRedeemedCodes = await prisma.redeemCode.count({
      where: { isRedeemed: true },
    });

    return NextResponse.json({
      totalUsers,
      totalTokenBalance,
      totalRedeemCodes,
      totalRedeemedCodes,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
