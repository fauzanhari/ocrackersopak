import { TokenTransactionType } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redeemSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { message: "Silakan login terlebih dahulu" },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = redeemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Kode tidak valid" },
      { status: 400 }
    );
  }

  const { code } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const redeemCode = await tx.redeemCode.findUnique({
        where: { code }
      });

      if (!redeemCode) {
        throw new Error("NOT_FOUND");
      }

      if (redeemCode.isRedeemed) {
        throw new Error("ALREADY_REDEEMED");
      }

      await tx.redeemCode.update({
        where: { id: redeemCode.id },
        data: {
          isRedeemed: true,
          redeemedAt: new Date(),
          redeemedBy: userId
        }
      });

      const user = await tx.user.update({
        where: { id: userId },
        data: {
          tokenBalance: {
            increment: redeemCode.tokenValue
          }
        },
        select: {
          tokenBalance: true
        }
      });

      await tx.redemption.create({
        data: {
          userId,
          codeId: redeemCode.id,
          tokenGain: redeemCode.tokenValue
        }
      });

      await tx.tokenTransaction.create({
        data: {
          userId,
          amount: redeemCode.tokenValue,
          type: TokenTransactionType.REDEEM_CODE,
          note: `Redeem kode ${code}`
        }
      });

      return {
        tokenGain: redeemCode.tokenValue,
        tokenBalance: user.tokenBalance
      };
    });

    return NextResponse.json({
      message: `Berhasil menukar kode. +${result.tokenGain} token`,
      ...result
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json(
        { message: "Kode tidak ditemukan" },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message === "ALREADY_REDEEMED") {
      return NextResponse.json(
        { message: "Kode sudah pernah digunakan" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Gagal menukar kode" },
      { status: 500 }
    );
  }
}
