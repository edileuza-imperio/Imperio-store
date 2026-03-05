"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import { FiTrash2, FiTag, FiPlus, FiX, FiSearch } from "react-icons/fi";

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string;
  statusid: number;
};

type Produto = {
  id_produto: number;
  nome: string;
};

export default function CampanhasPage() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [slug, setSlug] = useState("");
  const [descricao, setDescricao] = useState("");

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosSelecionados, setProdutosSelecionados] = useState<number[]>([]);
  const [buscaProduto, setBuscaProduto] = useState("");

  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [saving, setSaving] = useState(false);

  // ==============================
  // CARREGAR CAMPANHAS
  // ==============================
  async function carregarCampanhas() {
    try {
      setLoading(true);

      const res = await api.get("/admin/campanhas");

      const lista =
        res?.data?.dados?.campanhas ??
        res?.data?.dados ??
        res?.data ??
        [];

      setCampanhas(Array.isArray(lista) ? lista : []);
    } catch (err) {
      console.error("Erro campanhas:", err);
      setCampanhas([]);
    } finally {
      setLoading(false);
    }
  }

  // ==============================
  // CARREGAR PRODUTOS
  // ==============================
  async function carregarProdutos() {
    try {
      setLoadingProdutos(true);

      const res = await api.get("/admin/produtos");
      const data = res?.data?.dados ?? res?.data ?? [];

      setProdutos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro produtos:", err);
      setProdutos([]);
    } finally {
      setLoadingProdutos(false);
    }
  }

  useEffect(() => {
    carregarCampanhas();
  }, []);

  // ==============================
  // REMOVER CAMPANHA
  // ==============================
  async function remover(id: number) {
    if (!confirm("Remover campanha?")) return;

    try {
      await api.delete(`/admin/campanhas/${id}`);
      carregarCampanhas();
    } catch (err) {
      console.error(err);
    }
  }

  // ==============================
  // MODAL OPEN/CLOSE
  // ==============================
  function abrirModal() {
    setOpenModal(true);

    // carrega produtos quando abrir (se ainda não carregou)
    if (produtos.length === 0) carregarProdutos();
  }

  function fecharModal() {
    setOpenModal(false);

    setTitulo("");
    setSlug("");
    setDescricao("");
    setProdutosSelecionados([]);
    setBuscaProduto("");
  }

  // trava scroll do body com modal aberto + ESC para fechar
  useEffect(() => {
    if (!openModal) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fecharModal();
    };

    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openModal]);

  // ==============================
  // PRODUTOS: filtro + toggle
  // ==============================
  function toggleProduto(id: number) {
    setProdutosSelecionados((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  const produtosFiltrados = useMemo(() => {
    const term = buscaProduto.trim().toLowerCase();
    if (!term) return produtos;

    return produtos.filter((p) => p.nome.toLowerCase().includes(term));
  }, [buscaProduto, produtos]);

  // ==============================
  // CRIAR CAMPANHA
  // ==============================
  async function criarCampanha() {
    if (!titulo.trim() || !slug.trim()) {
      alert("Preencha título e slug");
      return;
    }

    try {
      setSaving(true);

      const res = await api.post("/admin/campanhas", {
        titulo: titulo.trim(),
        slug: slug.trim(),
        descricao: descricao.trim() || null,
        statusid: 3,
      });

      const id = res?.data?.dados?.id_campanha;

      if (id && produtosSelecionados.length > 0) {
        // seu backend usa /admin/campanha/{id}/produtos (singular "campanha")
        await api.post(`/admin/campanha/${id}/produtos`, {
          produtos: produtosSelecionados,
        });
      }

      fecharModal();
      carregarCampanhas();
    } catch (err) {
      console.error("Erro criar campanha:", err);
      alert("Erro ao criar campanha. Veja o console.");
    } finally {
      setSaving(false);
    }
  }

  // ==============================
  // RENDER
  // ==============================
  return (
    <div className="pageWrap">
      {/* Header */}
      <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
        <div>
          <h1 className="m-0 title">Campanhas</h1>
          <p className="m-0 subtitle">Gerencie campanhas promocionais do painel</p>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-primary btn-sm px-3 btnNew" onClick={abrirModal}>
            <FiPlus /> <span>Nova campanha</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="contentCard">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <div className="d-flex align-items-center gap-2">
            <span className="badge text-bg-dark badgeSoft">
              {loading ? "..." : campanhas.length} campanhas
            </span>
          </div>

          <div className="small text-muted">
            {loading ? "Carregando lista..." : "Tudo pronto ✅"}
          </div>
        </div>

        {loading && (
          <div className="skeletonGrid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeletonCard" />
            ))}
          </div>
        )}

        {!loading && campanhas.length === 0 && (
          <div className="emptyState">
            <div className="emptyIcon">
              <FiTag />
            </div>
            <h3>Nenhuma campanha criada</h3>
            <p>Crie a primeira campanha para organizar promoções e vitrines.</p>
            <button className="btn btn-primary btn-sm px-3" onClick={abrirModal}>
              <FiPlus /> Criar campanha
            </button>
          </div>
        )}

        {!loading && campanhas.length > 0 && (
          <div className="grid">
            {Array.isArray(campanhas) &&
              campanhas.map((c) => (
                <div key={c.id_campanha} className="campCard">
                  <div className="campTop">
                    <div className="campIcon">
                      <FiTag />
                    </div>

                    <button
                      className="btn btn-outline-danger btn-sm btnIcon"
                      onClick={() => remover(c.id_campanha)}
                      title="Remover campanha"
                    >
                      <FiTrash2 />
                    </button>
                  </div>

                  <div className="campBody">
                    <div className="campTitle" title={c.titulo}>
                      {c.titulo}
                    </div>

                    <div className="campSlug" title={c.slug}>
                      /{c.slug}
                    </div>

                    {c.descricao ? (
                      <div className="campDesc">{c.descricao}</div>
                    ) : (
                      <div className="campDesc muted">Sem descrição</div>
                    )}
                  </div>

                  <div className="campFooter">
                    <span className="badge text-bg-light border badgePill">
                      ID: {c.id_campanha}
                    </span>
                    <span className="badge text-bg-success badgePill">Ativa</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {openModal && (
        <div className="modalOverlay" onMouseDown={fecharModal}>
          <div
            className="modalDialog"
            onMouseDown={(e) => e.stopPropagation()} // não fecha ao clicar dentro
            role="dialog"
            aria-modal="true"
          >
            <div className="modalHeader">
              <div>
                <div className="modalTitle">Criar campanha</div>
                <div className="modalSub">Defina título, slug e vincule produtos</div>
              </div>

              <button className="btn btn-light btn-sm btnIcon" onClick={fecharModal}>
                <FiX />
              </button>
            </div>

            <div className="modalBody">
              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <label className="form-label mb-1">Título</label>
                  <input
                    className="form-control"
                    placeholder="Ex: Black Friday"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label mb-1">Slug</label>
                  <input
                    className="form-control"
                    placeholder="ex: black-friday"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label mb-1">Descrição</label>
                  <textarea
                    className="form-control"
                    placeholder="Opcional..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="prodBox mt-3">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                  <div className="fw-semibold">Produtos</div>

                  <span className="badge text-bg-primary badgePill">
                    Selecionados: {produtosSelecionados.length}
                  </span>
                </div>

                <div className="prodSearch">
                  <FiSearch />
                  <input
                    className="form-control"
                    placeholder="Buscar produto..."
                    value={buscaProduto}
                    onChange={(e) => setBuscaProduto(e.target.value)}
                  />
                </div>

                <div className="prodList">
                  {loadingProdutos && (
                    <div className="text-muted small py-2">Carregando produtos...</div>
                  )}

                  {!loadingProdutos && produtosFiltrados.length === 0 && (
                    <div className="text-muted small py-2">Nenhum produto encontrado.</div>
                  )}

                  {!loadingProdutos &&
                    produtosFiltrados.map((p) => {
                      const checked = produtosSelecionados.includes(p.id_produto);

                      return (
                        <label key={p.id_produto} className="prodRow">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleProduto(p.id_produto)}
                          />
                          <span className="prodName">{p.nome}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="modalFooter">
              <button className="btn btn-light" onClick={fecharModal}>
                Cancelar
              </button>

              <button
                className="btn btn-primary"
                onClick={criarCampanha}
                disabled={saving}
              >
                {saving ? "Criando..." : "Criar campanha"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS PURO (com bootstrap classes usando também) */}
      <style jsx>{`
        .pageWrap {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .title {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #0f172a;
        }

        .subtitle {
          margin-top: 6px;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
        }

        .btnNew {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 12px;
          box-shadow: 0 10px 28px rgba(124, 58, 237, 0.18);
        }

        .contentCard {
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 10px 30px rgba(2, 6, 23, 0.06);
        }

        .badgeSoft {
          border-radius: 999px;
          padding: 8px 10px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 14px;
        }

        .campCard {
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 16px;
          padding: 16px;
          background: linear-gradient(180deg, #ffffff, #fbfbff);
          box-shadow: 0 12px 30px rgba(2, 6, 23, 0.06);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 170px;
        }

        .campCard:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 44px rgba(2, 6, 23, 0.1);
        }

        .campTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .campIcon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #7c3aed, #9333ea);
          color: #fff;
          box-shadow: 0 10px 22px rgba(124, 58, 237, 0.28);
        }

        .btnIcon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: inline-grid;
          place-items: center;
          padding: 0;
        }

        .campBody {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .campTitle {
          font-weight: 900;
          color: #0f172a;
          font-size: 16px;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .campSlug {
          font-size: 12.5px;
          font-weight: 800;
          color: #6d28d9;
          background: rgba(109, 40, 217, 0.08);
          border: 1px solid rgba(109, 40, 217, 0.16);
          padding: 6px 10px;
          border-radius: 999px;
          width: fit-content;
        }

        .campDesc {
          font-size: 13px;
          color: #475569;
          font-weight: 600;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .campDesc.muted {
          color: #94a3b8;
        }

        .campFooter {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }

        .badgePill {
          border-radius: 999px;
          padding: 7px 10px;
          font-weight: 800;
        }

        /* Skeleton */
        .skeletonGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 14px;
        }

        .skeletonCard {
          height: 170px;
          border-radius: 16px;
          background: linear-gradient(
            90deg,
            rgba(15, 23, 42, 0.06),
            rgba(15, 23, 42, 0.03),
            rgba(15, 23, 42, 0.06)
          );
          background-size: 200% 100%;
          animation: shimmer 1.2s infinite linear;
          border: 1px solid rgba(15, 23, 42, 0.06);
        }

        @keyframes shimmer {
          0% {
            background-position: 0% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        /* Empty */
        .emptyState {
          border: 1px dashed rgba(15, 23, 42, 0.18);
          border-radius: 16px;
          padding: 28px;
          display: grid;
          place-items: center;
          text-align: center;
          gap: 10px;
          background: rgba(15, 23, 42, 0.02);
        }

        .emptyIcon {
          width: 54px;
          height: 54px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: rgba(124, 58, 237, 0.12);
          color: #6d28d9;
          border: 1px solid rgba(124, 58, 237, 0.18);
        }

        .emptyState h3 {
          margin: 0;
          font-weight: 900;
          color: #0f172a;
        }

        .emptyState p {
          margin: 0;
          max-width: 420px;
          color: #64748b;
          font-weight: 600;
        }

        /* Modal overlay + dialog CENTRALIZADO */
        .modalOverlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.58);
          z-index: 9999;

          display: flex;
          align-items: center; /* ✅ central vertical */
          justify-content: center; /* ✅ central horizontal */

          padding: 16px;
        }

        .modalDialog {
          width: min(760px, 100%);
          max-height: 90vh;

          background: #fff;
          border-radius: 16px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          box-shadow: 0 30px 100px rgba(2, 6, 23, 0.35);

          display: flex;
          flex-direction: column;

          transform: translateZ(0); /* evita bug visual */
        }

        .modalHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;

          padding: 16px 16px 12px;
          border-bottom: 1px solid rgba(15, 23, 42, 0.08);
        }

        .modalTitle {
          font-weight: 900;
          color: #0f172a;
          font-size: 18px;
          line-height: 1.1;
        }

        .modalSub {
          margin-top: 4px;
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
        }

        .modalBody {
          padding: 14px 16px;
          overflow: auto; /* ✅ scroll interno */
        }

        .modalFooter {
          padding: 12px 16px 16px;
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        /* Produtos box */
        .prodBox {
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 14px;
          padding: 12px;
          background: rgba(15, 23, 42, 0.02);
        }

        .prodSearch {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 12px;
          background: #fff;
          margin-bottom: 10px;
        }

        .prodSearch :global(svg) {
          color: #64748b;
        }

        .prodSearch :global(input) {
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }

        .prodList {
          max-height: 260px;
          overflow: auto;
          padding-right: 4px;
        }

        .prodRow {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 10px;
          border-radius: 12px;
          cursor: pointer;
          user-select: none;
          background: #fff;
          border: 1px solid rgba(15, 23, 42, 0.06);
          margin-bottom: 8px;
        }

        .prodRow:hover {
          border-color: rgba(124, 58, 237, 0.25);
          box-shadow: 0 10px 26px rgba(2, 6, 23, 0.06);
        }

        .prodName {
          font-weight: 700;
          color: #0f172a;
          font-size: 13.5px;
        }

        /* Scrollbar (suave) */
        .prodList::-webkit-scrollbar,
        .modalBody::-webkit-scrollbar {
          width: 8px;
        }

        .prodList::-webkit-scrollbar-thumb,
        .modalBody::-webkit-scrollbar-thumb {
          background: rgba(15, 23, 42, 0.14);
          border-radius: 999px;
        }

        @media (max-width: 520px) {
          .modalDialog {
            max-height: 92vh;
          }
        }
      `}</style>
    </div>
  );
}