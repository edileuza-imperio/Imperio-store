"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/Api/conectar";
import {
  FiArrowLeft,
  FiCheck,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiSave,
} from "react-icons/fi";

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
};

type Produto = {
  id_produto: number;
  nome: string;
};

function pickCampanha(res: any): Campanha | null {
  const c = res?.data?.dados ?? res?.data ?? null;
  if (!c) return null;

  const id = Number(c?.id_campanha ?? c?.id);
  if (!Number.isFinite(id) || id <= 0) return null;

  return {
    id_campanha: id,
    titulo: String(c?.titulo ?? ""),
    slug: String(c?.slug ?? ""),
  };
}

function pickProdutosLista(res: any): Produto[] {
  const lista = res?.data?.dados ?? res?.data ?? [];
  return Array.isArray(lista) ? lista : [];
}

function pickVinculosIds(res: any): number[] {
  const lista =
    res?.data?.dados?.produtos ??
    res?.data?.produtos ??
    res?.data?.dados ??
    res?.data ??
    [];

  if (!Array.isArray(lista)) return [];

  return lista
    .map((x: any) => Number(x?.id_produto ?? x))
    .filter((n: any) => Number.isFinite(n) && n > 0);
}

export default function CampanhaProdutosPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);

  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");

  async function carregarTudo() {
    if (!Number.isFinite(id) || id <= 0) return;

    setLoading(true);
    try {
      const [resCampanha, resProdutos, resVinculos] = await Promise.all([
        api.get(`/admin/campanha/${id}`).catch(() => null),
        api.get(`/admin/produtos`),
        api.get(`/admin/campanha/${id}/produtos`),
      ]);

      if (resCampanha) {
        const c = pickCampanha(resCampanha);
        if (c) setCampanha(c);
      }

      const listaProdutos = pickProdutosLista(resProdutos);
      setProdutos(listaProdutos);

      const idsVinc = pickVinculosIds(resVinculos);
      setSelecionados(idsVinc);
    } catch (e: any) {
      console.error(e);
      const status = e?.response?.status;

      const msg =
        e?.response?.data?.mensagem ||
        e?.response?.data?.message ||
        (status === 404
          ? "Rota não encontrada (404). Confira /admin/campanha/{id}/produtos"
          : "Erro ao carregar produtos da campanha");

      alert(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function toggle(idProduto: number) {
    setSelecionados((prev) =>
      prev.includes(idProduto)
        ? prev.filter((x) => x !== idProduto)
        : [...prev, idProduto]
    );
  }

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = produtos;

    if (!term) return base;

    return base.filter((p) =>
      (p.nome || "").toLowerCase().includes(term)
    );
  }, [produtos, q]);

  async function salvar() {
    if (!Number.isFinite(id) || id <= 0) return;
    setSaving(true);
    try {
      await api.post(`/admin/campanha/${id}/produtos`, {
        produtos: selecionados,
      });

      alert("Produtos salvos com sucesso!");
      await carregarTudo();
    } catch (e: any) {
      console.error(e);
      const msg =
        e?.response?.data?.mensagem ||
        e?.response?.data?.message ||
        "Erro ao salvar produtos";
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  const totalSelecionados = selecionados.length;

  return (
    <div className="page">
      {/* Top header premium */}
      <div className="hero">
        <div className="heroLeft">
          <button className="btnBack" onClick={() => router.push("/painel/campanhas")}>
            <FiArrowLeft />
          </button>

          <div className="heroTitle">
            <div className="crumbs">
              <span className="crumb" onClick={() => router.push("/painel")}>Painel</span>
              <span className="sep">/</span>
              <span className="crumb" onClick={() => router.push("/painel/campanhas")}>Campanhas</span>
              <span className="sep">/</span>
              <span className="here">Produtos</span>
            </div>

            <h1>
              <FiPackage /> Produtos da campanha
            </h1>

            <p>
              {campanha ? (
                <>
                  <strong>{campanha.titulo}</strong>{" "}
                  <span className="muted">/{campanha.slug}</span>
                </>
              ) : (
                <>Campanha #{id}</>
              )}
            </p>
          </div>
        </div>

        <div className="heroRight">
          <div className="kpi">
            <span className="kpiLabel">Selecionados</span>
            <span className="kpiValue">{loading ? "…" : totalSelecionados}</span>
          </div>

          <button className="btnGhost" onClick={carregarTudo} disabled={loading}>
            <FiRefreshCw /> Atualizar
          </button>

          <button className="btnPrimary" onClick={salvar} disabled={saving || loading}>
            <FiSave /> {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      {/* Search / toolbar */}
      <div className="toolbar">
        <div className="search">
          <FiSearch />
          <input
            placeholder="Buscar produto pelo nome..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q ? (
            <button className="clear" onClick={() => setQ("")} aria-label="Limpar busca">
              ×
            </button>
          ) : null}
        </div>

        <div className="toolbarInfo">
          <span className="badge">
            {loading ? "Carregando..." : `${filtrados.length} produto(s)`}
          </span>
          <span className="badge soft">
            {loading ? "…" : `${totalSelecionados} selecionado(s)`}
          </span>
        </div>
      </div>

      {/* Main panel */}
      <div className="panel">
        {loading ? (
          <div className="grid">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="skeletonCard">
                <div className="skLine w70" />
                <div className="skLine w45" />
                <div className="skPill" />
              </div>
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="empty">
            <div className="emptyIcon">
              <FiPackage />
            </div>
            <h3>Nenhum produto encontrado</h3>
            <p>Tente pesquisar por outro nome.</p>
          </div>
        ) : (
          <div className="grid">
            {filtrados.map((p) => {
              const on = selecionados.includes(p.id_produto);

              return (
                <button
                  key={p.id_produto}
                  className={`card ${on ? "on" : ""}`}
                  onClick={() => toggle(p.id_produto)}
                  title={p.nome}
                >
                  <div className="cardTop">
                    <span className={`check ${on ? "on" : ""}`}>
                      {on ? <FiCheck /> : null}
                    </span>

                    <span className={`status ${on ? "on" : ""}`}>
                      {on ? "Selecionado" : "Selecionar"}
                    </span>
                  </div>

                  <div className="cardName">{p.nome}</div>

                  <div className="cardMeta">
                    <span className="metaLabel">ID</span>
                    <span className="metaValue">#{p.id_produto}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .page {
          padding: 22px;
          min-height: 100vh;
          background:
            radial-gradient(900px 420px at 10% 0%, rgba(99, 102, 241, 0.12), transparent 55%),
            radial-gradient(900px 420px at 90% 10%, rgba(79, 70, 229, 0.10), transparent 55%),
            #f6f8fc;
        }

        /* HERO */
        .hero {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 16px;
          border-radius: 18px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          background: rgba(255, 255, 255, 0.78);
          backdrop-filter: blur(10px);
          box-shadow: 0 18px 44px rgba(2, 6, 23, 0.08);
          margin-bottom: 14px;
        }

        .heroLeft {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          min-width: 0;
        }

        .btnBack {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          background: #fff;
          box-shadow: 0 10px 26px rgba(2, 6, 23, 0.08);
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: 0.15s ease;
        }
        .btnBack:hover {
          transform: translateY(-1px);
        }

        .heroTitle {
          min-width: 0;
        }

        .crumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #64748b;
          font-weight: 800;
          user-select: none;
          margin-bottom: 6px;
          flex-wrap: wrap;
        }

        .crumb {
          cursor: pointer;
        }
        .crumb:hover {
          color: #0f172a;
        }

        .sep {
          color: #cbd5e1;
        }

        .here {
          color: #0f172a;
        }

        .heroTitle h1 {
          margin: 0;
          font-size: 22px;
          font-weight: 950;
          color: #0f172a;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          letter-spacing: -0.2px;
        }

        .heroTitle p {
          margin: 6px 0 0;
          font-size: 13px;
          color: #475569;
        }

        .muted {
          color: #64748b;
          font-weight: 800;
        }

        .heroRight {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .kpi {
          min-width: 160px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(2, 6, 23, 0.02);
          border: 1px solid rgba(226, 232, 240, 0.9);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .kpiLabel {
          font-size: 11px;
          font-weight: 900;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .kpiValue {
          font-size: 18px;
          font-weight: 950;
          color: #0f172a;
        }

        .btnPrimary,
        .btnGhost {
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 14px;
          font-weight: 900;
          transition: 0.15s ease;
          user-select: none;
          padding: 11px 13px;
        }

        .btnPrimary {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white;
          box-shadow: 0 16px 40px rgba(79, 70, 229, 0.22);
        }
        .btnPrimary:hover {
          transform: translateY(-1px);
        }
        .btnPrimary:disabled {
          opacity: 0.75;
          cursor: not-allowed;
          transform: none;
        }

        .btnGhost {
          background: white;
          color: #0f172a;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 26px rgba(2, 6, 23, 0.08);
        }
        .btnGhost:hover {
          transform: translateY(-1px);
        }
        .btnGhost:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        /* TOOLBAR */
        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .search {
          flex: 1;
          min-width: 260px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 12px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 12px 30px rgba(2, 6, 23, 0.06);
          color: #64748b;
          position: relative;
        }

        .search input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 14px;
          color: #0f172a;
          background: transparent;
        }

        .clear {
          border: none;
          cursor: pointer;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: #f1f5f9;
          color: #334155;
          font-weight: 900;
          display: grid;
          place-items: center;
        }

        .toolbarInfo {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .badge {
          padding: 8px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
          border: 1px solid #e2e8f0;
          background: rgba(255, 255, 255, 0.9);
          color: #0f172a;
          box-shadow: 0 10px 26px rgba(2, 6, 23, 0.06);
        }

        .badge.soft {
          background: rgba(99, 102, 241, 0.10);
          border-color: rgba(99, 102, 241, 0.22);
          color: #3730a3;
        }

        /* PANEL */
        .panel {
          border-radius: 20px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(10px);
          box-shadow: 0 20px 52px rgba(2, 6, 23, 0.10);
          padding: 14px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .card {
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 18px;
          padding: 14px;
          cursor: pointer;
          transition: 0.15s ease;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 120px;
          box-shadow: 0 10px 28px rgba(2, 6, 23, 0.06);
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 44px rgba(2, 6, 23, 0.10);
        }

        .card.on {
          border-color: rgba(99, 102, 241, 0.35);
          background: linear-gradient(180deg, #eef2ff 0%, #ffffff 60%);
        }

        .cardTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .check {
          width: 30px;
          height: 30px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          display: grid;
          place-items: center;
          color: #4f46e5;
        }

        .check.on {
          border-color: rgba(99, 102, 241, 0.35);
          background: rgba(99, 102, 241, 0.12);
        }

        .status {
          font-size: 12px;
          font-weight: 900;
          padding: 7px 10px;
          border-radius: 999px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #334155;
        }

        .status.on {
          background: rgba(99, 102, 241, 0.12);
          border-color: rgba(99, 102, 241, 0.22);
          color: #3730a3;
        }

        .cardName {
          font-size: 14px;
          font-weight: 950;
          color: #0f172a;
          line-height: 1.2;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 34px;
        }

        .cardMeta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 6px;
          border-top: 1px dashed #e2e8f0;
        }

        .metaLabel {
          font-size: 11px;
          font-weight: 900;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .metaValue {
          font-size: 12px;
          font-weight: 950;
          color: #0f172a;
        }

        /* EMPTY */
        .empty {
          padding: 34px 16px;
          text-align: center;
          color: #475569;
        }

        .emptyIcon {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          margin: 0 auto 10px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          display: grid;
          place-items: center;
          color: #4f46e5;
          box-shadow: 0 10px 26px rgba(2, 6, 23, 0.08);
        }

        .empty h3 {
          margin: 8px 0 4px;
          font-size: 16px;
          font-weight: 950;
          color: #0f172a;
        }

        .empty p {
          margin: 0;
          font-size: 13px;
          color: #64748b;
        }

        /* SKELETON */
        .skeletonCard {
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          background: linear-gradient(180deg, #ffffff, #f8fafc);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 120px;
          overflow: hidden;
          position: relative;
        }

        .skeletonCard:after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(2, 6, 23, 0.06),
            transparent
          );
          animation: shimmer 1.2s infinite;
        }

        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }

        .skLine {
          height: 12px;
          border-radius: 10px;
          background: rgba(148, 163, 184, 0.25);
        }

        .w70 { width: 70%; }
        .w45 { width: 45%; }

        .skPill {
          width: 40%;
          height: 26px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.22);
          margin-top: auto;
        }

        @media (max-width: 1100px) {
          .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }

        @media (max-width: 860px) {
          .hero { flex-direction: column; }
          .heroRight { width: 100%; justify-content: flex-start; }
          .kpi { min-width: 100%; }
          .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 520px) {
          .page { padding: 14px; }
          .grid { grid-template-columns: 1fr; }
          .search { min-width: 100%; }
        }
      `}</style>
    </div>
  );
}