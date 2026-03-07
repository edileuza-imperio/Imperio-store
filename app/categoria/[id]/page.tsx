"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/Api/conectar";
import Link from "next/link";

import Navbar from "@/components/site/menu/navbar";
import FooterPrincipal from "@/components/site/Rodape/Footer";

type Produto = {
  id_produto: number;
  nome: string;
  preco: string | number;
  preco_promocional?: string | number;
  imagem?: string;
  slug?: string;
  categoria_nome?: string;
  estoque?: number;
  ilimitado?: number;
  descricao?: string;
};

function formatMoney(valor: string | number | undefined) {
  const numero = Number(valor || 0);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getImagemUrl(caminho?: string) {
  if (!caminho) return "/sem-imagem.png";

  const base = (api.defaults.baseURL || "").replace(/\/+$/, "");
  const clean = String(caminho).replace(/^\/+/, "");

  return `${base}/${clean}`;
}

function resumoDescricao(texto?: string, limite = 88) {
  if (!texto) return "Produto disponível nesta categoria.";
  const limpa = texto.replace(/\s+/g, " ").trim();
  if (limpa.length <= limite) return limpa;
  return `${limpa.slice(0, limite).trim()}...`;
}

export default function CategoriaPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);

  async function carregarProdutos() {
    try {
      setLoading(true);
      setErro(null);

      const res = await api.get(`/produtos/categoria/${id}`);
      const lista = Array.isArray(res.data?.dados)
        ? res.data.dados
        : Array.isArray(res.data)
        ? res.data
        : [];

      setProdutos(lista);
    } catch (error) {
      console.error("Erro ao carregar produtos da categoria", error);
      setErro("Não foi possível carregar os produtos desta categoria.");
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }

  async function adicionarAoCarrinho(produtoId: number) {
    try {
      setAddingId(produtoId);

      await api.post("/carrinho/adicionar", {
        produto_id: produtoId,
        quantidade: 1,
      });

      alert("Produto adicionado ao carrinho com sucesso!");
    } catch (error: any) {
      console.error("Erro ao adicionar ao carrinho", error);

      const mensagem =
        error?.response?.data?.mensagem ||
        error?.response?.data?.erro ||
        "Não foi possível adicionar o produto ao carrinho.";

      alert(mensagem);
    } finally {
      setAddingId(null);
    }
  }

  useEffect(() => {
    if (id) {
      carregarProdutos();
    }
  }, [id]);

  const nomeCategoria = useMemo(() => {
    if (!produtos.length) return "Categoria";
    return produtos[0]?.categoria_nome || "Categoria";
  }, [produtos]);

  return (
    <>
      <Navbar />

      <main className="page">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>›</span>
            <Link href="/categoria">Categorias</Link>
            <span>›</span>
            <span>{nomeCategoria}</span>
          </div>

          <section className="hero">
            <div className="heroText">
              <span className="badge">Categoria</span>
              <h1>{nomeCategoria}</h1>
              <p>
                Confira os produtos disponíveis nesta categoria e escolha o que
                mais combina com seu pedido.
              </p>
            </div>

            <div className="heroInfo">
              <div className="heroCard">
                <strong>{produtos.length}</strong>
                <span>{produtos.length === 1 ? "produto" : "produtos"}</span>
              </div>
            </div>
          </section>

          {loading && (
            <div className="stateBox">
              <h3>Carregando produtos...</h3>
              <p>Aguarde enquanto buscamos os itens desta categoria.</p>
            </div>
          )}

          {!loading && erro && (
            <div className="stateBox error">
              <h3>Ops, ocorreu um problema</h3>
              <p>{erro}</p>
              <button type="button" className="retryBtn" onClick={carregarProdutos}>
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && !erro && produtos.length === 0 && (
            <div className="stateBox">
              <h3>Nenhum produto encontrado</h3>
              <p>Essa categoria ainda não possui produtos cadastrados.</p>
            </div>
          )}

          {!loading && !erro && produtos.length > 0 && (
            <section className="grid">
              {produtos.map((produto) => {
                const precoPromocional = Number(produto.preco_promocional || 0);
                const precoNormal = Number(produto.preco || 0);
                const precoFinal =
                  precoPromocional > 0 ? precoPromocional : precoNormal;

                const semEstoque =
                  Number(produto.ilimitado || 0) !== 1 &&
                  Number(produto.estoque || 0) <= 0;

                return (
                  <article key={produto.id_produto} className="card">
                    <Link
                      href={`/produto/${produto.slug || produto.id_produto}`}
                      className="imageWrap"
                    >
                      <img
                        src={getImagemUrl(produto.imagem)}
                        alt={produto.nome}
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/sem-imagem.png";
                        }}
                      />
                      {precoPromocional > 0 && <span className="promoTag">Oferta</span>}
                    </Link>

                    <div className="info">
                      <span className="categoryMini">{produto.categoria_nome || nomeCategoria}</span>

                      <Link
                        href={`/produto/${produto.slug || produto.id_produto}`}
                        className="titleLink"
                      >
                        <h3 title={produto.nome}>{produto.nome}</h3>
                      </Link>

                      <p className="desc">{resumoDescricao(produto.descricao)}</p>

                      <div className="priceBox">
                        {precoPromocional > 0 && (
                          <span className="old">{formatMoney(precoNormal)}</span>
                        )}

                        <span className="current">{formatMoney(precoFinal)}</span>
                      </div>

                      <div className="stockRow">
                        {semEstoque ? (
                          <span className="stock out">Sem estoque</span>
                        ) : (
                          <span className="stock in">
                            {Number(produto.ilimitado || 0) === 1
                              ? "Disponível"
                              : `Estoque: ${produto.estoque ?? 0}`}
                          </span>
                        )}
                      </div>

                      <div className="actions">
                        <button
                          type="button"
                          className="cartBtn"
                          onClick={() => adicionarAoCarrinho(produto.id_produto)}
                          disabled={semEstoque || addingId === produto.id_produto}
                        >
                          {addingId === produto.id_produto
                            ? "Adicionando..."
                            : "Adicionar ao carrinho"}
                        </button>

                        <Link
                          href={`/produto/${produto.slug || produto.id_produto}`}
                          className="detailsBtn"
                        >
                          Ver detalhes
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </main>

      <FooterPrincipal />

      <style jsx>{`
        .page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top, rgba(255, 240, 244, 0.9), transparent 28%),
            linear-gradient(180deg, #fff 0%, #fff8fa 100%);
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 34px 20px 64px;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          font-size: 14px;
          color: #7a7a7a;
          margin-bottom: 22px;
        }

        .breadcrumb a {
          color: #7a7a7a;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .breadcrumb a:hover {
          color: #d6336c;
        }

        .hero {
          display: flex;
          align-items: stretch;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 34px;
          padding: 28px;
          border-radius: 24px;
          background: linear-gradient(135deg, #ffffff 0%, #fff3f7 100%);
          border: 1px solid #f3d9e3;
          box-shadow: 0 12px 36px rgba(214, 51, 108, 0.08);
        }

        .heroText {
          flex: 1;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          border-radius: 999px;
          background: #ffe3ec;
          color: #b02557;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .heroText h1 {
          margin: 0 0 8px;
          font-size: 34px;
          line-height: 1.1;
          font-weight: 800;
          color: #1f1f1f;
        }

        .heroText p {
          margin: 0;
          max-width: 760px;
          color: #6f6f6f;
          font-size: 15px;
          line-height: 1.6;
        }

        .heroInfo {
          min-width: 170px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .heroCard {
          width: 100%;
          min-height: 120px;
          border-radius: 20px;
          background: linear-gradient(135deg, #d6336c 0%, #ef476f 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          box-shadow: 0 14px 30px rgba(214, 51, 108, 0.2);
        }

        .heroCard strong {
          font-size: 34px;
          line-height: 1;
        }

        .heroCard span {
          margin-top: 6px;
          font-size: 14px;
          opacity: 0.95;
        }

        .stateBox {
          text-align: center;
          padding: 64px 20px;
          border-radius: 20px;
          background: #fff;
          border: 1px solid #eee;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
        }

        .stateBox h3 {
          margin: 0 0 8px;
          font-size: 24px;
          color: #222;
        }

        .stateBox p {
          margin: 0;
          color: #737373;
        }

        .stateBox.error {
          border-color: #ffd2d2;
          background: #fff8f8;
        }

        .retryBtn {
          margin-top: 18px;
          border: 0;
          border-radius: 12px;
          padding: 12px 18px;
          background: #d6336c;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .retryBtn:hover {
          filter: brightness(1.05);
          transform: translateY(-1px);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(245px, 1fr));
          gap: 22px;
        }

        .card {
          display: flex;
          flex-direction: column;
          background: #fff;
          border-radius: 22px;
          overflow: hidden;
          border: 1px solid #f0f0f0;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .card:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.1);
          border-color: #f3c7d6;
        }

        .imageWrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 230px;
          background: linear-gradient(180deg, #fff 0%, #fff7fa 100%);
          text-decoration: none;
        }

        .imageWrap img {
          max-width: calc(100% - 24px);
          max-height: calc(100% - 24px);
          object-fit: contain;
          transition: transform 0.25s ease;
        }

        .card:hover .imageWrap img {
          transform: scale(1.03);
        }

        .promoTag {
          position: absolute;
          top: 14px;
          left: 14px;
          background: #e60023;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          padding: 7px 10px;
          border-radius: 999px;
          box-shadow: 0 6px 16px rgba(230, 0, 35, 0.24);
        }

        .info {
          display: flex;
          flex-direction: column;
          padding: 18px;
          gap: 10px;
          flex: 1;
        }

        .categoryMini {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #c2255c;
        }

        .titleLink {
          text-decoration: none;
          color: inherit;
        }

        .info h3 {
          margin: 0;
          font-size: 17px;
          line-height: 1.35;
          font-weight: 700;
          color: #202020;
          min-height: 46px;
        }

        .desc {
          margin: 0;
          color: #6f6f6f;
          font-size: 14px;
          line-height: 1.5;
          min-height: 42px;
        }

        .priceBox {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 2px;
        }

        .old {
          font-size: 13px;
          color: #989898;
          text-decoration: line-through;
        }

        .current {
          font-size: 24px;
          font-weight: 800;
          color: #d6336c;
          line-height: 1;
        }

        .stockRow {
          min-height: 22px;
        }

        .stock {
          display: inline-flex;
          align-items: center;
          font-size: 13px;
          font-weight: 600;
          border-radius: 999px;
          padding: 6px 10px;
        }

        .stock.in {
          background: #ebfbee;
          color: #2b8a3e;
        }

        .stock.out {
          background: #fff5f5;
          color: #c92a2a;
        }

        .actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: auto;
          padding-top: 4px;
        }

        .cartBtn,
        .detailsBtn {
          min-height: 46px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          transition: 0.2s ease;
        }

        .cartBtn {
          border: 0;
          background: linear-gradient(135deg, #d6336c 0%, #ef476f 100%);
          color: #fff;
          cursor: pointer;
          box-shadow: 0 10px 20px rgba(214, 51, 108, 0.18);
        }

        .cartBtn:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.03);
        }

        .cartBtn:disabled {
          cursor: not-allowed;
          opacity: 0.7;
          box-shadow: none;
        }

        .detailsBtn {
          background: #fff;
          color: #333;
          border: 1px solid #e9e9e9;
        }

        .detailsBtn:hover {
          border-color: #d6336c;
          color: #d6336c;
          transform: translateY(-1px);
        }

        @media (max-width: 900px) {
          .hero {
            flex-direction: column;
            padding: 22px;
          }

          .heroInfo {
            min-width: auto;
          }

          .heroCard {
            min-height: 96px;
          }
        }

        @media (max-width: 640px) {
          .container {
            padding: 24px 14px 48px;
          }

          .heroText h1 {
            font-size: 28px;
          }

          .grid {
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }

          .imageWrap {
            height: 180px;
          }

          .info {
            padding: 14px;
          }

          .info h3 {
            font-size: 15px;
            min-height: 40px;
          }

          .desc {
            font-size: 13px;
            min-height: 38px;
          }

          .current {
            font-size: 20px;
          }

          .actions {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 420px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}