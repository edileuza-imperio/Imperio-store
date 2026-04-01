"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/Api/conectar";

import {
  FiHeart,
  FiShoppingCart,
  FiCreditCard,
  FiShield,
  FiTruck,
  FiRefreshCcw,
  FiStar,
} from "react-icons/fi";
import Navbar from "@/components/site/menu/navbar";

type Produto = {
  id?: number | string;
  id_produto?: number | string;
  nome?: string;
  titulo?: string;
  subtitulo?: string;
  descricao?: string;
  descricao_curta?: string;
  imagem?: string;
  miniatura?: string;
  banner?: string;
  foto?: string;
  desktop?: string;
  mobile?: string;
  slug?: string;
  preco?: number | string;
  preco_promocional?: number | string;
  sku?: string;
  marca?: string;
};

function normalizarDados<T = any>(payload: any): T | null {
  return payload?.dados?.dados ?? payload?.dados ?? payload ?? null;
}

function resolverImagem(src?: string | null) {
  if (!src) return "";

  const valor = String(src).trim();
  if (!valor) return "";

  if (
    valor.startsWith("http://") ||
    valor.startsWith("https://") ||
    valor.startsWith("data:image") ||
    valor.startsWith("blob:")
  ) {
    return valor;
  }

  const baseURL =
    typeof api === "string"
      ? api
      : (api as any)?.defaults?.baseURL || "";

  if (!baseURL) return valor;

  if (valor.startsWith("/")) {
    return `${baseURL}${valor}`;
  }

  return `${baseURL}/${valor}`;
}

function montarGaleria(produto?: Produto | null) {
  const imagensBrutas = [
    produto?.miniatura,
    produto?.imagem,
    produto?.foto,
    produto?.banner,
    produto?.desktop,
    produto?.mobile,
  ];

  const imagensResolvidas = imagensBrutas
    .map((img) => resolverImagem(img))
    .filter(Boolean);

  return [...new Set(imagensResolvidas)];
}

function formatarPreco(valor?: number | string | null) {
  if (valor === null || valor === undefined || valor === "") return null;

  const numero = Number(valor);
  if (Number.isNaN(numero)) return null;

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function calcularDesconto(
  preco?: number | string | null,
  precoPromocional?: number | string | null
) {
  const original = Number(preco);
  const promocional = Number(precoPromocional);

  if (
    !preco ||
    !precoPromocional ||
    Number.isNaN(original) ||
    Number.isNaN(promocional) ||
    original <= 0 ||
    promocional <= 0 ||
    promocional >= original
  ) {
    return null;
  }

  return Math.round(((original - promocional) / original) * 100);
}

export default function VisualizarProdutoDaVitrine() {
  const params = useParams();

  const slug = useMemo(() => {
    const valor = params?.slug;
    return Array.isArray(valor) ? valor[0] : valor;
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [produto, setProduto] = useState<Produto | null>(null);
  const [favoritado, setFavoritado] = useState(false);
  const [imagemSelecionada, setImagemSelecionada] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setLoading(true);
        setErro("");

        const response = await api.get(`/produto/slug/${slug}`);
        const produtoData = normalizarDados<Produto>(response?.data);

        if (!produtoData) {
          if (!ativo) return;
          setErro("Produto não encontrado.");
          setProduto(null);
          return;
        }

        if (!ativo) return;
        setProduto(produtoData);
      } catch (error) {
        console.error("Erro ao carregar produto:", error);
        if (!ativo) return;
        setErro("Não foi possível carregar o produto.");
        setProduto(null);
      } finally {
        if (ativo) setLoading(false);
      }
    }

    if (slug) {
      carregar();
    }

    return () => {
      ativo = false;
    };
  }, [slug]);

  const galeria = useMemo(() => montarGaleria(produto), [produto]);

  useEffect(() => {
    if (galeria.length > 0) {
      setImagemSelecionada(galeria[0]);
    } else {
      setImagemSelecionada("");
    }
  }, [galeria]);

  const precoFinal = produto?.preco_promocional || produto?.preco || null;
  const precoOriginal = produto?.preco_promocional ? produto?.preco : null;
  const desconto = calcularDesconto(produto?.preco, produto?.preco_promocional);

  function handleAdicionarCarrinho() {
    console.log("Adicionar ao carrinho:", produto);
  }

  function handleComprarAgora() {
    console.log("Comprar agora:", produto);
  }

  function handleFavoritar() {
    setFavoritado((prev) => !prev);
    console.log("Favoritar produto:", produto);
  }

  return (
    <>
      <Navbar />

      <section className="produto-visualizar-page">
        <div className="bg-decor bg-decor-top" />
        <div className="bg-decor bg-decor-bottom" />

        <div className="container-produto">
          {loading ? (
            <div className="estado-box">
              <div className="estado-card">Carregando produto...</div>
            </div>
          ) : erro ? (
            <div className="estado-box">
              <div className="estado-card estado-erro">{erro}</div>
            </div>
          ) : !produto ? (
            <div className="estado-box">
              <div className="estado-card">Produto não encontrado.</div>
            </div>
          ) : (
            <div className="produto-hero-card">
              <div className="produto-galeria">
                {desconto && <span className="tag-desconto">-{desconto}% OFF</span>}

                <button
                  type="button"
                  className={`btn-favorito-flutuante ${favoritado ? "ativo" : ""}`}
                  onClick={handleFavoritar}
                  aria-label={favoritado ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                  title={favoritado ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  <FiHeart />
                </button>

                <div className="galeria-layout">
                  <div className="miniaturas-lateral">
                    {galeria.length > 0 ? (
                      galeria.map((imagem, index) => (
                        <button
                          type="button"
                          key={`${imagem}-${index}`}
                          className={`miniatura-item ${
                            imagemSelecionada === imagem ? "ativa" : ""
                          }`}
                          onClick={() => setImagemSelecionada(imagem)}
                        >
                          <img
                            src={imagem}
                            alt={`${produto.nome || produto.titulo || "Produto"} ${index + 1}`}
                            className="miniatura-imagem"
                          />
                        </button>
                      ))
                    ) : (
                      <div className="miniatura-vazia">Sem miniaturas</div>
                    )}
                  </div>

                  <div className="imagem-principal-wrap">
                    <div className="imagem-overlay" />

                    {imagemSelecionada ? (
                      <img
                        src={imagemSelecionada}
                        alt={produto.nome || produto.titulo || "Produto"}
                        className="imagem-principal"
                      />
                    ) : (
                      <div className="sem-imagem">Sem imagem disponível</div>
                    )}
                  </div>
                </div>

                <div className="mini-info-imagem">
                  <div className="mini-info-pill">
                    <FiStar />
                    <span>Destaque da vitrine</span>
                  </div>

                  {produto?.marca && (
                    <div className="mini-info-pill mini-info-soft">
                      <span>{produto.marca}</span>
                    </div>
                  )}

                  {produto?.miniatura && (
                    <div className="mini-info-pill mini-info-soft">
                      <span>Miniatura carregada</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="produto-detalhes">
                <span className="selo-vitrine">Produto em destaque</span>

                <h1 className="produto-titulo">
                  {produto.nome || produto.titulo || "Produto sem nome"}
                </h1>

                {produto.subtitulo && (
                  <p className="produto-subtitulo">{produto.subtitulo}</p>
                )}

                <div className="linha-info">
                  {produto.marca && (
                    <div className="info-pill">
                      <span className="label">Marca</span>
                      <strong>{produto.marca}</strong>
                    </div>
                  )}

                  {produto.sku && (
                    <div className="info-pill">
                      <span className="label">SKU</span>
                      <strong>{produto.sku}</strong>
                    </div>
                  )}

                  <div className="info-pill">
                    <span className="label">Galeria</span>
                    <strong>{galeria.length} imagem(ns)</strong>
                  </div>
                </div>

                {(precoOriginal || precoFinal) && (
                  <div className="bloco-preco">
                    {precoOriginal && (
                      <span className="preco-original">
                        De {formatarPreco(precoOriginal)}
                      </span>
                    )}

                    {precoFinal && (
                      <div className="preco-linha">
                        <span className="preco-label">Por</span>
                        <strong className="preco-final">
                          {formatarPreco(precoFinal)}
                        </strong>
                      </div>
                    )}

                    <span className="texto-pagamento">
                      Aproveite esta oferta especial disponível na vitrine.
                    </span>
                  </div>
                )}

                <div className="acoes-produto">
                  <button
                    type="button"
                    className="btn-principal"
                    onClick={handleAdicionarCarrinho}
                  >
                    <FiShoppingCart className="btn-icon" />
                    <span>Adicionar ao carrinho</span>
                  </button>

                  <button
                    type="button"
                    className="btn-comprar"
                    onClick={handleComprarAgora}
                  >
                    <FiCreditCard className="btn-icon" />
                    <span>Comprar agora</span>
                  </button>
                </div>

                {(produto.descricao_curta || produto.descricao) && (
                  <div className="bloco-descricao">
                    <h2>Descrição do produto</h2>
                    <p>{produto.descricao_curta || produto.descricao}</p>
                  </div>
                )}

                <div className="beneficios-grid">
                  <div className="beneficio-card">
                    <FiTruck className="beneficio-icon" />
                    <div>
                      <strong>Entrega rápida</strong>
                      <p>Envio com agilidade e acompanhamento do pedido.</p>
                    </div>
                  </div>

                  <div className="beneficio-card">
                    <FiShield className="beneficio-icon" />
                    <div>
                      <strong>Compra segura</strong>
                      <p>Seus dados protegidos em todo o processo.</p>
                    </div>
                  </div>

                  <div className="beneficio-card">
                    <FiRefreshCcw className="beneficio-icon" />
                    <div>
                      <strong>Suporte e troca</strong>
                      <p>Atendimento para dúvidas, suporte e pós-venda.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        .produto-visualizar-page {
          position: relative;
          min-height: 100vh;
          padding: 28px 16px 64px;
          background: linear-gradient(180deg, #fffaf4 0%, #fff4ec 48%, #fdf0e8 100%);
          overflow: hidden;
        }

        .bg-decor {
          position: absolute;
          border-radius: 999px;
          filter: blur(10px);
          opacity: 0.45;
          pointer-events: none;
        }

        .bg-decor-top {
          width: 320px;
          height: 320px;
          top: -100px;
          right: -100px;
          background: radial-gradient(circle, #c97a8d 0%, transparent 72%);
        }

        .bg-decor-bottom {
          width: 360px;
          height: 360px;
          bottom: -140px;
          left: -120px;
          background: radial-gradient(circle, #e8c9bb 0%, transparent 72%);
        }

        .container-produto {
          position: relative;
          z-index: 2;
          max-width: 1280px;
          margin: 0 auto;
        }

        .estado-box {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 60vh;
        }

        .estado-card {
          width: 100%;
          max-width: 520px;
          padding: 22px 20px;
          text-align: center;
          border-radius: 22px;
          background: rgba(255, 250, 244, 0.88);
          border: 1px solid rgba(201, 122, 141, 0.18);
          box-shadow: 0 18px 45px rgba(137, 78, 93, 0.12);
          color: #6f4250;
          font-size: 16px;
          font-weight: 600;
        }

        .estado-erro {
          color: #8a3248;
        }

        .produto-hero-card {
          display: grid;
          grid-template-columns: minmax(340px, 620px) 1fr;
          gap: 36px;
          padding: 26px;
          border-radius: 34px;
          background: rgba(255, 248, 241, 0.94);
          border: 1px solid rgba(201, 122, 141, 0.18);
          box-shadow:
            0 18px 60px rgba(123, 78, 92, 0.14),
            inset 0 1px 0 rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
        }

        .produto-galeria {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tag-desconto {
          position: absolute;
          top: 18px;
          left: 18px;
          z-index: 4;
          padding: 8px 14px;
          border-radius: 999px;
          background: linear-gradient(135deg, #b85d73 0%, #945060 100%);
          color: #fffaf7;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.4px;
          box-shadow: 0 12px 25px rgba(148, 80, 96, 0.28);
        }

        .btn-favorito-flutuante {
          position: absolute;
          top: 18px;
          right: 18px;
          z-index: 5;
          width: 54px;
          height: 54px;
          border: none;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: rgba(255, 250, 245, 0.94);
          color: #9a5c70;
          box-shadow:
            0 14px 30px rgba(143, 82, 99, 0.16),
            inset 0 1px 0 rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(10px);
          transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease, color 0.25s ease;
        }

        .btn-favorito-flutuante:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow:
            0 18px 34px rgba(143, 82, 99, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.85);
        }

        .btn-favorito-flutuante svg {
          font-size: 22px;
        }

        .btn-favorito-flutuante.ativo {
          background: linear-gradient(135deg, #b85d73 0%, #955163 100%);
          color: #fff;
          box-shadow: 0 18px 36px rgba(154, 84, 101, 0.28);
        }

        .galeria-layout {
          display: grid;
          grid-template-columns: 92px 1fr;
          gap: 16px;
          align-items: stretch;
        }

        .miniaturas-lateral {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 620px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .miniaturas-lateral::-webkit-scrollbar {
          width: 6px;
        }

        .miniaturas-lateral::-webkit-scrollbar-thumb {
          background: rgba(184, 93, 115, 0.28);
          border-radius: 999px;
        }

        .miniatura-item {
          width: 100%;
          height: 92px;
          border: 1px solid rgba(201, 122, 141, 0.14);
          border-radius: 18px;
          padding: 0;
          overflow: hidden;
          cursor: pointer;
          background: rgba(255, 250, 245, 0.95);
          box-shadow: 0 10px 20px rgba(158, 106, 120, 0.08);
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
        }

        .miniatura-item:hover {
          transform: translateY(-2px);
          border-color: rgba(184, 93, 115, 0.35);
        }

        .miniatura-item.ativa {
          border: 2px solid #b85d73;
          box-shadow: 0 14px 28px rgba(154, 84, 101, 0.18);
        }

        .miniatura-imagem {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .miniatura-vazia {
          min-height: 92px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 12px;
          color: #8f6572;
          border-radius: 18px;
          background: rgba(255, 250, 245, 0.92);
          border: 1px dashed rgba(201, 122, 141, 0.2);
          padding: 10px;
        }

        .imagem-principal-wrap {
          position: relative;
          width: 100%;
          min-height: 620px;
          border-radius: 30px;
          overflow: hidden;
          background: linear-gradient(180deg, #fff6f0 0%, #f8e3d7 100%);
          border: 1px solid rgba(201, 122, 141, 0.15);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.85),
            0 18px 34px rgba(175, 121, 136, 0.13);
        }

        .imagem-overlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at top right, rgba(255, 255, 255, 0.45), transparent 30%),
            linear-gradient(to top, rgba(84, 42, 54, 0.08), transparent 30%);
          z-index: 1;
          pointer-events: none;
        }

        .imagem-principal {
          position: relative;
          z-index: 0;
          width: 100%;
          height: 100%;
          min-height: 620px;
          object-fit: cover;
          display: block;
        }

        .sem-imagem {
          min-height: 620px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          text-align: center;
          color: #8d6170;
          font-weight: 600;
        }

        .mini-info-imagem {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .mini-info-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 40px;
          padding: 0 14px;
          border-radius: 999px;
          background: rgba(255, 250, 245, 0.92);
          border: 1px solid rgba(201, 122, 141, 0.14);
          color: #8b5767;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 10px 22px rgba(158, 106, 120, 0.08);
        }

        .mini-info-soft {
          background: rgba(248, 228, 218, 0.75);
        }

        .produto-detalhes {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 18px;
          padding: 10px 4px;
        }

        .selo-vitrine {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(201, 122, 141, 0.12);
          color: #9f5d71;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .produto-titulo {
          margin: 0;
          color: #5f3340;
          font-size: clamp(2rem, 4vw, 3.35rem);
          line-height: 1.06;
          letter-spacing: -0.03em;
        }

        .produto-subtitulo {
          margin: 0;
          color: #87606d;
          font-size: 1.05rem;
          line-height: 1.75;
          max-width: 720px;
        }

        .linha-info {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .info-pill {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 150px;
          padding: 14px 16px;
          border-radius: 18px;
          background: rgba(255, 250, 245, 0.95);
          border: 1px solid rgba(201, 122, 141, 0.12);
          box-shadow: 0 10px 24px rgba(158, 106, 120, 0.08);
        }

        .info-pill .label {
          font-size: 12px;
          color: #b07a89;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 700;
        }

        .info-pill strong {
          color: #6d4050;
          font-size: 15px;
        }

        .bloco-preco {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 22px;
          border-radius: 24px;
          background: linear-gradient(180deg, #fffaf6 0%, #f9ece2 100%);
          border: 1px solid rgba(201, 122, 141, 0.14);
          box-shadow: 0 14px 30px rgba(167, 112, 127, 0.1);
        }

        .preco-original {
          color: #b38b97;
          text-decoration: line-through;
          font-size: 15px;
          font-weight: 600;
        }

        .preco-linha {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
        }

        .preco-label {
          color: #8d6170;
          font-size: 15px;
          font-weight: 700;
        }

        .preco-final {
          color: #a54f67;
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .texto-pagamento {
          color: #8a6572;
          font-size: 14px;
        }

        .acoes-produto {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }

        .btn-principal,
        .btn-comprar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 54px;
          padding: 0 22px;
          border-radius: 18px;
          border: none;
          cursor: pointer;
          font-weight: 700;
          transition: 0.25s ease;
          font-size: 15px;
        }

        .btn-icon {
          font-size: 18px;
        }

        .btn-principal {
          background: linear-gradient(135deg, #b85d73 0%, #955163 100%);
          color: #fffaf7;
          box-shadow: 0 16px 32px rgba(154, 84, 101, 0.22);
        }

        .btn-principal:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 36px rgba(154, 84, 101, 0.28);
        }

        .btn-comprar {
          background: #f7e3d8;
          color: #8a4d61;
          border: 1px solid rgba(184, 93, 115, 0.18);
        }

        .btn-comprar:hover {
          transform: translateY(-2px);
          background: #f3dbcf;
        }

        .bloco-descricao {
          padding: 22px;
          border-radius: 22px;
          background: rgba(255, 251, 247, 0.92);
          border: 1px solid rgba(201, 122, 141, 0.12);
        }

        .bloco-descricao h2 {
          margin: 0 0 10px;
          color: #6b3e4d;
          font-size: 1.2rem;
        }

        .bloco-descricao p {
          margin: 0;
          color: #755260;
          line-height: 1.8;
          font-size: 15px;
        }

        .beneficios-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .beneficio-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 18px;
          border-radius: 20px;
          background: rgba(255, 251, 247, 0.95);
          border: 1px solid rgba(201, 122, 141, 0.12);
          box-shadow: 0 10px 22px rgba(158, 106, 120, 0.06);
        }

        .beneficio-icon {
          flex-shrink: 0;
          margin-top: 2px;
          font-size: 20px;
          color: #a55c70;
        }

        .beneficio-card strong {
          display: block;
          margin-bottom: 4px;
          color: #6c4050;
          font-size: 15px;
        }

        .beneficio-card p {
          margin: 0;
          color: #83626d;
          font-size: 13px;
          line-height: 1.6;
        }

        @media (max-width: 1180px) {
          .produto-hero-card {
            grid-template-columns: 1fr;
            gap: 28px;
          }

          .galeria-layout {
            grid-template-columns: 82px 1fr;
          }

          .imagem-principal-wrap,
          .imagem-principal,
          .sem-imagem {
            min-height: 460px;
          }

          .beneficios-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .produto-visualizar-page {
            padding: 18px 12px 48px;
          }

          .produto-hero-card {
            padding: 16px;
            border-radius: 24px;
          }

          .produto-titulo {
            font-size: 2rem;
          }

          .btn-favorito-flutuante {
            top: 14px;
            right: 14px;
            width: 46px;
            height: 46px;
          }

          .galeria-layout {
            grid-template-columns: 1fr;
          }

          .miniaturas-lateral {
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
            max-height: unset;
            padding-right: 0;
            padding-bottom: 4px;
            order: 2;
          }

          .miniatura-item {
            min-width: 78px;
            width: 78px;
            height: 78px;
            flex-shrink: 0;
            border-radius: 16px;
          }

          .imagem-principal-wrap,
          .imagem-principal,
          .sem-imagem {
            min-height: 320px;
            border-radius: 20px;
          }

          .acoes-produto {
            flex-direction: column;
          }

          .btn-principal,
          .btn-comprar {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}