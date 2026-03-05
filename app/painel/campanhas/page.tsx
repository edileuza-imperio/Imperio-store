"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import {
  FiTrash2,
  FiTag,
  FiPlus,
  FiX,
  FiSearch,
  FiCheck,
} from "react-icons/fi";

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

  // modal
  const [openModal, setOpenModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // form campanha
  const [titulo, setTitulo] = useState("");
  const [slug, setSlug] = useState("");
  const [descricao, setDescricao] = useState("");

  // produtos (opcional)
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [qProd, setQProd] = useState("");
  const [produtosSelecionados, setProdutosSelecionados] = useState<number[]>([]);

  async function carregarCampanhas() {
    try {
      setLoading(true);
      const res = await api.get("/admin/campanhas");
      const lista = res?.data?.dados?.campanhas ?? [];
      setCampanhas(lista);
    } catch (err) {
      console.error("Erro campanhas", err);
    } finally {
      setLoading(false);
    }
  }

  async function carregarProdutos() {
    try {
      setLoadingProdutos(true);
      const res = await api.get("/admin/produtos");
      setProdutos(res?.data ?? []);
    } catch (err) {
      console.error("Erro produtos", err);
      setProdutos([]);
    } finally {
      setLoadingProdutos(false);
    }
  }

  useEffect(() => {
    carregarCampanhas();
  }, []);

  async function remover(id: number) {
    if (!confirm("Remover campanha?")) return;

    try {
      await api.delete(`/admin/campanhas/${id}`);
      carregarCampanhas();
    } catch (err) {
      console.error(err);
    }
  }

  function abrirModal() {
    setOpenModal(true);

    // carrega produtos só quando abre (pra não pesar a página)
    if (produtos.length === 0) carregarProdutos();
  }

  function fecharModal() {
    setOpenModal(false);
    setSaving(false);

    // reset form
    setTitulo("");
    setSlug("");
    setDescricao("");
    setQProd("");
    setProdutosSelecionados([]);
  }

  function toggleProduto(id: number) {
    setProdutosSelecionados((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  const produtosFiltrados = useMemo(() => {
    const t = qProd.trim().toLowerCase();
    if (!t) return produtos;
    return produtos.filter((p) => p.nome.toLowerCase().includes(t));
  }, [produtos, qProd]);

  async function criarCampanha() {
    const t = titulo.trim();
    const s = slug.trim();

    if (!t || !s) {
      alert("Preencha Título e Slug.");
      return;
    }

    try {
      setSaving(true);

      // cria campanha
      const res = await api.post("/admin/campanhas", {
        titulo: t,
        slug: s,
        descricao: descricao?.trim() || null,
        statusid: 3,
      });

      const id = res?.data?.dados?.id_campanha;

      // vincula produtos (opcional)
      if (id && produtosSelecionados.length > 0) {
        await api.post(`/admin/campanha/${id}/produtos`, {
          produtos: produtosSelecionados,
          ordem_inicial: 1,
        });
      }

      await carregarCampanhas();
      fecharModal();
    } catch (err) {
      console.error("Erro criar campanha", err);
      alert("Erro ao criar campanha. Veja o console.");
      setSaving(false);
    }
  }

  return (
    <div className="container">
      <div className="headerRow">
        <div className="header">
          <h1>Campanhas</h1>
          <p>Gerencie campanhas promocionais</p>
        </div>

        <button className="primary" onClick={abrirModal}>
          <FiPlus /> Nova campanha
        </button>
      </div>

      <div className="grid">
        {loading && <p>Carregando...</p>}

        {!loading && campanhas.length === 0 && <p>Nenhuma campanha criada</p>}

        {campanhas.map((c) => (
          <div key={c.id_campanha} className="campanhaCard">
            <div className="top">
              <div className="icon">
                <FiTag size={20} />
              </div>

              <button className="danger" onClick={() => remover(c.id_campanha)}>
                <FiTrash2 />
              </button>
            </div>

            <h3>{c.titulo}</h3>
            <p className="slug">{c.slug}</p>

            {c.descricao && <p className="desc">{c.descricao}</p>}
          </div>
        ))}
      </div>

      {/* MODAL */}
      {openModal && (
        <>
          <button
            type="button"
            className="overlay"
            aria-label="Fechar modal"
            onClick={fecharModal}
          />

          <div className="modal" role="dialog" aria-modal="true">
            <div className="modalTop">
              <div>
                <h2>Criar campanha</h2>
                <p>Preencha os dados e opcionalmente selecione produtos.</p>
              </div>

              <button className="iconBtn" onClick={fecharModal} title="Fechar">
                <FiX />
              </button>
            </div>

            <div className="form">
              <div className="row2">
                <div className="field">
                  <label>Título</label>
                  <input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Promoção de Março"
                    disabled={saving}
                  />
                </div>

                <div className="field">
                  <label>Slug</label>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="ex: promocao-marco"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="field">
                <label>Descrição</label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Opcional..."
                  disabled={saving}
                />
              </div>

              <div className="productsBox">
                <div className="productsTop">
                  <div>
                    <h3>Produtos (opcional)</h3>
                    <p>
                      Selecionados: <b>{produtosSelecionados.length}</b>
                    </p>
                  </div>

                  <div className="search">
                    <FiSearch className="sicon" />
                    <input
                      value={qProd}
                      onChange={(e) => setQProd(e.target.value)}
                      placeholder="Buscar produto..."
                      disabled={saving || loadingProdutos}
                    />
                  </div>
                </div>

                <div className="productsList">
                  {loadingProdutos && <p className="muted">Carregando produtos...</p>}

                  {!loadingProdutos && produtosFiltrados.length === 0 && (
                    <p className="muted">Nenhum produto encontrado.</p>
                  )}

                  {!loadingProdutos &&
                    produtosFiltrados.map((p) => {
                      const checked = produtosSelecionados.includes(p.id_produto);
                      return (
                        <button
                          type="button"
                          key={p.id_produto}
                          className={`pItem ${checked ? "checked" : ""}`}
                          onClick={() => toggleProduto(p.id_produto)}
                          disabled={saving}
                        >
                          <span className="check">
                            {checked ? <FiCheck /> : null}
                          </span>
                          <span className="pName">{p.nome}</span>
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="actions">
                <button className="ghost" onClick={fecharModal} disabled={saving}>
                  Cancelar
                </button>

                <button className="primary" onClick={criarCampanha} disabled={saving}>
                  {saving ? "Criando..." : "Criar campanha"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .headerRow {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }

        .header h1 {
          font-size: 28px;
          font-weight: 800;
        }

        .header p {
          color: #64748b;
          font-size: 14px;
          margin-top: 6px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 18px;
        }

        .campanhaCard {
          background: linear-gradient(180deg, #fff, #fafafa);
          border-radius: 16px;
          padding: 22px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: 0.25s;
        }

        .campanhaCard:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.12);
        }

        .top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .icon {
          width: 40px;
          height: 40px;
          background: #7c3aed;
          color: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 18px rgba(124, 58, 237, 0.22);
        }

        .slug {
          font-size: 13px;
          color: #64748b;
        }

        .desc {
          font-size: 14px;
          color: #444;
          line-height: 1.4;
        }

        /* buttons */
        .primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 12px;
          border: none;
          background: #7c3aed;
          color: #fff;
          cursor: pointer;
          font-weight: 800;
          box-shadow: 0 10px 22px rgba(124, 58, 237, 0.22);
          transition: 0.18s;
          white-space: nowrap;
        }
        .primary:hover {
          transform: translateY(-1px);
          background: #6d28d9;
        }
        .ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: #fff;
          color: #111827;
          cursor: pointer;
          font-weight: 800;
          transition: 0.18s;
        }
        .ghost:hover {
          transform: translateY(-1px);
          background: #f8fafc;
        }
        .danger {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 12px;
          border: none;
          background: rgba(239, 68, 68, 0.95);
          color: #fff;
          cursor: pointer;
          transition: 0.18s;
        }
        .danger:hover {
          transform: translateY(-1px);
          filter: brightness(0.95);
        }

        /* modal */
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.6);
          border: none;
          z-index: 9998;
        }

        .modal {
          position: fixed;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: min(920px, calc(100vw - 28px));
          max-height: calc(100vh - 28px);
          overflow: auto;
          z-index: 9999;

          background: #fff;
          border-radius: 18px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
          padding: 18px;
        }

        .modalTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          margin-bottom: 12px;
        }

        .modalTop h2 {
          font-size: 18px;
          font-weight: 900;
        }

        .modalTop p {
          margin-top: 6px;
          font-size: 13px;
          color: #64748b;
        }

        .iconBtn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: #fff;
          cursor: pointer;
          display: inline-grid;
          place-items: center;
          transition: 0.18s;
        }
        .iconBtn:hover {
          transform: translateY(-1px);
          background: #f8fafc;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .row2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field label {
          font-size: 12px;
          font-weight: 900;
          color: #111827;
        }

        .field input,
        .field textarea {
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          outline: none;
          font-weight: 800;
        }

        .field textarea {
          min-height: 90px;
          resize: vertical;
          font-weight: 700;
        }

        .productsBox {
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 16px;
          padding: 14px;
          background: #fafafa;
        }

        .productsTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }

        .productsTop h3 {
          font-size: 14px;
          font-weight: 900;
        }

        .productsTop p {
          margin-top: 4px;
          font-size: 12px;
          color: #64748b;
          font-weight: 800;
        }

        .search {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 12px;
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          min-width: 260px;
        }

        .sicon {
          color: #64748b;
        }

        .search input {
          width: 100%;
          border: none;
          outline: none;
          font-weight: 800;
        }

        .productsList {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 10px;
          max-height: 260px;
          overflow: auto;
          padding-right: 4px;
        }

        .pItem {
          width: 100%;
          text-align: left;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: 0.16s;
        }

        .pItem:hover {
          transform: translateY(-1px);
          background: #f8fafc;
        }

        .pItem.checked {
          border-color: rgba(124, 58, 237, 0.35);
          box-shadow: 0 12px 24px rgba(124, 58, 237, 0.12);
        }

        .check {
          width: 26px;
          height: 26px;
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          display: inline-grid;
          place-items: center;
          color: #7c3aed;
          background: rgba(124, 58, 237, 0.08);
          flex: 0 0 auto;
        }

        .pName {
          font-weight: 900;
          color: #111827;
          font-size: 13px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .muted {
          color: #64748b;
          font-weight: 800;
          font-size: 13px;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          margin-top: 4px;
        }

        @media (max-width: 820px) {
          .row2 {
            grid-template-columns: 1fr;
          }
          .productsTop {
            flex-direction: column;
            align-items: stretch;
          }
          .search {
            min-width: 0;
          }
        }
      `}</style>
    </div>
  );
}