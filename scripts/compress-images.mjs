/**
 * Script kompres gambar di public/ untuk deployment.
 * Mengganti file PNG asli dengan versi terkompresi (WebP lebih kecil).
 * Jalankan: node scripts/compress-images.mjs
 */

import { createReadStream, createWriteStream, statSync } from "fs";
import { readdir, stat } from "fs/promises";
import { join, extname, basename } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Coba load sharp dari node_modules Next.js
let sharp;
try {
  sharp = require("sharp");
} catch {
  // Coba path sharp di Next.js
  try {
    sharp = require(join(process.cwd(), "node_modules", "sharp"));
  } catch {
    console.error("❌ Sharp tidak ditemukan. Install dulu: npm install sharp");
    process.exit(1);
  }
}

const PUBLIC_DIR = join(process.cwd(), "public");
const QUALITY = 80; // 80% quality — balance antara ukuran & kualitas

async function compress() {
  const files = await readdir(PUBLIC_DIR);
  const pngs = files.filter(f => extname(f).toLowerCase() === ".png");

  if (pngs.length === 0) {
    console.log("Tidak ada file PNG di public/");
    return;
  }

  let savedTotal = 0;

  for (const file of pngs) {
    const inputPath = join(PUBLIC_DIR, file);
    const tmpPath = inputPath + ".tmp";

    const originalSize = statSync(inputPath).size;

    try {
      await sharp(inputPath)
        .png({ quality: QUALITY, compressionLevel: 9 })
        .toFile(tmpPath);

      const newSize = statSync(tmpPath).size;

      if (newSize < originalSize) {
        // Ganti file asli dengan yang terkompresi
        const { rename, unlink } = await import("fs/promises");
        await rename(tmpPath, inputPath);
        const saved = originalSize - newSize;
        savedTotal += saved;
        console.log(
          `✅ ${file}: ${(originalSize/1024/1024).toFixed(2)}MB → ${(newSize/1024/1024).toFixed(2)}MB (hemat ${(saved/1024/1024).toFixed(2)}MB)`
        );
      } else {
        // Sudah optimal, hapus tmp
        const { unlink } = await import("fs/promises");
        await unlink(tmpPath);
        console.log(`⚡ ${file}: sudah optimal, tidak diubah.`);
      }
    } catch (err) {
      console.error(`❌ Gagal memproses ${file}:`, err.message);
      // Hapus tmp jika ada
      try { const { unlink } = await import("fs/promises"); await unlink(tmpPath); } catch {}
    }
  }

  console.log(`\n🎉 Total dihemat: ${(savedTotal/1024/1024).toFixed(2)} MB`);
}

compress();
