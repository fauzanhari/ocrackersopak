import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();

  if (!user || !user.isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const rewards = await prisma.rewardItem.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { exchanges: true } },
      },
    });

    return NextResponse.json({ rewards });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || !user.isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, pointCost, stock, imageUrl } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ message: "Nama reward wajib diisi" }, { status: 400 });
    }

    if (typeof pointCost !== "number" || pointCost < 1) {
      return NextResponse.json({ message: "Biaya poin harus lebih dari 0" }, { status: 400 });
    }

    const reward = await prisma.rewardItem.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        pointCost,
        stock: typeof stock === "number" ? stock : -1,
        imageUrl: imageUrl?.trim() || null,
        isActive: true,
      },
    });

    return NextResponse.json({ message: "Reward berhasil dibuat", reward }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
