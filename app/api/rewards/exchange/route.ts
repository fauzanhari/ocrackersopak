import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TokenTransactionType } from "@prisma/client";

export async function POST(request: Request) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { message: "Silakan login terlebih dahulu" },
      { status: 401 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Request body tidak valid" }, { status: 400 });
  }

  const { rewardItemId, userNote } = body;

  if (!rewardItemId || typeof rewardItemId !== "string") {
    return NextResponse.json({ message: "ID reward tidak valid" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Ambil reward
      const reward = await tx.rewardItem.findUnique({
        where: { id: rewardItemId },
      });

      if (!reward) {
        throw new Error("REWARD_NOT_FOUND");
      }

      if (!reward.isActive) {
        throw new Error("REWARD_INACTIVE");
      }

      // Cek stok (stock -1 = unlimited)
      if (reward.stock !== -1 && reward.stock <= 0) {
        throw new Error("REWARD_OUT_OF_STOCK");
      }

      // Ambil user & cek saldo
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { tokenBalance: true },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      if (user.tokenBalance < reward.pointCost) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      // Kurangi saldo user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { tokenBalance: { decrement: reward.pointCost } },
        select: { tokenBalance: true },
      });

      // Kurangi stok jika bukan unlimited
      if (reward.stock !== -1) {
        await tx.rewardItem.update({
          where: { id: rewardItemId },
          data: { stock: { decrement: 1 } },
        });
      }

      // Catat exchange
      const exchange = await tx.rewardExchange.create({
        data: {
          userId,
          rewardItemId,
          pointsSpent: reward.pointCost,
          userNote: typeof userNote === "string" ? userNote.trim() : null,
          status: "PENDING",
        },
      });

      // Catat transaksi token (negatif)
      await tx.tokenTransaction.create({
        data: {
          userId,
          amount: -reward.pointCost,
          type: TokenTransactionType.REWARD_EXCHANGE,
          note: `Penukaran reward: ${reward.name}`,
        },
      });

      return {
        exchangeId: exchange.id,
        rewardName: reward.name,
        pointsSpent: reward.pointCost,
        newBalance: updatedUser.tokenBalance,
      };
    });

    return NextResponse.json({
      message: `Berhasil menukar ${result.pointsSpent} poin dengan ${result.rewardName}! Harap tunggu konfirmasi dari admin.`,
      ...result,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    const errorMap: Record<string, [string, number]> = {
      REWARD_NOT_FOUND: ["Reward tidak ditemukan", 404],
      REWARD_INACTIVE: ["Reward tidak lagi tersedia", 400],
      REWARD_OUT_OF_STOCK: ["Stok reward sudah habis", 400],
      USER_NOT_FOUND: ["User tidak ditemukan", 404],
      INSUFFICIENT_BALANCE: ["Saldo poin tidak mencukupi", 400],
    };

    if (msg in errorMap) {
      const [message, status] = errorMap[msg];
      return NextResponse.json({ message }, { status });
    }

    return NextResponse.json({ message: "Gagal menukar reward" }, { status: 500 });
  }
}
