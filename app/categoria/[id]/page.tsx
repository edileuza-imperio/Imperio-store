"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/Api/conectar";

import Navbar from "@/components/site/menu/navbar";
import FooterPrincipal from "@/components/site/Rodape/Footer";

type Produto = {
  id_produto: number;
  nome: string;
  sku?: string;
  modelo?: string;
  descricao?: string;
  preco: string | number;
  preco_promocional?: string | number;
  parcelamento?: string | number;
  slug?: string;
  imagem?: string;
  estoque?: number;
  ilimitado?: number;
  statusid?: number;
  catalogo?: number;
  categoria_id?: number | null;
  destaque?: number | null;
  criado?: string;
  atualizado?: string;
  categoria_nome?: string | null;
};

type ApiResponse = {
  status?: number;
  mensagem?: string;
  dados?: {
    total?: number;
    itens?: Produto[];
  };
};

function formatMoney(valor: string | number | undefined | null) {
  const numero = Number(valor || 0);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getImagemUrl(caminho?: string) {
  if (!caminho) return "";

  const base = String(api.defaults.baseURL || "").replace(/\/+$/, "");
  const clean = String(caminho).replace(/^\/+/, "");

  return `${base}/${clean}`;
}

function cortarTexto(texto?: string, limite = 100) {
  const valor = String(texto || "").trim();
  if (!valor) return "Sem descrição disponível.";
  if (valor.length <= limite) return valor;
  return `${valor.slice(0, limite).trim()}...`;
}

export default function CategoriaPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);

  async function carregarProdutos() {
    try {
      setLoading(true);
      setErro(null);

      const res = await api.get<ApiResponse>(`/produtos/categoria/${id}`);

      const itens = Array.isArray(res.data?.dados?.itens)
        ? res.data.dados!.itens!
        : [];

      setProdutos(itens);
      setTotal(Number(res.data?.dados?.total || itens.length));
    } catch (error) {
      console.error("Erro ao carregar produtos da categoria", error);
      setErro("Não foi possível carregar os produtos desta categoria.");
      setProdutos([]);
      setTotal(0);
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
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho", error);
      alert("Não foi possível adicionar o produto ao carrinho.");
    } finally {
      setAddingId(null);
    }
  }

  useEffect(() => {
    if (!id) return;
    carregarProdutos();
  }, [id]);

  const categoriaNome = useMemo(() => {
    const nome = produtos.find((p) => p.categoria_nome)?.categoria_nome;
    return nome || "Categoria";
  }, [produtos]);

  return (
    <>
      <Navbar />

      <main className="page">
        <div className="container">
          <nav className="breadcrumb" aria-label="breadcrumb">
            <Link href="/">Home</Link>
            <span>›</span>
            <Link href="/categoria">Categorias</Link>
            <span>›</span>
            <span>{categoriaNome}</span>
          </nav>

          <section className="hero">
            <div className="heroContent">
              <span className="eyebrow">CATEGORIA</span>
              <h1>{categoriaNome}</h1>
              <p>
                Explore os produtos cadastrados nesta categoria e escolha o que
                combina melhor com sua compra.
              </p>

              {!loading && !erro && (
                <div className="heroMeta">
                  <div className="metaCard">
                    <strong>{total}</strong>
                    <span>produto{total === 1 ? "" : "s"}</span>
                  </div>

                  <div className="metaCard">
                    <strong>{categoriaNome}</strong>
                    <span>categoria atual</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {loading && (
            <section className="stateBox">
              <h3>Carregando produtos...</h3>
              <p>Aguarde enquanto buscamos os itens da categoria.</p>
            </section>
          )}

          {!loading && erro && (
            <section className="stateBox error">
              <h3>Ocorreu um problema</h3>
              <p>{erro}</p>
              <button type="button" className="retryBtn" onClick={carregarProdutos}>
                Tentar novamente
              </button>
            </section>
          )}

          {!loading && !erro && produtos.length === 0 && (
            <section className="stateBox empty">
              <h3>Nenhum produto encontrado</h3>
              <p>Essa categoria ainda não possui produtos cadastrados.</p>
            </section>
          )}

          {!loading && !erro && produtos.length > 0 && (
            <section className="catalogSection">
              <div className="sectionTop">
                <h2>Produtos disponíveis</h2>
                <span>{total} item(ns)</span>
              </div>

              <div className="grid">
                {produtos.map((produto) => {
                  const precoPromocional = Number(produto.preco_promocional || 0);
                  const precoNormal = Number(produto.preco || 0);
                  const precoFinal =
                    precoPromocional > 0 ? precoPromocional : precoNormal;

                  const semPreco = precoFinal <= 0;
                  const semEstoque =
                    Number(produto.ilimitado || 0) !== 1 &&
                    Number(produto.estoque || 0) <= 0;

                  const hrefDetalhe = produto.slug
                    ? `/produto/${produto.slug}`
                    : `/produto/${produto.id_produto}`;

                  return (
                    <article className="card" key={produto.id_produto}>
                      <Link href={hrefDetalhe} className="imageLink">
                        <div className="imageWrap">
                          {produto.imagem ? (
                            <img
                              src={getImagemUrl(produto.imagem)}
                              alt={produto.nome}
                            />
                          ) : (
                            <div className="noImage">Sem imagem</div>
                          )}

                          {precoPromocional > 0 && (
                            <span className="badge promo">Promoção</span>
                          )}

                          {semEstoque && <span className="badge out">Sem estoque</span>}
                        </div>
                      </Link>

                      <div className="info">
                        <div className="topInfo">
                          <span className="categoryTag">
                            {produto.categoria_nome || "Sem categoria"}
                          </span>

                          {produto.sku && (
                            <span className="sku">SKU: {produto.sku}</span>
                          )}
                        </div>

                        <Link href={hrefDetalhe} className="titleLink">
                          <h3>{produto.nome}</h3>
                        </Link>

                        <p className="desc">{cortarTexto(produto.descricao, 115)}</p>

                        <div className="extra">
                          <span>
                            <strong>Modelo:</strong> {produto.modelo || "—"}
                          </span>
                          <span>
                            <strong>Estoque:</strong>{" "}
                            {Number(produto.ilimitado || 0) === 1
                              ? "Ilimitado"
                              : Number(produto.estoque || 0)}
                          </span>
                        </div>

                        <div className="priceBox">
                          {precoPromocional > 0 && (
                            <span className="oldPrice">
                              {formatMoney(precoNormal)}
                            </span>
                          )}

                          <span className={`currentPrice ${semPreco ? "noPrice" : ""}`}>
                            {semPreco ? "Consultar valor" : formatMoney(precoFinal)}
                          </span>
                        </div>

                        <div className="actions">
                          <button
                            type="button"
                            className="cartBtn"
                            onClick={() => adicionarAoCarrinho(produto.id_produto)}
                            disabled={addingId === produto.id_produto || semEstoque}
                          >
                            {addingId === produto.id_produto
                              ? "Adicionando..."
                              : "Adicionar ao carrinho"}
                          </button>

                          <Link href={hrefDetalhe} className="detailsBtn">
                            Ver detalhes
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      <FooterPrincipal />

      <style jsx>{`
        .page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top, rgba(255, 192, 203, 0.12), transparent 25%),
            linear-gradient(180deg, #fffafc 0%, #ffffff 30%, #ffffff 100%);
        }

        .container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 28px 20px 56px;
        }

        .breadcrumb {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          margin-bottom: 22px;
          color: #7c7c88;
          font-size: 14px;
        }

        .breadcrumb a {
          color: #7c7c88;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .breadcrumb a:hover {
          color: #b24b73;
        }

        .hero {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(226, 203, 214, 0.8);
          background: linear-gradient(135deg, #fff8fb 0%, #ffffff 55%, #fff4f8 100%);
          border-radius: 24px;
          padding: 28px;
          margin-bottom: 28px;
          box-shadow: 0 18px 45px rgba(125, 72, 98, 0.08);
        }

        .heroContent {
          position: relative;
          z-index: 2;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(178, 75, 115, 0.08);
          color: #b24b73;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          margin-bottom: 14px;
        }

        .hero h1 {
          margin: 0 0 10px;
          font-size: clamp(28px, 5vw, 40px);
          line-height: 1.05;
          color: #24161d;
        }

        .hero p {
          margin: 0;
          max-width: 760px;
          color: #6f6470;
          font-size: 15px;
          line-height: 1.65;
        }

        .heroMeta {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 22px;
        }

        .metaCard {
          min-width: 140px;
          padding: 14px 16px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(235, 219, 226, 1);
          box-shadow: 0 10px 24px rgba(125, 72, 98, 0.06);
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .metaCard strong {
          font-size: 20px;
          color: #24161d;
        }

        .metaCard span {
          color: #7a6a74;
          font-size: 13px;
        }

        .sectionTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 18px;
        }

        .sectionTop h2 {
          margin: 0;
          font-size: 24px;
          color: #24161d;
        }

        .sectionTop span {
          color: #796b75;
          font-size: 14px;
          font-weight: 600;
        }

        .stateBox {
          text-align: center;
          background: #ffffff;
          border: 1px solid #eee7eb;
          border-radius: 22px;
          padding: 48px 24px;
          box-shadow: 0 14px 35px rgba(20, 18, 19, 0.05);
        }

        .stateBox h3 {
          margin: 0 0 10px;
          font-size: 24px;
          color: #24161d;
        }

        .stateBox p {
          margin: 0;
          color: #6f6470;
          line-height: 1.6;
        }

        .stateBox.error {
          border-color: #f2d4dc;
          background: #fffafb;
        }

        .retryBtn {
          margin-top: 18px;
          height: 44px;
          padding: 0 18px;
          border-radius: 12px;
          border: none;
          background: #b24b73;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }

        .retryBtn:hover {
          transform: translateY(-1px);
          opacity: 0.95;
        }

        .catalogSection {
          margin-top: 8px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 22px;
        }

        .card {
          display: flex;
          flex-direction: column;
          min-height: 100%;
          background: #ffffff;
          border: 1px solid #eee7eb;
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 14px 35px rgba(20, 18, 19, 0.05);
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            border-color 0.25s ease;
        }

        .card:hover {
          transform: translateY(-6px);
          border-color: #e6cfda;
          box-shadow: 0 18px 42px rgba(125, 72, 98, 0.12);
        }

        .imageLink {
          text-decoration: none;
        }

        .imageWrap {
          position: relative;
          height: 240px;
          background: linear-gradient(180deg, #fff9fb 0%, #faf7f8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          border-bottom: 1px solid #f1eaed;
        }

        .imageWrap img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          user-select: none;
        }

        .noImage {
          color: #978a93;
          font-weight: 600;
          font-size: 14px;
        }

        .badge {
          position: absolute;
          top: 14px;
          left: 14px;
          padding: 7px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        .badge.promo {
          background: #ffe9f1;
          color: #b12660;
          border: 1px solid #ffd3e2;
        }

        .badge.out {
          left: auto;
          right: 14px;
          background: #fff2f2;
          color: #c03d3d;
          border: 1px solid #ffd7d7;
        }

        .info {
          display: flex;
          flex-direction: column;
          flex: 1;
          padding: 18px;
        }

        .topInfo {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .categoryTag {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          padding: 0 10px;
          border-radius: 999px;
          background: #f8eef3;
          color: #9b4d6d;
          font-size: 12px;
          font-weight: 700;
        }

        .sku {
          color: #8a7a84;
          font-size: 12px;
          font-weight: 600;
        }

        .titleLink {
          text-decoration: none;
          color: inherit;
        }

        .titleLink h3 {
          margin: 0 0 10px;
          font-size: 18px;
          line-height: 1.35;
          color: #24161d;
          transition: color 0.2s ease;
        }

        .titleLink:hover h3 {
          color: #b24b73;
        }

        .desc {
          margin: 0 0 14px;
          color: #6f6470;
          font-size: 14px;
          line-height: 1.6;
          min-height: 68px;
        }

        .extra {
          display: grid;
          gap: 6px;
          margin-bottom: 16px;
          color: #5f545d;
          font-size: 13px;
        }

        .extra strong {
          color: #24161d;
        }

        .priceBox {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-top: auto;
          margin-bottom: 16px;
        }

        .oldPrice {
          color: #9d8f97;
          font-size: 13px;
          text-decoration: line-through;
        }

        .currentPrice {
          color: #b12660;
          font-size: 24px;
          font-weight: 800;
          line-height: 1;
        }

        .currentPrice.noPrice {
          color: #2f2b2d;
          font-size: 20px;
        }

        .actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .cartBtn,
        .detailsBtn {
          height: 46px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          text-decoration: none;
          font-weight: 700;
          font-size: 14px;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease,
            border-color 0.2s ease,
            color 0.2s ease,
            opacity 0.2s ease;
        }

        .cartBtn {
          border: none;
          background: linear-gradient(135deg, #c45782 0%, #a63b68 100%);
          color: #fff;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(166, 59, 104, 0.22);
        }

        .cartBtn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px rgba(166, 59, 104, 0.28);
        }

        .cartBtn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }

        .detailsBtn {
          background: #fff;
          color: #9b4d6d;
          border: 1px solid #ead6df;
        }

        .detailsBtn:hover {
          transform: translateY(-2px);
          background: #fff7fa;
          border-color: #ddb6c7;
        }

        @media (max-width: 768px) {
          .container {
            padding: 20px 14px 42px;
          }

          .hero {
            padding: 20px;
            border-radius: 20px;
          }

          .sectionTop {
            flex-direction: column;
            align-items: flex-start;
          }

          .grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .imageWrap {
            height: 220px;
          }

          .actions {
            grid-template-columns: 1fr;
          }

          .currentPrice {
            font-size: 22px;
          }
        }
      `}</style>
    </>
  );
}