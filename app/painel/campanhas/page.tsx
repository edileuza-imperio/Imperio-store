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
  FiTag,
  FiClock,
  FiShield,
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

function isCampaignActive(c: Campanha) {
  const now = Date.now();
  const ini = c.inicio
    ? new Date(c.inicio.includes("T") ? c.inicio : c.inicio.replace(" ", "T")).getTime()
    : null;
  const fim = c.fim
    ? new Date(c.fim.includes("T") ? c.fim : c.fim.replace(" ", "T")).getTime()
    : null;

  if (ini && now < ini) return "agendada";
  if (fim && now > fim) return "finalizada";
  if (ini && now >= ini && (!fim || now <= fim)) return "ativa";
  return "sem-periodo";
}

function buildPagination(current: number, total: number) {
  if (total <= 1) return [1];

  const pages: (number | "...")[] = [];
  const push = (p: number | "...") => pages.push(p);

  const show = new Set<number>();
  show.add(1);
  show.add(total);
  show.add(current);
  show.add(current - 1);
  show.add(current + 1);
  show.add(current - 2);
  show.add(current + 2);

  const list = Array.from(show)
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);

  let prev = 0;
  for (const p of list) {
    if (prev && p - prev > 1) push("...");
    push(p);
    prev = p;
  }

  return pages;
}

export default function CampanhasPage() {
  const router = useRouter();

  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loadingCampanhas, setLoadingCampanhas] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [q, setQ] = useState("");

  // paginação
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(9);

  // form campanha
  const [titulo, setTitulo] = useState("");
  const [slug, setSlug] = useState("");
  const [descricao, setDescricao] = useState("");
  const [banner, setBanner] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [statusid, setStatusId] = useState<number>(3); // ✅ agora editável
  const [salvandoCampanha, setSalvandoCampanha] = useState(false);

  // ✅ níveis de status (ajuste os IDs se os seus forem diferentes)
  const STATUS_OPTIONS = useMemo(
    () => [
      { id: 1, label: "Rascunho" },
      { id: 2, label: "Inativa" },
      { id: 3, label: "Ativa" },
      { id: 4, label: "Pausada" },
      { id: 5, label: "Finalizada" },
    ],
    []
  );

  async function carregarCampanhas() {
    setLoadingCampanhas(true);
    try {
      const res = await api.get("/admin/campanhas");
      const lista = res?.data?.dados?.campanhas ?? res?.data?.dados ?? res?.data ?? [];
      setCampanhas(Array.isArray(lista) ? lista : []);
    } catch (e) {
      console.error(e);
      alert("Erro ao carregar campanhas");
    } finally {
      setLoadingCampanhas(false);
    }
  }

  useEffect(() => {
    carregarCampanhas();
  }, []);

  function resetForm() {
    setTitulo("");
    setSlug("");
    setDescricao("");
    setBanner("");
    setInicio("");
    setFim("");
    setStatusId(3);
  }

  function closeModal() {
    setOpenModal(false);
    resetForm();
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
        statusid: Number(statusid) || 3, // ✅ envia o status escolhido
      };

      await api.post("/admin/campanhas", payload);

      setOpenModal(false);
      resetForm();
      await carregarCampanhas();
    } catch (e: any) {
      console.error(e);
      const msg =
        e?.response?.data?.mensagem || e?.response?.data?.message || "Erro ao criar campanha";
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

  const campanhasFiltradas = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = !term
      ? campanhas
      : campanhas.filter((c) => {
          const a = (c.titulo || "").toLowerCase();
          const b = (c.slug || "").toLowerCase();
          return a.includes(term) || b.includes(term);
        });
    return base;
  }, [campanhas, q]);

  useEffect(() => {
    setPage(1);
  }, [q, perPage]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(campanhasFiltradas.length / perPage)),
    [campanhasFiltradas.length, perPage]
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [page, totalPages]);

  const campanhasPaginadas = useMemo(() => {
    const start = (page - 1) * perPage;
    return campanhasFiltradas.slice(start, start + perPage);
  }, [campanhasFiltradas, page, perPage]);

  const pager = useMemo(() => buildPagination(page, totalPages), [page, totalPages]);

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
      {/* Top header */}
      <div className="top">
        <div className="topLeft">
          <div className="kicker">
            <span className="kdot" />
            <span>Marketing</span>
          </div>

          <div className="titleRow">
            <h1>Campanhas</h1>
            <span className="badge">{campanhas.length}</span>
          </div>

          <p className="subtitle">
            Crie campanhas, defina período e gerencie tudo com paginação e busca.
          </p>
        </div>

        <div className="topRight">
          <div className="search">
            <FiSearch className="searchIcon" />
            <input
              placeholder="Buscar por título ou slug..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="rightActions">
            <button className="btnGhost" onClick={carregarCampanhas} disabled={loadingCampanhas}>
              <FiRefreshCw />
              Atualizar
            </button>

            <button className="btnPrimary" onClick={() => setOpenModal(true)}>
              <FiPlus /> Nova campanha
            </button>
          </div>
        </div>
      </div>

      {/* toolbar */}
      <div className="toolbar">
        <div className="stats">
          <div className="stat">
            <span className="label">Resultados</span>
            <b>{campanhasFiltradas.length}</b>
          </div>
          <div className="sep" />
          <div className="stat">
            <span className="label">Página</span>
            <b>
              {page} / {totalPages}
            </b>
          </div>
        </div>

        <div className="perPage">
          <span>Itens por página</span>
          <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
            <option value={6}>6</option>
            <option value={9}>9</option>
            <option value={12}>12</option>
            <option value={18}>18</option>
          </select>
        </div>
      </div>

      {/* content */}
      {loadingCampanhas ? (
        <div className="skeletonGrid">
          {Array.from({ length: perPage }).map((_, i) => (
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
        <>
          <div className="grid">
            {campanhasPaginadas.map((c) => {
              const st = isCampaignActive(c);
              const statusLabel =
                st === "ativa"
                  ? "Ativa"
                  : st === "agendada"
                  ? "Agendada"
                  : st === "finalizada"
                  ? "Finalizada"
                  : "Sem período";

              return (
                <div key={c.id_campanha} className="card">
                  <div className="cardHead">
                    <div className="cardTitle">
                      <div className="nameRow">
                        <h3 title={c.titulo}>{c.titulo}</h3>
                        <span className={`status ${st}`}>{statusLabel}</span>
                      </div>

                      <span className="slug">
                        <FiLink /> /{c.slug}
                      </span>
                    </div>

                    <button
                      className="btnIconDanger"
                      onClick={() => removerCampanha(c.id_campanha)}
                      title="Remover"
                    >
                      <FiTrash2 />
                    </button>
                  </div>

                  <div className="bannerPreview">
                    <div className="bannerIcon">
                      <FiTag />
                    </div>
                    <div className="bannerText">
                      <span className="bLabel">Banner</span>
                      <span className="bValue">
                        {c.banner?.trim() ? c.banner : "Sem texto de banner"}
                      </span>
                    </div>
                  </div>

                  <p className="desc">{c.descricao?.trim() ? c.descricao : "Sem descrição"}</p>

                  <div className="meta">
                    <div className="metaItem">
                      <FiClock />
                      <span>
                        {c.inicio ? formatDateTimeBR(c.inicio) : "Sem início"} {" • "}
                        {c.fim ? formatDateTimeBR(c.fim) : "Sem fim"}
                      </span>
                    </div>
                    <div className="metaItem">
                      <FiCalendar />
                      <span>ID: {c.id_campanha}</span>
                    </div>
                  </div>

                  <div className="cardActions">
                    <button
                      className="btnSoft"
                      onClick={() => router.push(`/painel/campanhas/${c.id_campanha}/produtos`)}
                    >
                      <FiPackage /> Produtos
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* paginação (somente números) */}
          {totalPages > 1 && (
            <div className="pagination">
              {pager.map((p, idx) => {
                if (p === "...") {
                  return (
                    <span key={`d-${idx}`} className="dots">
                      ...
                    </span>
                  );
                }
                const n = p as number;
                const active = n === page;
                return (
                  <button
                    key={n}
                    type="button"
                    className={`pbtn ${active ? "on" : ""}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ✅ MODAL: CRIAR CAMPANHA (SEM SELEÇÃO DE PRODUTOS) */}
      {openModal && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modalHeader">
              <div>
                <h2>Criar campanha</h2>
                <p>Preencha os dados e selecione o nível de status.</p>
              </div>

              <button className="btnIcon" onClick={closeModal} aria-label="Fechar">
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
                  <div className="previewLine">
                    <span className="pillMini">Preview</span>
                    <span className="previewText">{banner?.trim() ? banner : "—"}</span>
                  </div>
                </div>

                <div className="field">
                  <label>Início</label>
                  <input
                    type="datetime-local"
                    value={inicio}
                    onChange={(e) => setInicio(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Fim</label>
                  <input
                    type="datetime-local"
                    value={fim}
                    onChange={(e) => setFim(e.target.value)}
                  />
                </div>

                {/* ✅ NOVO: NÍVEL DE STATUS */}
                <div className="field full">
                  <label>Nível de status</label>
                  <div className="statusRow">
                    <div className="statusIcon">
                      <FiShield />
                    </div>

                    <select value={statusid} onChange={(e) => setStatusId(Number(e.target.value))}>
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.id} • {s.label}
                        </option>
                      ))}
                    </select>

                    <div className="statusHint">
                      Esse valor será enviado como <b>statusid</b>.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modalActions">
              <button className="btnGhost" onClick={closeModal}>
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
          padding: 26px;
          background: radial-gradient(900px 500px at 20% 0%, rgba(99, 102, 241, 0.14), transparent 60%),
            radial-gradient(900px 500px at 80% 0%, rgba(14, 165, 233, 0.12), transparent 55%),
            #f6f8fc;
          min-height: 100vh;
        }

        .top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 14px;
        }

        .kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 900;
          color: #334155;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid #e2e8f0;
          padding: 6px 10px;
          border-radius: 999px;
          width: fit-content;
          box-shadow: 0 10px 24px rgba(2, 6, 23, 0.06);
          margin-bottom: 10px;
        }

        .kdot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #6366f1;
          box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.15);
        }

        .titleRow {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 950;
          letter-spacing: -0.03em;
          color: #0f172a;
        }

        .badge {
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 999px;
          background: #eef2ff;
          color: #3730a3;
          border: 1px solid #e0e7ff;
          font-weight: 900;
        }

        .subtitle {
          margin: 8px 0 0;
          color: #475569;
          font-size: 14px;
          max-width: 680px;
        }

        .topRight {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .rightActions {
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
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          box-shadow: 0 10px 24px rgba(2, 6, 23, 0.06);
          min-width: 320px;
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
          background: transparent;
          font-weight: 800;
        }

        .toolbar {
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          box-shadow: 0 18px 44px rgba(2, 6, 23, 0.08);
        }

        .stats {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .stat {
          display: grid;
          gap: 2px;
        }

        .stat .label {
          font-size: 11px;
          font-weight: 900;
          color: rgba(71, 85, 105, 0.9);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .stat b {
          font-size: 14px;
          color: #0f172a;
        }

        .sep {
          width: 1px;
          height: 28px;
          background: #e2e8f0;
        }

        .perPage {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #334155;
          font-size: 12px;
          font-weight: 900;
        }

        .perPage select {
          border: 1px solid #e2e8f0;
          background: #ffffff;
          border-radius: 12px;
          padding: 8px 10px;
          font-weight: 900;
          color: #0f172a;
          outline: none;
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
          border-radius: 14px;
          font-weight: 900;
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
          background: rgba(255, 255, 255, 0.92);
          color: #0f172a;
          border: 1px solid #e2e8f0;
          padding: 10px 12px;
          box-shadow: 0 10px 24px rgba(2, 6, 23, 0.06);
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
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 14px;
          margin-top: 14px;
        }

        .card {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 16px;
          box-shadow: 0 18px 44px rgba(2, 6, 23, 0.08);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .cardHead {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .nameRow {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .cardTitle h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 950;
          color: #0f172a;
          letter-spacing: -0.01em;
          line-height: 1.2;
          max-width: 260px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .status {
          font-size: 11px;
          font-weight: 950;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid transparent;
        }
        .status.ativa {
          background: rgba(34, 197, 94, 0.14);
          border-color: rgba(34, 197, 94, 0.22);
          color: #166534;
        }
        .status.agendada {
          background: rgba(99, 102, 241, 0.14);
          border-color: rgba(99, 102, 241, 0.22);
          color: #3730a3;
        }
        .status.finalizada {
          background: rgba(239, 68, 68, 0.14);
          border-color: rgba(239, 68, 68, 0.22);
          color: #991b1b;
        }
        .status.sem-periodo {
          background: rgba(100, 116, 139, 0.12);
          border-color: rgba(100, 116, 139, 0.18);
          color: #334155;
        }

        .slug {
          margin-top: 6px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #64748b;
          font-weight: 900;
        }

        .bannerPreview {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(14, 165, 233, 0.06));
          border: 1px solid rgba(148, 163, 184, 0.35);
        }

        .bannerIcon {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: rgba(99, 102, 241, 0.14);
          border: 1px solid rgba(99, 102, 241, 0.2);
          color: #3730a3;
        }

        .bannerText {
          display: grid;
          gap: 2px;
          min-width: 0;
        }

        .bLabel {
          font-size: 11px;
          font-weight: 950;
          color: rgba(71, 85, 105, 0.9);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .bValue {
          font-size: 13px;
          font-weight: 950;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 520px;
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
          font-weight: 900;
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

        /* paginação */
        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
        }

        .pbtn {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 10px 24px rgba(2, 6, 23, 0.06);
          cursor: pointer;
          font-weight: 950;
          color: #0f172a;
          transition: 0.15s ease;
        }
        .pbtn:hover {
          transform: translateY(-1px);
        }
        .pbtn.on {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff;
          border-color: rgba(79, 70, 229, 0.35);
          box-shadow: 0 16px 40px rgba(79, 70, 229, 0.22);
        }

        .dots {
          color: rgba(71, 85, 105, 0.9);
          font-weight: 950;
          padding: 0 4px;
        }

        /* modal overlay */
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.45);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          z-index: 9999;
        }

        .modal {
          width: 820px;
          max-width: 100%;
          background: #ffffff;
          border-radius: 20px;
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
          font-weight: 950;
          color: #0f172a;
        }

        .modalHeader p {
          margin: 6px 0 0;
          color: #475569;
          font-size: 13px;
          font-weight: 800;
        }

        .modalBody {
          padding: 16px 18px;
          overflow: auto;
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
          font-weight: 900;
          color: #334155;
        }

        .field input,
        .field textarea,
        .field select {
          border: 1px solid #e2e8f0;
          background: #ffffff;
          border-radius: 14px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          color: #0f172a;
          transition: 0.15s ease;
          font-weight: 850;
        }

        .field textarea {
          min-height: 90px;
          resize: vertical;
        }

        .field input:focus,
        .field textarea:focus,
        .field select:focus {
          border-color: #c7d2fe;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
        }

        .previewLine {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
        }

        .pillMini {
          font-size: 11px;
          font-weight: 950;
          padding: 6px 10px;
          border-radius: 999px;
          background: #eef2ff;
          border: 1px solid #e0e7ff;
          color: #3730a3;
          white-space: nowrap;
        }

        .previewText {
          font-size: 13px;
          font-weight: 950;
          color: #0f172a;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .statusRow {
          display: grid;
          grid-template-columns: 44px 1fr;
          gap: 10px;
          align-items: center;
          padding: 10px 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
        }

        .statusIcon {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: rgba(99, 102, 241, 0.14);
          border: 1px solid rgba(99, 102, 241, 0.2);
          color: #3730a3;
          font-size: 18px;
        }

        .statusRow select {
          width: 100%;
          background: #ffffff;
        }

        .statusHint {
          grid-column: span 2;
          margin-top: 8px;
          font-size: 12px;
          color: rgba(71, 85, 105, 0.9);
          font-weight: 800;
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
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 14px;
          margin-top: 14px;
        }

        .skeletonCard {
          height: 210px;
          border-radius: 20px;
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
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #e2e8f0;
          border-radius: 20px;
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
          font-weight: 950;
          color: #0f172a;
        }

        .empty p {
          margin: 0;
          color: #475569;
          font-size: 14px;
          font-weight: 800;
        }

        @media (max-width: 900px) {
          .top {
            flex-direction: column;
            align-items: stretch;
          }

          .search {
            min-width: 100%;
          }

          .toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .perPage {
            justify-content: space-between;
          }
        }

        @media (max-width: 720px) {
          .formGrid {
            grid-template-columns: 1fr;
          }

          .field.full {
            grid-column: auto;
          }

          .statusRow {
            grid-template-columns: 44px 1fr;
          }
          .statusHint {
            grid-column: auto;
          }
        }
      `}</style>
    </div>
  );
}