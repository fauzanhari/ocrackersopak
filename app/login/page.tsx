import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <Link className="back-link" href="/">
        Kembali ke beranda
      </Link>
      <LoginForm />
    </main>
  );
}
