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

      setProdutos(pickProdutosLista(resProdutos));
      setSelecionados(pickVinculosIds(resVinculos));
    } catch (e: any) {
      console.error(e);
      const msg =
        e?.response?.data?.mensagem ||
        e?.response?.data?.message ||
        "Erro ao carregar produtos da campanha";
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
    if (!term) return produtos;
    return produtos.filter((p) => (p.nome || "").toLowerCase().includes(term));
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

  function selecionarTodos() {
    setSelecionados(filtrados.map((p) => p.id_produto));
  }

  function limparSelecao() {
    setSelecionados([]);
  }

  return (
    <div className="page">
      {/* TOPBAR CLEAN */}
      <div className="topbar">
        <div className="left">
          <button className="iconBtn" onClick={() => router.push("/painel/campanhas")}>
            <FiArrowLeft />
          </button>

          <div className="title">
            <h1>
              <FiPackage /> Produtos da campanha
            </h1>
            <p>
              {campanha ? (
                <>
                  <span className="strong">{campanha.titulo}</span>
                  <span className="muted"> /{campanha.slug}</span>
                </>
              ) : (
                <>Campanha #{id}</>
              )}
            </p>
          </div>
        </div>

        <div className="right">
          <button className="btn" onClick={carregarTudo} disabled={loading}>
            <FiRefreshCw /> Atualizar
          </button>

          <button className="btnPrimary" onClick={salvar} disabled={saving || loading}>
            <FiSave /> {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar">
        <div className="search">
          <FiSearch />
          <input
            placeholder="Buscar produto..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q ? (
            <button className="clear" onClick={() => setQ("")} aria-label="Limpar">
              ×
            </button>
          ) : null}
        </div>

        <div className="meta">
          <span className="pill">
            {loading ? "Carregando..." : `${filtrados.length} itens`}
          </span>
          <span className="pill dark">
            {loading ? "…" : `${selecionados.length} selecionados`}
          </span>

          <button className="btnSmall" onClick={selecionarTodos} disabled={loading || filtrados.length === 0}>
            Selecionar todos
          </button>
          <button className="btnSmall" onClick={limparSelecao} disabled={loading || selecionados.length === 0}>
            Limpar
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="panel">
        {loading ? (
          <div className="grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="sk" />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="empty">
            <div className="emptyIcon">
              <FiPackage />
            </div>
            <div>
              <h3>Nenhum produto encontrado</h3>
              <p>Tente outra busca.</p>
            </div>
          </div>
        ) : (
          <div className="grid">
            {filtrados.map((p) => {
              const on = selecionados.includes(p.id_produto);
              return (
                <button
                  key={p.id_produto}
                  className={`item ${on ? "on" : ""}`}
                  onClick={() => toggle(p.id_produto)}
                >
                  <div className={`box ${on ? "on" : ""}`}>
                    {on ? <FiCheck /> : null}
                  </div>

                  <div className="info">
                    <div className="name">{p.nome}</div>
                    <div className="sub">ID #{p.id_produto}</div>
                  </div>

                  <div className={`tag ${on ? "on" : ""}`}>
                    {on ? "Selecionado" : "Selecionar"}
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
          background: #f4f6f9;
        }

        /* TOPBAR */
        .topbar {
          background: #fff;
          border: 1px solid #e6eaf0;
          border-radius: 12px;
          padding: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 12px;
        }

        .left {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          min-width: 0;
        }

        .iconBtn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1px solid #e6eaf0;
          background: #fff;
          cursor: pointer;
          display: grid;
          place-items: center;
        }

        .title {
          min-width: 0;
        }

        .title h1 {
          margin: 0;
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .title p {
          margin: 6px 0 0;
          font-size: 13px;
          color: #475569;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 520px;
        }

        .strong {
          font-weight: 900;
          color: #0f172a;
        }

        .muted {
          color: #64748b;
          font-weight: 700;
        }

        .right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .btn,
        .btnPrimary {
          border: 1px solid #e6eaf0;
          background: #fff;
          color: #0f172a;
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btnPrimary {
          border-color: #4f46e5;
          background: #4f46e5;
          color: #fff;
        }

        .btn:disabled,
        .btnPrimary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* TOOLBAR */
        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .search {
          flex: 1;
          min-width: 260px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fff;
          border: 1px solid #e6eaf0;
          border-radius: 12px;
          padding: 12px;
        }

        .search input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 14px;
          color: #0f172a;
        }

        .clear {
          border: none;
          background: #f1f5f9;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          cursor: pointer;
          font-weight: 900;
          color: #334155;
        }

        .meta {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .pill {
          padding: 8px 10px;
          border-radius: 999px;
          background: #fff;
          border: 1px solid #e6eaf0;
          font-size: 12px;
          font-weight: 900;
          color: #0f172a;
        }

        .pill.dark {
          background: #0f172a;
          color: #fff;
          border-color: #0f172a;
        }

        .btnSmall {
          border: 1px solid #e6eaf0;
          background: #fff;
          padding: 9px 10px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 900;
          color: #0f172a;
          font-size: 12px;
        }

        .btnSmall:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* PANEL */
        .panel {
          background: #fff;
          border: 1px solid #e6eaf0;
          border-radius: 12px;
          padding: 14px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .item {
          width: 100%;
          text-align: left;
          border: 1px solid #e6eaf0;
          background: #fff;
          border-radius: 12px;
          padding: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: space-between;
          transition: 0.12s ease;
        }

        .item:hover {
          border-color: #cbd5e1;
          box-shadow: 0 10px 24px rgba(2, 6, 23, 0.06);
          transform: translateY(-1px);
        }

        .item.on {
          border-color: #4f46e5;
          background: #f7f7ff;
        }

        .box {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid #e6eaf0;
          display: grid;
          place-items: center;
          color: #4f46e5;
          background: #fff;
          flex: 0 0 auto;
        }

        .box.on {
          border-color: #4f46e5;
          background: #eef2ff;
        }

        .info {
          flex: 1;
          min-width: 0;
        }

        .name {
          font-size: 14px;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sub {
          margin-top: 4px;
          font-size: 12px;
          color: #64748b;
          font-weight: 700;
        }

        .tag {
          flex: 0 0 auto;
          font-size: 12px;
          font-weight: 900;
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid #e6eaf0;
          background: #f1f5f9;
          color: #334155;
        }

        .tag.on {
          border-color: rgba(79, 70, 229, 0.35);
          background: #eef2ff;
          color: #3730a3;
        }

        .empty {
          padding: 22px;
          display: flex;
          align-items: center;
          gap: 14px;
          color: #475569;
        }

        .emptyIcon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          border: 1px solid #e6eaf0;
          display: grid;
          place-items: center;
          color: #4f46e5;
          background: #fff;
        }

        .empty h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 900;
          color: #0f172a;
        }

        .empty p {
          margin: 4px 0 0;
          font-size: 13px;
          color: #64748b;
        }

        .sk {
          height: 64px;
          border-radius: 12px;
          border: 1px solid #e6eaf0;
          background: linear-gradient(90deg, #f1f5f9, #ffffff, #f1f5f9);
          background-size: 200% 100%;
          animation: sk 1.1s infinite linear;
        }

        @keyframes sk {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }

        @media (max-width: 980px) {
          .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .title p { max-width: 360px; }
        }

        @media (max-width: 520px) {
          .page { padding: 14px; }
          .grid { grid-template-columns: 1fr; }
          .title p { max-width: 240px; }
          .right { width: 100%; justify-content: flex-start; }
        }
      `}</style>
    </div>
  );
}