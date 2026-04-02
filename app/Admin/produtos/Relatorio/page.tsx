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

function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProdutosRelatorioPage() {
  const router = useRouter();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarProdutos() {
    try {
      setCarregando(true);
      setErro("");

      const response = await api.get("/produtos");
      const lista = extrairListaProdutos(response?.data);
      setProdutos(lista);
    } catch (error: any) {
      console.error("Erro ao carregar produtos:", error);
      setErro(
        error?.response?.data?.mensagem ||
          "Não foi possível carregar os dados do relatório."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  const resumo = useMemo(() => {
    const total = produtos.length;

    const ativos = produtos.filter(
      (produto) => String(produto.status_id ?? "") === "1"
    ).length;

    const inativos = produtos.filter(
      (produto) => String(produto.status_id ?? "") === "2"
    ).length;

    const comPromocao = produtos.filter(
      (produto) =>
        produto.preco_promocional !== null &&
        produto.preco_promocional !== undefined &&
        String(produto.preco_promocional).trim() !== "" &&
        Number(produto.preco_promocional) > 0
    ).length;

    const valorTotal = produtos.reduce((acc, produto) => {
      return acc + Number(produto.preco || 0);
    }, 0);

    const valorPromocionalTotal = produtos.reduce((acc, produto) => {
      return acc + Number(produto.preco_promocional || 0);
    }, 0);

    return {
      total,
      ativos,
      inativos,
      comPromocao,
      valorTotal,
      valorPromocionalTotal,
    };
  }, [produtos]);

  return (
    <div className="pagina-dashboard">
      <div className="hero">
        <div className="hero-left">
          <span className="tag">Painel de Produtos</span>
          <h1>Relatório de produtos</h1>
          <p>
            Visualize os indicadores gerais do catálogo em uma tela de relatório
            mais limpa, objetiva e profissional.
          </p>
        </div>

        <div className="hero-right">
          <button
            type="button"
            className="btn btn-primary"
            onClick={carregarProdutos}
          >
            Atualizar relatório
          </button>

          <Link href="/Admin/produtos/cadastrar" className="btn btn-secondary">
            Cadastrar novo
          </Link>
        </div>
      </div>

      {carregando ? (
        <div className="estado">Carregando relatório...</div>
      ) : erro ? (
        <div className="estado erro">{erro}</div>
      ) : (
        <>
          <section className="grid-resumo">
            <div className="card-resumo destaque">
              <div className="card-topo">
                <span>Total de produtos</span>
                <div className="icone">📦</div>
              </div>
              <strong>{resumo.total}</strong>
              <small>Todos os produtos cadastrados no catálogo</small>
            </div>

            <div className="card-resumo">
              <div className="card-topo">
                <span>Produtos ativos</span>
                <div className="icone">✅</div>
              </div>
              <strong>{resumo.ativos}</strong>
              <small>Itens disponíveis e ativos no sistema</small>
            </div>

            <div className="card-resumo">
              <div className="card-topo">
                <span>Produtos inativos</span>
                <div className="icone">⛔</div>
              </div>
              <strong>{resumo.inativos}</strong>
              <small>Itens pausados ou desativados</small>
            </div>

            <div className="card-resumo">
              <div className="card-topo">
                <span>Em promoção</span>
                <div className="icone">🏷️</div>
              </div>
              <strong>{resumo.comPromocao}</strong>
              <small>Produtos com preço promocional</small>
            </div>
          </section>

          <section className="painel-inferior">
            <div className="box-grande">
              <span className="box-label">Valor bruto do catálogo</span>
              <h2>{formatarPreco(resumo.valorTotal)}</h2>
              <p>
                Soma simples dos preços cadastrados para visão rápida do valor
                total do catálogo.
              </p>
            </div>

            <div className="box-grande">
              <span className="box-label">Valor promocional acumulado</span>
              <h2>{formatarPreco(resumo.valorPromocionalTotal)}</h2>
              <p>
                Soma dos preços promocionais cadastrados nos produtos em oferta.
              </p>
            </div>
          </section>

          <section className="painel-acoes">
            <div className="box-acoes">
              <button
                type="button"
                className="btn btn-dark w-full"
                onClick={() => router.push("/Admin")}
              >
                Voltar ao painel
              </button>

              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={carregarProdutos}
              >
                Recarregar dados
              </button>
            </div>
          </section>
        </>
      )}

      <style jsx>{`
        .pagina-dashboard {
          min-height: 100vh;
          padding: 32px;
          background:
            radial-gradient(circle at top left, rgba(99, 102, 241, 0.14), transparent 28%),
            radial-gradient(circle at bottom right, rgba(124, 58, 237, 0.12), transparent 30%),
            #f6f7fb;
          color: #111827;
        }

        .hero {
          max-width: 1400px;
          margin: 0 auto 28px auto;
          background: linear-gradient(135deg, #111827, #1f2937, #312e81);
          border-radius: 32px;
          padding: 32px;
          color: #fff;
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: center;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.16);
        }

        .hero-left {
          max-width: 760px;
        }

        .tag {
          display: inline-flex;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.16);
          margin-bottom: 16px;
          font-size: 13px;
        }

        .hero h1 {
          margin: 0 0 12px 0;
          font-size: 2.4rem;
          line-height: 1.1;
        }

        .hero p {
          margin: 0;
          color: rgba(255, 255, 255, 0.82);
          line-height: 1.7;
          font-size: 1rem;
        }

        .hero-right {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .btn {
          border: none;
          text-decoration: none;
          cursor: pointer;
          border-radius: 18px;
          padding: 14px 20px;
          font-weight: 700;
          transition: 0.25s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-primary {
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          color: #fff;
          box-shadow: 0 12px 30px rgba(99, 102, 241, 0.3);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.16);
        }

        .btn-dark {
          background: #111827;
          color: #fff;
        }

        .w-full {
          width: 100%;
        }

        .estado {
          max-width: 1400px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 28px;
          padding: 28px;
          text-align: center;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
        }

        .estado.erro {
          color: #b91c1c;
          border-color: #fecaca;
        }

        .grid-resumo {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
        }

        .card-resumo {
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
        }

        .card-resumo.destaque {
          background: linear-gradient(135deg, #6366f1, #7c3aed);
          color: #fff;
        }

        .card-topo {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .card-topo span {
          font-size: 0.95rem;
          font-weight: 600;
        }

        .icone {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.14);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.15rem;
        }

        .card-resumo strong {
          display: block;
          font-size: 2.1rem;
          margin-bottom: 8px;
        }

        .card-resumo small {
          display: block;
          color: inherit;
          opacity: 0.82;
          line-height: 1.6;
        }

        .painel-inferior {
          max-width: 1400px;
          margin: 22px auto 0 auto;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .box-grande,
        .box-acoes {
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
        }

        .box-label {
          display: block;
          color: #6b7280;
          margin-bottom: 10px;
          font-weight: 600;
        }

        .box-grande h2 {
          margin: 0 0 8px 0;
          font-size: 2.2rem;
          color: #111827;
        }

        .box-grande p {
          margin: 0;
          color: #6b7280;
          line-height: 1.7;
        }

        .painel-acoes {
          max-width: 1400px;
          margin: 22px auto 0 auto;
        }

        .box-acoes {
          display: flex;
          flex-direction: column;
          gap: 12px;
          justify-content: center;
        }

        @media (max-width: 1100px) {
          .grid-resumo {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .painel-inferior {
            grid-template-columns: 1fr;
          }

          .hero {
            flex-direction: column;
            align-items: flex-start;
          }

          .hero-right {
            width: 100%;
            justify-content: flex-start;
          }
        }

        @media (max-width: 768px) {
          .pagina-dashboard {
            padding: 18px;
          }

          .hero {
            padding: 24px;
            border-radius: 24px;
          }

          .hero h1 {
            font-size: 1.8rem;
          }

          .grid-resumo {
            grid-template-columns: 1fr;
          }

          .hero-right,
          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}