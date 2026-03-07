"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";

// Tipos
type Produto = {
  id_produto: number;
  nome: string;
  slug?: string;
  descricao?: string;
  preco?: number | string;
  preco_promocional?: number | string;
  estoque?: number;
  ilimitado?: number;
  imagem?: string;
  categoria_id?: number | null;
  categoria_nome?: string | null;
  statusid?: number | null;
  status_nome?: string | null;
  catalogo?: number;
  destaque?: number | null;
  sku?: string;
  modelo?: string;
};

// Funções auxiliares
function resolveApi<T>(payload: any): T {
  if (payload?.dados != null) return payload.dados as T;
  if (payload?.data != null) return payload.data as T;
  if (payload?.produtos != null) return payload.produtos as T;
  return payload as T;
}

function getImagemUrl(caminho?: string) {
  if (!caminho) return "/placeholder-image.png";
  const base = api.defaults.baseURL || "";
  if (caminho.startsWith("http")) return caminho;
  return `${base.replace(/\/$/, "")}/${String(caminho).replace(/^\/+/, "")}`;
}

function formatMoney(value: number | string | undefined) {
  const n = Number(value || 0);
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Componente principal
export default function ProdutosPainelPage() {
  const router = useRouter();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  async function carregarProdutos() {
    try {
      setLoading(true);
      const res = await api.get("/admin/produtos", { withCredentials: true });
      const lista = resolveApi<Produto[]>(res.data) || [];
      setProdutos(Array.isArray(lista) ? lista : []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      alert("Não foi possível carregar os produtos. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return produtos;

    return produtos.filter((p) => {
      return (
        p.nome.toLowerCase().includes(termo) ||
        (p.sku || "").toLowerCase().includes(termo) ||
        (p.categoria_nome || "").toLowerCase().includes(termo)
      );
    });
  }, [produtos, busca]);

  async function excluirProduto(produto: Produto) {
    const confirmou = window.confirm(
      `Tem certeza que deseja excluir o produto "${produto.nome}"? Esta ação não pode ser desfeita.`
    );
    if (!confirmou) return;

    try {
      await api.delete(`/admin/produto/${produto.id_produto}/remover`, {
        withCredentials: true,
      });
      // Remove o produto da lista local para uma atualização de UI instantânea
      setProdutos((anteriores) =>
        anteriores.filter((p) => p.id_produto !== produto.id_produto)
      );
    } catch (error: any) {
      console.error("Erro ao excluir produto:", error);
      alert(
        error?.response?.data?.mensagem || "Ocorreu um erro ao excluir o produto."
      );
    }
  }

  return (
    <>
      <div className="painel-container">
        <header className="painel-header">
          <div className="header-content">
            <h1>Catálogo de Produtos</h1>
            <p>Gerencie seus produtos com eficiência e estilo.</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => router.push("/painel/produtos/novo")}
          >
            + Adicionar Produto
          </button>
        </header>

        <div className="busca-wrapper">
          <svg className="busca-icon" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            className="busca-input"
            placeholder="Buscar por nome, SKU ou categoria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="feedback-box">Carregando...</div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="feedback-box">
            {busca ? "Nenhum produto encontrado para sua busca." : "Nenhum produto cadastrado ainda."}
          </div>
        ) : (
          <div className="produtos-grid">
            {produtosFiltrados.map((produto) => (
              <div key={produto.id_produto} className="produto-card">
                <div className="card-imagem-wrapper">
                  <img
                    src={getImagemUrl(produto.imagem)}
                    alt={produto.nome}
                    className="card-imagem"
                  />
                  <div className="card-badges">
                    {produto.destaque ? (
                      <span className="badge badge-destaque">Destaque</span>
                    ) : null}
                    <span
                      className={`badge ${produto.catalogo ? "badge-ativo" : "badge-inativo"}`}
                    >
                      {produto.catalogo ? "Visível" : "Oculto"}
                    </span>
                  </div>
                </div>
                <div className="card-conteudo">
                  <span className="card-categoria">
                    {produto.categoria_nome || "Sem Categoria"}
                  </span>
                  <h3 className="card-titulo">{produto.nome}</h3>
                  <div className="card-info-grid">
                    <div className="info-item">
                      <span>Preço</span>
                      <strong>{formatMoney(produto.preco)}</strong>
                    </div>
                    <div className="info-item">
                      <span>Estoque</span>
                      <strong>
                        {produto.ilimitado ? "Ilimitado" : produto.estoque ?? 0}
                      </strong>
                    </div>
                  </div>
                  <div className="card-acoes">
                    <button
                      className="btn btn-secondary"
                      onClick={() =>
                        router.push(
                          `/painel/produtos/${produto.id_produto}/editar`
                        )
                      }
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => excluirProduto(produto)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .painel-container {
          background-color: #111827; // Dark background
          color: #f9fafb; // Light text
          min-height: 100vh;
          padding: 2rem;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .painel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .header-content h1 {
          font-size: 2.25rem; // 36px
          font-weight: 800;
          letter-spacing: -0.025em;
          margin: 0;
        }

        .header-content p {
          font-size: 1rem; // 16px
          color: #9ca3af; // Gray 400
          margin-top: 0.5rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem; // 8px
          font-weight: 600;
          font-size: 0.875rem; // 14px
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .btn-primary {
          background-color: #be185d; // Pink 700
          color: white;
        }
        
        .btn-secondary {
          background-color: #374151; // Gray 700
          color: #f9fafb; // Gray 50
        }
        
        .btn-danger {
          background-color: #991b1b; // Red 800
          color: #f9fafb; // Gray 50
        }

        .busca-wrapper {
          position: relative;
          margin-bottom: 2.5rem;
        }

        .busca-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 1.25rem; // 20px
          height: 1.25rem;
          color: #6b7280; // Gray 500
        }

        .busca-input {
          width: 100%;
          background-color: #1f2937; // Gray 800
          color: #f9fafb;
          border: 1px solid #374151; // Gray 700
          border-radius: 0.5rem;
          padding: 1rem 1rem 1rem 3rem;
          font-size: 1rem;
          outline: none;
        }

        .busca-input:focus {
          border-color: #be185d;
          box-shadow: 0 0 0 3px rgba(190, 24, 93, 0.5);
        }

        .feedback-box {
          text-align: center;
          padding: 4rem;
          background-color: #1f2937;
          border-radius: 1rem;
          color: #9ca3af;
          font-weight: 500;
        }

        .produtos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
        }

        .produto-card {
          background-color: #1f2937; // Gray 800
          border-radius: 1rem; // 16px
          overflow: hidden;
          border: 1px solid #374151; // Gray 700
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .produto-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
        }

        .card-imagem-wrapper {
          position: relative;
          height: 220px;
          background-color: #374151;
        }

        .card-imagem {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .card-badges {
          position: absolute;
          top: 1rem;
          left: 1rem;
          display: flex;
          gap: 0.5rem;
        }

        .badge {
          padding: 0.375rem 0.75rem;
          border-radius: 999px;
          font-size: 0.75rem; // 12px
          font-weight: 700;
          text-transform: uppercase;
        }

        .badge-destaque {
          background-color: #f59e0b; // Amber 500
          color: #111827;
        }

        .badge-ativo {
          background-color: #10b981; // Green 500
          color: #f9fafb;
        }

        .badge-inativo {
          background-color: #4b5563; // Gray 600
          color: #d1d5db; // Gray 300
        }

        .card-conteudo {
          padding: 1.5rem;
        }

        .card-categoria {
          font-size: 0.75rem;
          font-weight: 600;
          color: #be185d;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-titulo {
          font-size: 1.25rem; // 20px
          font-weight: 700;
          margin: 0.5rem 0 1rem;
        }

        .card-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .info-item span {
          font-size: 0.875rem;
          color: #9ca3af;
          display: block;
        }

        .info-item strong {
          font-size: 1rem;
          font-weight: 600;
          color: #f9fafb;
        }

        .card-acoes {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        @media (max-width: 640px) {
          .painel-container { padding: 1rem; }
          .painel-header { text-align: center; justify-content: center; }
          .card-acoes { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}

