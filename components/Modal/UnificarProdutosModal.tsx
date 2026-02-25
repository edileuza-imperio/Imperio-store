'use client';

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Produto {
  id_produto: number;
  nome: string;
  categoria_id: number | null;
  preco?: number | null;
  estoque?: number | null;
}

interface Categoria {
  id_categoria: number;
  nome: string;
  total_produtos: number;
}

export default function UnificarProdutosModal({
  open,
  categoriaId,
  onClose,
  onSaved,
}: {
  open: boolean;
  categoriaId: number | null;
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
}) {
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // UI
  const [busca, setBusca] = useState("");
  const [somenteDisponiveis, setSomenteDisponiveis] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open || !categoriaId) return;

    setLoading(true);
    setSelecionados([]);
    setBusca("");
    setSomenteDisponiveis(true);

    const carregar = async () => {
      try {
        const [cat, prod] = await Promise.all([
          api.get(`/admin/categorias/${categoriaId}`, { withCredentials: true }),
          api.get("/admin/produtos", { withCredentials: true }),
        ]);
        setCategoria(cat.data?.dados ?? null);
        setProdutos(prod.data?.dados ?? []);
      } catch {
        toast.error("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [open, categoriaId]);

  // ESC fecha modal
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const toggle = (id: number) => {
    setSelecionados(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const limpar = () => setSelecionados([]);

  const produtosFiltrados = useMemo(() => {
    const term = busca.trim().toLowerCase();
    return produtos
      .filter(p => (somenteDisponiveis ? p.categoria_id === null : true))
      .filter(p => (term ? p.nome?.toLowerCase().includes(term) : true));
  }, [produtos, busca, somenteDisponiveis]);

  const totais = useMemo(() => {
    const bloqueados = produtos.filter(p => p.categoria_id !== null).length;
    const disponiveis = produtos.length - bloqueados;
    return { bloqueados, disponiveis, total: produtos.length };
  }, [produtos]);

  const salvar = async () => {
    if (!categoriaId) return;

    if (selecionados.length === 0) {
      toast.error("Selecione pelo menos um produto");
      return;
    }

    try {
      setSalvando(true);
      await api.post("/admin/produtos/unificar", {
        categoria_id: categoriaId,
        produtos: selecionados
      }, { withCredentials: true });

      toast.success("Produtos unificados com sucesso!");
      if (onSaved) await onSaved();
      onClose();
    } catch {
      toast.error("Erro ao unificar produtos");
    } finally {
      setSalvando(false);
    }
  };

  if (!open) return null;

  return (
    <div className="u2m__backdrop" onMouseDown={onClose}>
      <div className="u2m__shell" onMouseDown={(e) => e.stopPropagation()}>
        <ToastContainer />

        {/* TOP BAR */}
        <header className="u2__top">
          <div className="u2__topLeft">
            <div className="u2__crumb">Admin / Categorias / Unificar</div>
            <div className="u2__titleRow">
              <h1 className="u2__title">
                Unificar em <span>{categoria?.nome}</span>
              </h1>
              <span className="u2__chip">
                Já unificados: <b>{categoria?.total_produtos ?? 0}</b>
              </span>
            </div>
          </div>

          <div className="u2__topRight">
            <button className="u2__btn u2__btn--ghost" onClick={onClose}>
              Cancelar
            </button>

            <button
              className="u2__btn u2__btn--primary"
              onClick={salvar}
              disabled={salvando || selecionados.length === 0}
            >
              {salvando ? "Salvando..." : "Salvar"}
              <span className="u2__count">{selecionados.length}</span>
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <main className="u2__content">
          {/* LEFT PANEL */}
          <aside className="u2__panel">
            <div className="u2__panelTitle">Resumo</div>

            <div className="u2__kpis">
              <div className="u2__kpi">
                <div className="u2__kpiLabel">Total</div>
                <div className="u2__kpiValue">{totais.total}</div>
              </div>
              <div className="u2__kpi">
                <div className="u2__kpiLabel">Disponíveis</div>
                <div className="u2__kpiValue u2__kpiValue--ok">{totais.disponiveis}</div>
              </div>
              <div className="u2__kpi">
                <div className="u2__kpiLabel">Bloqueados</div>
                <div className="u2__kpiValue u2__kpiValue--muted">{totais.bloqueados}</div>
              </div>
            </div>

            <div className="u2__divider" />

            <div className="u2__panelTitle">Filtros</div>

            <label className="u2__label">Buscar</label>
            <input
              className="u2__input"
              placeholder="Digite o nome do produto…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />

            <label className="u2__check">
              <input
                type="checkbox"
                checked={somenteDisponiveis}
                onChange={(e) => setSomenteDisponiveis(e.target.checked)}
              />
              <span>Mostrar só disponíveis</span>
            </label>

            <button
              className="u2__btn u2__btn--danger u2__btn--full"
              onClick={limpar}
              disabled={selecionados.length === 0}
            >
              Limpar seleção
            </button>

            <div className="u2__hint">
              Dica: clique no card para selecionar/desselecionar.
            </div>
          </aside>

          {/* GRID */}
          <section className="u2__gridWrap">
            {loading ? (
              <div className="u2__loading">
                <div className="u2__dots">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="u2__loadingText">Carregando produtos…</div>
              </div>
            ) : produtosFiltrados.length === 0 ? (
              <div className="u2__empty">
                <div className="u2__emptyTitle">Nenhum produto encontrado</div>
                <div className="u2__emptySub">
                  Tente outro termo ou desative “Mostrar só disponíveis”.
                </div>
              </div>
            ) : (
              <div className="u2__grid">
                {produtosFiltrados.map((prod) => {
                  const bloqueado = prod.categoria_id !== null;
                  const ativo = selecionados.includes(prod.id_produto);

                  return (
                    <article
                      key={prod.id_produto}
                      className={[
                        "u2__card",
                        ativo ? "u2__card--selected" : "",
                        bloqueado ? "u2__card--locked" : ""
                      ].join(" ")}
                      onClick={() => !bloqueado && toggle(prod.id_produto)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="u2__cardTop">
                        <div className="u2__name" title={prod.nome}>{prod.nome}</div>
                        <div className="u2__badgeRow">
                          {bloqueado ? (
                            <span className="u2__badge u2__badge--muted">Bloqueado</span>
                          ) : ativo ? (
                            <span className="u2__badge u2__badge--primary">Selecionado</span>
                          ) : (
                            <span className="u2__badge u2__badge--ok">Disponível</span>
                          )}
                        </div>
                      </div>

                      <div className="u2__meta">
                        <div className="u2__metaRow">
                          <span>Preço</span>
                          <b>R${Number(prod.preco ?? 0).toFixed(2)}</b>
                        </div>
                        <div className="u2__metaRow">
                          <span>Estoque</span>
                          <b>{Number(prod.estoque ?? 0)}</b>
                        </div>
                      </div>

                      <div className="u2__cardBottom">
                        <span className="u2__id">#{prod.id_produto}</span>
                        <span className="u2__small">
                          {bloqueado ? "Já tem categoria" : ativo ? "Clique para remover" : "Clique para selecionar"}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>

        {/* ====== MODAL CSS (backdrop + container) ====== */}
        <style jsx global>{`
          .u2m__backdrop{
            position: fixed;
            inset: 0;
            background: rgba(17,24,39,.55);
            display:flex;
            align-items:center;
            justify-content:center;
            padding: 14px;
            z-index: 9999;
            overflow:auto;
          }
          .u2m__shell{
            width: min(1200px, 100%);
          }
        `}</style>

        {/* ====== CSS ORIGINAL COMPLETO (mantido) ====== */}
        <style jsx global>{`
          .u2{
            min-height:100vh;
            background:#f6f7fb;
            color:#111827;
            padding:20px;
          }

          .u2 *{ box-sizing:border-box; }
          .u2{ font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }

          /* TOP */
          .u2__top{
            background:#ffffff;
            border:1px solid #e5e7eb;
            border-radius:16px;
            padding:16px 16px;
            display:flex;
            justify-content:space-between;
            align-items:flex-start;
            gap:12px;
            box-shadow: 0 10px 24px rgba(17,24,39,.06);
          }

          .u2__crumb{
            font-size:12px;
            color:#6b7280;
            margin-bottom:6px;
          }

          .u2__titleRow{
            display:flex;
            gap:10px;
            align-items:center;
            flex-wrap:wrap;
          }

          .u2__title{
            margin:0;
            font-size:22px;
            font-weight:900;
            letter-spacing:-.02em;
          }

          .u2__title span{
            color:#2563eb;
          }

          .u2__chip{
            font-size:12px;
            background:#eff6ff;
            color:#1d4ed8;
            border:1px solid #dbeafe;
            padding:6px 10px;
            border-radius:999px;
            font-weight:700;
          }

          .u2__topRight{
            display:flex;
            gap:10px;
            align-items:center;
          }

          .u2__btn{
            border:none;
            border-radius:12px;
            padding:10px 14px;
            font-weight:800;
            cursor:pointer;
            transition: transform .12s ease, box-shadow .12s ease, background .12s ease, opacity .12s ease;
            display:inline-flex;
            align-items:center;
            gap:10px;
          }
          .u2__btn:active{ transform: translateY(1px); }
          .u2__btn:disabled{ opacity:.55; cursor:not-allowed; }

          .u2__btn--ghost{
            background:#f3f4f6;
            color:#111827;
          }
          .u2__btn--ghost:hover{ background:#e5e7eb; }

          .u2__btn--primary{
            background:#2563eb;
            color:#fff;
            box-shadow: 0 12px 20px rgba(37,99,235,.22);
          }
          .u2__btn--primary:hover{ background:#1d4ed8; }

          .u2__btn--danger{
            background:#fff;
            color:#b91c1c;
            border:1px solid #fecaca;
          }
          .u2__btn--danger:hover{ background:#fef2f2; }

          .u2__btn--full{ width:100%; justify-content:center; }

          .u2__count{
            background: rgba(255,255,255,.25);
            border: 1px solid rgba(255,255,255,.35);
            padding:2px 8px;
            border-radius:999px;
            font-size:12px;
            font-weight:900;
          }

          /* LAYOUT */
          .u2__content{
            margin-top:14px;
            display:grid;
            grid-template-columns: 320px 1fr;
            gap:14px;
            align-items:start;
          }

          @media (max-width: 980px){
            .u2__content{ grid-template-columns: 1fr; }
          }

          /* PANEL */
          .u2__panel{
            background:#fff;
            border:1px solid #e5e7eb;
            border-radius:16px;
            padding:14px;
            box-shadow: 0 10px 24px rgba(17,24,39,.06);
            position: sticky;
            top: 14px;
          }

          @media (max-width: 980px){
            .u2__panel{ position: static; }
          }

          .u2__panelTitle{
            font-weight:900;
            margin-bottom:10px;
            letter-spacing:-.01em;
          }

          .u2__kpis{
            display:grid;
            grid-template-columns: repeat(3, 1fr);
            gap:10px;
          }

          .u2__kpi{
            border:1px solid #e5e7eb;
            border-radius:14px;
            padding:10px;
            background:#fafafa;
          }

          .u2__kpiLabel{
            font-size:12px;
            color:#6b7280;
          }
          .u2__kpiValue{
            font-size:18px;
            font-weight:900;
            margin-top:2px;
          }
          .u2__kpiValue--ok{ color:#059669; }
          .u2__kpiValue--muted{ color:#6b7280; }

          .u2__divider{
            height:1px;
            background:#e5e7eb;
            margin:12px 0;
          }

          .u2__label{
            display:block;
            font-size:12px;
            color:#6b7280;
            font-weight:800;
            margin: 8px 0 6px;
          }

          .u2__input{
            width:100%;
            border:1px solid #e5e7eb;
            border-radius:12px;
            padding:10px 12px;
            outline:none;
            font-weight:700;
            background:#fff;
          }
          .u2__input:focus{
            border-color:#93c5fd;
            box-shadow: 0 0 0 4px rgba(59,130,246,.15);
          }

          .u2__check{
            display:flex;
            gap:10px;
            align-items:center;
            margin-top:10px;
            font-weight:800;
            color:#111827;
            user-select:none;
          }
          .u2__check input{ width:16px; height:16px; }

          .u2__hint{
            margin-top:10px;
            font-size:12px;
            color:#6b7280;
          }

          /* GRID AREA */
          .u2__gridWrap{
            min-height: 260px;
          }

          .u2__grid{
            display:grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap:12px;
          }
          @media (max-width: 1200px){
            .u2__grid{ grid-template-columns: repeat(3, minmax(0,1fr)); }
          }
          @media (max-width: 900px){
            .u2__grid{ grid-template-columns: repeat(2, minmax(0,1fr)); }
          }
          @media (max-width: 520px){
            .u2__grid{ grid-template-columns: 1fr; }
          }

          .u2__card{
            background:#fff;
            border:1px solid #e5e7eb;
            border-radius:16px;
            padding:12px;
            box-shadow: 0 10px 24px rgba(17,24,39,.06);
            transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
            cursor:pointer;
            user-select:none;
          }
          .u2__card:hover{
            transform: translateY(-2px);
            box-shadow: 0 16px 34px rgba(17,24,39,.10);
            border-color:#dbeafe;
          }

          .u2__card--selected{
            border-color:#93c5fd;
            box-shadow: 0 18px 40px rgba(37,99,235,.18);
          }

          .u2__card--locked{
            opacity:.6;
            cursor:not-allowed;
          }

          .u2__cardTop{
            display:flex;
            justify-content:space-between;
            align-items:flex-start;
            gap:10px;
          }

          .u2__name{
            font-weight:900;
            letter-spacing:-.01em;
            max-width:70%;
            overflow:hidden;
            text-overflow:ellipsis;
            white-space:nowrap;
          }

          .u2__badge{
            font-size:11px;
            padding:6px 10px;
            border-radius:999px;
            font-weight:900;
            border:1px solid transparent;
          }
          .u2__badge--primary{
            background:#eff6ff;
            color:#1d4ed8;
            border-color:#dbeafe;
          }
          .u2__badge--ok{
            background:#ecfdf5;
            color:#047857;
            border-color:#a7f3d0;
          }
          .u2__badge--muted{
            background:#f3f4f6;
            color:#6b7280;
            border-color:#e5e7eb;
          }

          .u2__meta{
            margin-top:10px;
            border-top:1px solid #e5e7eb;
            padding-top:10px;
            display:flex;
            flex-direction:column;
            gap:6px;
            color:#374151;
            font-size:13px;
            font-weight:700;
          }
          .u2__metaRow{
            display:flex;
            justify-content:space-between;
            align-items:center;
          }

          .u2__cardBottom{
            margin-top:10px;
            display:flex;
            justify-content:space-between;
            align-items:center;
            color:#6b7280;
            font-size:12px;
            font-weight:800;
          }
          .u2__id{ color:#111827; }

          /* LOADING */
          .u2__loading{
            background:#fff;
            border:1px dashed #e5e7eb;
            border-radius:16px;
            padding:30px;
            text-align:center;
            box-shadow: 0 10px 24px rgba(17,24,39,.06);
          }
          .u2__dots{
            display:inline-flex;
            gap:8px;
            margin-bottom:10px;
          }
          .u2__dots span{
            width:10px;height:10px;border-radius:999px;
            background:#2563eb;
            animation:u2bounce .7s infinite alternate;
          }
          .u2__dots span:nth-child(2){ animation-delay: .15s; }
          .u2__dots span:nth-child(3){ animation-delay: .3s; }
          @keyframes u2bounce{
            from{ transform: translateY(0); opacity:.35; }
            to{ transform: translateY(-6px); opacity:1; }
          }
          .u2__loadingText{ font-weight:900; color:#111827; }

          /* EMPTY */
          .u2__empty{
            background:#fff;
            border:1px dashed #e5e7eb;
            border-radius:16px;
            padding:30px;
            text-align:center;
            box-shadow: 0 10px 24px rgba(17,24,39,.06);
          }
          .u2__emptyTitle{ font-weight:900; font-size:16px; }
          .u2__emptySub{ margin-top:6px; color:#6b7280; font-weight:700; }
        `}</style>
      </div>
    </div>
  );
}