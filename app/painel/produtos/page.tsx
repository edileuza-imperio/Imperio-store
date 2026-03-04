"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FaEdit, FaStar, FaPlus, FaTrash, FaBook } from "react-icons/fa";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NovoProdutoModal from "@/components/Modal/NovoProdutoModal";

interface Produto {
  id_produto: number;
  nome: string;
  slug: string;
  preco: number;
  estoque: number;
  destaque?: boolean;
  id_destaque?: number;
  catalogo?: number;
  imagem?: string;
}

export const getImagemUrl = (caminho?: string) => {
  if (!caminho) return undefined;

  const base = api.defaults.baseURL || "";
  const caminhoLimpo = String(caminho).replace(/^\/+/, "");
  const baseFinal = base.endsWith("/") ? base : `${base}/`;

  return `${baseFinal}${caminhoLimpo}`;
};

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalNovoProduto, setModalNovoProduto] = useState(false);

  // ✅ paginação por select + números
  const [itensPorPagina, setItensPorPagina] = useState<number>(12);
  const [pagina, setPagina] = useState<number>(1);

  useEffect(() => {
    carregarProdutos();
  }, []);

  // quando mudar a quantidade por página, volta pra página 1
  useEffect(() => {
    setPagina(1);
  }, [itensPorPagina]);

  const carregarProdutos = async () => {
    try {
      setLoading(true);

      const res = await api.get("/admin/produtos");

      let lista = res.data?.dados || res.data;
      if (lista?.dados) lista = lista.dados;
      if (!Array.isArray(lista)) lista = [];

      const convertidos: Produto[] = lista.map((p: any) => ({
        ...p,
        preco: Number(p.preco || 0),
        estoque: Number(p.estoque || 0),
        imagem: getImagemUrl(p.imagem),
      }));

      setProdutos(convertidos);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  const toggleDestaque = async (produto: Produto) => {
    try {
      if (produto.destaque) {
        if (!produto.id_destaque) {
          toast.error("Não foi possível remover: id_destaque ausente.");
          return;
        }

        await api.delete(`/admin/produtos/destaques/${produto.id_destaque}/remover`);

        setProdutos((p) =>
          p.map((i) =>
            i.id_produto === produto.id_produto
              ? { ...i, destaque: false, id_destaque: undefined }
              : i
          )
        );

        toast.success("Removido do destaque");
      } else {
        const res = await api.post("/admin/produtos/destaques/criar", {
          produto_id: produto.id_produto,
        });

        const idDestaque =
          res.data?.id_destaque ??
          res.data?.dados?.id_destaque ??
          res.data?.dados?.id ??
          res.data?.id ??
          undefined;

        setProdutos((p) =>
          p.map((i) =>
            i.id_produto === produto.id_produto
              ? { ...i, destaque: true, id_destaque: idDestaque }
              : i
          )
        );

        toast.success("Adicionado ao destaque");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao alterar destaque");
    }
  };

  const toggleCatalogo = async (produto: Produto) => {
    try {
      if (produto.catalogo === 1) {
        await api.put(`/admin/produtos/${produto.id_produto}/catalogo/nao`);

        setProdutos((p) =>
          p.map((i) =>
            i.id_produto === produto.id_produto ? { ...i, catalogo: 0 } : i
          )
        );

        toast.success("Removido do catálogo");
      } else {
        await api.put(`/admin/produtos/${produto.id_produto}/catalogo/sim`);

        setProdutos((p) =>
          p.map((i) =>
            i.id_produto === produto.id_produto ? { ...i, catalogo: 1 } : i
          )
        );

        toast.success("Adicionado ao catálogo");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar catálogo");
    }
  };

  const excluirProduto = async (id: number) => {
    if (!confirm("Deseja excluir este produto?")) return;

    try {
      await api.delete(`/admin/produto/${id}/remover`);

      setProdutos((p) => p.filter((i) => i.id_produto !== id));
      toast.success("Produto excluído com sucesso");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir produto");
    }
  };

  // ===== paginação (front) =====
  const totalPaginas = useMemo(() => {
    const total = Math.ceil((produtos?.length || 0) / itensPorPagina);
    return Math.max(total, 1);
  }, [produtos, itensPorPagina]);

  // garante pagina dentro do range
  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas);
    if (pagina < 1) setPagina(1);
  }, [pagina, totalPaginas]);

  const produtosPaginados = useMemo(() => {
    const start = (pagina - 1) * itensPorPagina;
    const end = start + itensPorPagina;
    return produtos.slice(start, end);
  }, [produtos, pagina, itensPorPagina]);

  const paginas = useMemo(() => {
    // lista completa de páginas (1..N). Se quiser limitar (tipo 1..10), eu ajusto.
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  }, [totalPaginas]);

  return (
    <div className="container-fluid py-4 dashboard-bg">
      <ToastContainer position="top-right" autoClose={2500} />

      <NovoProdutoModal
        open={modalNovoProduto}
        onClose={() => setModalNovoProduto(false)}
        onCreated={async () => {
          setModalNovoProduto(false);
          await carregarProdutos();
        }}
      />

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="title">Produtos</h2>
          <p className="text-muted">Gerencie os produtos cadastrados</p>
        </div>

        <div className="top-actions">
          <div className="pagerSelect">
            <span>Por página</span>
            <select
              value={itensPorPagina}
              onChange={(e) => setItensPorPagina(Number(e.target.value))}
            >
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={16}>16</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>

          <button className="btn btn-gold" onClick={() => setModalNovoProduto(true)}>
            <FaPlus /> Novo Produto
          </button>
        </div>
      </div>

      {/* ✅ numeração sem Próximo/Anterior */}
      {!loading && produtos.length > 0 && totalPaginas > 1 && (
        <div className="pagerBar">
          <div className="pagerInfo">
            Página <b>{pagina}</b> de <b>{totalPaginas}</b> — Total:{" "}
            <b>{produtos.length}</b>
          </div>

          <div className="pagerNumbers" aria-label="Paginação">
            {paginas.map((p) => (
              <button
                key={p}
                type="button"
                className={`pageBtn ${p === pagina ? "active" : ""}`}
                onClick={() => setPagina(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">Carregando produtos...</div>
      ) : (
        <div className="row g-4">
          {produtosPaginados.map((prod) => (
            <div key={prod.id_produto} className="col-xl-3 col-lg-4 col-md-6">
              <div className="produto-card">
                <div className="card-image">
                  {prod.imagem ? (
                    <img src={prod.imagem} alt={prod.nome} />
                  ) : (
                    <div className="no-image">Sem imagem</div>
                  )}

                  <div className="badges">
                    {prod.destaque && <span className="badge badge-destaque">Destaque</span>}

                    {prod.catalogo === 1 && (
                      <span className="badge badge-catalogo">Catálogo</span>
                    )}
                  </div>
                </div>

                <div className="card-body">
                  <h6 className="produto-nome">{prod.nome}</h6>

                  <p className="preco">R$ {prod.preco.toFixed(2)}</p>

                  <small className="estoque">Estoque: {prod.estoque}</small>

                  <div className="acoes">
                    <Link href={`/admin/produto/${prod.slug}`} title="Editar">
                      <FaEdit />
                    </Link>

                    <button onClick={() => toggleDestaque(prod)} title="Destaque">
                      <FaStar />
                    </button>

                    <button
                      onClick={() => toggleCatalogo(prod)}
                      title="Catálogo"
                      className={prod.catalogo === 1 ? "catalogo-on" : "catalogo-off"}
                    >
                      <FaBook />
                    </button>

                    <button
                      onClick={() => excluirProduto(prod.id_produto)}
                      className="danger"
                      title="Excluir"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {!produtos.length && (
            <div className="col-12">
              <div className="alert alert-light border">Nenhum produto encontrado</div>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        .dashboard-bg {
          background: #f6f7fb;
          min-height: 100vh;
        }

        .title {
          color: #6b4c4f;
          font-weight: 700;
        }

        .btn-gold {
          background: #d4af37;
          color: #fff;
          border: none;
          display: inline-flex;
          gap: 8px;
          align-items: center;
        }

        .top-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .pagerSelect {
          display: flex;
          gap: 10px;
          align-items: center;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 999px;
          padding: 10px 12px;
          box-shadow: 0 8px 18px rgba(0,0,0,0.06);
          color: #6b4c4f;
          font-weight: 700;
          font-size: 12px;
        }

        .pagerSelect select {
          border: 1px solid rgba(0,0,0,0.12);
          border-radius: 999px;
          padding: 6px 10px;
          outline: none;
          background: #fff;
          font-weight: 700;
          cursor: pointer;
        }

        .pagerBar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 14px;

          background: rgba(255,255,255,0.78);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 14px;
          padding: 10px 12px;
          box-shadow: 0 10px 24px rgba(0,0,0,0.06);
        }

        .pagerInfo {
          color: #6b4c4f;
          font-size: 13px;
        }

        .pagerNumbers {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: flex-end;
        }

        .pageBtn {
          min-width: 36px;
          height: 34px;
          padding: 0 10px;
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.10);
          background: #fff;
          font-weight: 800;
          color: #6b4c4f;
          cursor: pointer;
          transition: 0.15s;
        }

        .pageBtn:hover {
          transform: translateY(-1px);
          border-color: rgba(0,0,0,0.18);
        }

        .pageBtn.active {
          background: #d4af37;
          border-color: #d4af37;
          color: #fff;
        }

        .produto-card {
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
          transition: 0.2s;
        }

        .produto-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 26px rgba(0, 0, 0, 0.12);
        }

        .card-image {
          height: 150px;
          position: relative;
          background: #eee;
        }

        .card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .no-image {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .badges {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 6px;
        }

        .badge {
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 999px;
          color: #fff;
        }

        .badge-destaque {
          background: #e74c3c;
        }

        .badge-catalogo {
          background: #22c55e;
        }

        .card-body {
          padding: 12px;
        }

        .produto-nome {
          margin-bottom: 4px;
          font-size: 14px;
        }

        .preco {
          font-weight: 600;
          margin-bottom: 2px;
        }

        .estoque {
          font-size: 12px;
          color: #888;
        }

        .acoes {
          margin-top: 8px;
          display: flex;
          gap: 12px;
          font-size: 16px;
        }

        .acoes button,
        .acoes a {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b4c4f;
          text-decoration: none;
        }

        .acoes .danger {
          color: #e74c3c;
        }

        .catalogo-on {
          color: #22c55e;
        }

        .catalogo-off {
          color: #999;
        }

        .acoes button:hover,
        .acoes a:hover {
          color: #d4af37;
        }
      `}</style>
    </div>
  );
}