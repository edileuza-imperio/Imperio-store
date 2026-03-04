"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";

import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiGitMerge,
  FiX,
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
  FiSearch,
  FiTag,
} from "react-icons/fi";

type Categoria = {
  id_categoria: number;
  nome: string;
  icone: string;
  statusid?: number;
  total_produtos?: number;
};

type Produto = {
  id_produto: number;
  nome?: string;
  titulo?: string;
  categoria_id?: number | null;
};

type ToastType = "success" | "error" | "info";
type Toast = { id: string; type: ToastType; title: string; message?: string };

type DrawerTab = "create" | "edit" | "merge";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function CategoriasPage() {
  // ====== DATA ======
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  // ====== TOAST ======
  const [toasts, setToasts] = useState<Toast[]>([]);
  function pushToast(t: Omit<Toast, "id">, ttlMs = 3200) {
    const id = uid();
    setToasts((prev) => [{ id, ...t }, ...prev].slice(0, 3));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, ttlMs);
  }

  // ====== DRAWER + TABS ======
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState<DrawerTab>("create");

  // categoria selecionada (para Editar/Unificar)
  const [selectedCat, setSelectedCat] = useState<Categoria | null>(null);

  // ====== FORM CREATE/EDIT ======
  const [nome, setNome] = useState("");
  const [icone, setIcone] = useState("");
  const [saving, setSaving] = useState(false);

  // ====== MERGE ======
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodSearch, setProdSearch] = useState("");
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [merging, setMerging] = useState(false);

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => Number(k)),
    [selected]
  );

  const filteredProdutos = useMemo(() => {
    const q = prodSearch.trim().toLowerCase();
    if (!q) return produtos;
    return produtos.filter((p) => (p.nome ?? p.titulo ?? "").toLowerCase().includes(q));
  }, [produtos, prodSearch]);

  // ====== HELPERS ======
  function closeDrawer() {
    setDrawerOpen(false);
  }

  function openDrawerCreate() {
    setSelectedCat(null);
    setTab("create");
    setNome("");
    setIcone("");
    setProdSearch("");
    setSelected({});
    setDrawerOpen(true);
  }

  function openDrawerEdit(cat: Categoria) {
    setSelectedCat(cat);
    setTab("edit");
    setNome(cat.nome ?? "");
    setIcone(cat.icone ?? "");
    setDrawerOpen(true);
  }

  async function openDrawerMerge(cat: Categoria) {
    setSelectedCat(cat);
    setTab("merge");
    setSelected({});
    setProdSearch("");
    setDrawerOpen(true);
    await carregarProdutosParaUnificar();
  }

  // fecha com ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // trava scroll do body quando drawer abrir
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // ====== API ======
  async function carregarCategorias() {
    try {
      setLoading(true);
      const res = await api.get("/admin/categorias");

      const data = res?.data?.dados ?? res?.data ?? [];
      if (Array.isArray(data)) setCategorias(data);
    } catch (err) {
      console.error("Erro ao carregar categorias", err);
      pushToast({
        type: "error",
        title: "Erro ao carregar categorias",
        message: "Verifique sua API /admin/categorias.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function criarCategoria() {
    if (!nome.trim()) return pushToast({ type: "info", title: "Informe o nome da categoria" });
    if (!icone.trim()) return pushToast({ type: "info", title: "Informe o ícone (ex: bi-gift-fill)" });

    try {
      setSaving(true);

      await api.post("/admin/categorias", { nome: nome.trim(), icone: icone.trim(), statusid: 1 });

      pushToast({
        type: "success",
        title: "Categoria criada",
        message: `“${nome.trim()}” foi cadastrada.`,
      });

      closeDrawer();
      await carregarCategorias();
    } catch (err) {
      console.error("Erro ao criar categoria", err);
      pushToast({ type: "error", title: "Erro ao criar categoria", message: "Veja o console." });
    } finally {
      setSaving(false);
    }
  }

  async function atualizarCategoria() {
    if (!selectedCat) return;
    if (!nome.trim()) return pushToast({ type: "info", title: "Informe o nome da categoria" });
    if (!icone.trim()) return pushToast({ type: "info", title: "Informe o ícone (ex: bi-gift-fill)" });

    try {
      setSaving(true);

      await api.put(`/admin/categorias/${selectedCat.id_categoria}`, {
        nome: nome.trim(),
        icone: icone.trim(),
        statusid: 1,
      });

      pushToast({
        type: "success",
        title: "Categoria atualizada",
        message: `“${nome.trim()}” foi atualizada.`,
      });

      closeDrawer();
      await carregarCategorias();
    } catch (err) {
      console.error("Erro ao atualizar categoria", err);
      pushToast({ type: "error", title: "Erro ao atualizar categoria", message: "Veja o console." });
    } finally {
      setSaving(false);
    }
  }

  async function removerCategoria(id: number, nomeCat?: string) {
    if (!confirm("Deseja remover essa categoria?")) return;

    try {
      await api.delete(`/admin/categorias/${id}`);
      setCategorias((prev) => prev.filter((c) => c.id_categoria !== id));
      pushToast({
        type: "success",
        title: "Categoria removida",
        message: nomeCat ? `“${nomeCat}” foi removida.` : "Removida com sucesso.",
      });
    } catch (err) {
      console.error("Erro ao remover categoria", err);
      pushToast({ type: "error", title: "Erro ao remover categoria", message: "Veja o console." });
    }
  }

  async function carregarProdutosParaUnificar() {
    try {
      setProdLoading(true);

      // rota: GET /admin/produtos
      const res = await api.get("/admin/produtos");
      const data = res?.data?.dados ?? res?.data ?? [];
      const arr: Produto[] = Array.isArray(data) ? data : [];

      // pega só produtos sem categoria (ajuste se seu campo for outro)
      const semCategoria = arr.filter((p) => !p.categoria_id);

      setProdutos(semCategoria);
    } catch (err) {
      console.error("Erro ao carregar produtos", err);
      pushToast({
        type: "error",
        title: "Erro ao carregar produtos",
        message: "Verifique a rota /admin/produtos.",
      });
      setProdutos([]);
    } finally {
      setProdLoading(false);
    }
  }

  async function unificarProdutos() {
    if (!selectedCat) return;

    if (selectedIds.length === 0) {
      pushToast({ type: "info", title: "Selecione pelo menos 1 produto" });
      return;
    }

    try {
      setMerging(true);

      await api.post("/admin/produtos/unificar", {
        categoria_id: selectedCat.id_categoria,
        produtos: selectedIds,
      });

      pushToast({
        type: "success",
        title: "Unificação concluída",
        message: `${selectedIds.length} produto(s) vinculados em “${selectedCat.nome}”.`,
      });

      closeDrawer();
      setSelected({});
      await carregarCategorias();
    } catch (err) {
      console.error("Erro ao unificar", err);
      pushToast({ type: "error", title: "Erro ao unificar", message: "Veja o console." });
    } finally {
      setMerging(false);
    }
  }

  useEffect(() => {
    carregarCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ====== UI ======
  return (
    <div className="page">
      {/* TOASTS */}
      <div className="toastWrap" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => {
          const Icon =
            t.type === "success" ? FiCheckCircle : t.type === "error" ? FiAlertTriangle : FiInfo;

          return (
            <div key={t.id} className={`toast ${t.type}`}>
              <div className="tIcon">
                <Icon size={18} />
              </div>
              <div className="tBody">
                <div className="tTitle">{t.title}</div>
                {t.message ? <div className="tMsg">{t.message}</div> : null}
              </div>
              <button
                className="tClose"
                onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
                aria-label="Fechar"
                type="button"
              >
                <FiX size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* HEADER */}
      <div className="top">
        <div className="titleBlock">
          <h1>Categorias</h1>
          <p className="sub">Gerencie as categorias do catálogo</p>
        </div>

        <button className="btnAdd" onClick={openDrawerCreate} type="button">
          <FiPlus size={16} />
          Nova Categoria
        </button>
      </div>

      {loading ? <p>Carregando categorias...</p> : null}

      {/* CARDS */}
      <div className="grid">
        {categorias.map((cat) => (
          <div key={cat.id_categoria} className="card">
            <div className="cardTop">
              <div className="icon" title={cat.icone}>
                <i className={`bi ${cat.icone}`} />
              </div>

              <div className="count">
                <div className="num">{cat.total_produtos ?? 0}</div>
                <div className="lbl">produtos</div>
              </div>
            </div>

            <h3 className="name">{cat.nome}</h3>

            <div className="actions">
              <button className="edit" type="button" onClick={() => openDrawerEdit(cat)}>
                <FiEdit2 size={15} />
                Editar
              </button>

              <button className="merge" type="button" onClick={() => openDrawerMerge(cat)}>
                <FiGitMerge size={15} />
                Unificar
              </button>

              <button className="delete" type="button" onClick={() => removerCategoria(cat.id_categoria, cat.nome)}>
                <FiTrash2 size={15} />
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DRAWER (RIGHT) */}
      {drawerOpen && (
        <div className={`drawerOverlay ${drawerOpen ? "show" : ""}`} onClick={closeDrawer}>
          <aside className="drawer" onClick={(e) => e.stopPropagation()} aria-label="Painel lateral">
            {/* Drawer Header */}
            <div className="drawerHeader">
              <div className="drawerTitle">
                <div className="drawerH">
                  <FiTag size={16} />
                  <span>Painel de Categorias</span>
                </div>

                <div className="drawerSub">
                  {tab === "create" && "Criar uma nova categoria"}
                  {tab === "edit" && selectedCat ? `Editar: ${selectedCat.nome}` : "Editar categoria"}
                  {tab === "merge" && selectedCat ? `Unificar para: ${selectedCat.nome}` : "Unificar produtos"}
                </div>
              </div>

              <button className="iconBtn" type="button" onClick={closeDrawer} aria-label="Fechar">
                <FiX size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="tabs" role="tablist" aria-label="Abas do drawer">
              <button
                type="button"
                className={`tab ${tab === "create" ? "on" : ""}`}
                onClick={() => {
                  setSelectedCat(null);
                  setNome("");
                  setIcone("");
                  setTab("create");
                }}
              >
                Criar
              </button>

              <button
                type="button"
                className={`tab ${tab === "edit" ? "on" : ""}`}
                onClick={() => {
                  // se não tiver categoria selecionada, mostra dica (sem bloquear)
                  setTab("edit");
                }}
              >
                Editar
              </button>

              <button
                type="button"
                className={`tab ${tab === "merge" ? "on" : ""}`}
                onClick={async () => {
                  setTab("merge");
                  if (selectedCat) await carregarProdutosParaUnificar();
                }}
              >
                Unificar
              </button>
            </div>

            {/* Tab Content */}
            <div className="drawerBody">
              {/* CREATE */}
              {tab === "create" && (
                <>
                  <div className="sectionTitle">Nova Categoria</div>

                  <div className="form">
                    <label>
                      Nome
                      <input
                        placeholder="Ex: Cestas"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                      />
                    </label>

                    <label>
                      Ícone Bootstrap
                      <input
                        placeholder="Ex: bi-gift-fill"
                        value={icone}
                        onChange={(e) => setIcone(e.target.value)}
                      />
                    </label>

                    <div className="preview">
                      <div className="previewBox" aria-hidden>
                        <i className={`bi ${icone || "bi-grid-1x2-fill"}`} />
                      </div>
                      <div className="previewTxt">
                        Exemplo: <span>bi-gift-fill</span> / <span>bi-basket-fill</span>
                      </div>
                    </div>
                  </div>

                  <div className="actionsModal">
                    <button className="cancel" type="button" onClick={closeDrawer}>
                      Cancelar
                    </button>

                    <button className="save" type="button" onClick={criarCategoria} disabled={saving}>
                      {saving ? "Salvando..." : "Criar"}
                    </button>
                  </div>
                </>
              )}

              {/* EDIT */}
              {tab === "edit" && (
                <>
                  <div className="sectionTitle">Editar Categoria</div>

                  {!selectedCat ? (
                    <div className="emptyHint">
                      Clique em <b>Editar</b> em uma categoria para carregar aqui.
                    </div>
                  ) : (
                    <>
                      <div className="hintRow">
                        <div className="hintPill">
                          Editando: <b>{selectedCat.nome}</b>
                        </div>
                      </div>

                      <div className="form">
                        <label>
                          Nome
                          <input
                            placeholder="Ex: Cestas"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                          />
                        </label>

                        <label>
                          Ícone Bootstrap
                          <input
                            placeholder="Ex: bi-gift-fill"
                            value={icone}
                            onChange={(e) => setIcone(e.target.value)}
                          />
                        </label>

                        <div className="preview">
                          <div className="previewBox" aria-hidden>
                            <i className={`bi ${icone || "bi-grid-1x2-fill"}`} />
                          </div>
                          <div className="previewTxt">
                            Atual: <span>{selectedCat.icone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="actionsModal">
                        <button className="cancel" type="button" onClick={closeDrawer}>
                          Cancelar
                        </button>

                        <button className="save" type="button" onClick={atualizarCategoria} disabled={saving}>
                          {saving ? "Salvando..." : "Salvar"}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* MERGE */}
              {tab === "merge" && (
                <>
                  <div className="sectionTitle">Unificar Produtos</div>

                  {!selectedCat ? (
                    <div className="emptyHint">
                      Clique em <b>Unificar</b> em uma categoria para selecionar o destino.
                    </div>
                  ) : (
                    <>
                      <div className="hintRow">
                        <div className="hintPill warn">
                          Unificar para: <b>{selectedCat.nome}</b>
                        </div>
                      </div>

                      <div className="mergeHeader">
                        <div className="mergeNote">
                          Selecione produtos <b>sem categoria</b> para vincular nesta categoria.
                        </div>

                        <div className="search">
                          <FiSearch size={16} />
                          <input
                            placeholder="Buscar produto..."
                            value={prodSearch}
                            onChange={(e) => setProdSearch(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="mergeBody">
                        {prodLoading ? (
                          <div className="mergeLoading">Carregando produtos...</div>
                        ) : filteredProdutos.length === 0 ? (
                          <div className="mergeEmpty">Nenhum produto disponível para unificar.</div>
                        ) : (
                          <div className="prodList">
                            {filteredProdutos.map((p) => {
                              const label = p.nome ?? p.titulo ?? `Produto #${p.id_produto}`;
                              const checked = !!selected[p.id_produto];

                              return (
                                <label key={p.id_produto} className={`prodRow ${checked ? "on" : ""}`}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) =>
                                      setSelected((prev) => ({ ...prev, [p.id_produto]: e.target.checked }))
                                    }
                                  />
                                  <span className="prodName">{label}</span>
                                  <span className="prodId">#{p.id_produto}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="actionsModal">
                        <div className="selInfo">
                          Selecionados: <b>{selectedIds.length}</b>
                        </div>

                        <button className="cancel" type="button" onClick={closeDrawer}>
                          Cancelar
                        </button>

                        <button
                          className="save"
                          type="button"
                          onClick={unificarProdutos}
                          disabled={merging || selectedIds.length === 0}
                        >
                          {merging ? "Unificando..." : "Unificar"}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </aside>
        </div>
      )}

      <style jsx>{`
        /* PAGE */
        .page {
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
        }

        .top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
        }

        .titleBlock h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .sub {
          margin: 4px 0 0;
          font-size: 13px;
          color: #64748b;
          font-weight: 700;
        }

        .btnAdd {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #7c3aed;
          color: white;
          border: none;
          padding: 10px 14px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 900;
          font-size: 13px;
          box-shadow: 0 16px 34px rgba(124, 58, 237, 0.25);
          transition: 0.2s;
          white-space: nowrap;
        }
        .btnAdd:hover {
          background: #6d28d9;
          transform: translateY(-1px);
        }

        /* GRID */
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }

        /* CARD */
        .card {
          background: linear-gradient(180deg, #ffffff, #fbfbff);
          border-radius: 18px;
          padding: 18px;
          border: 1px solid rgba(17, 24, 39, 0.06);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          transition: 0.25s;
        }

        .card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
        }

        .cardTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .icon {
          width: 58px;
          height: 58px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #7c3aed, #9333ea);
          color: white;
          font-size: 26px;
          box-shadow: 0 12px 24px rgba(124, 58, 237, 0.28);
        }

        .count {
          text-align: right;
          display: grid;
          gap: 2px;
        }

        .num {
          font-size: 26px;
          font-weight: 950;
          color: #111827;
          line-height: 1;
        }

        .lbl {
          font-size: 12px;
          color: #64748b;
          font-weight: 800;
        }

        .name {
          margin: 12px 0 0;
          font-size: 16px;
          font-weight: 950;
          color: #111827;
          letter-spacing: -0.01em;
        }

        /* ACTIONS */
        .actions {
          display: flex;
          gap: 10px;
          margin-top: 14px;
          flex-wrap: wrap;
        }

        .actions button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(17, 24, 39, 0.08);
          background: rgba(17, 24, 39, 0.02);
          padding: 9px 10px;
          border-radius: 12px;
          font-size: 12px;
          cursor: pointer;
          font-weight: 900;
          transition: 0.2s;
        }

        .actions button:hover {
          transform: translateY(-1px);
          background: rgba(17, 24, 39, 0.05);
        }

        .edit {
          color: #2563eb;
        }

        .merge {
          color: #b45309;
        }

        .delete {
          color: #dc2626;
        }

        /* TOASTS */
        .toastWrap {
          position: fixed;
          top: 18px;
          right: 18px;
          z-index: 999999;
          display: grid;
          gap: 10px;
          width: min(360px, calc(100vw - 36px));
        }

        .toast {
          display: grid;
          grid-template-columns: 36px 1fr 36px;
          gap: 10px;
          align-items: start;
          padding: 12px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(17, 24, 39, 0.08);
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(10px);
        }

        .tIcon {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(17, 24, 39, 0.08);
          background: rgba(17, 24, 39, 0.02);
        }

        .toast.success .tIcon {
          color: #16a34a;
          background: rgba(22, 163, 74, 0.08);
          border-color: rgba(22, 163, 74, 0.18);
        }

        .toast.error .tIcon {
          color: #dc2626;
          background: rgba(220, 38, 38, 0.08);
          border-color: rgba(220, 38, 38, 0.18);
        }

        .toast.info .tIcon {
          color: #0f172a;
          background: rgba(15, 23, 42, 0.06);
          border-color: rgba(15, 23, 42, 0.12);
        }

        .tBody {
          display: grid;
          gap: 2px;
        }

        .tTitle {
          font-size: 13px;
          font-weight: 950;
          color: #111827;
        }

        .tMsg {
          font-size: 12px;
          color: #64748b;
          font-weight: 700;
          line-height: 1.3;
        }

        .tClose {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          border: 1px solid rgba(17, 24, 39, 0.08);
          background: rgba(17, 24, 39, 0.02);
          cursor: pointer;
          display: grid;
          place-items: center;
        }

        /* DRAWER OVERLAY */
        .drawerOverlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.55);
          backdrop-filter: blur(3px);
          z-index: 99999;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }

        .drawerOverlay.show {
          opacity: 1;
          pointer-events: auto;
        }

        /* DRAWER */
        .drawer {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          width: min(560px, 92vw);
          background: white;
          border-left: 1px solid rgba(17, 24, 39, 0.08);
          box-shadow: -30px 0 90px rgba(0, 0, 0, 0.35);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transform: translateX(105%);
          transition: transform 0.22s ease;
        }

        .drawerOverlay.show .drawer {
          transform: translateX(0);
        }

        .drawerHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(17, 24, 39, 0.08);
        }

        .drawerTitle {
          min-width: 0;
        }

        .drawerH {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 950;
          color: #111827;
        }

        .drawerSub {
          margin-top: 4px;
          font-size: 12px;
          color: #64748b;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 46vw;
        }

        .iconBtn {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          border: 1px solid rgba(17, 24, 39, 0.1);
          background: rgba(17, 24, 39, 0.02);
          cursor: pointer;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
        }

        /* TABS */
        .tabs {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
        }

        .tab {
          border: 1px solid rgba(17, 24, 39, 0.1);
          background: rgba(17, 24, 39, 0.02);
          padding: 10px 12px;
          border-radius: 14px;
          font-weight: 950;
          cursor: pointer;
          transition: 0.2s;
        }

        .tab:hover {
          background: rgba(17, 24, 39, 0.05);
          transform: translateY(-1px);
        }

        .tab.on {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.16), rgba(147, 51, 234, 0.12));
          border-color: rgba(124, 58, 237, 0.25);
          color: #6d28d9;
        }

        .drawerBody {
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow: auto;
          padding-right: 2px;
        }

        .sectionTitle {
          font-size: 12px;
          font-weight: 950;
          color: rgba(17, 24, 39, 0.75);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .hintRow {
          display: flex;
          gap: 10px;
        }

        .hintPill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid rgba(17, 24, 39, 0.12);
          background: rgba(17, 24, 39, 0.02);
          font-size: 12px;
          font-weight: 900;
          color: #111827;
        }

        .hintPill.warn {
          border-color: rgba(245, 158, 11, 0.25);
          background: rgba(245, 158, 11, 0.08);
          color: #92400e;
        }

        .emptyHint {
          padding: 14px;
          border-radius: 16px;
          border: 1px solid rgba(17, 24, 39, 0.08);
          background: rgba(17, 24, 39, 0.02);
          font-size: 13px;
          color: #64748b;
          font-weight: 700;
        }

        /* FORM */
        .form {
          display: grid;
          gap: 10px;
        }

        label {
          display: grid;
          gap: 6px;
          font-size: 12px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.72);
        }

        input {
          padding: 11px 12px;
          border-radius: 14px;
          border: 1px solid rgba(17, 24, 39, 0.12);
          font-size: 14px;
          outline: none;
          transition: 0.2s;
        }

        input:focus {
          border-color: rgba(124, 58, 237, 0.55);
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.12);
        }

        .preview {
          display: grid;
          gap: 8px;
          margin-top: 2px;
        }

        .previewBox {
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(147, 51, 234, 0.1));
          border: 1px solid rgba(124, 58, 237, 0.18);
          display: grid;
          place-items: center;
          font-size: 26px;
          color: #6d28d9;
        }

        .previewTxt {
          font-size: 12px;
          color: #64748b;
          font-weight: 700;
        }

        .previewTxt span {
          font-weight: 950;
          color: #111827;
        }

        /* ACTIONS (footer) */
        .actionsModal {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 2px;
          align-items: center;
        }

        .selInfo {
          margin-right: auto;
          font-size: 12px;
          color: #64748b;
          font-weight: 800;
        }

        .cancel {
          background: rgba(17, 24, 39, 0.06);
          border: 1px solid rgba(17, 24, 39, 0.12);
          padding: 10px 12px;
          border-radius: 14px;
          cursor: pointer;
          font-weight: 950;
        }

        .save {
          background: #7c3aed;
          color: white;
          border: none;
          padding: 10px 14px;
          border-radius: 14px;
          cursor: pointer;
          font-weight: 950;
          box-shadow: 0 16px 34px rgba(124, 58, 237, 0.25);
        }

        .save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .save:hover:not(:disabled) {
          background: #6d28d9;
        }

        /* MERGE */
        .mergeHeader {
          display: grid;
          gap: 10px;
        }

        .mergeNote {
          font-size: 12px;
          color: #64748b;
          font-weight: 700;
        }

        .search {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid rgba(17, 24, 39, 0.12);
          background: rgba(17, 24, 39, 0.02);
        }

        .search input {
          border: none;
          outline: none;
          background: transparent;
          padding: 0;
          box-shadow: none;
          width: 100%;
        }

        .mergeBody {
          max-height: 380px;
          overflow: auto;
          border-radius: 14px;
          border: 1px solid rgba(17, 24, 39, 0.08);
          background: rgba(17, 24, 39, 0.01);
        }

        .mergeLoading,
        .mergeEmpty {
          padding: 16px;
          font-size: 13px;
          color: #64748b;
          font-weight: 700;
        }

        .prodList {
          display: grid;
          gap: 6px;
          padding: 10px;
        }

        .prodRow {
          display: grid;
          grid-template-columns: 18px 1fr auto;
          gap: 10px;
          align-items: center;
          padding: 10px;
          border-radius: 14px;
          border: 1px solid rgba(17, 24, 39, 0.06);
          background: white;
          cursor: pointer;
        }

        .prodRow.on {
          border-color: rgba(124, 58, 237, 0.25);
          background: rgba(124, 58, 237, 0.06);
        }

        .prodName {
          font-size: 13px;
          font-weight: 900;
          color: #111827;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .prodId {
          font-size: 12px;
          color: #64748b;
          font-weight: 800;
        }
      `}</style>
    </div>
  );
}