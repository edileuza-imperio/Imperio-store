'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FaEdit, FaPlus, FaTrash, FaLayerGroup, FaBox, FaSearch } from "react-icons/fa";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { rotas } from "@/components/Bibioteca/config/rotas";

interface Categoria {
  id_categoria: number;
  nome: string;
  icone?: string;
  total_produtos: number;
}

interface Status {
  id_status: number;
  nome: string;
  cor?: string;
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  // UI
  const [busca, setBusca] = useState("");
  const [ordenar, setOrdenar] = useState<"nome" | "produtos">("nome");

  // Modal
  const [modalNovaCat, setModalNovaCat] = useState(false);

  useEffect(() => {
    carregarCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregarCategorias = async () => {
    try {
      setLoading(true);
      const res = await api.get(rotas.admin.api.categoriasListar, { withCredentials: true });
      setCategorias(res.data?.dados ?? []);
    } catch (err: any) {
      console.error(err?.response?.data || err?.message || err);
      toast.error("Erro ao carregar categorias");
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  };

  const excluirCategoria = async (id: number) => {
    if (!confirm("Deseja realmente excluir esta categoria?")) return;

    try {
      // ✅ rota correta (deve gerar /admin/categorias/{id}/remover)
      const url = rotas.admin.api.categoriaRemover(id);
      await api.delete(url, { withCredentials: true });

      setCategorias((prev) => prev.filter((c) => c.id_categoria !== id));
      toast.success("Categoria excluída com sucesso!");
    } catch (err: any) {
      console.error(err?.response?.data || err?.message || err);
      toast.error("Não foi possível excluir a categoria");
    }
  };

  const categoriasFiltradas = useMemo(() => {
    const term = busca.trim().toLowerCase();

    let lista = categorias.filter((c) =>
      term ? c.nome?.toLowerCase().includes(term) : true
    );

    lista = [...lista].sort((a, b) => {
      if (ordenar === "produtos") return (b.total_produtos ?? 0) - (a.total_produtos ?? 0);
      return (a.nome ?? "").localeCompare(b.nome ?? "");
    });

    return lista;
  }, [categorias, busca, ordenar]);

  const totalProdutos = useMemo(
    () => categorias.reduce((acc, c) => acc + (c.total_produtos ?? 0), 0),
    [categorias]
  );

  return (
    <div className="catui container-fluid py-4">
      <ToastContainer position="top-right" />

      {/* MODAL NOVA CATEGORIA */}
      {modalNovaCat && (
        <NovaCategoriaModal
          onClose={() => setModalNovaCat(false)}
          onCreated={async () => {
            setModalNovaCat(false);
            await carregarCategorias();
          }}
        />
      )}

      {/* HEADER */}
      <div className="catui__header">
        <div className="catui__titleWrap">
          <div className="catui__kicker">Admin</div>
          <h1 className="catui__title">Categorias</h1>
          <p className="catui__subtitle">Gerencie as categorias e seus produtos</p>
        </div>

        <div className="catui__headerActions">
          <div className="catui__pill">
            <div className="catui__pillNum">{categorias.length}</div>
            <div className="catui__pillText">
              <b>Categorias</b>
              <span>{totalProdutos} produtos no total</span>
            </div>
          </div>

          {/* ✅ ABRE MODAL (em vez de Link para /nova) */}
          <button
            type="button"
            className="catui__btn catui__btn--primary"
            onClick={() => setModalNovaCat(true)}
          >
            <FaPlus /> Nova Categoria
          </button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="catui__toolbar">
        <div className="catui__search">
          <FaSearch className="catui__searchIcon" />
          <input
            className="catui__input"
            placeholder="Buscar categoria pelo nome…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="catui__sort">
          <span className="catui__sortLabel">Ordenar:</span>
          <button
            className={`catui__chipBtn ${ordenar === "nome" ? "isActive" : ""}`}
            onClick={() => setOrdenar("nome")}
            type="button"
          >
            Nome
          </button>
          <button
            className={`catui__chipBtn ${ordenar === "produtos" ? "isActive" : ""}`}
            onClick={() => setOrdenar("produtos")}
            type="button"
          >
            Produtos
          </button>
        </div>
      </div>

      {/* CONTEÚDO */}
      {loading ? (
        <div className="catui__loading">
          <div className="catui__spinner" />
          <div>
            <div className="catui__loadingTitle">Carregando categorias…</div>
            <div className="catui__loadingSub">Aguarde um instante.</div>
          </div>
        </div>
      ) : categoriasFiltradas.length === 0 ? (
        <div className="catui__empty">
          <div className="catui__emptyTitle">Nenhuma categoria encontrada</div>
          <div className="catui__emptySub">
            Tente outro termo de busca ou crie uma nova categoria.
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {categoriasFiltradas.map((cat) => (
            <div key={cat.id_categoria} className="col-12 col-sm-6 col-md-4 col-xl-3">
              <div className="catui__card">
                {/* Top */}
                <div className="catui__cardTop">
                  <div className="catui__icon">
                    {cat.icone ? (
                      <i className={`bi ${cat.icone}`} />
                    ) : (
                      <FaBox />
                    )}
                  </div>

                  <div className="catui__countBox">
                    <span className="catui__countNum">{cat.total_produtos ?? 0}</span>
                    <small className="catui__countLabel">produtos</small>
                  </div>
                </div>

                {/* Nome */}
                <h5 className="catui__name" title={cat.nome}>
                  {cat.nome}
                </h5>

                {/* Actions */}
                <div className="catui__actions">
                  <Link
                    href={`/admin/categorias/${cat.id_categoria}`}
                    title="Editar"
                    className="catui__iconBtn catui__iconBtn--edit"
                  >
                    <FaEdit />
                  </Link>

                  <button
                    onClick={() => excluirCategoria(cat.id_categoria)}
                    title="Excluir"
                    className="catui__iconBtn catui__iconBtn--delete"
                    type="button"
                  >
                    <FaTrash />
                  </button>

                  <Link
                    href={`/admin/categorias/${cat.id_categoria}/unificar`}
                    className="catui__btn catui__btn--outline"
                    title="Unificar produtos nesta categoria"
                  >
                    <FaLayerGroup />
                    Unificar
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== ESTILO GLOBAL (isolado por .catui) ===== */}
      <style jsx global>{`
        .catui{
          min-height: 100vh;
          background: #f6f7fb;
          padding-inline: 18px;
          color: #111827;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        }
        .catui *{ box-sizing: border-box; }

        .catui__header{
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 16px 18px;
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:14px;
          flex-wrap:wrap;
          box-shadow: 0 10px 24px rgba(17,24,39,.06);
        }
        .catui__kicker{
          font-size: 12px;
          color: #6b7280;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
        }
        .catui__title{
          margin: 4px 0 0;
          font-size: 24px;
          font-weight: 900;
          letter-spacing: -.02em;
        }
        .catui__subtitle{
          margin: 6px 0 0;
          color: #6b7280;
          font-weight: 600;
        }
        .catui__headerActions{
          display:flex;
          align-items:center;
          gap:12px;
          flex-wrap:wrap;
        }
        .catui__pill{
          display:flex;
          gap:10px;
          align-items:center;
          padding: 10px 12px;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          background: #fafafa;
          min-width: 240px;
        }
        .catui__pillNum{
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display:flex;
          align-items:center;
          justify-content:center;
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #dbeafe;
          font-weight: 900;
        }
        .catui__pillText{
          display:flex;
          flex-direction:column;
          line-height:1.1;
          font-size: 12px;
          color: #6b7280;
          font-weight: 700;
        }
        .catui__pillText b{
          font-size: 13px;
          color:#111827;
        }

        .catui__toolbar{
          margin-top: 14px;
          display:flex;
          gap:12px;
          align-items:center;
          justify-content:space-between;
          flex-wrap:wrap;
        }
        .catui__search{
          flex: 1;
          min-width: 280px;
          background:#fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          display:flex;
          align-items:center;
          gap:10px;
          padding: 10px 12px;
          box-shadow: 0 10px 24px rgba(17,24,39,.06);
        }
        .catui__searchIcon{ color:#6b7280; }
        .catui__input{
          width:100%;
          border:none;
          outline:none;
          font-weight: 800;
          color:#111827;
          background: transparent;
        }
        .catui__input::placeholder{ color:#9ca3af; font-weight:700; }

        .catui__sort{
          display:flex;
          align-items:center;
          gap:10px;
          background:#fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 10px 12px;
          box-shadow: 0 10px 24px rgba(17,24,39,.06);
        }
        .catui__sortLabel{
          color:#6b7280;
          font-size: 12px;
          font-weight: 900;
        }
        .catui__chipBtn{
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          padding: 8px 10px;
          border-radius: 999px;
          font-weight: 900;
          font-size: 12px;
          cursor:pointer;
          transition: transform .12s ease, background .12s ease, border-color .12s ease;
        }
        .catui__chipBtn:active{ transform: translateY(1px); }
        .catui__chipBtn:hover{ background:#f3f4f6; }
        .catui__chipBtn.isActive{
          background:#eff6ff;
          border-color:#dbeafe;
          color:#1d4ed8;
        }

        .catui__btn{
          border: none;
          border-radius: 14px;
          padding: 10px 14px;
          font-weight: 900;
          cursor:pointer;
          display:inline-flex;
          align-items:center;
          gap:10px;
          transition: transform .12s ease, box-shadow .12s ease, background .12s ease, opacity .12s ease;
          text-decoration: none;
          user-select:none;
          white-space:nowrap;
        }
        .catui__btn:active{ transform: translateY(1px); }
        .catui__btn:disabled{ opacity:.6; cursor:not-allowed; }

        .catui__btn--primary{
          background:#2563eb;
          color:#fff;
          box-shadow: 0 12px 20px rgba(37,99,235,.22);
        }
        .catui__btn--primary:hover{ background:#1d4ed8; }

        .catui__btn--outline{
          margin-left:auto;
          background:#fff;
          border: 1px solid #e5e7eb;
          color:#111827;
        }
        .catui__btn--outline:hover{
          background:#f9fafb;
          border-color:#dbeafe;
        }

        .catui__card{
          background:#fff;
          border:1px solid #e5e7eb;
          border-radius: 18px;
          padding: 16px;
          height:100%;
          box-shadow: 0 10px 26px rgba(17,24,39,.06);
          display:flex;
          flex-direction:column;
          transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
        }
        .catui__card:hover{
          transform: translateY(-4px);
          box-shadow: 0 16px 34px rgba(17,24,39,.10);
          border-color:#dbeafe;
        }

        .catui__cardTop{
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom: 10px;
        }
        .catui__icon{
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#f3f4f6;
          color:#374151;
          border:1px solid #e5e7eb;
          font-size: 18px;
        }

        .catui__countBox{
          text-align:right;
          line-height:1.1;
        }
        .catui__countNum{
          display:block;
          font-size: 20px;
          font-weight: 900;
          color:#111827;
        }
        .catui__countLabel{
          color:#6b7280;
          font-weight: 800;
          font-size: 11px;
        }

        .catui__name{
          font-weight: 900;
          color:#111827;
          margin: 4px 0 14px;
          letter-spacing: -.01em;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .catui__actions{
          margin-top:auto;
          display:flex;
          align-items:center;
          gap:10px;
        }

        .catui__iconBtn{
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border:1px solid #e5e7eb;
          background:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
          transition: transform .12s ease, background .12s ease, border-color .12s ease;
          text-decoration:none;
        }
        .catui__iconBtn:active{ transform: translateY(1px); }

        .catui__iconBtn--edit{ color:#2563eb; }
        .catui__iconBtn--edit:hover{
          background:#eff6ff; border-color:#dbeafe;
        }

        .catui__iconBtn--delete{ color:#ef4444; }
        .catui__iconBtn--delete:hover{
          background:#fef2f2; border-color:#fecaca;
        }

        .catui__loading{
          margin-top: 14px;
          background:#fff;
          border:1px solid #e5e7eb;
          border-radius: 18px;
          padding: 22px 18px;
          display:flex;
          gap:12px;
          align-items:center;
          box-shadow: 0 10px 24px rgba(17,24,39,.06);
        }
        .catui__spinner{
          width: 18px;
          height: 18px;
          border-radius: 999px;
          border: 3px solid #e5e7eb;
          border-top-color: #2563eb;
          animation: catspin .8s linear infinite;
        }
        @keyframes catspin{ to{ transform: rotate(360deg); } }

        .catui__loadingTitle{ font-weight: 900; }
        .catui__loadingSub{ color:#6b7280; font-weight: 700; font-size: 12px; }

        .catui__empty{
          margin-top: 14px;
          background:#fff;
          border:1px dashed #e5e7eb;
          border-radius: 18px;
          padding: 28px 18px;
          text-align:center;
          box-shadow: 0 10px 24px rgba(17,24,39,.06);
        }
        .catui__emptyTitle{ font-weight: 900; font-size: 16px; }
        .catui__emptySub{ margin-top: 6px; color:#6b7280; font-weight:700; }

        @media (max-width: 520px){
          .catui{ padding-inline: 12px; }
          .catui__pill{ min-width: auto; width: 100%; }
          .catui__headerActions{ width: 100%; justify-content: space-between; }
          .catui__btn--outline{ margin-left: 0; width: 100%; justify-content:center; }
        }
      `}</style>
    </div>
  );
}

/* =========================================================
   MODAL: NOVA CATEGORIA (substitui /admin/categorias/nova)
========================================================= */

function NovaCategoriaModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [nome, setNome] = useState("");
  const [icone, setIcone] = useState("");
  const [statusList, setStatusList] = useState<Status[]>([]);
  const [statusSelecionado, setStatusSelecionado] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const carregarStatus = async () => {
      try {
        // ⚠️ aqui depois você troca pra rotas.admin.api... quando mandar o configrotas
        const res = await api.get("/admin/status", { withCredentials: true });
        const lista = res.data?.dados || [];
        setStatusList(lista);
        setStatusSelecionado(lista[0] || null);
      } catch (err) {
        toast.error("Erro ao carregar status");
      }
    };
    carregarStatus();
  }, []);

  // ESC fecha modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleStatus = () => {
    if (!statusSelecionado || statusList.length === 0) return;
    const idx = statusList.findIndex((s) => s.id_status === statusSelecionado.id_status);
    setStatusSelecionado(statusList[(idx + 1) % statusList.length]);
  };

  const getContraste = (cor?: string) => {
    if (!cor) return "#fff";
    const hex = cor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#000" : "#fff";
  };

  const salvar = async () => {
    if (!nome.trim()) return toast.error("O nome da categoria é obrigatório");
    if (!statusSelecionado) return toast.error("Selecione um status");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("nome", nome.trim());
      formData.append("icone", icone.trim());
      formData.append("statusid", String(statusSelecionado.id_status));

      // ⚠️ aqui depois você troca pra rotas.admin.api... quando mandar o configrotas
      await api.post("/admin/cat", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Categoria criada com sucesso!");
      await onCreated();
    } catch (err) {
      toast.error("Erro ao criar categoria");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mcat__backdrop" onMouseDown={onClose}>
      <div className="mcat__modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mcat__header">
          <div>
            <div className="mcat__kicker">Admin</div>
            <h2 className="mcat__title">Nova Categoria</h2>
            <p className="mcat__sub">Crie e organize categorias do catálogo</p>
          </div>

          <button className="mcat__close" type="button" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        {/* Nome */}
        <div className="mcat__field">
          <label className="mcat__label">Nome</label>
          <input
            className="mcat__input"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Eletrônicos"
          />
        </div>

        {/* Ícone */}
        <div className="mcat__field">
          <label className="mcat__label">Ícone (Bootstrap / FontAwesome)</label>
          <input
            className="mcat__input"
            value={icone}
            onChange={(e) => setIcone(e.target.value)}
            placeholder="Ex: bi-tags ou fa-solid fa-box"
          />
        </div>

        {/* Status */}
        <div className="mcat__field">
          <label className="mcat__label">Status</label>

          {statusSelecionado ? (
            <>
              <button
                type="button"
                className="mcat__pill"
                onClick={toggleStatus}
                style={{
                  background: statusSelecionado.cor || "#2563eb",
                  color: getContraste(statusSelecionado.cor),
                }}
              >
                {statusSelecionado.nome}
              </button>

              <div className="mcat__hint">Clique para alternar o status</div>
            </>
          ) : (
            <div className="mcat__hint">Carregando status…</div>
          )}
        </div>

        <div className="mcat__footer">
          <button type="button" className="mcat__btn mcat__btnLight" onClick={onClose} disabled={loading}>
            Cancelar
          </button>

          <button type="button" className="mcat__btn mcat__btnPrimary" onClick={salvar} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Categoria"}
          </button>
        </div>

        <style jsx global>{`
          .mcat__backdrop{
            position: fixed;
            inset: 0;
            background: rgba(17,24,39,.55);
            display:flex;
            align-items:center;
            justify-content:center;
            padding: 18px;
            z-index: 9999;
          }
          .mcat__modal{
            width: 100%;
            max-width: 640px;
            background: #fff;
            border-radius: 18px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 18px 50px rgba(0,0,0,.25);
            padding: 18px;
          }
          .mcat__header{
            display:flex;
            justify-content:space-between;
            gap: 12px;
            align-items:flex-start;
            margin-bottom: 10px;
          }
          .mcat__kicker{
            font-size: 12px;
            color: #6b7280;
            font-weight: 800;
            letter-spacing: .12em;
            text-transform: uppercase;
          }
          .mcat__title{
            margin: 4px 0 0;
            font-size: 20px;
            font-weight: 900;
            letter-spacing: -.02em;
            color: #111827;
          }
          .mcat__sub{
            margin: 6px 0 0;
            color: #6b7280;
            font-weight: 600;
            font-size: 13px;
          }
          .mcat__close{
            border: 1px solid #e5e7eb;
            background: #fff;
            width: 40px;
            height: 40px;
            border-radius: 12px;
            cursor:pointer;
            font-weight: 900;
          }
          .mcat__field{
            margin-top: 12px;
          }
          .mcat__label{
            display:block;
            font-weight: 800;
            color:#374151;
            font-size: 13px;
            margin-bottom: 6px;
          }
          .mcat__input{
            width: 100%;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 10px 12px;
            outline: none;
            font-weight: 700;
          }
          .mcat__input:focus{
            border-color: #dbeafe;
            box-shadow: 0 0 0 4px rgba(37,99,235,.12);
          }
          .mcat__pill{
            border: none;
            border-radius: 999px;
            padding: 8px 14px;
            font-weight: 900;
            cursor: pointer;
          }
          .mcat__hint{
            margin-top: 6px;
            font-size: 12px;
            color:#6b7280;
            font-weight: 700;
          }
          .mcat__footer{
            display:flex;
            justify-content:flex-end;
            gap: 10px;
            margin-top: 16px;
          }
          .mcat__btn{
            border: none;
            border-radius: 14px;
            padding: 10px 14px;
            font-weight: 900;
            cursor:pointer;
          }
          .mcat__btnLight{
            background:#f3f4f6;
            color:#111827;
          }
          .mcat__btnPrimary{
            background:#2563eb;
            color:#fff;
          }
          .mcat__btn:disabled{
            opacity: .7;
            cursor:not-allowed;
          }
        `}</style>
      </div>
    </div>
  );
}