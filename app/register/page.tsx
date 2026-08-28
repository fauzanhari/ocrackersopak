import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <main className="auth-shell">
      <Link className="back-link" href="/">
        Kembali ke beranda
      </Link>
      <RegisterForm />
    </main>
  );
}
