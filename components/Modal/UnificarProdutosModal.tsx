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
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const limpar = () => setSelecionados([]);

  const produtosFiltrados = useMemo(() => {
    const term = busca.trim().toLowerCase();
    return produtos
      .filter((p) => (somenteDisponiveis ? p.categoria_id === null : true))
      .filter((p) => (term ? p.nome?.toLowerCase().includes(term) : true));
  }, [produtos, busca, somenteDisponiveis]);

  const totais = useMemo(() => {
    const bloqueados = produtos.filter((p) => p.categoria_id !== null).length;
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
      await api.post(
        "/admin/produtos/unificar",
        { categoria_id: categoriaId, produtos: selecionados },
        { withCredentials: true }
      );

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
    <div className="um__backdrop" onMouseDown={onClose}>
      <ToastContainer position="top-right" />

      <div className="um__modal" onMouseDown={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <header className="um__header">
          <div className="um__headerLeft">
            <div className="um__kicker">Admin</div>
            <div className="um__titleRow">
              <h2 className="um__title">
                Unificar em <span>{categoria?.nome ?? "..."}</span>
              </h2>
              <span className="um__chip">
                Já unificados: <b>{categoria?.total_produtos ?? 0}</b>
              </span>
            </div>
            <div className="um__sub">
              Selecione produtos disponíveis para adicionar nesta categoria.
            </div>
          </div>

          <button className="um__close" type="button" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        {/* BODY */}
        <div className="um__body">
          {/* LEFT: filtros + resumo */}
          <aside className="um__side">
            <div className="um__panelTitle">Resumo</div>

            <div className="um__kpis">
              <div className="um__kpi">
                <div className="um__kpiLabel">Total</div>
                <div className="um__kpiValue">{totais.total}</div>
              </div>
              <div className="um__kpi">
                <div className="um__kpiLabel">Disponíveis</div>
                <div className="um__kpiValue um__kpiValue--ok">{totais.disponiveis}</div>
              </div>
              <div className="um__kpi">
                <div className="um__kpiLabel">Bloqueados</div>
                <div className="um__kpiValue um__kpiValue--muted">{totais.bloqueados}</div>
              </div>
            </div>

            <div className="um__divider" />

            <div className="um__panelTitle">Filtros</div>

            <label className="um__label">Buscar</label>
            <input
              className="um__input"
              placeholder="Digite o nome do produto…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />

            <label className="um__check">
              <input
                type="checkbox"
                checked={somenteDisponiveis}
                onChange={(e) => setSomenteDisponiveis(e.target.checked)}
              />
              <span>Somente disponíveis</span>
            </label>

            <button
              className="um__btn um__btn--danger um__btn--full"
              onClick={limpar}
              disabled={selecionados.length === 0}
              type="button"
            >
              Limpar seleção
            </button>

            <div className="um__hint">
              Dica: marque os itens na lista.
            </div>
          </aside>

          {/* RIGHT: lista */}
          <section className="um__listWrap">
            <div className="um__listHeader">
              <div className="um__listTitle">Produtos</div>
              <div className="um__listMeta">
                Selecionados: <b>{selecionados.length}</b>
              </div>
            </div>

            {loading ? (
              <div className="um__state">
                <div className="um__spinner" />
                <div>
                  <div className="um__stateTitle">Carregando produtos…</div>
                  <div className="um__stateSub">Aguarde um instante.</div>
                </div>
              </div>
            ) : produtosFiltrados.length === 0 ? (
              <div className="um__state um__state--empty">
                <div className="um__stateTitle">Nenhum produto encontrado</div>
                <div className="um__stateSub">
                  Tente outro termo ou desative “Somente disponíveis”.
                </div>
              </div>
            ) : (
              <div className="um__list">
                {produtosFiltrados.map((p) => {
                  const bloqueado = p.categoria_id !== null;
                  const checked = selecionados.includes(p.id_produto);

                  return (
                    <div
                      key={p.id_produto}
                      className={[
                        "um__row",
                        checked ? "isChecked" : "",
                        bloqueado ? "isLocked" : "",
                      ].join(" ")}
                      onClick={() => !bloqueado && toggle(p.id_produto)}
                      role="button"
                      tabIndex={0}
                      title={bloqueado ? "Este produto já está em uma categoria" : "Clique para selecionar"}
                    >
                      <div className="um__rowLeft">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(p.id_produto)}
                          disabled={bloqueado}
                          onClick={(e) => e.stopPropagation()}
                        />

                        <div className="um__rowText">
                          <div className="um__rowName" title={p.nome}>{p.nome}</div>
                          <div className="um__rowSub">
                            <span>#{p.id_produto}</span>
                            <span>•</span>
                            <span>Estoque: <b>{Number(p.estoque ?? 0)}</b></span>
                          </div>
                        </div>
                      </div>

                      <div className="um__rowRight">
                        <div className="um__price">R${Number(p.preco ?? 0).toFixed(2)}</div>

                        {bloqueado ? (
                          <span className="um__badge um__badge--muted">Bloqueado</span>
                        ) : checked ? (
                          <span className="um__badge um__badge--primary">Selecionado</span>
                        ) : (
                          <span className="um__badge um__badge--ok">Disponível</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* FOOTER */}
        <footer className="um__footer">
          <button
            type="button"
            className="um__btn um__btn--ghost"
            onClick={onClose}
            disabled={salvando}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="um__btn um__btn--primary"
            onClick={salvar}
            disabled={salvando || selecionados.length === 0}
          >
            {salvando ? "Salvando..." : "Salvar"}
            <span className="um__count">{selecionados.length}</span>
          </button>
        </footer>

        {/* ===== CSS (compacto e profissional) ===== */}
        <style jsx global>{`
          .um__backdrop{
            position: fixed;
            inset: 0;
            background: rgba(17,24,39,.55);
            display:flex;
            align-items:center;
            justify-content:center;
            padding: 16px;
            z-index: 9999;
            overflow:auto;
          }

          .um__modal{
            width: min(980px, 100%);
            background:#fff;
            border:1px solid #e5e7eb;
            border-radius: 18px;
            box-shadow: 0 18px 60px rgba(0,0,0,.25);
            overflow:hidden;
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
            color:#111827;
          }

          .um__header{
            display:flex;
            justify-content:space-between;
            gap:12px;
            align-items:flex-start;
            padding: 16px 16px 12px;
            border-bottom:1px solid #e5e7eb;
            background:#fff;
          }

          .um__kicker{
            font-size: 12px;
            color: #6b7280;
            font-weight: 900;
            letter-spacing: .12em;
            text-transform: uppercase;
          }

          .um__titleRow{
            display:flex;
            align-items:center;
            gap:10px;
            flex-wrap:wrap;
            margin-top: 2px;
          }

          .um__title{
            margin:0;
            font-size: 18px;
            font-weight: 950;
            letter-spacing: -.02em;
          }

          .um__title span{ color:#2563eb; }

          .um__chip{
            font-size: 12px;
            background:#eff6ff;
            color:#1d4ed8;
            border:1px solid #dbeafe;
            padding:6px 10px;
            border-radius:999px;
            font-weight:800;
          }

          .um__sub{
            margin-top: 6px;
            font-size: 12px;
            color:#6b7280;
            font-weight: 700;
          }

          .um__close{
            border:1px solid #e5e7eb;
            background:#fff;
            width:40px;
            height:40px;
            border-radius: 12px;
            cursor:pointer;
            font-weight: 900;
          }

          .um__body{
            display:grid;
            grid-template-columns: 300px 1fr;
            gap: 0;
            min-height: 520px;
          }

          @media (max-width: 900px){
            .um__body{ grid-template-columns: 1fr; }
          }

          .um__side{
            padding: 14px;
            border-right:1px solid #e5e7eb;
            background:#fafafa;
          }
          @media (max-width: 900px){
            .um__side{ border-right:none; border-bottom:1px solid #e5e7eb; }
          }

          .um__panelTitle{
            font-weight: 950;
            margin-bottom: 10px;
            letter-spacing: -.01em;
          }

          .um__kpis{
            display:grid;
            grid-template-columns: repeat(3, 1fr);
            gap:10px;
          }

          .um__kpi{
            background:#fff;
            border:1px solid #e5e7eb;
            border-radius: 14px;
            padding: 10px;
          }

          .um__kpiLabel{ font-size: 12px; color:#6b7280; font-weight:800; }
          .um__kpiValue{ font-size: 16px; font-weight: 950; margin-top: 2px; }
          .um__kpiValue--ok{ color:#059669; }
          .um__kpiValue--muted{ color:#6b7280; }

          .um__divider{
            height:1px;
            background:#e5e7eb;
            margin: 12px 0;
          }

          .um__label{
            display:block;
            font-size:12px;
            color:#6b7280;
            font-weight: 900;
            margin: 8px 0 6px;
          }

          .um__input{
            width:100%;
            border:1px solid #e5e7eb;
            border-radius: 12px;
            padding: 10px 12px;
            outline:none;
            background:#fff;
            font-weight: 800;
          }

          .um__input:focus{
            border-color:#93c5fd;
            box-shadow: 0 0 0 4px rgba(59,130,246,.15);
          }

          .um__check{
            display:flex;
            align-items:center;
            gap:10px;
            margin-top: 10px;
            font-weight: 900;
            color:#111827;
            user-select:none;
          }
          .um__check input{ width:16px; height:16px; }

          .um__hint{
            margin-top: 10px;
            font-size: 12px;
            color:#6b7280;
            font-weight: 700;
          }

          .um__listWrap{
            padding: 0;
            display:flex;
            flex-direction:column;
            min-width:0;
          }

          .um__listHeader{
            padding: 12px 14px;
            border-bottom:1px solid #e5e7eb;
            display:flex;
            justify-content:space-between;
            align-items:center;
            background:#fff;
          }

          .um__listTitle{
            font-weight: 950;
            letter-spacing:-.01em;
          }

          .um__listMeta{
            font-size: 12px;
            color:#6b7280;
            font-weight: 800;
          }

          .um__list{
            padding: 10px;
            overflow:auto;
            max-height: 420px;
          }

          @media (max-width: 900px){
            .um__list{ max-height: 360px; }
            .um__body{ min-height: 0; }
          }

          .um__row{
            border:1px solid #e5e7eb;
            border-radius: 14px;
            background:#fff;
            padding: 10px 12px;
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap: 12px;
            margin-bottom: 10px;
            cursor:pointer;
            transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
          }

          .um__row:hover{
            transform: translateY(-1px);
            box-shadow: 0 14px 30px rgba(17,24,39,.08);
            border-color:#dbeafe;
          }

          .um__row.isLocked{
            opacity:.65;
            cursor:not-allowed;
          }

          .um__row.isChecked{
            border-color:#93c5fd;
            box-shadow: 0 16px 36px rgba(37,99,235,.14);
          }

          .um__rowLeft{
            display:flex;
            align-items:flex-start;
            gap: 10px;
            min-width:0;
          }

          .um__rowLeft input{
            margin-top: 4px;
          }

          .um__rowText{
            min-width:0;
          }

          .um__rowName{
            font-weight: 950;
            max-width: 520px;
            overflow:hidden;
            text-overflow:ellipsis;
            white-space:nowrap;
          }

          .um__rowSub{
            margin-top: 4px;
            font-size: 12px;
            color:#6b7280;
            font-weight: 800;
            display:flex;
            gap: 8px;
            align-items:center;
          }

          .um__rowRight{
            display:flex;
            flex-direction:column;
            gap: 6px;
            align-items:flex-end;
            white-space:nowrap;
          }

          .um__price{
            font-weight: 950;
          }

          .um__badge{
            font-size:11px;
            padding: 6px 10px;
            border-radius: 999px;
            font-weight: 950;
            border: 1px solid transparent;
          }

          .um__badge--primary{
            background:#eff6ff;
            color:#1d4ed8;
            border-color:#dbeafe;
          }
          .um__badge--ok{
            background:#ecfdf5;
            color:#047857;
            border-color:#a7f3d0;
          }
          .um__badge--muted{
            background:#f3f4f6;
            color:#6b7280;
            border-color:#e5e7eb;
          }

          .um__state{
            padding: 18px;
            margin: 12px;
            border-radius: 16px;
            border: 1px dashed #e5e7eb;
            background:#fff;
            display:flex;
            gap: 12px;
            align-items:center;
            justify-content:center;
          }

          .um__state--empty{
            flex-direction:column;
            text-align:center;
          }

          .um__spinner{
            width: 18px;
            height: 18px;
            border-radius: 999px;
            border: 3px solid #e5e7eb;
            border-top-color:#2563eb;
            animation: umspin .8s linear infinite;
          }
          @keyframes umspin{ to{ transform: rotate(360deg); } }

          .um__stateTitle{ font-weight: 950; }
          .um__stateSub{ font-size: 12px; color:#6b7280; font-weight: 700; }

          .um__footer{
            border-top:1px solid #e5e7eb;
            padding: 12px 14px;
            display:flex;
            justify-content:flex-end;
            gap: 10px;
            background:#fff;
          }

          .um__btn{
            border:none;
            border-radius: 14px;
            padding: 10px 14px;
            font-weight: 950;
            cursor:pointer;
            display:inline-flex;
            align-items:center;
            gap: 10px;
            transition: transform .12s ease, background .12s ease, opacity .12s ease;
          }
          .um__btn:active{ transform: translateY(1px); }
          .um__btn:disabled{ opacity:.6; cursor:not-allowed; }

          .um__btn--ghost{
            background:#f3f4f6;
            color:#111827;
          }
          .um__btn--ghost:hover{ background:#e5e7eb; }

          .um__btn--primary{
            background:#2563eb;
            color:#fff;
            box-shadow: 0 12px 20px rgba(37,99,235,.22);
          }
          .um__btn--primary:hover{ background:#1d4ed8; }

          .um__btn--danger{
            background:#fff;
            color:#b91c1c;
            border:1px solid #fecaca;
          }
          .um__btn--danger:hover{ background:#fef2f2; }

          .um__btn--full{
            width:100%;
            justify-content:center;
          }

          .um__count{
            background: rgba(255,255,255,.25);
            border: 1px solid rgba(255,255,255,.35);
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 950;
          }
        `}</style>
      </div>
    </div>
  );
}