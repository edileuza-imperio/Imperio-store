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
            <span className="separator">›</span>
            <Link href="/categoria">Categorias</Link>
            <span className="separator">›</span>
            <span className="current">{nomeCategoria}</span>
          </div>

          <section className="hero">
            <div className="heroContent">
              <div className="heroText">
                <span className="badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L15.09 8.26H22L17.82 12.44L20.91 18.7L12 14.52L3.09 18.7L6.18 12.44L2 8.26H8.91L12 2Z" />
                  </svg>
                  Categoria
                </span>
                <h1>{nomeCategoria}</h1>
                <p>
                  Explore nossa seleção de produtos nesta categoria. Encontre exatamente o que você procura com preços competitivos e qualidade garantida.
                </p>
              </div>

              <div className="heroStats">
                <div className="statCard">
                  <div className="statNumber">{produtos.length}</div>
                  <div className="statLabel">{produtos.length === 1 ? "Produto" : "Produtos"}</div>
                </div>
              </div>
            </div>
          </section>

          {loading && (
            <div className="stateContainer">
              <div className="stateBox loading">
                <div className="spinner"></div>
                <h3>Carregando produtos...</h3>
                <p>Aguarde enquanto buscamos os itens desta categoria.</p>
              </div>
            </div>
          )}

          {!loading && erro && (
            <div className="stateContainer">
              <div className="stateBox error">
                <div className="errorIcon">⚠️</div>
                <h3>Oops! Algo deu errado</h3>
                <p>{erro}</p>
                <button type="button" className="retryBtn" onClick={carregarProdutos}>
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {!loading && !erro && produtos.length === 0 && (
            <div className="stateContainer">
              <div className="stateBox empty">
                <div className="emptyIcon">📦</div>
                <h3>Nenhum produto encontrado</h3>
                <p>Essa categoria ainda não possui produtos cadastrados. Volte em breve!</p>
              </div>
            </div>
          )}

          {!loading && !erro && produtos.length > 0 && (
            <section className="productsGrid">
              {produtos.map((produto) => {
                const precoPromocional = Number(produto.preco_promocional || 0);
                const precoNormal = Number(produto.preco || 0);
                const precoFinal =
                  precoPromocional > 0 ? precoPromocional : precoNormal;

                const semEstoque =
                  Number(produto.ilimitado || 0) !== 1 &&
                  Number(produto.estoque || 0) <= 0;

                const percentualDesconto = precoPromocional > 0
                  ? Math.round(((precoNormal - precoPromocional) / precoNormal) * 100)
                  : 0;

                return (
                  <article key={produto.id_produto} className="productCard">
                    <div className="imageContainer">
                      <Link
                        href={`/produto/${produto.slug || produto.id_produto}`}
                        className="imageLink"
                      >
                        <img
                          src={getImagemUrl(produto.imagem)}
                          alt={produto.nome}
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/sem-imagem.png";
                          }}
                        />
                      </Link>

                      {precoPromocional > 0 && (
                        <div className="badges">
                          <span className="discountBadge">-{percentualDesconto}%</span>
                        </div>
                      )}

                      {semEstoque && <div className="outOfStockOverlay">Sem estoque</div>}
                    </div>

                    <div className="cardContent">
                      <span className="categoryTag">{produto.categoria_nome || nomeCategoria}</span>

                      <Link
                        href={`/produto/${produto.slug || produto.id_produto}`}
                        className="productTitle"
                      >
                        <h3 title={produto.nome}>{produto.nome}</h3>
                      </Link>

                      <p className="productDesc">{resumoDescricao(produto.descricao)}</p>

                      <div className="priceSection">
                        {precoPromocional > 0 && (
                          <span className="originalPrice">{formatMoney(precoNormal)}</span>
                        )}
                        <span className="finalPrice">{formatMoney(precoFinal)}</span>
                      </div>

                      <div className="stockStatus">
                        {semEstoque ? (
                          <span className="badge-stock out">
                            <span className="dot"></span>
                            Sem estoque
                          </span>
                        ) : (
                          <span className="badge-stock in">
                            <span className="dot"></span>
                            {Number(produto.ilimitado || 0) === 1
                              ? "Disponível"
                              : `Estoque: ${produto.estoque ?? 0}`}
                          </span>
                        )}
                      </div>

                      <div className="actionButtons">
                        <button
                          type="button"
                          className="btnPrimary"
                          onClick={() => adicionarAoCarrinho(produto.id_produto)}
                          disabled={semEstoque || addingId === produto.id_produto}
                          title={semEstoque ? "Produto sem estoque" : "Adicionar ao carrinho"}
                        >
                          {addingId === produto.id_produto ? (
                            <>
                              <span className="spinner-mini"></span>
                              Adicionando...
                            </>
                          ) : (
                            <>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                              </svg>
                              Carrinho
                            </>
                          )}
                        </button>

                        <Link
                          href={`/produto/${produto.slug || produto.id_produto}`}
                          className="btnSecondary"
                          title="Ver detalhes do produto"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          Detalhes
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
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8f9ff 0%, #fff5f8 50%, #fffbf0 100%);
          padding: 40px 0;
        }

        .container {
          max-width: 1320px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* Breadcrumb */
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 32px;
          padding: 0;
        }

        .breadcrumb a {
          color: #6b7280;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
          position: relative;
        }

        .breadcrumb a:hover {
          color: #ec4899;
        }

        .breadcrumb a::after {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: #ec4899;
          transition: width 0.3s ease;
        }

        .breadcrumb a:hover::after {
          width: 100%;
        }

        .breadcrumb .separator {
          color: #d1d5db;
          margin: 0 4px;
        }

        .breadcrumb .current {
          color: #ec4899;
          font-weight: 600;
        }

        /* Hero Section */
        .hero {
          margin-bottom: 48px;
          padding: 48px;
          border-radius: 20px;
          background: linear-gradient(135deg, #ffffff 0%, #fff8fc 100%);
          border: 1px solid #f3e8f5;
          box-shadow: 0 20px 60px rgba(236, 72, 153, 0.08);
          backdrop-filter: blur(10px);
        }

        .heroContent {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 40px;
        }

        .heroText {
          flex: 1;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 50px;
          background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
          color: #be185d;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 16px;
          width: fit-content;
        }

        .badge svg {
          width: 16px;
          height: 16px;
        }

        .heroText h1 {
          font-size: 42px;
          font-weight: 800;
          color: #1f2937;
          line-height: 1.2;
          margin: 0 0 16px 0;
          letter-spacing: -1px;
        }

        .heroText p {
          font-size: 16px;
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
          max-width: 500px;
        }

        .heroStats {
          display: flex;
          gap: 24px;
          align-items: center;
        }

        .statCard {
          padding: 32px 24px;
          border-radius: 16px;
          background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
          color: white;
          text-align: center;
          min-width: 140px;
          box-shadow: 0 10px 30px rgba(236, 72, 153, 0.3);
        }

        .statNumber {
          font-size: 36px;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 8px;
        }

        .statLabel {
          font-size: 13px;
          opacity: 0.95;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* State Containers */
        .stateContainer {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          padding: 40px 20px;
        }

        .stateBox {
          text-align: center;
          padding: 60px 40px;
          border-radius: 20px;
          background: white;
          border: 1px solid #f3e8f5;
          max-width: 500px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
        }

        .stateBox h3 {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin: 16px 0 8px 0;
        }

        .stateBox p {
          font-size: 15px;
          color: #6b7280;
          margin: 0 0 24px 0;
          line-height: 1.6;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3e8f5;
          border-top-color: #ec4899;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 24px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .errorIcon,
        .emptyIcon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .retryBtn {
          padding: 12px 32px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 20px rgba(236, 72, 153, 0.2);
        }

        .retryBtn:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(236, 72, 153, 0.3);
        }

        /* Products Grid */
        .productsGrid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 28px;
          margin-top: 40px;
        }

        /* Product Card */
        .productCard {
          display: flex;
          flex-direction: column;
          border-radius: 16px;
          background: white;
          border: 1px solid #f3e8f5;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          height: 100%;
        }

        .productCard:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(236, 72, 153, 0.15);
          border-color: #fbcfe8;
        }

        .imageContainer {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          background: linear-gradient(135deg, #f8f9ff 0%, #fff5f8 100%);
          overflow: hidden;
        }

        .imageLink {
          display: block;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .imageContainer img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .productCard:hover .imageContainer img {
          transform: scale(1.08);
        }

        .badges {
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .discountBadge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          border-radius: 8px;
          background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
          color: white;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .outOfStockOverlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.5);
          color: white;
          font-weight: 700;
          font-size: 16px;
          backdrop-filter: blur(2px);
        }

        .cardContent {
          display: flex;
          flex-direction: column;
          flex: 1;
          padding: 20px;
        }

        .categoryTag {
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          color: #ec4899;
          background: #fce7f3;
          padding: 6px 10px;
          border-radius: 6px;
          width: fit-content;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }

        .productTitle {
          text-decoration: none;
          margin-bottom: 8px;
        }

        .productTitle h3 {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          line-height: 1.4;
          margin: 0;
          min-height: 48px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.3s ease;
        }

        .productCard:hover .productTitle h3 {
          color: #ec4899;
        }

        .productDesc {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.5;
          margin: 0 0 12px 0;
          min-height: 39px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .priceSection {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin: 12px 0 16px 0;
        }

        .originalPrice {
          font-size: 13px;
          color: #9ca3af;
          text-decoration: line-through;
          font-weight: 500;
        }

        .finalPrice {
          font-size: 28px;
          font-weight: 800;
          color: #ec4899;
          line-height: 1;
        }

        .stockStatus {
          margin-bottom: 16px;
        }

        .badge-stock {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 8px;
          padding: 8px 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .badge-stock.in {
          background: #dcfce7;
          color: #166534;
        }

        .badge-stock.out {
          background: #fee2e2;
          color: #991b1b;
        }

        .dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .actionButtons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: auto;
        }

        .btnPrimary,
        .btnSecondary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          min-height: 44px;
        }

        .btnPrimary {
          background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
          color: white;
          box-shadow: 0 10px 20px rgba(236, 72, 153, 0.2);
        }

        .btnPrimary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(236, 72, 153, 0.3);
        }

        .btnPrimary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btnSecondary {
          background: #f3f4f6;
          color: #1f2937;
          border: 1px solid #e5e7eb;
        }

        .btnSecondary:hover {
          background: #ec4899;
          color: white;
          border-color: #ec4899;
          transform: translateY(-2px);
        }

        .spinner-mini {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .hero {
            padding: 36px;
          }

          .heroContent {
            flex-direction: column;
            gap: 24px;
          }

          .heroStats {
            width: 100%;
            justify-content: center;
          }

          .statCard {
            flex: 1;
            min-width: auto;
          }

          .productsGrid {
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 24px;
          }
        }

        @media (max-width: 768px) {
          .page {
            padding: 24px 0;
          }

          .container {
            padding: 0 16px;
          }

          .hero {
            padding: 28px;
            margin-bottom: 32px;
          }

          .heroText h1 {
            font-size: 32px;
          }

          .heroText p {
            font-size: 15px;
          }

          .productsGrid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 20px;
          }

          .cardContent {
            padding: 16px;
          }

          .productTitle h3 {
            font-size: 15px;
            min-height: 44px;
          }

          .finalPrice {
            font-size: 24px;
          }

          .actionButtons {
            grid-template-columns: 1fr;
          }

          .btnPrimary,
          .btnSecondary {
            padding: 11px 14px;
            font-size: 13px;
            min-height: 40px;
          }
        }

        @media (max-width: 640px) {
          .breadcrumb {
            font-size: 12px;
            margin-bottom: 24px;
          }

          .hero {
            padding: 20px;
            margin-bottom: 24px;
          }

          .badge {
            font-size: 11px;
            padding: 8px 12px;
          }

          .heroText h1 {
            font-size: 26px;
            margin-bottom: 12px;
          }

          .heroText p {
            font-size: 14px;
          }

          .statCard {
            padding: 24px 16px;
            min-width: 120px;
          }

          .statNumber {
            font-size: 28px;
          }

          .statLabel {
            font-size: 11px;
          }

          .productsGrid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .imageContainer {
            aspect-ratio: 1;
          }

          .cardContent {
            padding: 14px;
          }

          .productTitle h3 {
            font-size: 14px;
            min-height: 40px;
          }

          .productDesc {
            font-size: 12px;
            min-height: 36px;
          }

          .finalPrice {
            font-size: 20px;
          }

          .stateBox {
            padding: 40px 24px;
          }

          .stateBox h3 {
            font-size: 20px;
          }

          .stateBox p {
            font-size: 14px;
          }
        }

        @media (max-width: 480px) {
          .container {
            padding: 0 12px;
          }

          .breadcrumb {
            font-size: 11px;
            gap: 6px;
            margin-bottom: 16px;
          }

          .hero {
            padding: 16px;
            margin-bottom: 20px;
          }

          .heroText h1 {
            font-size: 22px;
          }

          .heroText p {
            font-size: 13px;
          }

          .heroStats {
            flex-direction: row;
            gap: 12px;
          }

          .statCard {
            padding: 16px 12px;
            min-width: 100px;
          }

          .statNumber {
            font-size: 24px;
          }

          .productsGrid {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .cardContent {
            padding: 12px;
          }

          .productTitle h3 {
            font-size: 13px;
          }

          .finalPrice {
            font-size: 18px;
          }

          .btnPrimary,
          .btnSecondary {
            padding: 10px 12px;
            font-size: 12px;
            min-height: 38px;
          }

          .stateContainer {
            min-height: 300px;
            padding: 24px 12px;
          }

          .stateBox {
            padding: 32px 20px;
          }

          .stateBox h3 {
            font-size: 18px;
          }

          .stateBox p {
            font-size: 13px;
          }
        }
      `}</style>
    </>
  );
}