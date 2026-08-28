import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RewardExchangeStatus } from "@prisma/client";

export async function GET() {
  const user = await getCurrentUser();

  if (!user || !user.isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const exchanges = await prisma.rewardExchange.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, email: true, name: true } },
        rewardItem: { select: { id: true, name: true, pointCost: true } },
      },
    });

    return NextResponse.json({ exchanges });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user || !user.isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { exchangeId, status, adminNote } = body;

    if (!exchangeId || !status) {
      return NextResponse.json({ message: "exchangeId dan status wajib diisi" }, { status: 400 });
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ message: "Status tidak valid" }, { status: 400 });
    }

    const exchange = await prisma.rewardExchange.findUnique({
      where: { id: exchangeId },
      include: { rewardItem: true },
    });

    if (!exchange) {
      return NextResponse.json({ message: "Request tidak ditemukan" }, { status: 404 });
    }

    if (exchange.status !== "PENDING") {
      return NextResponse.json(
        { message: "Request ini sudah diproses sebelumnya" },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.rewardExchange.update({
        where: { id: exchangeId },
        data: {
          status: status as RewardExchangeStatus,
          adminNote: adminNote?.trim() || null,
        },
      });

      // Jika ditolak, kembalikan poin ke user
      if (status === "REJECTED") {
        await tx.user.update({
          where: { id: exchange.userId },
          data: { tokenBalance: { increment: exchange.pointsSpent } },
        });

        // Tambah stok kembali jika bukan unlimited
        if (exchange.rewardItem.stock !== -1) {
          await tx.rewardItem.update({
            where: { id: exchange.rewardItemId },
            data: { stock: { increment: 1 } },
          });
        }

        // Catat pengembalian poin
        await tx.tokenTransaction.create({
          data: {
            userId: exchange.userId,
            amount: exchange.pointsSpent,
            type: "ADJUSTMENT",
            note: `Pengembalian poin: ${exchange.rewardItem.name} (request ditolak)`,
          },
        });
      }
    });

    return NextResponse.json({
      message: `Request berhasil ${status === "APPROVED" ? "disetujui" : "ditolak"}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
