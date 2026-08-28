import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().trim().email("Email tidak valid").max(255),
  password: z.string().min(8, "Password minimal 8 karakter").max(100)
});

export const loginSchema = z.object({
  email: z.string().trim().email("Email tidak valid").max(255),
  password: z.string().min(1, "Password wajib diisi")
});

export const redeemSchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, "Kode terlalu pendek")
    .max(50, "Kode terlalu panjang")
    .transform((value) => value.toUpperCase())
});
