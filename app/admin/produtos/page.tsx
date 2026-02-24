"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaEdit, FaStar, FaPlus, FaTrash, FaBook } from "react-icons/fa";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { rotas } from "@/components/Bibioteca/config/rotas";

interface Status {
  id_status: number;
  nome: string;
  cor?: string;
}

interface Produto {
  id_produto: number;
  nome: string;
  slug: string;
  preco: number;
  estoque: number;
  statusid: number;
  imagem?: string;
  destaque?: boolean;
  id_destaque?: number;
  statusNome?: string;
  statusCor?: string;
  catalogo?: number;
}

type ApiResponse<T> = {
  dados?: any;
  data?: any;
};

function resolveArray<T>(payload: any): T[] {
  const root = payload?.dados ?? payload?.data ?? payload;
  if (Array.isArray(root)) return root;
  if (root?.dados && Array.isArray(root.dados)) return root.dados;
  return [];
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

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);

      const [statusRes, produtosRes] = await Promise.all([
        api.get<ApiResponse<Status[]>>(rotas.admin.api.produtosStatus),
        api.get<ApiResponse<any[]>>(rotas.admin.api.produtos),
      ]);

      const statuses = resolveArray<Status>(statusRes.data);
      const listaProdutos = resolveArray<any>(produtosRes.data);

      const produtosConvertidos: Produto[] = listaProdutos.map((p: any) => {
        const status = statuses.find(
          (s) => Number(s.id_status) === Number(p.statusid)
        );

        return {
          ...p,
          preco: Number(p.preco || 0),
          estoque: Number(p.estoque || 0),
          destaque: Boolean(p.destaque),
          catalogo: Number(p.catalogo ?? 0),
          imagem: getImagemUrl(p.imagem),
          statusNome: status?.nome ?? "Inativo",
          statusCor: status?.cor ?? "#999",
        };
      });

      setProdutos(produtosConvertidos);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao carregar produtos");
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  };

  const excluirProduto = async (id: number) => {
    if (!confirm("Deseja excluir este produto?")) return;

    try {
      await api.delete(rotas.admin.api.produtoRemover(id));
      setProdutos((p) => p.filter((i) => i.id_produto !== id));
      toast.success("Produto excluído");
    } catch {
      toast.error("Erro ao excluir produto");
    }
  };

  return (
    <div className="container-fluid py-4 dashboard-bg">
      <ToastContainer position="top-right" />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold title">Produtos</h1>
          <p className="text-muted">Gerencie os produtos cadastrados</p>
        </div>

        <Link href="/admin/produto/novo" className="btn btn-gold">
          <FaPlus /> Novo Produto
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-5">Carregando...</div>
      ) : (
        <div className="row g-4">
          {produtos.map((prod) => {
            const isEspecial = prod.destaque || prod.catalogo === 1;

            return (
              <div key={prod.id_produto} className="col-12 col-sm-6 col-md-4 col-xl-3">
                <div className="produto-card">
                  <div className="card-image">
                    {prod.imagem ? (
                      <img src={prod.imagem} alt={prod.nome} />
                    ) : (
                      <div className="no-image">Sem imagem</div>
                    )}

                    {prod.destaque && (
                      <span className="badge destaque">Destaque</span>
                    )}

                    {prod.catalogo === 1 && (
                      <span className="badge catalogo">Catálogo</span>
                    )}
                  </div>

                  <div className="card-body">
                    <h6 className="produto-nome">{prod.nome}</h6>

                    <span
                      className="status-badge"
                      style={{ backgroundColor: prod.statusCor }}
                    >
                      {prod.statusNome}
                    </span>

                    <p className="preco">
                      R$ {Number(prod.preco).toFixed(2)}
                    </p>

                    <small className="estoque">
                      Estoque: {Number(prod.estoque)}
                    </small>

                    {/* ❌ Se for destaque ou catálogo some os botões */}
                    {!isEspecial && (
                      <div className="acoes acoes-hide">
                        <Link
                          href={`/admin/produto/${encodeURIComponent(prod.slug)}`}
                        >
                          <FaEdit />
                        </Link>

                        <button
                          onClick={() => excluirProduto(prod.id_produto)}
                          className="danger"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {!produtos.length && (
            <div className="col-12">
              <div className="alert alert-light border">
                Nenhum produto encontrado.
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        .dashboard-bg { background: #f5f6fa; min-height: 100vh; }
        .title { color: #6b4c4f; }
        .btn-gold { background: #d4af37; color: #fff; border: none; }

        .produto-card {
          background: #fff;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 6px 18px rgba(0,0,0,0.06);
          transition: 0.2s;
          height: 100%;
        }

        .produto-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.12);
        }

        .card-image {
          position: relative;
          height: 160px;
          background: #eee;
        }

        .card-image img, .no-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .badge {
          position: absolute;
          top: 10px;
          padding: 4px 10px;
          font-size: 11px;
          border-radius: 999px;
          color: #fff;
        }

        .badge.destaque { right: 10px; background: #e74c3c; }
        .badge.catalogo { left: 10px; background: #22c55e; }

        .card-body { padding: 14px; }
        .produto-nome { color: #6b4c4f; margin-bottom: 4px; }

        .status-badge {
          display: inline-block;
          margin-bottom: 8px;
          padding: 4px 10px;
          font-size: 11px;
          border-radius: 999px;
          color: #fff;
        }

        .preco { font-weight: 600; margin-bottom: 2px; }
        .estoque { color: #888; font-size: 12px; }

        .acoes {
          margin-top: 12px;
          display: flex;
          gap: 14px;
          font-size: 1.1rem;
        }

        .acoes a, .acoes button {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b4c4f;
        }

        .acoes .danger { color: #e74c3c; }

        /* ✅ MOBILE: sempre visível */
        .acoes-hide {
          opacity: 1;
          transform: translateY(0);
        }

        /* ✅ DESKTOP: hover */
        @media (hover: hover) and (pointer: fine) {
          .acoes-hide {
            opacity: 0;
            transform: translateY(6px);
            transition: 0.18s ease;
          }

          .produto-card:hover .acoes-hide {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}