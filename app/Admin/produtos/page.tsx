"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Produto = {
  id_produto?: number | string;
  id?: number | string;
  nome?: string;
  slug?: string;
  descricao?: string;
  imagem?: string;
  miniatura?: string;
  preco?: number | string;
  preco_promocional?: number | string | null;
  sku?: string;
  modelo?: string;
  marca?: string;
  categoria_id?: number | string;
  status_id?: number | string;
  criado_em?: string;
  atualizado_em?: string;
};

function extrairListaProdutos(data: any): Produto[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.dados)) return data.dados;
  if (Array.isArray(data?.dados?.dados)) return data.dados.dados;
  if (Array.isArray(data?.produtos)) return data.produtos;
  if (Array.isArray(data?.dados?.produtos)) return data.dados.produtos;
  return [];
}

function formatarPreco(valor: number | string | null | undefined) {
  const numero = Number(valor || 0);
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data?: string) {
  if (!data) return "-";

  const dt = new Date(data.replace(" ", "T"));
  if (Number.isNaN(dt.getTime())) return data;

  return dt.toLocaleDateString("pt-BR");
}

function obterIdProduto(produto: Produto) {
  return String(produto.id_produto ?? produto.id ?? "");
}

function obterImagemProduto(produto: Produto) {
  return produto.miniatura || produto.imagem || "";
}

function obterBadgeStatus(statusId?: number | string) {
  const valor = String(statusId ?? "");

  if (valor === "1") {
    return { texto: "Ativo", classe: "ativo" };
  }

  if (valor === "2") {
    return { texto: "Inativo", classe: "inativo" };
  }

  return { texto: `Status ${valor || "-"}`, classe: "neutro" };
}

export default function ProdutosPage() {
  const router = useRouter();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarProdutos() {
      try {
        setCarregando(true);
        setErro("");

        // Ajuste esta rota se sua API listar produtos em outro endpoint
        const response = await api.get("/produtos");
        const lista = extrairListaProdutos(response?.data);

        setProdutos(lista);
      } catch (error: any) {
        console.error("Erro ao carregar produtos:", error);
        setErro(
          error?.response?.data?.mensagem ||
            "Não foi possível carregar os produtos."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarProdutos();
  }, []);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      const textoBusca = busca.trim().toLowerCase();

      const nome = String(produto.nome || "").toLowerCase();
      const sku = String(produto.sku || "").toLowerCase();
      const marca = String(produto.marca || "").toLowerCase();
      const slug = String(produto.slug || "").toLowerCase();

      const passouBusca =
        !textoBusca ||
        nome.includes(textoBusca) ||
        sku.includes(textoBusca) ||
        marca.includes(textoBusca) ||
        slug.includes(textoBusca);

      const statusProduto = String(produto.status_id ?? "");

      const passouStatus =
        filtroStatus === "todos" || statusProduto === filtroStatus;

      return passouBusca && passouStatus;
    });
  }, [produtos, busca, filtroStatus]);

  const totalProdutos = produtos.length;
  const totalAtivos = produtos.filter(
    (produto) => String(produto.status_id ?? "") === "1"
  ).length;
  const totalInativos = produtos.filter(
    (produto) => String(produto.status_id ?? "") === "2"
  ).length;

  return (
    <div className="pagina-produtos">
      <div className="topo">
        <div>
          <span className="badge-painel">Painel Administrativo</span>
          <h1>Produtos</h1>
          <p>
            Gerencie seus produtos, visualize informações principais e acesse o
            cadastro rapidamente.
          </p>
        </div>

        <div className="acoes-topo">
          <button
            type="button"
            className="btn-secundario"
            onClick={() => router.push("/Admin")}
          >
            Voltar ao painel
          </button>

          <Link href="/Admin/produtos/cadastrar" className="btn-primario">
            + Novo produto
          </Link>
        </div>
      </div>

      <div className="cards-resumo">
        <div className="card-resumo">
          <span>Total</span>
          <strong>{totalProdutos}</strong>
        </div>

        <div className="card-resumo">
          <span>Ativos</span>
          <strong>{totalAtivos}</strong>
        </div>

        <div className="card-resumo">
          <span>Inativos</span>
          <strong>{totalInativos}</strong>
        </div>
      </div>

      <div className="barra-filtros">
        <div className="campo-busca">
          <label>Buscar produto</label>
          <input
            type="text"
            placeholder="Buscar por nome, SKU, marca ou slug..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="campo-filtro">
          <label>Status</label>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="1">Ativos</option>
            <option value="2">Inativos</option>
          </select>
        </div>
      </div>

      {carregando ? (
        <div className="estado estado-loading">Carregando produtos...</div>
      ) : erro ? (
        <div className="estado estado-erro">{erro}</div>
      ) : produtosFiltrados.length === 0 ? (
        <div className="estado estado-vazio">
          Nenhum produto encontrado com os filtros atuais.
        </div>
      ) : (
        <div className="grid-produtos">
          {produtosFiltrados.map((produto) => {
            const id = obterIdProduto(produto);
            const imagem = obterImagemProduto(produto);
            const badge = obterBadgeStatus(produto.status_id);

            return (
              <div className="card-produto" key={id || Math.random()}>
                <div className="imagem-produto">
                  {imagem ? (
                    <img src={imagem} alt={produto.nome || "Produto"} />
                  ) : (
                    <div className="sem-imagem">Sem imagem</div>
                  )}
                </div>

                <div className="conteudo-card">
                  <div className="linha-topo-card">
                    <span className={`badge-status ${badge.classe}`}>
                      {badge.texto}
                    </span>

                    <span className="sku">{produto.sku || "Sem SKU"}</span>
                  </div>

                  <h2>{produto.nome || "Produto sem nome"}</h2>

                  <p className="descricao">
                    {produto.descricao || "Sem descrição cadastrada."}
                  </p>

                  <div className="infos">
                    <div>
                      <span>Marca</span>
                      <strong>{produto.marca || "-"}</strong>
                    </div>

                    <div>
                      <span>Modelo</span>
                      <strong>{produto.modelo || "-"}</strong>
                    </div>

                    <div>
                      <span>Criado em</span>
                      <strong>{formatarData(produto.criado_em)}</strong>
                    </div>

                    <div>
                      <span>Slug</span>
                      <strong>{produto.slug || "-"}</strong>
                    </div>
                  </div>

                  <div className="precos">
                    <strong className="preco-principal">
                      {formatarPreco(produto.preco)}
                    </strong>

                    {produto.preco_promocional ? (
                      <span className="preco-promocional">
                        Promo: {formatarPreco(produto.preco_promocional)}
                      </span>
                    ) : (
                      <span className="preco-promocional sem-promo">
                        Sem promoção
                      </span>
                    )}
                  </div>

                  <div className="acoes-card">
                    <Link
                      href={`/Admin/produtos/${id}`}
                      className="btn-card-secundario"
                    >
                      Ver detalhes
                    </Link>

                    <Link
                      href={`/Admin/produtos/editar/${id}`}
                      className="btn-card-primario"
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .pagina-produtos {
          min-height: 100vh;
          background: #f6f7fb;
          padding: 32px;
          color: #111827;
        }

        .topo {
          max-width: 1400px;
          margin: 0 auto 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .badge-painel {
          display: inline-flex;
          padding: 8px 14px;
          border-radius: 999px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 13px;
          margin-bottom: 14px;
        }

        .topo h1 {
          margin: 0 0 10px;
          font-size: 2rem;
          font-weight: 800;
        }

        .topo p {
          margin: 0;
          max-width: 680px;
          color: #6b7280;
          line-height: 1.6;
        }

        .acoes-topo {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn-primario,
        .btn-secundario,
        .btn-card-primario,
        .btn-card-secundario {
          text-decoration: none;
          border: none;
          cursor: pointer;
          border-radius: 14px;
          padding: 13px 18px;
          font-weight: 700;
          transition: 0.25s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-primario,
        .btn-card-primario {
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          color: #fff;
          box-shadow: 0 10px 24px rgba(99, 102, 241, 0.22);
        }

        .btn-secundario,
        .btn-card-secundario {
          background: #fff;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .cards-resumo {
          max-width: 1400px;
          margin: 0 auto 20px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .card-resumo {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 22px;
          padding: 22px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
        }

        .card-resumo span {
          display: block;
          color: #6b7280;
          font-size: 0.92rem;
          margin-bottom: 8px;
        }

        .card-resumo strong {
          font-size: 1.8rem;
          color: #111827;
        }

        .barra-filtros {
          max-width: 1400px;
          margin: 0 auto 24px;
          display: grid;
          grid-template-columns: 1fr 220px;
          gap: 16px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
        }

        .campo-busca,
        .campo-filtro {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .campo-busca label,
        .campo-filtro label {
          font-size: 0.92rem;
          font-weight: 600;
          color: #374151;
        }

        .campo-busca input,
        .campo-filtro select {
          width: 100%;
          border: 1px solid #d1d5db;
          background: #fff;
          color: #111827;
          border-radius: 16px;
          padding: 14px 16px;
          outline: none;
          font-size: 0.97rem;
        }

        .estado {
          max-width: 1400px;
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          padding: 28px;
          text-align: center;
          color: #374151;
        }

        .estado-erro {
          color: #b91c1c;
          background: #fff;
          border-color: #fecaca;
        }

        .grid-produtos {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .card-produto {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
          display: flex;
          flex-direction: column;
        }

        .imagem-produto {
          width: 100%;
          height: 230px;
          background: #f3f4f6;
        }

        .imagem-produto img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .sem-imagem {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          font-weight: 600;
        }

        .conteudo-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .linha-topo-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .badge-status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .badge-status.ativo {
          background: #dcfce7;
          color: #166534;
        }

        .badge-status.inativo {
          background: #fee2e2;
          color: #991b1b;
        }

        .badge-status.neutro {
          background: #e5e7eb;
          color: #374151;
        }

        .sku {
          font-size: 0.82rem;
          color: #6b7280;
          font-weight: 600;
        }

        .conteudo-card h2 {
          margin: 0;
          font-size: 1.2rem;
          color: #111827;
        }

        .descricao {
          margin: 0;
          color: #6b7280;
          line-height: 1.6;
          min-height: 50px;
        }

        .infos {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .infos span {
          display: block;
          color: #6b7280;
          font-size: 0.8rem;
          margin-bottom: 4px;
        }

        .infos strong {
          color: #111827;
          font-size: 0.92rem;
          word-break: break-word;
        }

        .precos {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-top: 4px;
        }

        .preco-principal {
          font-size: 1.3rem;
          color: #111827;
        }

        .preco-promocional {
          font-size: 0.92rem;
          color: #16a34a;
          font-weight: 600;
        }

        .preco-promocional.sem-promo {
          color: #6b7280;
        }

        .acoes-card {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 4px;
        }

        @media (max-width: 1100px) {
          .grid-produtos {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .cards-resumo {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .pagina-produtos {
            padding: 18px;
          }

          .topo {
            flex-direction: column;
          }

          .barra-filtros {
            grid-template-columns: 1fr;
          }

          .grid-produtos {
            grid-template-columns: 1fr;
          }

          .acoes-topo {
            width: 100%;
          }

          .btn-primario,
          .btn-secundario {
            width: 100%;
          }

          .acoes-card {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}