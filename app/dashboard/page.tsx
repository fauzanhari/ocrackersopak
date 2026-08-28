import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "./LogoutButton";
import { RedeemForm } from "./RedeemForm";
import { RewardList } from "./RewardList";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.isAdmin) {
    redirect("/admin");
  }

  const transactions = await prisma.tokenTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  let rewards = await prisma.rewardItem.findMany({
    where: { isActive: true },
    orderBy: { pointCost: "asc" },
  });

  // Jika belum ada reward di database, buat reward default otomatis
  if (rewards.length === 0) {
    await prisma.rewardItem.createMany({
      data: [
        {
          name: "Paket O-Crackers Sate Tanjung (1 Pack)",
          description: "1 Kemasan Opak-Opak Ambon Rasa Sate Tanjung khas Lombok (100g)",
          pointCost: 100,
          stock: 50,
          isActive: true,
        },
        {
          name: "Gantungan Kunci Eksklusif O-Crackers",
          description: "Gantungan kunci akrilik edisi spesial O-Crackers Lombok",
          pointCost: 150,
          stock: 30,
          isActive: true,
        },
        {
          name: "Paket Combo Hemat O-Crackers (3 Pack)",
          description: "Paket 3 bungkus Opak-Opak Ambon renyah gurih",
          pointCost: 250,
          stock: 25,
          isActive: true,
        },
        {
          name: "Voucher Diskon Belanja Rp 50.000",
          description: "Voucher potongan harga Rp 50.000 untuk pembelian berikutnya",
          pointCost: 400,
          stock: -1,
          isActive: true,
        },
        {
          name: "T-Shirt Premium O-Crackers Lombok",
          description: "Kaos distro bahan Cotton Combed 30s edisi khusus O-Crackers",
          pointCost: 500,
          stock: 10,
          isActive: true,
        },
      ],
    });

    rewards = await prisma.rewardItem.findMany({
      where: { isActive: true },
      orderBy: { pointCost: "asc" },
    });
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <Link className="back-link" href="/">
            O-Crackers
          </Link>
          <h1>Dashboard Token</h1>
          <p className="muted">{user.email}</p>
        </div>
        <LogoutButton />
      </header>

      <section className="dashboard-grid">
        <div className="token-card">
          <p className="eyebrow">Saldo Token</p>
          <strong>{user.tokenBalance.toLocaleString("id-ID")}</strong>
          <span>Token tersedia</span>
        </div>

        <RedeemForm />
      </section>

      <RewardList rewards={rewards} userBalance={user.tokenBalance} />

      <section className="panel">
        <h2>Riwayat Token</h2>
        {transactions.length ? (
          <div className="history-list">
            {transactions.map((transaction) => (
              <div className="history-row" key={transaction.id}>
                <div>
                  <strong>{transaction.note ?? transaction.type}</strong>
                  <span>
                    {new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(transaction.createdAt)}
                  </span>
                </div>
                <b className={transaction.amount >= 0 ? "positive" : "negative"}>
                  {transaction.amount >= 0 ? "+" : ""}
                  {transaction.amount.toLocaleString("id-ID")}
                </b>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">Belum ada transaksi token.</p>
        )}
      </section>
    </main>
  );
}
