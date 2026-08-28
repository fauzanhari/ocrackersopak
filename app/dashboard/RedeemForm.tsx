"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function RedeemForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: formData.get("code")
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

    setMessage(data.message ?? (response.ok ? "Kode diproses" : "Terjadi kesalahan pada server/database"));
    setIsError(!response.ok);
    setIsLoading(false);

    if (response.ok) {
      form.reset();
      router.refresh();
    }
  }

  return (
    <form className="panel" onSubmit={onSubmit}>
      <h2>Tukar Kode</h2>
      <p className="muted">Masukkan kode unik dari kemasan O-Crackers.</p>
      <label>
        Kode Kemasan
        <input name="code" placeholder="OCR-XXXX-XXXX" required />
      </label>
      {message ? (
        <p className={isError ? "form-error" : "form-success"}>{message}</p>
      ) : null}
      <button className="primary-button" disabled={isLoading} type="submit">
        {isLoading ? "Menukar..." : "Klaim Token"}
      </button>
    </form>
  );
}
