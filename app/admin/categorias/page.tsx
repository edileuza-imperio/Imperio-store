'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FaEdit, FaPlus, FaTrash, FaLayerGroup, FaBox, FaSearch } from "react-icons/fa";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { rotas } from "@/components/Bibioteca/config/rotas";

interface Categoria {
  id_categoria: number;
  nome: string;
  icone?: string;
  total_produtos: number;
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  // UI
  const [busca, setBusca] = useState("");
  const [ordenar, setOrdenar] = useState<"nome" | "produtos">("nome");

  useEffect(() => {
    carregarCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregarCategorias = async () => {
    try {
      setLoading(true);
      const res = await api.get(rotas.admin.api.categoriasListar, { withCredentials: true });

      // seu backend usa Mensagemjson("...", 200, $dados)
      // então geralmente vem { mensagem, status, dados }
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
      // ✅ nova rota
      await api.delete(rotas.admin.api.categoriaRemover(id), { withCredentials: true });

      setCategorias((prev) => prev.filter((c) => c.id_categoria !== id));
      toast.success("Categoria excluída com sucesso!");
    } catch (err: any) {
      console.error(err?.response?.data || err?.message || err);
      toast.error("Não foi possível excluir a categoria");
    }
  };

  // (Opcional) soft delete - se você quiser usar desativar ao invés de deletar
  // const desativarCategoria = async (id: number) => {
  //   if (!confirm("Deseja desativar esta categoria?")) return;
  //   try {
  //     await api.put(rotas.admin.api.categoriaDesativar(id), null, { withCredentials: true });
  //     toast.info("Categoria desativada");
  //     await carregarCategorias();
  //   } catch (err: any) {
  //     console.error(err?.response?.data || err?.message || err);
  //     toast.error("Não foi possível desativar a categoria");
  //   }
  // };

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

          <Link href="/admin/categorias/nova" className="catui__btn catui__btn--primary">
            <FaPlus /> Nova Categoria
          </Link>
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
        /* (seu CSS pode ficar igual — não precisa mexer) */
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