"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password")
      })
    });

    let data: any = {};
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }
    } catch (err) {
      console.error("Gagal mengurai JSON:", err);
    }

    if (!response.ok) {
      setMessage(data.message ?? "Registrasi gagal (terjadi kesalahan pada server/database)");
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="auth-card" onSubmit={onSubmit}>
      <div>
        <p className="eyebrow">O-Points</p>
        <h1>Daftar Akun</h1>
        <p className="muted">Buat akun untuk mulai mengumpulkan token dari kode kemasan.</p>
      </div>

      <label>
        Nama Lengkap
        <input name="name" type="text" placeholder="Nama Anda" required />
      </label>

      <label>
        Email
        <input name="email" type="email" placeholder="nama@email.com" required />
      </label>

      <label>
        Password
        <input name="password" type="password" minLength={8} placeholder="Minimal 8 karakter" required />
      </label>

      {message ? <p className="form-error">{message}</p> : null}

      <button className="primary-button" disabled={isLoading} type="submit">
        {isLoading ? "Memproses..." : "Daftar"}
      </button>

      <p className="muted center">
        Sudah punya akun? <Link href="/login">Masuk</Link>
      </p>
    </form>
  );
}
