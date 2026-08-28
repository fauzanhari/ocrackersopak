import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || !user.isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, pointCost, stock, isActive, imageUrl } = body;

    const existing = await prisma.rewardItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ message: "Reward tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.rewardItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(pointCost !== undefined && { pointCost }),
        ...(stock !== undefined && { stock }),
        ...(isActive !== undefined && { isActive }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl?.trim() || null }),
      },
    });

    return NextResponse.json({ message: "Reward berhasil diperbarui", reward: updated });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || !user.isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const existing = await prisma.rewardItem.findUnique({
      where: { id },
      include: { _count: { select: { exchanges: true } } },
    });

    if (!existing) {
      return NextResponse.json({ message: "Reward tidak ditemukan" }, { status: 404 });
    }

    if (existing._count.exchanges > 0) {
      // Jika ada exchange, nonaktifkan saja daripada menghapus
      await prisma.rewardItem.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: "Reward dinonaktifkan (ada riwayat penukaran yang tertaut)",
      });
    }

    await prisma.rewardItem.delete({ where: { id } });

    return NextResponse.json({ message: "Reward berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
