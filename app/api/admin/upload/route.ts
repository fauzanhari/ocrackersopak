import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";

// Max 5 MB
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  // Admin only
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "Tidak ada file yang dikirim." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: "Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { message: "Ukuran file terlalu besar. Maksimal 5 MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Buat nama file unik: timestamp + nama asli yang di-sanitasi
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Pastikan folder public/uploads ada
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filePath = join(uploadDir, safeName);
    await writeFile(filePath, buffer);

    // Return URL relatif yang bisa diakses browser
    const publicUrl = `/uploads/${safeName}`;
    return NextResponse.json({ url: publicUrl, message: "Upload berhasil!" });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ message: "Terjadi kesalahan saat mengupload." }, { status: 500 });
  }
}
