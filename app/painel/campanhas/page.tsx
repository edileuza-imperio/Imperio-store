"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import { FiTrash2, FiTag, FiPlus, FiX, FiSearch } from "react-icons/fi";

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string | null;
  banner?: string | null;
  statusid: number;
  inicio?: string | null;
  fim?: string | null;
  criado?: string | null;
  atualizado?: string | null;
};

type Produto = {
  id_produto: number;
  nome: string;
};

function slugify(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9\s-]/g, "") // remove caracteres especiais
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function CampanhasPage() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);

  // campos da tabela campanha
  const [titulo, setTitulo] = useState("");
  const [slug, setSlug] = useState("");
  const [descricao, setDescricao] = useState("");
  const [banner, setBanner] = useState("");
  const [inicio, setInicio] = useState(""); // datetime-local
  const [fim, setFim] = useState(""); // datetime-local

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
      alert("Erro ao remover campanha. Veja o console.");
    }
  }

  // ==============================
  // MODAL OPEN/CLOSE
  // ==============================
  function abrirModal() {
    setOpenModal(true);
    if (produtos.length === 0) carregarProdutos();
  }

  function resetForm() {
    setTitulo("");
    setSlug("");
    setDescricao("");
    setBanner("");
    setInicio("");
    setFim("");
    setProdutosSelecionados([]);
    setBuscaProduto("");
  }

  function fecharModal() {
    setOpenModal(false);
    resetForm();
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
  // PRODUTOS
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
  // CRIAR CAMPANHA (SEM DUPLICAR)
  // ==============================
  async function criarCampanha() {
    // ✅ evita clique duplo (duplicar no banco)
    if (saving) return;

    const t = titulo.trim();
    const s = slug.trim();

    if (!t) {
      alert("Preencha o título");
      return;
    }

    // se usuário deixou slug vazio, gera automático
    const slugFinal = s ? slugify(s) : slugify(t);

    if (!slugFinal) {
      alert("Slug inválido");
      return;
    }

    // valida datas (opcional)
    if (inicio && fim) {
      const di = new Date(inicio).getTime();
      const df = new Date(fim).getTime();
      if (df < di) {
        alert("A data FIM não pode ser menor que a data INÍCIO.");
        return;
      }
    }

    try {
      setSaving(true);

      // ✅ 1) cria campanha (tabela campanha)
      const res = await api.post("/admin/campanhas", {
        titulo: t,
        slug: slugFinal,
        descricao: descricao.trim() || null,
        banner: banner.trim() || null,
        statusid: 3,
        // seu back espera "YYYY-mm-dd HH:ii:ss" (string)
        // a input datetime-local vem "YYYY-mm-ddTHH:ii"
        inicio: inicio ? inicio.replace("T", " ") + ":00" : null,
        fim: fim ? fim.replace("T", " ") + ":00" : null,
      });

      const id = res?.data?.dados?.id_campanha;

      if (!id) {
        console.error("Resposta sem id_campanha:", res?.data);
        alert("Campanha criada, mas não retornou o ID. Veja o console.");
        return;
      }

      // ✅ 2) vincula produtos (tabela campanha_produto)
      if (produtosSelecionados.length > 0) {
        await api.post(`/admin/campanha/${id}/produtos`, {
          produtos: produtosSelecionados,
          ordem_inicial: 1,
        });
      }

      fecharModal();
      carregarCampanhas();
    } catch (err: any) {
      console.error("Erro criar campanha:", err);

      const msg =
        err?.response?.data?.mensagem ||
        err?.response?.data?.message ||
        "Erro ao criar campanha. Veja o console.";

      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  // auto-slug: quando digitar título, preenche slug (só se slug ainda estiver vazio)
  useEffect(() => {
    if (!openModal) return;
    if (slug.trim()) return;
    if (!titulo.trim()) return;
    setSlug(slugify(titulo));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titulo, openModal]);

  // ==============================
  // RENDER
  // ==============================
  return (
    <div className="pageWrap">
      <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
        <div>
          <h1 className="m-0 title">Campanhas</h1>
          <p className="m-0 subtitle">Gerencie campanhas promocionais do painel</p>
        </div>

        <button
          className="btn btn-primary btn-sm px-3 btnNew"
          onClick={abrirModal}
        >
          <FiPlus /> <span>Nova campanha</span>
        </button>
      </div>

      <div className="contentCard">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <span className="badge text-bg-dark badgeSoft">
            {loading ? "..." : campanhas.length} campanhas
          </span>

          <div className="small text-muted">
            {loading ? "Carregando lista..." : "Tudo pronto ✅"}
          </div>
        </div>

        {loading && <p className="text-muted m-0">Carregando...</p>}

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
            {campanhas.map((c) => (
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
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modalHeader">
              <div>
                <div className="modalTitle">Criar campanha</div>
                <div className="modalSub">
                  Salva em <b>campanha</b> e vincula em <b>campanha_produto</b>
                </div>
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
                  <div className="small text-muted mt-1">
                    Se deixar vazio, eu gero automático pelo título.
                  </div>
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

                <div className="col-12">
                  <label className="form-label mb-1">Banner (URL ou caminho)</label>
                  <input
                    className="form-control"
                    placeholder="ex: upload/campanhas/banner.jpg"
                    value={banner}
                    onChange={(e) => setBanner(e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label mb-1">Início (opcional)</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={inicio}
                    onChange={(e) => setInicio(e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label mb-1">Fim (opcional)</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={fim}
                    onChange={(e) => setFim(e.target.value)}
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
              <button className="btn btn-light" onClick={fecharModal} disabled={saving}>
                Cancelar
              </button>

              <button className="btn btn-primary" onClick={criarCampanha} disabled={saving}>
                {saving ? "Criando..." : "Criar campanha"}
              </button>
            </div>
          </div>
        </div>
      )}

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

        /* Modal centralizado */
        .modalOverlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.58);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
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
          overflow: auto;
        }

        .modalFooter {
          padding: 12px 16px 16px;
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

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
      `}</style>
    </div>
  );
}