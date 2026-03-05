"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import {
  FiPlus,
  FiTrash2,
  FiPackage,
  FiX,
  FiSearch,
  FiRefreshCw,
  FiCalendar,
  FiLink,
  FiInfo,
  FiCheck,
} from "react-icons/fi";

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string;
  banner?: string;
  inicio?: string;
  fim?: string;
  statusid?: number;
};

type Produto = {
  id_produto: number;
  nome: string;
};

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatDateTimeBR(value?: string) {
  if (!value) return "";
  const iso = value.includes("T") ? value : value.replace(" ", "T");
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export default function CampanhasPage() {
  const router = useRouter();

  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const [loadingCampanhas, setLoadingCampanhas] = useState(false);
  const [loadingProdutos, setLoadingProdutos] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [q, setQ] = useState("");

  // form campanha
  const [titulo, setTitulo] = useState("");
  const [slug, setSlug] = useState("");
  const [descricao, setDescricao] = useState("");
  const [banner, setBanner] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [salvandoCampanha, setSalvandoCampanha] = useState(false);

  // seleção de produtos só no cadastro (continua aqui)
  const [produtosSelecionados, setProdutosSelecionados] = useState<number[]>([]);

  async function carregarCampanhas() {
    setLoadingCampanhas(true);
    try {
      const res = await api.get("/admin/campanhas");
      const lista =
        res?.data?.dados?.campanhas ??
        res?.data?.dados ??
        res?.data ??
        [];
      setCampanhas(Array.isArray(lista) ? lista : []);
    } catch (e) {
      console.error(e);
      alert("Erro ao carregar campanhas");
    } finally {
      setLoadingCampanhas(false);
    }
  }

  async function carregarProdutos() {
    setLoadingProdutos(true);
    try {
      const res = await api.get("/admin/produtos");
      const lista = res?.data?.dados ?? res?.data ?? [];
      setProdutos(Array.isArray(lista) ? lista : []);
    } catch (e) {
      console.error(e);
      alert("Erro ao carregar produtos");
    } finally {
      setLoadingProdutos(false);
    }
  }

  useEffect(() => {
    carregarCampanhas();
    carregarProdutos();
  }, []);

  function resetForm() {
    setTitulo("");
    setSlug("");
    setDescricao("");
    setBanner("");
    setInicio("");
    setFim("");
    setProdutosSelecionados([]);
  }

  async function criarCampanha() {
    if (!titulo.trim()) return alert("Informe o título");
    if (!slug.trim()) return alert("Informe o slug");

    setSalvandoCampanha(true);
    try {
      const payload = {
        titulo: titulo.trim(),
        slug: slug.trim(),
        descricao: descricao?.trim() || null,
        banner: banner?.trim() || null,
        inicio: inicio || null,
        fim: fim || null,
        statusid: 3,
      };

      const res = await api.post("/admin/campanhas", payload);

      const id =
        res?.data?.dados?.id_campanha ??
        res?.data?.dados?.id ??
        res?.data?.id_campanha;

      if (id && produtosSelecionados.length > 0) {
        await api.post(`/admin/campanha/${id}/produtos`, {
          produtos: produtosSelecionados,
        });
      }

      setOpenModal(false);
      resetForm();
      await carregarCampanhas();
    } catch (e: any) {
      console.error(e);
      const msg =
        e?.response?.data?.mensagem ||
        e?.response?.data?.message ||
        "Erro ao criar campanha";
      alert(msg);
    } finally {
      setSalvandoCampanha(false);
    }
  }

  async function removerCampanha(id: number) {
    if (!confirm("Remover campanha?")) return;
    try {
      await api.delete(`/admin/campanhas/${id}`);
      await carregarCampanhas();
    } catch (e) {
      console.error(e);
      alert("Erro ao remover campanha");
    }
  }

  function toggleProduto(id: number) {
    setProdutosSelecionados((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  const campanhasFiltradas = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return campanhas;
    return campanhas.filter((c) => {
      const a = (c.titulo || "").toLowerCase();
      const b = (c.slug || "").toLowerCase();
      return a.includes(term) || b.includes(term);
    });
  }, [campanhas, q]);

  // slug automático ao digitar título
  useEffect(() => {
    if (!openModal) return;
    if (!titulo) return;
    const auto = slugify(titulo);
    if (!slug || slug === slugify(slug)) {
      setSlug(auto);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titulo, openModal]);

  return (
    <div className="page">
      <div className="header">
        <div className="headerLeft">
          <div className="titleRow">
            <h1>Campanhas</h1>
            <span className="badge">{campanhas.length}</span>
          </div>
          <p className="subtitle">Gerencie campanhas promocionais e vincule produtos.</p>
        </div>

        <div className="headerRight">
          <div className="search">
            <FiSearch className="searchIcon" />
            <input
              placeholder="Buscar por título ou slug..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <button className="btnGhost" onClick={carregarCampanhas} disabled={loadingCampanhas}>
            <FiRefreshCw />
            Atualizar
          </button>

          <button className="btnPrimary" onClick={() => setOpenModal(true)}>
            <FiPlus /> Nova campanha
          </button>
        </div>
      </div>

      {loadingCampanhas ? (
        <div className="skeletonGrid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeletonCard" />
          ))}
        </div>
      ) : campanhasFiltradas.length === 0 ? (
        <div className="empty">
          <div className="emptyIcon">
            <FiInfo />
          </div>
          <h3>Nenhuma campanha encontrada</h3>
          <p>Tente mudar a busca ou crie uma nova campanha.</p>
          <button className="btnPrimary" onClick={() => setOpenModal(true)}>
            <FiPlus /> Criar campanha
          </button>
        </div>
      ) : (
        <div className="grid">
          {campanhasFiltradas.map((c) => (
            <div key={c.id_campanha} className="card">
              <div className="cardTop">
                <div className="cardTitle">
                  <h3 title={c.titulo}>{c.titulo}</h3>
                  <span className="slug">
                    <FiLink /> /{c.slug}
                  </span>
                </div>

                <button className="btnIconDanger" onClick={() => removerCampanha(c.id_campanha)} title="Remover">
                  <FiTrash2 />
                </button>
              </div>

              <p className="desc">{c.descricao?.trim() ? c.descricao : "Sem descrição"}</p>

              <div className="meta">
                <div className="metaItem">
                  <FiCalendar />
                  <span>
                    {c.inicio ? formatDateTimeBR(c.inicio) : "Sem início"}
                    {" • "}
                    {c.fim ? formatDateTimeBR(c.fim) : "Sem fim"}
                  </span>
                </div>
                {c.banner?.trim() ? (
                  <div className="metaBanner" title={c.banner}>
                    {c.banner}
                  </div>
                ) : null}
              </div>

              <div className="cardActions">
                {/* ✅ AGORA VAI PRA OUTRA PÁGINA */}
                <button
                  className="btnSoft"
                  onClick={() => router.push(`/painel/campanhas/${c.id_campanha}/produtos`)}
                >
                  <FiPackage /> Produtos
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CRIAR CAMPANHA (overlay arrumado) */}
      {openModal && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modalHeader">
              <div>
                <h2>Criar campanha</h2>
                <p>Defina título, slug, período e selecione produtos.</p>
              </div>

              <button className="btnIcon" onClick={() => setOpenModal(false)} aria-label="Fechar">
                <FiX />
              </button>
            </div>

            <div className="modalBody">
              <div className="formGrid">
                <div className="field">
                  <label>Título</label>
                  <input
                    placeholder="Ex: Semana do Cliente"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Slug</label>
                  <input
                    placeholder="ex: semana-do-cliente"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>

                <div className="field full">
                  <label>Descrição</label>
                  <textarea
                    placeholder="Descreva a campanha (opcional)"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                  />
                </div>

                <div className="field full">
                  <label>Texto do banner</label>
                  <input
                    placeholder="Ex: até 50% OFF (opcional)"
                    value={banner}
                    onChange={(e) => setBanner(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Início</label>
                  <input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} />
                </div>

                <div className="field">
                  <label>Fim</label>
                  <input type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} />
                </div>
              </div>

              <div className="divider" />

              <div className="produtosBox">
                <div className="produtosTop">
                  <h4>Produtos da campanha</h4>
                  <span className="mini">
                    {loadingProdutos ? "Carregando..." : `${produtosSelecionados.length} selecionado(s)`}
                  </span>
                </div>

                <div className="produtosList">
                  {loadingProdutos ? (
                    <div className="hint">Carregando produtos…</div>
                  ) : produtos.length === 0 ? (
                    <div className="hint">Nenhum produto encontrado.</div>
                  ) : (
                    produtos.map((p) => {
                      const checked = produtosSelecionados.includes(p.id_produto);
                      return (
                        <label key={p.id_produto} className={`checkRow ${checked ? "on" : ""}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleProduto(p.id_produto)} />
                          <span className="checkName">{p.nome}</span>
                          {checked ? (
                            <span className="checkBadge">
                              <FiCheck /> Selecionado
                            </span>
                          ) : null}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="modalActions">
              <button
                className="btnGhost"
                onClick={() => {
                  setOpenModal(false);
                  resetForm();
                }}
              >
                Cancelar
              </button>

              <button className="btnPrimary" onClick={criarCampanha} disabled={salvandoCampanha}>
                {salvandoCampanha ? "Criando..." : "Criar campanha"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .page {
          padding: 28px;
          background: #f6f8fc;
          min-height: 100vh;
        }

        .header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .headerLeft h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #0f172a;
        }

        .titleRow {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .badge {
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 999px;
          background: #eef2ff;
          color: #3730a3;
          border: 1px solid #e0e7ff;
          font-weight: 800;
        }

        .subtitle {
          margin: 6px 0 0;
          color: #475569;
          font-size: 14px;
        }

        .headerRight {
          display: flex;
          align-items: center;
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
          min-width: 280px;
        }

        .searchIcon {
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
        .btnGhost,
        .btnSoft,
        .btnIcon,
        .btnIconDanger {
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 12px;
          font-weight: 800;
          transition: 0.15s ease;
          user-select: none;
        }

        .btnPrimary {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white;
          padding: 10px 14px;
          box-shadow: 0 14px 34px rgba(79, 70, 229, 0.22);
        }

        .btnPrimary:hover {
          transform: translateY(-1px);
          filter: brightness(1.02);
        }

        .btnPrimary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .btnGhost {
          background: white;
          color: #0f172a;
          border: 1px solid #e2e8f0;
          padding: 10px 12px;
          box-shadow: 0 8px 24px rgba(2, 6, 23, 0.06);
        }

        .btnGhost:hover {
          transform: translateY(-1px);
        }

        .btnSoft {
          background: #eef2ff;
          border: 1px solid #e0e7ff;
          color: #3730a3;
          padding: 10px 12px;
        }

        .btnSoft:hover {
          transform: translateY(-1px);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 14px;
          margin-top: 14px;
        }

        .card {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 16px;
          box-shadow: 0 18px 44px rgba(2, 6, 23, 0.08);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .cardTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .cardTitle h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.01em;
          line-height: 1.2;
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .slug {
          margin-top: 6px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #64748b;
        }

        .desc {
          margin: 0;
          font-size: 14px;
          color: #334155;
          line-height: 1.4;
          min-height: 40px;
        }

        .meta {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 4px;
        }

        .metaItem {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #475569;
          font-size: 12px;
        }

        .metaBanner {
          font-size: 12px;
          color: #0f172a;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 8px 10px;
          border-radius: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .cardActions {
          margin-top: auto;
          display: flex;
          justify-content: flex-end;
        }

        .btnIcon {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          width: 40px;
          height: 40px;
          justify-content: center;
        }

        .btnIconDanger {
          background: #fee2e2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          width: 40px;
          height: 40px;
          justify-content: center;
        }

        /* ✅ AQUI ESTÁ O “ARRUMA A TELA PRETA” */
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.45); /* menos preto */
          backdrop-filter: blur(6px); /* fica premium */
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          z-index: 9999;
        }

        .modal {
          width: 760px;
          max-width: 100%;
          background: #ffffff;
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 40px 90px rgba(2, 6, 23, 0.25);
          overflow: hidden;
          max-height: calc(100vh - 36px);
          display: flex;
          flex-direction: column;
        }

        .modalHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 18px 12px;
          border-bottom: 1px solid #e2e8f0;
          background: linear-gradient(180deg, #ffffff, #fbfdff);
        }

        .modalHeader h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
        }

        .modalHeader p {
          margin: 6px 0 0;
          color: #475569;
          font-size: 13px;
        }

        .modalBody {
          padding: 16px 18px;
          overflow: auto; /* ✅ scroll interno (não “escurece” a tela) */
        }

        .formGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field.full {
          grid-column: span 2;
        }

        .field label {
          font-size: 12px;
          font-weight: 800;
          color: #334155;
        }

        .field input,
        .field textarea {
          border: 1px solid #e2e8f0;
          background: #ffffff;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          color: #0f172a;
          transition: 0.15s ease;
        }

        .field textarea {
          min-height: 90px;
          resize: vertical;
        }

        .field input:focus,
        .field textarea:focus {
          border-color: #c7d2fe;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
        }

        .divider {
          height: 1px;
          background: #e2e8f0;
          margin: 16px 0;
        }

        .produtosTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .produtosTop h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 900;
          color: #0f172a;
        }

        .mini {
          font-size: 12px;
          color: #64748b;
          font-weight: 800;
        }

        .produtosList {
          border: 1px solid #e2e8f0;
          background: #fbfdff;
          border-radius: 14px;
          padding: 10px;
          max-height: 220px;
          overflow: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .hint {
          font-size: 13px;
          color: #64748b;
          padding: 10px;
        }

        .checkRow {
          display: grid;
          grid-template-columns: 18px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 10px 10px;
          border-radius: 12px;
          border: 1px solid transparent;
          background: white;
          cursor: pointer;
          user-select: none;
        }

        .checkRow.on {
          border-color: #c7d2fe;
          background: #eef2ff;
        }

        .checkName {
          font-size: 13px;
          color: #0f172a;
          font-weight: 800;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .checkBadge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          padding: 5px 8px;
          border-radius: 999px;
          background: rgba(79, 70, 229, 0.12);
          color: #3730a3;
          border: 1px solid rgba(79, 70, 229, 0.18);
          font-weight: 900;
        }

        .modalActions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 14px 18px 18px;
          border-top: 1px solid #e2e8f0;
          background: #ffffff;
        }

        /* skeleton */
        .skeletonGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 14px;
          margin-top: 14px;
        }

        .skeletonCard {
          height: 180px;
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          background: linear-gradient(90deg, #ffffff, #f1f5f9, #ffffff);
          background-size: 200% 100%;
          animation: shimmer 1.1s infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: 0% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .empty {
          margin-top: 18px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 26px;
          box-shadow: 0 18px 44px rgba(2, 6, 23, 0.08);
          display: grid;
          place-items: center;
          text-align: center;
          gap: 10px;
        }

        .emptyIcon {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: #eef2ff;
          color: #4f46e5;
          border: 1px solid #e0e7ff;
          font-size: 22px;
        }

        .empty h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
        }

        .empty p {
          margin: 0;
          color: #475569;
          font-size: 14px;
        }

        @media (max-width: 720px) {
          .header {
            flex-direction: column;
            align-items: stretch;
          }

          .search {
            min-width: 100%;
          }

          .formGrid {
            grid-template-columns: 1fr;
          }

          .field.full {
            grid-column: auto;
          }
        }
      `}</style>
    </div>
  );
}