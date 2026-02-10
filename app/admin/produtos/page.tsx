"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaEdit, FaStar, FaPlus, FaTrash, FaBook } from "react-icons/fa";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  catalogo?: number; // 1 = no catálogo, 0 = não
}

export const getImagemUrl = (caminho?: string) => {
  if (!caminho) return undefined;
  const base = api.defaults.baseURL || "";
  const caminhoLimpo = caminho.replace(/^\/+/, "");
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
      const [statusRes, produtosRes] = await Promise.all([
        api.get("/admin/status"),
        api.get("/admin/produtos"),
      ]);

      const statuses: Status[] = statusRes.data.dados || [];

      const produtosConvertidos = produtosRes.data.dados.map((p: any) => {
        const status = statuses.find((s) => s.id_status === p.statusid);
        return {
          ...p,
          preco: Number(p.preco),
          destaque: Boolean(p.destaque),
          id_destaque: p.id_destaque,
          statusNome: status?.nome ?? "Inativo",
          statusCor: status?.cor ?? "#999",
          imagem: getImagemUrl(p.imagem),
          catalogo: p.catalogo ?? 0,
        };
      });

      setProdutos(produtosConvertidos);
    } catch (err: any) {
      console.error("❌ Erro ao carregar produtos:", err.response?.data || err.message || err);
      toast.error("Erro ao carregar produtos, veja o console");
    } finally {
      setLoading(false);
    }
  };

  const toggleDestaque = async (produto: Produto) => {
    try {
      if (produto.destaque && produto.id_destaque) {
        const res = await api.delete(`/admin/produtos/destaques/${produto.id_destaque}/remover`);
        setProdutos((p) =>
          p.map((i) =>
            i.id_produto === produto.id_produto ? { ...i, destaque: false } : i
          )
        );
        toast.success("Produto removido do destaque");
      } else {
        const res = await api.post("/admin/produtos/destaques/criar", {
          produto_id: produto.id_produto,
        });
        setProdutos((p) =>
          p.map((i) =>
            i.id_produto === produto.id_produto
              ? { ...i, destaque: true, id_destaque: res.data.dados?.id_destaque }
              : i
          )
        );
        toast.success("Produto adicionado ao destaque");
      }
    } catch (err: any) {
      console.error("❌ Erro ao atualizar destaque:", err.response?.data || err.message || err);
      toast.error("Erro ao atualizar destaque, veja o console");
    }
  };

  const toggleCatalogo = async (produto: Produto) => {
    try {
      if (produto.catalogo === 1) {
        // Remover do catálogo
        await api.put(`/admin/produtos/${produto.id_produto}/catalogo/nao`);
        setProdutos((p) =>
          p.map((i) =>
            i.id_produto === produto.id_produto ? { ...i, catalogo: 0 } : i
          )
        );
        toast.success("Produto removido do catálogo");
      } else {
        // Adicionar ao catálogo
        await api.put(`/admin/produtos/${produto.id_produto}/catalogo/sim`);
        setProdutos((p) =>
          p.map((i) =>
            i.id_produto === produto.id_produto ? { ...i, catalogo: 1 } : i
          )
        );
        toast.success("Produto adicionado ao catálogo");
      }
    } catch (err: any) {
      console.error("❌ Erro ao atualizar catálogo:", err.response?.data || err.message || err);
      toast.error("Erro ao atualizar catálogo, veja o console");
    }
  };

  const excluirProduto = async (id: number) => {
    if (!confirm("Deseja excluir este produto?")) return;
    try {
      await api.delete(`/admin/produto/${id}/remover`);
      setProdutos((p) => p.filter((i) => i.id_produto !== id));
      toast.success("Produto excluído");
    } catch (err: any) {
      console.error("❌ Erro ao excluir produto:", err.response?.data || err.message || err);
      toast.error("Erro ao excluir produto, veja o console");
    }
  };

  return (
    <div className="container-fluid py-4 dashboard-bg">
      <ToastContainer position="top-right" />

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold title">Produtos</h1>
          <p className="text-muted">Gerencie os produtos cadastrados</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/admin/produto/novo" className="btn btn-gold">
            <FaPlus /> Novo Produto
          </Link>
          <Link href="/admin/catalogo" className="btn btn-dark-soft">
            <FaBook /> Catálogo
          </Link>
        </div>
      </div>

      {/* LISTA DE PRODUTOS */}
      {loading ? (
        <div className="text-center py-5">Carregando...</div>
      ) : (
        <div className="row g-4">
          {produtos.map((prod) => (
            <div key={prod.id_produto} className="col-12 col-sm-6 col-md-4 col-xl-3">
              <div className="produto-card">
                {/* IMAGEM */}
                <div className="card-image">
                  {prod.imagem ? <img src={prod.imagem} alt={prod.nome} /> : <div className="no-image">Sem imagem</div>}
                  {prod.destaque && <span className="badge destaque">Destaque</span>}
                </div>

                {/* CONTEÚDO */}
                <div className="card-body">
                  <h6 className="produto-nome">{prod.nome}</h6>
                  <span className="status-badge" style={{ backgroundColor: prod.statusCor }}>{prod.statusNome}</span>
                  <p className="preco">R$ {prod.preco.toFixed(2)}</p>
                  <small className="estoque">Estoque: {prod.estoque}</small>

                  {/* AÇÕES */}
                  <div className="acoes">
                    <Link href={`/admin/produto/${encodeURIComponent(prod.slug)}`} title="Editar"><FaEdit /></Link>
                    <button onClick={() => toggleDestaque(prod)} title="Destaque"><FaStar /></button>
                    <button
                      onClick={() => toggleCatalogo(prod)}
                      title={prod.catalogo === 1 ? "Remover do catálogo" : "Adicionar ao catálogo"}
                      className={prod.catalogo === 1 ? "catalogo-on" : "catalogo-off"}
                    >
                      <FaBook />
                    </button>
                    <button onClick={() => excluirProduto(prod.id_produto)} title="Excluir" className="danger"><FaTrash /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ESTILOS */}
      <style jsx global>{`
        .dashboard-bg { background: #f5f6fa; min-height: 100vh; }
        .title { color: #6b4c4f; }
        .btn-gold { background: #d4af37; color: #fff; border: none; }
        .btn-dark-soft { background: #6b4c4f; color: #fff; border: none; }

        .produto-card { background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 6px 18px rgba(0,0,0,0.06); transition: transform 0.2s, box-shadow 0.2s; height: 100%; }
        .produto-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.12); }

        .card-image { position: relative; height: 160px; background: #eee; }
        .card-image img, .no-image { width: 100%; height: 100%; object-fit: cover; }

        .badge.destaque { position: absolute; top: 10px; right: 10px; background: #e74c3c; color: #fff; font-size: 11px; padding: 4px 10px; border-radius: 999px; }

        .card-body { padding: 14px; }
        .produto-nome { color: #6b4c4f; margin-bottom: 4px; }
        .status-badge { display: inline-block; margin-bottom: 8px; padding: 4px 10px; font-size: 11px; border-radius: 999px; color: #fff; }
        .preco { font-weight: 600; margin-bottom: 2px; }
        .estoque { color: #888; font-size: 12px; }

        .acoes { margin-top: 12px; display: flex; gap: 14px; font-size: 1.1rem; }
        .acoes a, .acoes button { background: none; border: none; cursor: pointer; color: #6b4c4f; }
        .acoes .danger { color: #e74c3c; }
        .acoes a:hover, .acoes button:hover { color: #d4af37; }

        .catalogo-on { color: #22c55e; }
        .catalogo-off { color: #888; }
        .catalogo-on:hover, .catalogo-off:hover { color: #d4af37; }
      `}</style>
    </div>
  );
}
