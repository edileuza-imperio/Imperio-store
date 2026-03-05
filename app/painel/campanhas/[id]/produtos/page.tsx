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
  // Seu endpoint listarProdutosDaCampanha retorna:
  // { dados: { produtos: [...] } } (pelo seu controller)
  // mas vou aceitar variações também:
  const lista =
    res?.data?.dados?.produtos ??
    res?.data?.produtos ??
    res?.data?.dados ??
    res?.data ??
    [];

  if (!Array.isArray(lista)) return [];

  // aceita [{id_produto: 1}] ou [1,2,3]
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
      // ✅ ROTAS CERTAS (igual seu Router PHP)
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
      const status = e?.response?.status;

      const msg =
        e?.response?.data?.mensagem ||
        e?.response?.data?.message ||
        (status === 404
          ? "Rota não encontrada (404). Confira se o servidor publicou as rotas /admin/campanha/{id}/produtos"
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
    if (!term) return produtos;
    return produtos.filter((p) => (p.nome || "").toLowerCase().includes(term));
  }, [produtos, q]);

  async function salvar() {
    if (!Number.isFinite(id) || id <= 0) return;
    setSaving(true);
    try {
      // ✅ ROTA CERTA (igual seu Router PHP)
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

  return (
    <div className="page">
      <div className="top">
        <button className="btnGhost" onClick={() => router.push("/painel/campanhas")}>
          <FiArrowLeft /> Voltar
        </button>

        <div className="title">
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

        <div className="actions">
          <div className="search">
            <FiSearch />
            <input
              placeholder="Buscar produto..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <button className="btnGhost" onClick={carregarTudo} disabled={loading}>
            <FiRefreshCw /> Atualizar
          </button>

          <button className="btnPrimary" onClick={salvar} disabled={saving || loading}>
            <FiSave /> {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panelTop">
          <span className="mini">
            {loading ? "Carregando..." : `${selecionados.length} selecionado(s)`}
          </span>
        </div>

        {loading ? (
          <div className="hint">Carregando produtos…</div>
        ) : filtrados.length === 0 ? (
          <div className="hint">Nenhum produto encontrado.</div>
        ) : (
          <div className="list">
            {filtrados.map((p) => {
              const on = selecionados.includes(p.id_produto);
              return (
                <button
                  key={p.id_produto}
                  className={`row ${on ? "on" : ""}`}
                  onClick={() => toggle(p.id_produto)}
                >
                  <span className="name">{p.nome}</span>
                  {on ? (
                    <span className="tag">
                      <FiCheck /> Selecionado
                    </span>
                  ) : (
                    <span className="tag off">Selecionar</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .page {
          padding: 28px;
          background: #f6f8fc;
          min-height: 100vh;
        }

        .top {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 12px;
          align-items: start;
          margin-bottom: 16px;
        }

        .title h1 {
          margin: 0;
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .title p {
          margin: 6px 0 0;
          color: #475569;
          font-size: 13px;
        }

        .muted {
          color: #64748b;
          font-weight: 700;
        }

        .actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .search {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(2, 6, 23, 0.06);
          min-width: 260px;
          color: #64748b;
        }

        .search input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 14px;
          color: #0f172a;
        }

        .btnPrimary,
        .btnGhost {
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 12px;
          font-weight: 800;
          transition: 0.15s ease;
          user-select: none;
          padding: 10px 12px;
        }

        .btnPrimary {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white;
          box-shadow: 0 14px 34px rgba(79, 70, 229, 0.22);
        }

        .btnPrimary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btnGhost {
          background: white;
          color: #0f172a;
          border: 1px solid #e2e8f0;
          box-shadow: 0 8px 24px rgba(2, 6, 23, 0.06);
        }

        .panel {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 14px;
          box-shadow: 0 18px 44px rgba(2, 6, 23, 0.08);
        }

        .panelTop {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 10px;
        }

        .mini {
          font-size: 12px;
          color: #64748b;
          font-weight: 800;
        }

        .hint {
          font-size: 13px;
          color: #64748b;
          padding: 10px;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .row {
          width: 100%;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 14px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: 0.15s ease;
          text-align: left;
        }

        .row:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 30px rgba(2, 6, 23, 0.08);
        }

        .row.on {
          border-color: #c7d2fe;
          background: #eef2ff;
        }

        .name {
          font-size: 14px;
          font-weight: 900;
          color: #0f172a;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(79, 70, 229, 0.12);
          color: #3730a3;
          border: 1px solid rgba(79, 70, 229, 0.18);
          font-weight: 900;
        }

        .tag.off {
          background: #f1f5f9;
          color: #334155;
          border-color: #e2e8f0;
        }

        @media (max-width: 900px) {
          .top {
            grid-template-columns: 1fr;
          }
          .actions {
            justify-content: flex-start;
          }
          .search {
            min-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}