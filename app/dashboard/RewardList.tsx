"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface RewardItem {
  id: string;
  name: string;
  description: string | null;
  pointCost: number;
  stock: number;
  imageUrl: string | null;
}

interface MyExchange {
  id: string;
  pointsSpent: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  userNote: string | null;
  adminNote: string | null;
  createdAt: string;
  rewardItem: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
}

interface RewardListProps {
  rewards: RewardItem[];
  userBalance: number;
}

export function RewardList({ rewards, userBalance }: RewardListProps) {
  const router = useRouter();
  const [activeSubTab, setActiveSubTab] = useState<"catalog" | "my_exchanges">("catalog");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [confirmReward, setConfirmReward] = useState<RewardItem | null>(null);
  const [userNote, setUserNote] = useState("");
  const [myExchanges, setMyExchanges] = useState<MyExchange[]>([]);
  const [loadingExchanges, setLoadingExchanges] = useState(false);

  const fetchMyExchanges = useCallback(async () => {
    setLoadingExchanges(true);
    try {
      const res = await fetch("/api/rewards/my-exchanges");
      if (res.ok) {
        const data = await res.json();
        setMyExchanges(data.exchanges);
      }
    } catch {}
    setLoadingExchanges(false);
  }, []);

  useEffect(() => {
    fetchMyExchanges();
  }, [fetchMyExchanges]);

  const handleExchange = async (reward: RewardItem) => {
    setLoading(reward.id);
    setMessage("");
    setIsError(false);

    try {
      const res = await fetch("/api/rewards/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardItemId: reward.id,
          userNote: userNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      setMessage(data.message ?? (res.ok ? "Berhasil ditukar" : "Terjadi kesalahan"));
      setIsError(!res.ok);

      if (res.ok) {
        setConfirmReward(null);
        setUserNote("");
        fetchMyExchanges();
        router.refresh();
      }
    } catch {
      setMessage("Terjadi kesalahan sistem");
      setIsError(true);
    } finally {
      setLoading(null);
    }
  };

  const pendingCount = myExchanges.filter((e) => e.status === "PENDING").length;

  return (
    <section className="panel">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <h2>
          <i className="fas fa-gift" style={{ color: "var(--secondary)", marginRight: "8px" }}></i>
          Tukar Reward
        </h2>

        {/* Sub-tabs */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setActiveSubTab("catalog")}
            style={{
              padding: "6px 16px",
              borderRadius: "20px",
              border: "1px solid rgba(232, 93, 4, 0.3)",
              background: activeSubTab === "catalog" ? "rgba(232, 93, 4, 0.2)" : "transparent",
              color: activeSubTab === "catalog" ? "var(--secondary)" : "rgba(255,248,240,0.6)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.85rem",
            }}
          >
            <i className="fas fa-store" style={{ marginRight: "6px" }}></i>
            Katalog Hadiah
          </button>
          <button
            onClick={() => {
              setActiveSubTab("my_exchanges");
              fetchMyExchanges();
            }}
            style={{
              padding: "6px 16px",
              borderRadius: "20px",
              border: "1px solid rgba(232, 93, 4, 0.3)",
              background: activeSubTab === "my_exchanges" ? "rgba(232, 93, 4, 0.2)" : "transparent",
              color: activeSubTab === "my_exchanges" ? "var(--secondary)" : "rgba(255,248,240,0.6)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <i className="fas fa-history"></i>
            Riwayat Penukaran Saya
            {pendingCount > 0 && (
              <span style={{ background: "var(--secondary)", color: "#fff", borderRadius: "10px", padding: "1px 6px", fontSize: "0.75rem", fontWeight: 700 }}>
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={isError ? "form-error" : "form-success"}
          style={{ marginBottom: "16px", padding: "12px", borderRadius: "8px" }}
        >
          {message}
        </div>
      )}

      {/* Catalog Tab */}
      {activeSubTab === "catalog" && (
        <>
          {rewards.length === 0 ? (
            <p className="muted">Belum ada reward tersedia saat ini. Pantau terus ya!</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              {rewards.map((reward) => {
                const canAfford = userBalance >= reward.pointCost;
                const outOfStock = reward.stock !== -1 && reward.stock <= 0;
                const isDisabled = !canAfford || outOfStock || loading === reward.id;

                return (
                  <div
                    key={reward.id}
                    style={{
                      background: "rgba(255,248,240,0.06)",
                      border: `1px solid ${canAfford && !outOfStock ? "rgba(232, 93, 4, 0.3)" : "rgba(255,248,240,0.1)"}`,
                      borderRadius: "16px",
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      opacity: outOfStock ? 0.6 : 1,
                      transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                  >
                    {reward.imageUrl && (
                      <img
                        src={reward.imageUrl}
                        alt={reward.name}
                        style={{
                          width: "100%",
                          height: "120px",
                          objectFit: "cover",
                          borderRadius: "10px",
                        }}
                      />
                    )}

                    <div>
                      <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
                        {reward.name}
                      </h3>
                      {reward.description && (
                        <p
                          className="muted"
                          style={{ fontSize: "0.82rem", margin: "4px 0 0", lineHeight: 1.5 }}
                        >
                          {reward.description}
                        </p>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span
                        style={{
                          background: "rgba(232, 93, 4, 0.2)",
                          color: "var(--secondary)",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          padding: "4px 10px",
                          borderRadius: "20px",
                        }}
                      >
                        <i className="fas fa-coins" style={{ marginRight: "4px" }}></i>
                        {reward.pointCost.toLocaleString("id-ID")} Poin
                      </span>
                      {reward.stock !== -1 && (
                        <span style={{ fontSize: "0.78rem", color: reward.stock <= 5 ? "#ff6b6b" : "rgba(255,248,240,0.5)" }}>
                          Stok: {reward.stock}
                        </span>
                      )}
                    </div>

                    {outOfStock ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "8px",
                          borderRadius: "8px",
                          background: "rgba(255,255,255,0.05)",
                          color: "rgba(255,248,240,0.4)",
                          fontSize: "0.85rem",
                        }}
                      >
                        Stok Habis
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setConfirmReward(reward);
                          setUserNote("");
                        }}
                        disabled={isDisabled}
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "10px",
                          border: "none",
                          background: canAfford
                            ? "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)"
                            : "rgba(255,248,240,0.1)",
                          color: canAfford ? "#fff" : "rgba(255,248,240,0.4)",
                          fontWeight: 700,
                          cursor: isDisabled ? "not-allowed" : "pointer",
                          fontSize: "0.9rem",
                          transition: "opacity 0.2s",
                        }}
                      >
                        {!canAfford ? (
                          <>
                            <i className="fas fa-lock" style={{ marginRight: "6px" }}></i>
                            Poin Kurang
                          </>
                        ) : (
                          <>
                            <i className="fas fa-exchange-alt" style={{ marginRight: "6px" }}></i>
                            Tukar Sekarang
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* My Exchanges Tab */}
      {activeSubTab === "my_exchanges" && (
        <div>
          {loadingExchanges ? (
            <p className="muted" style={{ textAlign: "center", padding: "20px 0" }}>Memuat riwayat penukaran...</p>
          ) : myExchanges.length === 0 ? (
            <p className="muted" style={{ textAlign: "center", padding: "20px 0" }}>
              Kamu belum pernah melakukan penukaran reward.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {myExchanges.map((ex) => (
                <div
                  key={ex.id}
                  style={{
                    background: "rgba(255,248,240,0.04)",
                    border: `1px solid ${
                      ex.status === "PENDING"
                        ? "rgba(232, 93, 4, 0.3)"
                        : ex.status === "APPROVED"
                        ? "rgba(37, 211, 102, 0.25)"
                        : "rgba(255, 100, 100, 0.2)"
                    }`,
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "16px",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {ex.rewardItem.imageUrl ? (
                      <img
                        src={ex.rewardItem.imageUrl}
                        alt={ex.rewardItem.name}
                        style={{ width: "48px", height: "48px", borderRadius: "8px", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "8px",
                          background: "rgba(232,93,4,0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--secondary)",
                        }}
                      >
                        <i className="fas fa-gift fa-lg"></i>
                      </div>
                    )}
                    <div>
                      <strong style={{ fontSize: "0.95rem" }}>{ex.rewardItem.name}</strong>
                      <div style={{ fontSize: "0.82rem", color: "var(--secondary)", fontWeight: 600, margin: "2px 0" }}>
                        <i className="fas fa-coins" style={{ marginRight: "4px" }}></i>
                        {ex.pointsSpent.toLocaleString("id-ID")} Poin
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "rgba(255,248,240,0.4)" }}>
                        {new Date(ex.createdAt).toLocaleString("id-ID")}
                      </div>
                      {ex.userNote && (
                        <div style={{ fontSize: "0.8rem", color: "rgba(255,248,240,0.6)", marginTop: "4px" }}>
                          Catatan kamu: <em>"{ex.userNote}"</em>
                        </div>
                      )}
                      {ex.adminNote && (
                        <div style={{ fontSize: "0.8rem", color: "#8ff0b0", marginTop: "4px" }}>
                          Catatan Admin: <em>"{ex.adminNote}"</em>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <span
                      style={{
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background:
                          ex.status === "PENDING"
                            ? "rgba(232, 93, 4, 0.15)"
                            : ex.status === "APPROVED"
                            ? "rgba(37, 211, 102, 0.15)"
                            : "rgba(255, 100, 100, 0.15)",
                        color:
                          ex.status === "PENDING"
                            ? "var(--secondary)"
                            : ex.status === "APPROVED"
                            ? "#8ff0b0"
                            : "#ff8080",
                      }}
                    >
                      {ex.status === "PENDING" && (
                        <>
                          <i className="fas fa-clock"></i> Menunggu Konfirmasi Admin
                        </>
                      )}
                      {ex.status === "APPROVED" && (
                        <>
                          <i className="fas fa-check-circle"></i> Disetujui (Hadiah Diproses)
                        </>
                      )}
                      {ex.status === "REJECTED" && (
                        <>
                          <i className="fas fa-times-circle"></i> Ditolak (Poin Dikembalikan)
                        </>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmReward && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setConfirmReward(null)}
        >
          <div
            style={{
              background: "#1a1208",
              border: "1px solid rgba(232, 93, 4, 0.4)",
              borderRadius: "20px",
              padding: "28px",
              maxWidth: "440px",
              width: "100%",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 8px", fontFamily: "Playfair Display, serif", fontSize: "1.3rem" }}>
              Konfirmasi Penukaran Reward
            </h3>
            <p className="muted" style={{ marginBottom: "16px", fontSize: "0.88rem" }}>
              Kamu akan menukarkan poin untuk mendapatkan:
            </p>

            <div
              style={{
                background: "rgba(232, 93, 4, 0.1)",
                border: "1px solid rgba(232, 93, 4, 0.25)",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "20px",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "4px" }}>
                {confirmReward.name}
              </div>
              <div style={{ color: "var(--secondary)", fontWeight: 700, fontSize: "1.1rem" }}>
                <i className="fas fa-coins" style={{ marginRight: "6px" }}></i>
                {confirmReward.pointCost.toLocaleString("id-ID")} Poin
              </div>
              <div style={{ fontSize: "0.82rem", color: "rgba(255,248,240,0.6)", marginTop: "6px" }}>
                Sisa poin setelah penukaran:{" "}
                <strong style={{ color: "#fff" }}>
                  {(userBalance - confirmReward.pointCost).toLocaleString("id-ID")} Poin
                </strong>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                Catatan / Alamat Pengiriman / No. WhatsApp (Opsional)
              </label>
              <textarea
                rows={3}
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="Contoh: No. WA 08123456789, kirim ke Alamat Lombok Barat..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "rgba(255,248,240,0.08)",
                  border: "1px solid rgba(255,248,240,0.2)",
                  borderRadius: "10px",
                  color: "#fff8f0",
                  font: "inherit",
                  fontSize: "0.88rem",
                  outline: "none",
                  resize: "vertical",
                }}
              />
              <span style={{ fontSize: "0.76rem", color: "rgba(255,248,240,0.5)", marginTop: "4px", display: "block" }}>
                Informasi ini membantu admin menghubungi atau mengirimkan hadiah kepada kamu.
              </span>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setConfirmReward(null)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,248,240,0.2)",
                  background: "transparent",
                  color: "rgba(255,248,240,0.7)",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Batal
              </button>
              <button
                onClick={() => handleExchange(confirmReward)}
                disabled={loading === confirmReward.id}
                style={{
                  flex: 2,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
                  color: "#fff",
                  cursor: loading === confirmReward.id ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  opacity: loading === confirmReward.id ? 0.7 : 1,
                }}
              >
                {loading === confirmReward.id ? (
                  "Memproses..."
                ) : (
                  <>
                    <i className="fas fa-check" style={{ marginRight: "6px" }}></i>
                    Konfirmasi Penukaran
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
