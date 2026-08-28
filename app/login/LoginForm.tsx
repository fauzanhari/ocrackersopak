"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
      setMessage(data.message ?? "Login gagal (terjadi kesalahan pada server/database)");
      setIsLoading(false);
      return;
    }

    if (data.user && data.user.isAdmin) {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  }

  return (
    <form className="auth-card" onSubmit={onSubmit}>
      <div>
        <p className="eyebrow">O-Crackers Account</p>
        <h1>Masuk</h1>
        <p className="muted">Masuk untuk melihat token dan menukarkan kode kemasan.</p>
      </div>

      <label>
        Email
        <input name="email" type="email" placeholder="nama@email.com" required />
      </label>

      <label>
        Password
        <input name="password" type="password" placeholder="Minimal 8 karakter" required />
      </label>

      {message ? <p className="form-error">{message}</p> : null}

      <button className="primary-button" disabled={isLoading} type="submit">
        {isLoading ? "Memproses..." : "Masuk"}
      </button>

      <p className="muted center">
        Belum punya akun? <Link href="/register">Daftar</Link>
      </p>
    </form>
  );
}
