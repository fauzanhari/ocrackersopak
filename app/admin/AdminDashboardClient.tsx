"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";

interface AdminDashboardClientProps {
  user: any;
  initialStats: {
    totalUsers: number;
    totalTokenBalance: number;
    totalRedeemCodes: number;
    totalRedeemedCodes: number;
  };
  initialCodes: any[];
  initialSettings: Record<string, string>;
}

export function AdminDashboardClient({
  user,
  initialStats,
  initialCodes,
  initialSettings,
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "codes" | "content" | "rewards">("stats");

  // States
  const [stats, setStats] = useState(initialStats);
  const [codes, setCodes] = useState<any[]>(initialCodes);
  const [settings, setSettings] = useState<Record<string, string>>({
    heroTitle: initialSettings.heroTitle || "O-Crackers Opak-Opak Ambon",
    heroSubtitle: initialSettings.heroSubtitle || "Khas Lombok !!",
    heroDescription: initialSettings.heroDescription || "Rasakan sensasi renyahnya Opak-Opak Ambon dengan bumbu Sate Tanjung autentik khas Lombok.",
    flavorTitle: initialSettings.flavorTitle || "Sate Tanjung",
    flavorSubtitle: initialSettings.flavorSubtitle || "Legenda Rasa dari Lombok",
    flavorDescription: initialSettings.flavorDescription || "Sate Tanjung adalah ikon kuliner Lombok yang telah dikenal sejak puluhan tahun lalu.",
    ...initialSettings
  });

  // Forms
  const [tokenValue, setTokenValue] = useState("100");
  const [codeCount, setCodeCount] = useState("5");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Rewards state
  const [rewards, setRewards] = useState<any[]>([]);
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [isLoadingRewards, setIsLoadingRewards] = useState(false);
  const [rewardForm, setRewardForm] = useState({ name: "", description: "", pointCost: "", stock: "-1", imageUrl: "" });
  const [isSavingReward, setIsSavingReward] = useState(false);
  const [editingReward, setEditingReward] = useState<any>(null);
  const [rewardMsg, setRewardMsg] = useState("");
  const [rewardMsgError, setRewardMsgError] = useState(false);
  const [rewardSubTab, setRewardSubTab] = useState<"manage" | "requests">("manage");
  const [processingExchange, setProcessingExchange] = useState<string | null>(null);

  // Image upload state
  const [isUploading, setIsUploading] = useState(false);
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [uploadPreview, setUploadPreview] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exchangeModal, setExchangeModal] = useState<{
    exchange: any;
    actionStatus: "APPROVED" | "REJECTED";
  } | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState("");

  const fetchRewards = useCallback(async () => {
    setIsLoadingRewards(true);
    try {
      const [rRes, eRes] = await Promise.all([
        fetch("/api/admin/rewards"),
        fetch("/api/admin/reward-exchanges"),
      ]);
      if (rRes.ok) setRewards((await rRes.json()).rewards);
      if (eRes.ok) setExchanges((await eRes.json()).exchanges);
    } catch {}
    setIsLoadingRewards(false);
  }, []);

  const handleRewardTabClick = () => {
    setActiveTab("rewards");
    fetchRewards();
  };

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingReward(true);
    setRewardMsg("");
    const payload = {
      name: rewardForm.name,
      description: rewardForm.description || null,
      pointCost: parseInt(rewardForm.pointCost),
      stock: parseInt(rewardForm.stock),
      imageUrl: rewardForm.imageUrl || null,
    };
    try {
      const url = editingReward ? `/api/admin/rewards/${editingReward.id}` : "/api/admin/rewards";
      const method = editingReward ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      setRewardMsgError(!res.ok);
      setRewardMsg(data.message);
      if (res.ok) {
        setRewardForm({ name: "", description: "", pointCost: "", stock: "-1", imageUrl: "" });
        setEditingReward(null);
        setUploadPreview("");
        setImageMode("upload");
        fetchRewards();
      }
    } catch {
      setRewardMsg("Terjadi kesalahan sistem");
      setRewardMsgError(true);
    } finally {
      setIsSavingReward(false);
    }
  };

  const handleToggleReward = async (reward: any) => {
    try {
      await fetch(`/api/admin/rewards/${reward.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !reward.isActive }),
      });
      fetchRewards();
    } catch {}
  };

  const handleDeleteReward = async (id: string) => {
    if (!confirm("Hapus reward ini?")) return;
    try {
      const res = await fetch(`/api/admin/rewards/${id}`, { method: "DELETE" });
      const data = await res.json();
      setRewardMsg(data.message);
      setRewardMsgError(!res.ok);
      fetchRewards();
    } catch {}
  };

  const confirmExchangeAction = async () => {
    if (!exchangeModal) return;
    const { exchange, actionStatus } = exchangeModal;
    setProcessingExchange(exchange.id);
    try {
      const res = await fetch("/api/admin/reward-exchanges", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exchangeId: exchange.id,
          status: actionStatus,
          adminNote: adminNoteInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      setRewardMsg(data.message);
      setRewardMsgError(!res.ok);
      setExchangeModal(null);
      fetchRewards();
    } catch {
      setRewardMsg("Terjadi kesalahan");
      setRewardMsgError(true);
    } finally {
      setProcessingExchange(null);
    }
  };

  const startEditReward = (reward: any) => {
    setEditingReward(reward);
    setRewardForm({
      name: reward.name,
      description: reward.description || "",
      pointCost: String(reward.pointCost),
      stock: String(reward.stock),
      imageUrl: reward.imageUrl || "",
    });
    // Set preview if editing a reward with existing image
    if (reward.imageUrl) {
      setUploadPreview(reward.imageUrl);
      setImageMode(reward.imageUrl.startsWith("/uploads/") ? "upload" : "url");
    } else {
      setUploadPreview("");
      setImageMode("upload");
    }
    setRewardMsg("");
  };

  const refreshStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {}
  };

  const handleGenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenValue: parseInt(tokenValue),
          count: parseInt(codeCount),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Gagal membuat kode");
        setIsGenerating(false);
        return;
      }
      setSuccessMessage(`Berhasil membuat ${parseInt(codeCount)} kode redeem baru!`);
      const codesRes = await fetch("/api/admin/codes");
      if (codesRes.ok) {
        const codesData = await codesRes.json();
        setCodes(codesData.codes);
      }
      refreshStats();
    } catch (err) {
      setMessage("Terjadi kesalahan sistem");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Gagal menyimpan pengaturan");
        return;
      }
      setSuccessMessage("Konten beranda berhasil diperbarui!");
    } catch (err) {
      setMessage("Terjadi kesalahan sistem");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const pendingExchanges = exchanges.filter((e) => e.status === "PENDING").length;

  const tabs = [
    { id: "stats" as const, label: "Statistik", icon: "fa-chart-pie", onClick: () => { setActiveTab("stats"); refreshStats(); } },
    { id: "codes" as const, label: "Generator Kode", icon: "fa-ticket-alt", onClick: () => setActiveTab("codes") },
    { id: "rewards" as const, label: "Reward", icon: "fa-gift", badge: pendingExchanges, onClick: handleRewardTabClick },
    { id: "content" as const, label: "Edit Konten", icon: "fa-edit", onClick: () => setActiveTab("content") },
  ];

  return (
    <>
      <style>{`
        .admin-wrapper {
          min-height: 100vh;
          background: radial-gradient(ellipse at top left, rgba(232,93,4,0.12) 0%, transparent 50%),
                      radial-gradient(ellipse at bottom right, rgba(214,40,40,0.08) 0%, transparent 50%),
                      #120700;
          padding: 0;
        }

        /* ── Top Header Bar ── */
        .admin-topbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(18, 7, 0, 0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(232,93,4,0.2);
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
          gap: 16px;
        }

        .admin-topbar-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .admin-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 16px;
          border-radius: 50px;
          background: rgba(255,248,240,0.07);
          border: 1px solid rgba(255,248,240,0.15);
          color: rgba(255,248,240,0.75);
          font-size: 0.82rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.25s;
          white-space: nowrap;
        }
        .admin-back-btn:hover {
          background: rgba(232,93,4,0.15);
          border-color: rgba(232,93,4,0.4);
          color: var(--secondary);
        }

        .admin-topbar-title {
          font-family: "Playfair Display", serif;
          font-size: 1.2rem;
          font-weight: 900;
          color: var(--cream);
          white-space: nowrap;
        }
        .admin-topbar-title span {
          color: var(--primary);
        }

        .admin-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          background: linear-gradient(135deg, rgba(232,93,4,0.25), rgba(214,40,40,0.15));
          border: 1px solid rgba(232,93,4,0.35);
          border-radius: 50px;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--secondary);
        }

        /* ── Body Layout ── */
        .admin-body {
          display: flex;
          min-height: calc(100vh - 64px);
        }

        /* ── Sidebar ── */
        .admin-sidebar {
          width: 220px;
          flex-shrink: 0;
          padding: 28px 14px;
          border-right: 1px solid rgba(255,248,240,0.06);
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: rgba(0,0,0,0.15);
        }

        .admin-sidebar-label {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,248,240,0.3);
          padding: 0 10px;
          margin-bottom: 6px;
        }

        .admin-tab-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: rgba(255,248,240,0.55);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
          font-family: inherit;
        }

        .admin-tab-btn i {
          width: 18px;
          text-align: center;
          font-size: 0.9rem;
        }

        .admin-tab-btn:hover {
          background: rgba(255,248,240,0.06);
          color: var(--cream);
        }

        .admin-tab-btn.active {
          background: linear-gradient(135deg, rgba(232,93,4,0.25), rgba(214,40,40,0.15));
          border: 1px solid rgba(232,93,4,0.3);
          color: var(--secondary);
        }

        .admin-tab-btn.active i {
          color: var(--primary);
        }

        .tab-notif-dot {
          margin-left: auto;
          background: var(--primary);
          color: #fff;
          border-radius: 50px;
          padding: 1px 7px;
          font-size: 0.7rem;
          font-weight: 700;
        }

        /* ── Main Content ── */
        .admin-content {
          flex: 1;
          padding: 32px;
          overflow-x: hidden;
          min-width: 0;
        }

        /* ── Stat Cards ── */
        .stat-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 18px;
          margin-bottom: 28px;
        }

        .stat-card-new {
          position: relative;
          overflow: hidden;
          padding: 24px 22px;
          border-radius: 18px;
          background: rgba(255,248,240,0.04);
          border: 1px solid rgba(255,248,240,0.08);
          transition: transform 0.3s, box-shadow 0.3s;
        }

        .stat-card-new::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 18px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(232,93,4,0.4), transparent 60%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        .stat-card-new:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.35);
        }

        .stat-card-new .stat-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          margin-bottom: 16px;
        }

        .stat-card-new .stat-value {
          font-size: 2rem;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 4px;
          font-family: "Poppins", sans-serif;
        }

        .stat-card-new .stat-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: rgba(255,248,240,0.5);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 2px;
        }

        .stat-card-new .stat-sub {
          font-size: 0.78rem;
          color: rgba(255,248,240,0.35);
        }

        /* ── Info Panel ── */
        .admin-info-panel {
          padding: 22px 26px;
          border-radius: 16px;
          background: rgba(232,93,4,0.07);
          border: 1px solid rgba(232,93,4,0.18);
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .admin-info-panel i {
          color: var(--primary);
          font-size: 1.2rem;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .admin-info-panel h3 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .admin-info-panel p {
          font-size: 0.85rem;
          color: rgba(255,248,240,0.65);
          line-height: 1.7;
        }

        /* ── Content Cards ── */
        .admin-card {
          background: rgba(255,248,240,0.035);
          border: 1px solid rgba(255,248,240,0.09);
          border-radius: 18px;
          padding: 26px;
        }

        .admin-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255,248,240,0.07);
        }

        .admin-card-header i {
          color: var(--primary);
          font-size: 1rem;
        }

        .admin-card-header h3 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--cream);
        }

        .admin-card-header p {
          font-size: 0.78rem;
          color: rgba(255,248,240,0.45);
          margin-top: 1px;
        }

        .admin-two-col {
          display: grid;
          grid-template-columns: minmax(0,1fr) minmax(0,1.8fr);
          gap: 20px;
        }

        /* ── Form Elements ── */
        .admin-form-group {
          display: grid;
          gap: 6px;
          margin-bottom: 16px;
        }

        .admin-form-group:last-child { margin-bottom: 0; }

        .admin-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: rgba(255,248,240,0.65);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .admin-input {
          background: rgba(255,248,240,0.07);
          border: 1px solid rgba(255,248,240,0.14);
          border-radius: 10px;
          color: #fff8f0;
          font: inherit;
          font-size: 0.9rem;
          padding: 11px 14px;
          width: 100%;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .admin-input:focus {
          border-color: rgba(232,93,4,0.5);
          outline: none;
          box-shadow: 0 0 0 3px rgba(232,93,4,0.1);
        }

        .admin-textarea {
          resize: vertical;
          min-height: 90px;
        }

        .admin-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 22px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, var(--primary), #c0392b);
          color: #fff;
          font: inherit;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s;
          width: 100%;
        }

        .admin-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(232,93,4,0.4);
        }

        .admin-btn-primary:disabled {
          opacity: 0.55;
          cursor: wait;
        }

        .admin-btn-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid rgba(255,248,240,0.15);
          background: transparent;
          color: rgba(255,248,240,0.65);
          font: inherit;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .admin-btn-ghost:hover {
          background: rgba(255,248,240,0.07);
          color: var(--cream);
        }

        .admin-btn-danger {
          border-color: rgba(255,80,80,0.3);
          color: #ff8080;
        }

        .admin-btn-danger:hover {
          background: rgba(255,80,80,0.1);
          border-color: rgba(255,80,80,0.5);
        }

        .admin-btn-success {
          border-color: rgba(37,211,102,0.3);
          color: #8ff0b0;
        }

        .admin-btn-success:hover {
          background: rgba(37,211,102,0.1);
        }

        /* ── Codes Table ── */
        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,248,240,0.35);
          text-align: left;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255,248,240,0.07);
        }

        .admin-table td {
          padding: 13px 14px;
          font-size: 0.88rem;
          border-bottom: 1px solid rgba(255,248,240,0.04);
          color: var(--cream);
        }

        .admin-table tr:last-child td { border-bottom: none; }

        .admin-table tr:hover td {
          background: rgba(255,248,240,0.02);
        }

        .code-mono {
          font-family: "Courier New", monospace;
          font-weight: 700;
          color: var(--secondary);
          font-size: 0.92rem;
          letter-spacing: 0.05em;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 50px;
        }

        .status-active {
          background: rgba(37,211,102,0.12);
          color: #8ff0b0;
          border: 1px solid rgba(37,211,102,0.2);
        }

        .status-used {
          background: rgba(255,248,240,0.06);
          color: rgba(255,248,240,0.35);
          border: 1px solid rgba(255,248,240,0.08);
        }

        .status-pending {
          background: rgba(232,93,4,0.12);
          color: var(--secondary);
          border: 1px solid rgba(232,93,4,0.25);
        }

        .status-approved {
          background: rgba(37,211,102,0.12);
          color: #8ff0b0;
          border: 1px solid rgba(37,211,102,0.2);
        }

        .status-rejected {
          background: rgba(255,80,80,0.1);
          color: #ff8080;
          border: 1px solid rgba(255,80,80,0.2);
        }

        /* ── Reward Cards ── */
        .reward-item-card {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          padding: 16px;
          border-radius: 14px;
          background: rgba(255,248,240,0.04);
          border: 1px solid rgba(255,248,240,0.07);
          transition: border-color 0.2s;
          margin-bottom: 10px;
        }

        .reward-item-card:last-child { margin-bottom: 0; }

        .reward-item-card.active-reward {
          border-color: rgba(232,93,4,0.2);
        }

        .reward-item-card.inactive-reward {
          opacity: 0.5;
        }

        .reward-item-info { flex: 1; min-width: 0; }

        .reward-item-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--cream);
          margin-bottom: 3px;
        }

        .reward-item-desc {
          font-size: 0.8rem;
          color: rgba(255,248,240,0.5);
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .reward-item-meta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          font-size: 0.8rem;
        }

        .reward-item-actions {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex-shrink: 0;
        }

        /* ── Exchange Request Card ── */
        .exchange-card {
          padding: 16px;
          border-radius: 14px;
          background: rgba(255,248,240,0.03);
          border: 1px solid rgba(255,248,240,0.07);
          margin-bottom: 10px;
          display: flex;
          gap: 14px;
          align-items: center;
        }

        .exchange-card:last-child { margin-bottom: 0; }

        .exchange-card-info { flex: 1; min-width: 0; }

        /* ── Alert Messages ── */
        .admin-alert {
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .admin-alert-error {
          background: rgba(255,80,80,0.1);
          border: 1px solid rgba(255,80,80,0.25);
          color: #ffb4a8;
        }

        .admin-alert-success {
          background: rgba(37,211,102,0.1);
          border: 1px solid rgba(37,211,102,0.25);
          color: #8ff0b0;
        }

        /* ── Section Header ── */
        .admin-section-heading {
          font-size: 1.4rem;
          font-weight: 800;
          font-family: "Playfair Display", serif;
          color: var(--cream);
          margin-bottom: 4px;
        }

        .admin-section-sub {
          font-size: 0.83rem;
          color: rgba(255,248,240,0.45);
          margin-bottom: 24px;
        }

        /* ── Sub tabs ── */
        .admin-subtabs {
          display: flex;
          gap: 8px;
          margin-bottom: 22px;
        }

        .admin-subtab-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 18px;
          border-radius: 50px;
          border: 1px solid rgba(255,248,240,0.12);
          background: transparent;
          color: rgba(255,248,240,0.5);
          font: inherit;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .admin-subtab-btn.active {
          background: rgba(232,93,4,0.18);
          border-color: rgba(232,93,4,0.35);
          color: var(--secondary);
        }

        .admin-subtab-btn:hover:not(.active) {
          background: rgba(255,248,240,0.06);
          color: var(--cream);
        }

        /* ── CMS Grid ── */
        .cms-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .cms-section-title {
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--secondary);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cms-section-title::before {
          content: "";
          display: block;
          width: 3px;
          height: 14px;
          background: var(--primary);
          border-radius: 2px;
        }

        /* ── Scrollable table container ── */
        .admin-table-wrap {
          overflow-y: auto;
          max-height: 480px;
        }

        .admin-table-wrap::-webkit-scrollbar { width: 5px; }
        .admin-table-wrap::-webkit-scrollbar-track { background: rgba(255,248,240,0.03); }
        .admin-table-wrap::-webkit-scrollbar-thumb { background: rgba(232,93,4,0.3); border-radius: 10px; }

        /* ── Modal ── */
        .admin-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.78);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .admin-modal-box {
          background: #180900;
          border-radius: 22px;
          padding: 30px;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 30px 80px rgba(0,0,0,0.6);
          border: 1px solid rgba(255,248,240,0.1);
        }

        .admin-modal-box h3 {
          font-family: "Playfair Display", serif;
          font-size: 1.25rem;
          margin-bottom: 8px;
        }

        .admin-modal-summary {
          padding: 16px;
          border-radius: 12px;
          background: rgba(255,248,240,0.05);
          border: 1px solid rgba(255,248,240,0.08);
          margin: 16px 0;
          font-size: 0.88rem;
        }

        .admin-modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 16px;
        }

        .admin-modal-cancel {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid rgba(255,248,240,0.15);
          background: transparent;
          color: rgba(255,248,240,0.65);
          font: inherit;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .admin-modal-cancel:hover {
          background: rgba(255,248,240,0.06);
        }

        .admin-modal-confirm-approve {
          flex: 2;
          padding: 12px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #25d366, #128c7e);
          color: #fff;
          font: inherit;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .admin-modal-confirm-reject {
          flex: 2;
          padding: 12px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #ff4d4d, #c0392b);
          color: #fff;
          font: inherit;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
        }

        .admin-modal-confirm-approve:hover,
        .admin-modal-confirm-reject:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .admin-modal-confirm-approve:disabled,
        .admin-modal-confirm-reject:disabled {
          opacity: 0.55;
          cursor: wait;
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .admin-sidebar { display: none; }
          .cms-grid { grid-template-columns: 1fr; }
          .admin-two-col { grid-template-columns: 1fr; }
        }

        @media (max-width: 640px) {
          .admin-content { padding: 20px 16px; }
          .stat-cards-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="admin-wrapper">
        {/* ── Top Bar ── */}
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <Link href="/" className="admin-back-btn">
              <i className="fas fa-arrow-left" /> Kembali ke Web
            </Link>
            <div className="admin-topbar-title">
              O-<span>Crackers</span> Admin
            </div>
          </div>
          <div className="admin-badge-pill">
            <i className="fas fa-user-shield" />
            {user.email.split("@")[0]}
          </div>
        </div>

        <div className="admin-body">
          {/* ── Sidebar Navigation ── */}
          <aside className="admin-sidebar">
            <div className="admin-sidebar-label">Menu</div>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`admin-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                onClick={tab.onClick}
              >
                <i className={`fas ${tab.icon}`} />
                {tab.label}
                {tab.badge && tab.badge > 0 ? (
                  <span className="tab-notif-dot">{tab.badge}</span>
                ) : null}
              </button>
            ))}
          </aside>

          {/* ── Main Content ── */}
          <main className="admin-content">

            {/* Global messages */}
            {message && (
              <div className="admin-alert admin-alert-error">
                <i className="fas fa-exclamation-circle" /> {message}
              </div>
            )}
            {successMessage && (
              <div className="admin-alert admin-alert-success">
                <i className="fas fa-check-circle" /> {successMessage}
              </div>
            )}

            {/* ════════════════════════════════════════
                TAB: Statistik
            ════════════════════════════════════════ */}
            {activeTab === "stats" && (
              <div>
                <div className="admin-section-heading">Statistik Web</div>
                <div className="admin-section-sub">Ringkasan data pengguna dan kode redeem secara real-time</div>

                <div className="stat-cards-grid">
                  {/* Card 1 */}
                  <div className="stat-card-new">
                    <div className="stat-icon-wrap" style={{ background: "rgba(232,93,4,0.15)" }}>
                      <i className="fas fa-users" style={{ color: "var(--primary)" }} />
                    </div>
                    <div className="stat-value" style={{ color: "var(--cream)" }}>{stats.totalUsers}</div>
                    <div className="stat-label">Total Pengguna</div>
                    <div className="stat-sub">Terdaftar di sistem</div>
                  </div>
                  {/* Card 2 */}
                  <div className="stat-card-new">
                    <div className="stat-icon-wrap" style={{ background: "rgba(244,162,97,0.15)" }}>
                      <i className="fas fa-coins" style={{ color: "var(--secondary)" }} />
                    </div>
                    <div className="stat-value" style={{ color: "var(--secondary)" }}>
                      {stats.totalTokenBalance.toLocaleString("id-ID")}
                    </div>
                    <div className="stat-label">Total Saldo Token</div>
                    <div className="stat-sub">Beredar pada pengguna</div>
                  </div>
                  {/* Card 3 */}
                  <div className="stat-card-new">
                    <div className="stat-icon-wrap" style={{ background: "rgba(100,200,255,0.12)" }}>
                      <i className="fas fa-tags" style={{ color: "#6ec6ff" }} />
                    </div>
                    <div className="stat-value" style={{ color: "#6ec6ff" }}>{stats.totalRedeemCodes}</div>
                    <div className="stat-label">Kode Dibuat</div>
                    <div className="stat-sub">Kode unik terkunci / aktif</div>
                  </div>
                  {/* Card 4 */}
                  <div className="stat-card-new">
                    <div className="stat-icon-wrap" style={{ background: "rgba(37,211,102,0.12)" }}>
                      <i className="fas fa-check-circle" style={{ color: "#8ff0b0" }} />
                    </div>
                    <div className="stat-value" style={{ color: "#8ff0b0" }}>{stats.totalRedeemedCodes}</div>
                    <div className="stat-label">Kode Ditukar</div>
                    <div className="stat-sub">
                      {stats.totalRedeemCodes > 0
                        ? `${Math.round((stats.totalRedeemedCodes / stats.totalRedeemCodes) * 100)}% dari total kode`
                        : "Belum ada kode"}
                    </div>
                  </div>
                </div>

                <div className="admin-info-panel">
                  <i className="fas fa-info-circle" />
                  <div>
                    <h3>Informasi Sistem</h3>
                    <p>
                      Dashboard ini terhubung langsung ke cluster database PostgreSQL Anda di Supabase.
                      Anda dapat memantau kode redeem secara real-time. Jika pengguna menukarkan kode unik
                      di kemasan O-Crackers, saldo token mereka akan bertambah secara instan dan transaksi
                      akan terdaftar pada riwayat poin.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════
                TAB: Generator Kode
            ════════════════════════════════════════ */}
            {activeTab === "codes" && (
              <div>
                <div className="admin-section-heading">Generator Kode Redeem</div>
                <div className="admin-section-sub">Buat kode unik acak untuk dimasukkan ke dalam kemasan produk</div>

                <div className="admin-two-col">
                  {/* Form */}
                  <div className="admin-card">
                    <div className="admin-card-header">
                      <i className="fas fa-plus-circle" />
                      <div>
                        <h3>Buat Kode Baru</h3>
                        <p>Isi parameter lalu klik Generate</p>
                      </div>
                    </div>

                    <form onSubmit={handleGenerateCodes} style={{ display: "grid", gap: "16px" }}>
                      <div className="admin-form-group">
                        <label className="admin-label">Nilai Token (Poin)</label>
                        <input
                          className="admin-input"
                          type="number"
                          value={tokenValue}
                          onChange={(e) => setTokenValue(e.target.value)}
                          placeholder="Misal: 100"
                          required
                          min="1"
                        />
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-label">Jumlah Kode</label>
                        <input
                          className="admin-input"
                          type="number"
                          value={codeCount}
                          onChange={(e) => setCodeCount(e.target.value)}
                          placeholder="Misal: 5"
                          required
                          min="1"
                          max="50"
                        />
                      </div>
                      <button className="admin-btn-primary" type="submit" disabled={isGenerating}>
                        {isGenerating ? (
                          <><i className="fas fa-spinner fa-spin" /> Memproses...</>
                        ) : (
                          <><i className="fas fa-magic" /> Generate Kode</>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Table */}
                  <div className="admin-card" style={{ display: "flex", flexDirection: "column" }}>
                    <div className="admin-card-header">
                      <i className="fas fa-list" />
                      <div>
                        <h3>Daftar Kode Redeem</h3>
                        <p>Menampilkan 50 kode terbaru</p>
                      </div>
                    </div>
                    <div className="admin-table-wrap" style={{ flex: 1 }}>
                      {codes.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,248,240,0.3)", fontSize: "0.88rem" }}>
                          <i className="fas fa-inbox" style={{ fontSize: "2rem", marginBottom: "12px", display: "block" }} />
                          Belum ada kode redeem yang dibuat.
                        </div>
                      ) : (
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Kode</th>
                              <th>Poin</th>
                              <th>Status</th>
                              <th>Dibuat</th>
                            </tr>
                          </thead>
                          <tbody>
                            {codes.map((item) => (
                              <tr key={item.id}>
                                <td><span className="code-mono">{item.code}</span></td>
                                <td style={{ fontWeight: 700 }}>{item.tokenValue} Pts</td>
                                <td>
                                  {item.isRedeemed ? (
                                    <span className="status-badge status-used">
                                      <i className="fas fa-circle" style={{ fontSize: "6px" }} /> Terpakai
                                    </span>
                                  ) : (
                                    <span className="status-badge status-active">
                                      <i className="fas fa-circle" style={{ fontSize: "6px" }} /> Aktif
                                    </span>
                                  )}
                                </td>
                                <td style={{ fontSize: "0.78rem", color: "rgba(255,248,240,0.45)" }}>
                                  {new Date(item.createdAt).toLocaleDateString("id-ID")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════
                TAB: Manajemen Reward
            ════════════════════════════════════════ */}
            {activeTab === "rewards" && (
              <div>
                <div className="admin-section-heading">Manajemen Reward</div>
                <div className="admin-section-sub">Kelola katalog hadiah dan proses request penukaran</div>

                {rewardMsg && (
                  <div className={`admin-alert ${rewardMsgError ? "admin-alert-error" : "admin-alert-success"}`}>
                    <i className={`fas ${rewardMsgError ? "fa-exclamation-circle" : "fa-check-circle"}`} />
                    {rewardMsg}
                  </div>
                )}

                <div className="admin-subtabs">
                  <button
                    className={`admin-subtab-btn ${rewardSubTab === "manage" ? "active" : ""}`}
                    onClick={() => setRewardSubTab("manage")}
                  >
                    <i className="fas fa-list" /> Daftar Reward
                  </button>
                  <button
                    className={`admin-subtab-btn ${rewardSubTab === "requests" ? "active" : ""}`}
                    onClick={() => setRewardSubTab("requests")}
                  >
                    <i className="fas fa-inbox" /> Request Penukaran
                    {pendingExchanges > 0 && (
                      <span className="tab-notif-dot">{pendingExchanges}</span>
                    )}
                  </button>
                </div>

                {/* Sub-tab: Manage */}
                {rewardSubTab === "manage" && (
                  <div className="admin-two-col">
                    {/* Form */}
                    <div className="admin-card">
                      <div className="admin-card-header">
                        <i className="fas fa-plus-circle" />
                        <div>
                          <h3>{editingReward ? "Edit Reward" : "Tambah Reward Baru"}</h3>
                          <p>Isi detail reward lalu simpan</p>
                        </div>
                      </div>
                      <form onSubmit={handleSaveReward} style={{ display: "grid", gap: "14px" }}>
                        <div className="admin-form-group">
                          <label className="admin-label">Nama Reward *</label>
                          <input
                            className="admin-input"
                            type="text"
                            value={rewardForm.name}
                            onChange={(e) => setRewardForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="Paket O-Crackers 3 Bungkus"
                            required
                          />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Deskripsi</label>
                          <textarea
                            className="admin-input admin-textarea"
                            value={rewardForm.description}
                            onChange={(e) => setRewardForm((p) => ({ ...p, description: e.target.value }))}
                            placeholder="Deskripsi singkat hadiah..."
                          />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                          <div className="admin-form-group">
                            <label className="admin-label">Biaya Poin *</label>
                            <input
                              className="admin-input"
                              type="number"
                              value={rewardForm.pointCost}
                              onChange={(e) => setRewardForm((p) => ({ ...p, pointCost: e.target.value }))}
                              placeholder="500"
                              required
                              min="1"
                            />
                          </div>
                          <div className="admin-form-group">
                            <label className="admin-label">Stok (-1 = ∞)</label>
                            <input
                              className="admin-input"
                              type="number"
                              value={rewardForm.stock}
                              onChange={(e) => setRewardForm((p) => ({ ...p, stock: e.target.value }))}
                              placeholder="-1"
                              min="-1"
                            />
                          </div>
                        </div>
                        {/* ── Image Section ── */}
                        <div className="admin-form-group">
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <label className="admin-label" style={{ margin: 0 }}>Gambar Reward (opsional)</label>
                            <div style={{ display: "flex", background: "rgba(255,248,240,0.06)", borderRadius: "8px", padding: "3px" }}>
                              <button
                                type="button"
                                onClick={() => setImageMode("upload")}
                                style={{
                                  padding: "4px 12px",
                                  borderRadius: "6px",
                                  border: "none",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                  background: imageMode === "upload" ? "rgba(232,93,4,0.3)" : "transparent",
                                  color: imageMode === "upload" ? "var(--secondary)" : "rgba(255,248,240,0.45)",
                                  fontFamily: "inherit",
                                }}
                              >
                                <i className="fas fa-upload" style={{ marginRight: "5px" }} />
                                Upload
                              </button>
                              <button
                                type="button"
                                onClick={() => setImageMode("url")}
                                style={{
                                  padding: "4px 12px",
                                  borderRadius: "6px",
                                  border: "none",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                  background: imageMode === "url" ? "rgba(232,93,4,0.3)" : "transparent",
                                  color: imageMode === "url" ? "var(--secondary)" : "rgba(255,248,240,0.45)",
                                  fontFamily: "inherit",
                                }}
                              >
                                <i className="fas fa-link" style={{ marginRight: "5px" }} />
                                URL
                              </button>
                            </div>
                          </div>

                          {/* Upload mode */}
                          {imageMode === "upload" && (
                            <div>
                              {/* Hidden file input */}
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                style={{ display: "none" }}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setIsUploading(true);
                                  setRewardMsg("");
                                  try {
                                    const fd = new FormData();
                                    fd.append("file", file);
                                    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
                                    const data = await res.json();
                                    if (!res.ok) {
                                      setRewardMsg(data.message || "Upload gagal");
                                      setRewardMsgError(true);
                                    } else {
                                      setRewardForm((p) => ({ ...p, imageUrl: data.url }));
                                      setUploadPreview(data.url);
                                    }
                                  } catch {
                                    setRewardMsg("Terjadi kesalahan saat mengupload.");
                                    setRewardMsgError(true);
                                  } finally {
                                    setIsUploading(false);
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                  }
                                }}
                              />

                              {/* Drop zone */}
                              <div
                                onClick={() => !isUploading && fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={async (e) => {
                                  e.preventDefault();
                                  setDragOver(false);
                                  const file = e.dataTransfer.files?.[0];
                                  if (!file) return;
                                  setIsUploading(true);
                                  setRewardMsg("");
                                  try {
                                    const fd = new FormData();
                                    fd.append("file", file);
                                    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
                                    const data = await res.json();
                                    if (!res.ok) {
                                      setRewardMsg(data.message || "Upload gagal");
                                      setRewardMsgError(true);
                                    } else {
                                      setRewardForm((p) => ({ ...p, imageUrl: data.url }));
                                      setUploadPreview(data.url);
                                    }
                                  } catch {
                                    setRewardMsg("Terjadi kesalahan saat mengupload.");
                                    setRewardMsgError(true);
                                  } finally {
                                    setIsUploading(false);
                                  }
                                }}
                                style={{
                                  border: `2px dashed ${dragOver ? "rgba(232,93,4,0.7)" : uploadPreview ? "rgba(37,211,102,0.4)" : "rgba(255,248,240,0.15)"}`,
                                  borderRadius: "12px",
                                  padding: uploadPreview ? "10px" : "28px 16px",
                                  textAlign: "center",
                                  cursor: isUploading ? "wait" : "pointer",
                                  background: dragOver ? "rgba(232,93,4,0.08)" : uploadPreview ? "rgba(37,211,102,0.04)" : "rgba(255,248,240,0.03)",
                                  transition: "all 0.2s",
                                  position: "relative",
                                  overflow: "hidden",
                                }}
                              >
                                {isUploading ? (
                                  <div style={{ padding: "16px 0" }}>
                                    <i className="fas fa-spinner fa-spin" style={{ fontSize: "1.5rem", color: "var(--primary)", marginBottom: "8px", display: "block" }} />
                                    <span style={{ fontSize: "0.82rem", color: "rgba(255,248,240,0.55)" }}>Mengupload...</span>
                                  </div>
                                ) : uploadPreview ? (
                                  <div style={{ position: "relative" }}>
                                    <img
                                      src={uploadPreview}
                                      alt="Preview"
                                      style={{ width: "100%", maxHeight: "140px", objectFit: "cover", borderRadius: "8px", display: "block" }}
                                    />
                                    <div style={{
                                      position: "absolute",
                                      inset: 0,
                                      background: "rgba(0,0,0,0)",
                                      borderRadius: "8px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      transition: "background 0.2s",
                                    }}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.45)")}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0)")}
                                    >
                                      <span style={{ color: "#fff", fontSize: "0.78rem", fontWeight: 700, opacity: 0, transition: "opacity 0.2s", pointerEvents: "none" }}
                                        className="img-hover-label"
                                      >
                                        <i className="fas fa-camera" style={{ marginRight: "5px" }} />Ganti Foto
                                      </span>
                                    </div>
                                    <div style={{ marginTop: "8px", fontSize: "0.72rem", color: "rgba(37,211,102,0.8)", fontWeight: 600 }}>
                                      <i className="fas fa-check-circle" style={{ marginRight: "4px" }} />
                                      Foto berhasil diupload — klik untuk mengganti
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <i className="fas fa-cloud-upload-alt" style={{ fontSize: "1.8rem", color: "rgba(255,248,240,0.25)", marginBottom: "10px", display: "block" }} />
                                    <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "rgba(255,248,240,0.55)", marginBottom: "4px" }}>
                                      {dragOver ? "Lepaskan untuk upload" : "Klik atau seret foto ke sini"}
                                    </div>
                                    <div style={{ fontSize: "0.74rem", color: "rgba(255,248,240,0.28)" }}>
                                      JPG, PNG, WebP, GIF · Maks. 5 MB
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Clear button */}
                              {uploadPreview && !isUploading && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUploadPreview("");
                                    setRewardForm((p) => ({ ...p, imageUrl: "" }));
                                  }}
                                  style={{
                                    marginTop: "6px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    padding: "4px 10px",
                                    border: "1px solid rgba(255,80,80,0.3)",
                                    borderRadius: "6px",
                                    background: "rgba(255,80,80,0.07)",
                                    color: "#ff8080",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                  }}
                                >
                                  <i className="fas fa-trash" /> Hapus Foto
                                </button>
                              )}
                            </div>
                          )}

                          {/* URL mode */}
                          {imageMode === "url" && (
                            <div>
                              <input
                                className="admin-input"
                                type="url"
                                value={rewardForm.imageUrl}
                                onChange={(e) => {
                                  setRewardForm((p) => ({ ...p, imageUrl: e.target.value }));
                                  setUploadPreview(e.target.value);
                                }}
                                placeholder="https://contoh.com/gambar.jpg"
                              />
                              {uploadPreview && (
                                <div style={{ marginTop: "8px", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,248,240,0.1)" }}>
                                  <img
                                    src={uploadPreview}
                                    alt="Preview URL"
                                    style={{ width: "100%", maxHeight: "140px", objectFit: "cover", display: "block" }}
                                    onError={() => setUploadPreview("")}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {editingReward && (
                            <button
                              type="button"
                              className="admin-btn-ghost"
                              onClick={() => { setEditingReward(null); setRewardForm({ name: "", description: "", pointCost: "", stock: "-1", imageUrl: "" }); }}
                              style={{ flex: 1 }}
                            >
                              Batal
                            </button>
                          )}
                          <button className="admin-btn-primary" type="submit" disabled={isSavingReward} style={{ flex: 2 }}>
                            {isSavingReward ? (
                              <><i className="fas fa-spinner fa-spin" /> Menyimpan...</>
                            ) : editingReward ? (
                              <><i className="fas fa-save" /> Simpan Perubahan</>
                            ) : (
                              <><i className="fas fa-plus" /> Tambah Reward</>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* List */}
                    <div className="admin-card" style={{ display: "flex", flexDirection: "column" }}>
                      <div className="admin-card-header">
                        <i className="fas fa-th-list" />
                        <div>
                          <h3>Semua Reward</h3>
                          <p>{rewards.length} reward terdaftar</p>
                        </div>
                      </div>
                      <div className="admin-table-wrap" style={{ flex: 1 }}>
                        {isLoadingRewards ? (
                          <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,248,240,0.35)", fontSize: "0.88rem" }}>
                            <i className="fas fa-spinner fa-spin" style={{ fontSize: "1.5rem", marginBottom: "10px", display: "block" }} />
                            Memuat...
                          </div>
                        ) : rewards.length === 0 ? (
                          <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,248,240,0.3)", fontSize: "0.88rem" }}>
                            <i className="fas fa-gift" style={{ fontSize: "2rem", marginBottom: "12px", display: "block" }} />
                            Belum ada reward. Buat reward pertama!
                          </div>
                        ) : (
                          rewards.map((reward) => (
                            <div
                              key={reward.id}
                              className={`reward-item-card ${reward.isActive ? "active-reward" : "inactive-reward"}`}
                            >
                              <div className="reward-item-info">
                                <div className="reward-item-name">
                                  {reward.name}
                                  {!reward.isActive && (
                                    <span style={{ marginLeft: "8px", fontSize: "0.7rem", padding: "2px 8px", borderRadius: "6px", background: "rgba(255,248,240,0.08)", color: "rgba(255,248,240,0.4)", fontWeight: 600 }}>
                                      Nonaktif
                                    </span>
                                  )}
                                </div>
                                {reward.description && (
                                  <div className="reward-item-desc">{reward.description}</div>
                                )}
                                <div className="reward-item-meta">
                                  <span style={{ color: "var(--secondary)", fontWeight: 700 }}>
                                    <i className="fas fa-coins" style={{ marginRight: "4px" }} />
                                    {reward.pointCost.toLocaleString("id-ID")} Poin
                                  </span>
                                  <span style={{ color: "rgba(255,248,240,0.4)" }}>
                                    Stok: {reward.stock === -1 ? "∞" : reward.stock}
                                  </span>
                                  <span style={{ color: "rgba(255,248,240,0.3)" }}>
                                    {reward._count?.exchanges ?? 0}× ditukar
                                  </span>
                                </div>
                              </div>
                              <div className="reward-item-actions">
                                <button className="admin-btn-ghost" onClick={() => startEditReward(reward)} title="Edit">
                                  <i className="fas fa-edit" />
                                </button>
                                <button
                                  className="admin-btn-ghost"
                                  onClick={() => handleToggleReward(reward)}
                                  title={reward.isActive ? "Nonaktifkan" : "Aktifkan"}
                                >
                                  <i className={`fas fa-${reward.isActive ? "eye-slash" : "eye"}`} />
                                </button>
                                <button className="admin-btn-ghost admin-btn-danger" onClick={() => handleDeleteReward(reward.id)} title="Hapus">
                                  <i className="fas fa-trash" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-tab: Requests */}
                {rewardSubTab === "requests" && (
                  <div className="admin-card">
                    <div className="admin-card-header">
                      <i className="fas fa-inbox" />
                      <div>
                        <h3>Request Penukaran Reward</h3>
                        <p>Approve atau tolak request penukaran dari pengguna</p>
                      </div>
                    </div>
                    {isLoadingRewards ? (
                      <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,248,240,0.35)", fontSize: "0.88rem" }}>
                        <i className="fas fa-spinner fa-spin" style={{ fontSize: "1.5rem", marginBottom: "10px", display: "block" }} />
                        Memuat...
                      </div>
                    ) : exchanges.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,248,240,0.3)", fontSize: "0.88rem" }}>
                        <i className="fas fa-check-double" style={{ fontSize: "2rem", marginBottom: "12px", display: "block" }} />
                        Belum ada request penukaran.
                      </div>
                    ) : (
                      exchanges.map((ex) => (
                        <div
                          key={ex.id}
                          className="exchange-card"
                          style={{
                            borderColor: ex.status === "PENDING"
                              ? "rgba(232,93,4,0.25)"
                              : ex.status === "APPROVED"
                              ? "rgba(37,211,102,0.2)"
                              : "rgba(255,80,80,0.18)",
                          }}
                        >
                          <div className="exchange-card-info">
                            <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "3px" }}>
                              {ex.rewardItem?.name}
                            </div>
                            <div style={{ fontSize: "0.82rem", color: "rgba(255,248,240,0.6)", marginBottom: "2px" }}>
                              Pemohon: <strong style={{ color: "var(--cream)" }}>{ex.user?.name ? `${ex.user.name} (${ex.user.email})` : ex.user?.email}</strong>
                              &nbsp;—&nbsp;
                              <span style={{ color: "var(--secondary)", fontWeight: 700 }}>{ex.pointsSpent.toLocaleString("id-ID")} Poin</span>
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "rgba(255,248,240,0.35)", marginBottom: "6px" }}>
                              {new Date(ex.createdAt).toLocaleString("id-ID")}
                            </div>
                            {ex.userNote && (
                              <div style={{ fontSize: "0.8rem", background: "rgba(255,248,240,0.05)", padding: "6px 10px", borderRadius: "7px", borderLeft: "3px solid var(--secondary)", color: "#fff8f0", marginBottom: "4px" }}>
                                <strong>Catatan User:</strong> {ex.userNote}
                              </div>
                            )}
                            {ex.adminNote && (
                              <div style={{ fontSize: "0.8rem", background: "rgba(37,211,102,0.07)", padding: "6px 10px", borderRadius: "7px", borderLeft: "3px solid #8ff0b0", color: "#8ff0b0" }}>
                                <strong>Catatan Admin:</strong> {ex.adminNote}
                              </div>
                            )}
                          </div>
                          <div style={{ flexShrink: 0 }}>
                            {ex.status === "PENDING" ? (
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                  className="admin-btn-ghost admin-btn-success"
                                  onClick={() => { setExchangeModal({ exchange: ex, actionStatus: "APPROVED" }); setAdminNoteInput(""); }}
                                  disabled={processingExchange === ex.id}
                                >
                                  <i className="fas fa-check" /> Setujui
                                </button>
                                <button
                                  className="admin-btn-ghost admin-btn-danger"
                                  onClick={() => { setExchangeModal({ exchange: ex, actionStatus: "REJECTED" }); setAdminNoteInput(""); }}
                                  disabled={processingExchange === ex.id}
                                >
                                  <i className="fas fa-times" /> Tolak
                                </button>
                              </div>
                            ) : (
                              <span className={`status-badge ${ex.status === "APPROVED" ? "status-approved" : "status-rejected"}`}>
                                <i className={`fas ${ex.status === "APPROVED" ? "fa-check-circle" : "fa-times-circle"}`} />
                                {ex.status === "APPROVED" ? "Disetujui" : "Ditolak"}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Confirmation Modal */}
                {exchangeModal && (
                  <div className="admin-modal-overlay" onClick={() => setExchangeModal(null)}>
                    <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
                      <h3 style={{ color: exchangeModal.actionStatus === "APPROVED" ? "#8ff0b0" : "#ff8080" }}>
                        <i className={`fas fa-${exchangeModal.actionStatus === "APPROVED" ? "check-circle" : "times-circle"}`} style={{ marginRight: "10px" }} />
                        {exchangeModal.actionStatus === "APPROVED" ? "Konfirmasi Persetujuan" : "Konfirmasi Penolakan"}
                      </h3>
                      <p className="muted" style={{ fontSize: "0.85rem", marginTop: "6px" }}>
                        {exchangeModal.actionStatus === "APPROVED"
                          ? "Setujui penukaran reward ini dan berikan catatan/resi untuk pemohon."
                          : "Tolak penukaran ini. Poin akan dikembalikan ke saldo pemohon secara otomatis."}
                      </p>
                      <div className="admin-modal-summary">
                        <div style={{ fontWeight: 700, marginBottom: "4px" }}>{exchangeModal.exchange.rewardItem?.name}</div>
                        <div style={{ color: "var(--secondary)", fontWeight: 600, fontSize: "0.88rem", marginBottom: "4px" }}>
                          Pemohon: {exchangeModal.exchange.user?.name
                            ? `${exchangeModal.exchange.user.name} (${exchangeModal.exchange.user.email})`
                            : exchangeModal.exchange.user?.email}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "rgba(255,248,240,0.45)" }}>
                          Biaya: {exchangeModal.exchange.pointsSpent.toLocaleString("id-ID")} Poin
                        </div>
                        {exchangeModal.exchange.userNote && (
                          <div style={{ marginTop: "8px", padding: "7px", background: "rgba(255,248,240,0.06)", borderRadius: "7px", fontSize: "0.82rem", color: "#fff8f0" }}>
                            Catatan User: {exchangeModal.exchange.userNote}
                          </div>
                        )}
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-label">
                          {exchangeModal.actionStatus === "APPROVED"
                            ? "Catatan / No. Resi Pengiriman (Opsional)"
                            : "Alasan Penolakan (Opsional)"}
                        </label>
                        <textarea
                          className="admin-input admin-textarea"
                          value={adminNoteInput}
                          onChange={(e) => setAdminNoteInput(e.target.value)}
                          placeholder={
                            exchangeModal.actionStatus === "APPROVED"
                              ? "Contoh: No. Resi JNE: 123456789..."
                              : "Contoh: Stok barang sedang kosong..."
                          }
                        />
                      </div>
                      <div className="admin-modal-actions">
                        <button className="admin-modal-cancel" onClick={() => setExchangeModal(null)}>
                          Batal
                        </button>
                        {exchangeModal.actionStatus === "APPROVED" ? (
                          <button
                            className="admin-modal-confirm-approve"
                            onClick={confirmExchangeAction}
                            disabled={processingExchange === exchangeModal.exchange.id}
                          >
                            {processingExchange === exchangeModal.exchange.id ? "Memproses..." : "✓ Ya, Setujui"}
                          </button>
                        ) : (
                          <button
                            className="admin-modal-confirm-reject"
                            onClick={confirmExchangeAction}
                            disabled={processingExchange === exchangeModal.exchange.id}
                          >
                            {processingExchange === exchangeModal.exchange.id ? "Memproses..." : "✗ Ya, Tolak"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════
                TAB: Edit Konten
            ════════════════════════════════════════ */}
            {activeTab === "content" && (
              <div>
                <div className="admin-section-heading">Edit Konten Web</div>
                <div className="admin-section-sub">Perbarui teks yang ditampilkan di halaman utama (CMS)</div>

                <form onSubmit={handleSaveSettings}>
                  <div className="cms-grid">
                    {/* Hero Section */}
                    <div className="admin-card">
                      <div className="cms-section-title">Hero Section</div>
                      <div className="admin-form-group">
                        <label className="admin-label">Label Kecil (Eyebrow)</label>
                        <input
                          className="admin-input"
                          type="text"
                          value={settings.heroSubtitle}
                          onChange={(e) => handleSettingChange("heroSubtitle", e.target.value)}
                          placeholder="Khas Lombok !!"
                        />
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-label">Judul Utama (H1)</label>
                        <input
                          className="admin-input"
                          type="text"
                          value={settings.heroTitle}
                          onChange={(e) => handleSettingChange("heroTitle", e.target.value)}
                          placeholder="O-Crackers Opak-Opak Ambon"
                        />
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-label">Deskripsi Singkat</label>
                        <textarea
                          className="admin-input admin-textarea"
                          value={settings.heroDescription}
                          onChange={(e) => handleSettingChange("heroDescription", e.target.value)}
                          placeholder="Deskripsi produk utama..."
                        />
                      </div>
                    </div>

                    {/* Flavor Section */}
                    <div className="admin-card">
                      <div className="cms-section-title">Rasa Section</div>
                      <div className="admin-form-group">
                        <label className="admin-label">Judul Varian Rasa</label>
                        <input
                          className="admin-input"
                          type="text"
                          value={settings.flavorTitle}
                          onChange={(e) => handleSettingChange("flavorTitle", e.target.value)}
                          placeholder="Sate Tanjung"
                        />
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-label">Subtitle Rasa</label>
                        <input
                          className="admin-input"
                          type="text"
                          value={settings.flavorSubtitle}
                          onChange={(e) => handleSettingChange("flavorSubtitle", e.target.value)}
                          placeholder="Legenda Rasa dari Lombok"
                        />
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-label">Deskripsi Keunikan Rasa</label>
                        <textarea
                          className="admin-input admin-textarea"
                          value={settings.flavorDescription}
                          onChange={(e) => handleSettingChange("flavorDescription", e.target.value)}
                          placeholder="Penjelasan keunikan varian rasa..."
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                    <button className="admin-btn-primary" type="submit" disabled={isSavingSettings} style={{ width: "auto", minWidth: "200px" }}>
                      {isSavingSettings ? (
                        <><i className="fas fa-spinner fa-spin" /> Menyimpan...</>
                      ) : (
                        <><i className="fas fa-save" /> Simpan Perubahan</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
