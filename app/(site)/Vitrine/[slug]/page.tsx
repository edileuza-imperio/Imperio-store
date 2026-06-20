"use client";

import { use, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import api from "@/Api/conectar";
import {
  FiShoppingCart,
  FiEye,
  FiChevronRight,
  FiFilter,
  FiHeart,
} from "react-icons/fi";
import { imagemFundo } from "@/components/Bibioteca/imagem";

type Produto = {
  id_produto: number;
  nome: string;
  slug?: string;
  descricao?: string;
  descricao_curta?: string;
  imagem?: string;
  miniatura?: string;
  banner?: string;
  foto?: string;
  preco?: number | string;
  preco_promocional?: number | string;
  marca?: string;
};

type Item = {
  produto_id?: number;
  imagem_personalizada?: string;
  titulo_personalizado?: string;
  subtitulo_personalizado?: string;
};

type Vitrine = {
  id_vitrine: number;
  nome?: string;
  titulo?: string;
  subtitulo?: string;
  slug?: string;
};

type VitrinePageProps = {
  params: Promise<{ slug: string }>;
};



function formatarPreco(valor?: number | string) {
  if (valor === null || valor === undefined || valor === "") return null;

  const numero = Number(valor);
  if (Number.isNaN(numero)) return null;

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarTitulo(slug: string) {
  return slug
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function obterPrecoNumero(produto: Produto) {
  const valor = produto.preco_promocional || produto.preco;
  const numero = Number(valor);
  return Number.isNaN(numero) ? 0 : numero;
}

export default function VitrinePage({ params }: VitrinePageProps) {
  const { slug } = use(params);

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [vitrine, setVitrine] = useState<Vitrine | null>(null);
  const [loading, setLoading] = useState(true);
  const [porPagina, setPorPagina] = useState(12);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [ordenacao, setOrdenacao] = useState("relevancia");

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setLoading(true);

        const vitrineRes = await api.get(`/vitrine/slug/${slug}`);

        const vitrineData: Vitrine | null =
          vitrineRes?.data?.dados?.dados ??
          vitrineRes?.data?.dados ??
          vitrineRes?.data ??
          null;

        if (!ativo) return;
        setVitrine(vitrineData);

        if (!vitrineData?.id_vitrine) {
          setProdutos([]);
          return;
        }

        const itensRes = await api.get(`/vitrine/${vitrineData.id_vitrine}/itens`);

        const itens: Item[] =
          itensRes?.data?.dados?.dados ??
          itensRes?.data?.dados ??
          itensRes?.data ??
          [];

        const lista = await Promise.all(
          itens.map(async (item) => {
            if (!item.produto_id) return null;

            const res = await api.get(`/produto/${item.produto_id}`);

            const produto: Produto | null =
              res?.data?.dados?.dados ??
              res?.data?.dados ??
              res?.data ??
              null;

            if (!produto) return null;

            return {
              ...produto,
              nome: item.titulo_personalizado || produto.nome,
              descricao:
                item.subtitulo_personalizado ||
                produto.descricao_curta ||
                produto.descricao ||
                "",
              imagem:
                item.imagem_personalizada ||
                produto.imagem ||
                produto.miniatura ||
                produto.banner ||
                produto.foto ||
                "",
            };
          })
        );

        if (!ativo) return;
        setProdutos(lista.filter(Boolean) as Produto[]);
      } catch (error) {
        console.error("Erro ao carregar vitrine:", error);
        if (!ativo) return;
        setProdutos([]);
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, [slug]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [porPagina, ordenacao]);

  const produtosOrdenados = useMemo(() => {
    const lista = [...produtos];

    switch (ordenacao) {
      case "menor-preco":
        return lista.sort((a, b) => obterPrecoNumero(a) - obterPrecoNumero(b));
      case "maior-preco":
        return lista.sort((a, b) => obterPrecoNumero(b) - obterPrecoNumero(a));
      case "nome-az":
        return lista.sort((a, b) => a.nome.localeCompare(b.nome));
      case "nome-za":
        return lista.sort((a, b) => b.nome.localeCompare(a.nome));
      default:
        return lista;
    }
  }, [produtos, ordenacao]);

  const totalProdutos = produtosOrdenados.length;
  const totalPaginas = Math.max(1, Math.ceil(totalProdutos / porPagina));

  const produtosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * porPagina;
    return produtosOrdenados.slice(inicio, inicio + porPagina);
  }, [produtosOrdenados, paginaAtual, porPagina]);

  const titulo = vitrine?.titulo || vitrine?.nome || formatarTitulo(slug);
  const subtitulo =
    vitrine?.subtitulo ||
    "Produtos selecionados com carinho para você encontrar opções especiais.";

  return (
    <main className="vitrinePage">
      <section className="hero">
        <div className="heroDecor decorOne" />
        <div className="heroDecor decorTwo" />

        <div className="container">
          <nav className="breadcrumb">
            <Link href="/">Início</Link>
            <FiChevronRight />
            <Link href="/vitrine">Vitrines</Link>
            <FiChevronRight />
            <span>{titulo}</span>
          </nav>

          <div className="heroBox">
            <span className="badge">
              <FiHeart />
              Coleção Especial
            </span>

            <h1>{titulo}</h1>
            <p>{subtitulo}</p>
          </div>
        </div>
      </section>

      <section className="catalogo">
        <div className="container">
          {loading ? (
            <div className="stateBox">
              <div className="spinner" />
              <p>Carregando produtos...</p>
            </div>
          ) : produtos.length === 0 ? (
            <div className="stateBox">
              <h2>Nenhum produto encontrado</h2>
              <p>Essa vitrine ainda não possui produtos cadastrados.</p>
            </div>
          ) : (
            <>
              <div className="topbar">
                <div>
                  <strong>{totalProdutos}</strong>
                  <span> produtos encontrados</span>
                </div>

                <div className="controls">
                  <label>
                    <FiFilter />
                    <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)}>
                      <option value="relevancia">Relevância</option>
                      <option value="menor-preco">Menor preço</option>
                      <option value="maior-preco">Maior preço</option>
                      <option value="nome-az">Nome A-Z</option>
                      <option value="nome-za">Nome Z-A</option>
                    </select>
                  </label>

                  <label>
                    <select value={porPagina} onChange={(e) => setPorPagina(Number(e.target.value))}>
                      <option value={8}>8 por página</option>
                      <option value={12}>12 por página</option>
                      <option value={16}>16 por página</option>
                      <option value={24}>24 por página</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="grid">
                {produtosPaginados.map((produto, index) => {
                  const precoFinal = formatarPreco(produto.preco_promocional || produto.preco);
                  const precoOriginal =
                    produto.preco_promocional && produto.preco
                      ? formatarPreco(produto.preco)
                      : null;

                  const produtoHref = `/produto/${produto.slug || produto.id_produto}`;
                  const imagemProduto = imagemFundo(produto.imagem);

                  return (
                    <article key={produto.id_produto} className="card">
                      <Link href={produtoHref} className="imageBox">
                        {imagemProduto ? (
                          <Image
                            src={imagemProduto}
                            alt={produto.nome || "Produto"}
                            fill
                            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw"
                            className="productImage"
                            priority={index < 2}
                          />
                        ) : (
                          <div className="noImage">Sem imagem</div>
                        )}

                        {produto.marca && <span className="tag">{produto.marca}</span>}
                      </Link>

                      <div className="cardBody">
                        <Link href={produtoHref} className="titleLink">
                          <h3>{produto.nome}</h3>
                        </Link>

                        <p>{produto.descricao || "Produto disponível nesta vitrine."}</p>

                        <div className="priceArea">
                          {precoOriginal && <span>{precoOriginal}</span>}
                          {precoFinal && <strong>{precoFinal}</strong>}
                        </div>

                        <div className="actions">
                          <button type="button">
                            <FiShoppingCart />
                            Carrinho
                          </button>

                          <Link href={produtoHref}>
                            <FiEye />
                            Ver
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {totalPaginas > 1 && (
                <div className="pagination">
                  <button
                    type="button"
                    onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                  >
                    Anterior
                  </button>

                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                    <button
                      type="button"
                      key={pagina}
                      onClick={() => setPaginaAtual(pagina)}
                      className={paginaAtual === pagina ? "active" : ""}
                    >
                      {pagina}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAtual === totalPaginas}
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <style jsx>{`
        .vitrinePage {
          min-height: 100vh;
          background: #fff7fb;
          color: #23151d;
        }

        .container {
          width: min(1180px, calc(100% - 32px));
          margin: 0 auto;
        }

        .hero {
          position: relative;
          overflow: hidden;
          padding: 42px 0 74px;
          background:
            radial-gradient(circle at top left, rgba(255, 96, 145, 0.26), transparent 34%),
            linear-gradient(135deg, #fff7fb 0%, #ffe8f0 48%, #fff 100%);
        }

        .heroDecor {
          position: absolute;
          border-radius: 999px;
          filter: blur(2px);
          opacity: 0.45;
        }

        .decorOne {
          width: 280px;
          height: 280px;
          background: #ff8caf;
          right: -90px;
          top: -100px;
        }

        .decorTwo {
          width: 180px;
          height: 180px;
          background: #ffd1df;
          left: -60px;
          bottom: -80px;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #7c5364;
          margin-bottom: 34px;
          flex-wrap: wrap;
        }

        .breadcrumb a {
          color: #7c5364;
          text-decoration: none;
        }

        .breadcrumb span {
          color: #d6336c;
          font-weight: 700;
        }

        .heroBox {
          max-width: 760px;
          position: relative;
          z-index: 2;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 999px;
          background: #ffffffcc;
          border: 1px solid #ffd2e0;
          color: #c2255c;
          font-weight: 800;
          font-size: 13px;
          margin-bottom: 20px;
          box-shadow: 0 12px 30px rgba(194, 37, 92, 0.12);
        }

        .heroBox h1 {
          margin: 0;
          font-size: clamp(34px, 6vw, 68px);
          line-height: 0.96;
          letter-spacing: -2.5px;
          color: #2b111c;
        }

        .heroBox p {
          margin: 20px 0 0;
          max-width: 620px;
          font-size: 18px;
          line-height: 1.7;
          color: #6f4a59;
        }

        .catalogo {
          padding: 34px 0 70px;
          margin-top: -38px;
          position: relative;
          z-index: 3;
        }

        .topbar {
          background: #fff;
          border: 1px solid #f4d6e0;
          border-radius: 24px;
          padding: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          box-shadow: 0 18px 50px rgba(94, 35, 57, 0.08);
          margin-bottom: 24px;
        }

        .topbar strong {
          color: #d6336c;
          font-size: 22px;
        }

        .topbar span {
          color: #6f4a59;
          font-size: 14px;
        }

        .controls {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .controls label {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #f2cada;
          border-radius: 14px;
          padding: 0 12px;
          background: #fff7fb;
          color: #c2255c;
        }

        .controls select {
          height: 42px;
          border: 0;
          background: transparent;
          outline: none;
          color: #3b1f2b;
          font-weight: 700;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 22px;
        }

        .card {
          background: #fff;
          border: 1px solid #f4d6e0;
          border-radius: 26px;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(94, 35, 57, 0.08);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }

        .card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 60px rgba(94, 35, 57, 0.14);
        }

        .imageBox {
          position: relative;
          display: block;
          aspect-ratio: 1 / 1.12;
          background: #fff0f5;
          overflow: hidden;
        }

        .productImage {
          object-fit: cover;
          transition: transform 0.35s ease;
        }

        .card:hover .productImage {
          transform: scale(1.06);
        }

        .noImage {
          height: 100%;
          display: grid;
          place-items: center;
          color: #b46b86;
          font-weight: 800;
        }

        .tag {
          position: absolute;
          left: 12px;
          top: 12px;
          background: #fff;
          color: #c2255c;
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 900;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
        }

        .cardBody {
          padding: 18px;
        }

        .titleLink {
          color: inherit;
          text-decoration: none;
        }

        .cardBody h3 {
          margin: 0;
          font-size: 17px;
          line-height: 1.25;
          color: #2b111c;
        }

        .cardBody p {
          margin: 9px 0 14px;
          color: #765464;
          font-size: 13px;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .priceArea {
          min-height: 45px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          gap: 2px;
          margin-bottom: 16px;
        }

        .priceArea span {
          color: #a98a98;
          font-size: 13px;
          text-decoration: line-through;
        }

        .priceArea strong {
          color: #d6336c;
          font-size: 24px;
          letter-spacing: -0.8px;
        }

        .actions {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
        }

        .actions button,
        .actions a {
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 900;
          text-decoration: none;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .actions button {
          border: 0;
          background: linear-gradient(135deg, #d6336c, #ff6b9a);
          color: #fff;
        }

        .actions a {
          padding: 0 14px;
          background: #fff0f5;
          color: #c2255c;
          border: 1px solid #f5c2d3;
        }

        .actions button:hover,
        .actions a:hover {
          transform: translateY(-2px);
        }

        .pagination {
          display: flex;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 34px;
        }

        .pagination button {
          min-width: 42px;
          height: 42px;
          border-radius: 14px;
          border: 1px solid #f1c9d8;
          background: #fff;
          color: #5e3445;
          font-weight: 900;
          cursor: pointer;
        }

        .pagination button.active {
          background: #d6336c;
          color: #fff;
          border-color: #d6336c;
        }

        .pagination button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .stateBox {
          min-height: 300px;
          border-radius: 28px;
          background: #fff;
          border: 1px solid #f4d6e0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 30px;
          color: #6f4a59;
          box-shadow: 0 18px 50px rgba(94, 35, 57, 0.08);
        }

        .stateBox h2 {
          margin: 0 0 8px;
          color: #2b111c;
        }

        .spinner {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 4px solid #ffd2e0;
          border-top-color: #d6336c;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1050px) {
          .grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 780px) {
          .hero {
            padding-top: 30px;
          }

          .topbar {
            align-items: stretch;
            flex-direction: column;
          }

          .controls {
            width: 100%;
          }

          .controls label {
            flex: 1;
          }

          .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }
        }

        @media (max-width: 520px) {
          .container {
            width: min(100% - 22px, 1180px);
          }

          .heroBox h1 {
            letter-spacing: -1.4px;
          }

          .heroBox p {
            font-size: 15px;
          }

          .grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}