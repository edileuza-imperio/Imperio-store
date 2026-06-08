"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

import api from "@/Api/conectar";
import { imagemFundo } from "@/components/Bibioteca/imagem";
import { useVitrine } from "./useVitrine";

import {
  FiAlertCircle,
  FiCheckCircle,
  FiCreditCard,
  FiHeart,
  FiRefreshCcw,
  FiShield,
  FiShoppingCart,
  FiStar,
  FiTruck,
  FiX,
} from "react-icons/fi";

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

type Notificacao = {
  tipo: "sucesso" | "erro";
  texto: string;
};

function normalizarDados<T = any>(payload: any): T | null {
  return payload?.dados?.dados ?? payload?.dados ?? payload ?? null;
}

function montarGaleria(produto?: Produto | null) {
  const imagens = [
    produto?.miniatura,
    produto?.imagem,
    produto?.foto,
    produto?.banner,
    produto?.desktop,
    produto?.mobile,
  ];

  return [...new Set(imagens.map(imagemFundo).filter(Boolean))];
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
    !original ||
    !promocional ||
    Number.isNaN(original) ||
    Number.isNaN(promocional) ||
    promocional >= original
  ) {
    return null;
  }

  return Math.round(((original - promocional) / original) * 100);
}

function extrairMensagemErro(error: unknown, fallback = "Ocorreu um erro.") {
  if (typeof error === "string") return error;

  if (error && typeof error === "object") {
    const anyError = error as any;

    return (
      anyError?.response?.data?.erro ||
      anyError?.response?.data?.mensagem ||
      anyError?.message ||
      fallback
    );
  }

  return fallback;
}

export default function VisualizarProdutoDaVitrine() {
  const params = useParams();

  const slug = useMemo(() => {
    const valor = params?.slug;
    return Array.isArray(valor) ? valor[0] : valor;
  }, [params]);

  const {
    loadingCarrinho,
    loadingComprar,
    adicionarAoCarrinho,
    comprarAgora,
  } = useVitrine();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [produto, setProduto] = useState<Produto | null>(null);
  const [favoritado, setFavoritado] = useState(false);
  const [imagemSelecionada, setImagemSelecionada] = useState("");
  const [notificacao, setNotificacao] = useState<Notificacao | null>(null);

  const timerNotificacao = useRef<number | null>(null);

  function mostrarNotificacao(
    texto: string,
    tipo: Notificacao["tipo"] = "sucesso"
  ) {
    setNotificacao({ texto, tipo });

    if (timerNotificacao.current) {
      window.clearTimeout(timerNotificacao.current);
    }

    timerNotificacao.current = window.setTimeout(() => {
      setNotificacao(null);
    }, 2800);
  }

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
    } else {
      setLoading(false);
      setErro("Slug do produto não encontrado.");
    }

    return () => {
      ativo = false;

      if (timerNotificacao.current) {
        window.clearTimeout(timerNotificacao.current);
      }
    };
  }, [slug]);

  const galeria = useMemo(() => montarGaleria(produto), [produto]);

  useEffect(() => {
    setImagemSelecionada(galeria[0] || "");
  }, [galeria]);

  const produtoId = Number(produto?.id || produto?.id_produto);
  const precoFinal = produto?.preco_promocional || produto?.preco || null;
  const precoOriginal = produto?.preco_promocional ? produto?.preco : null;
  const desconto = calcularDesconto(produto?.preco, produto?.preco_promocional);

  async function handleAdicionarCarrinho() {
    try {
      const resultado = await adicionarAoCarrinho(produtoId, 1);

      mostrarNotificacao(
        resultado?.mensagem || "Produto adicionado ao carrinho.",
        "sucesso"
      );
    } catch (error) {
      mostrarNotificacao(
        extrairMensagemErro(error, "Não foi possível adicionar ao carrinho."),
        "erro"
      );
    }
  }

  async function handleComprarAgora() {
    try {
      await comprarAgora(produtoId, 1);
    } catch (error) {
      mostrarNotificacao(
        extrairMensagemErro(error, "Não foi possível comprar agora."),
        "erro"
      );
    }
  }

  function handleFavoritar() {
    setFavoritado((prev) => {
      const novoEstado = !prev;

      mostrarNotificacao(
        novoEstado ? "Adicionado aos favoritos." : "Removido dos favoritos.",
        "sucesso"
      );

      return novoEstado;
    });
  }

  return (
    <>
      <section className="produto-visualizar-page">
        <div className="bg-decor bg-decor-top" />
        <div className="bg-decor bg-decor-bottom" />

        {notificacao && (
          <div
            className={`toast-notificacao ${
              notificacao.tipo === "sucesso" ? "toast-sucesso" : "toast-erro"
            }`}
          >
            <div className="toast-conteudo">
              {notificacao.tipo === "sucesso" ? (
                <FiCheckCircle />
              ) : (
                <FiAlertCircle />
              )}
              <span>{notificacao.texto}</span>
            </div>

            <button type="button" onClick={() => setNotificacao(null)}>
              <FiX />
            </button>
          </div>
        )}

        <div className="container-produto">
          {loading ? (
            <div className="estado-box">
              <div className="estado-card">Carregando produto...</div>
            </div>
          ) : erro ? (
            <div className="estado-box">
              <div className="estado-card erro">{erro}</div>
            </div>
          ) : !produto ? (
            <div className="estado-box">
              <div className="estado-card">Produto não encontrado.</div>
            </div>
          ) : (
            <div className="produto-card">
              <div className="produto-galeria">
                {desconto && <span className="tag-desconto">-{desconto}% OFF</span>}

                <button
                  type="button"
                  className={`btn-favorito ${favoritado ? "ativo" : ""}`}
                  onClick={handleFavoritar}
                >
                  <FiHeart />
                </button>

                <div className="galeria-layout">
                  <div className="miniaturas">
                    {galeria.length > 0 ? (
                      galeria.map((imagem, index) => (
                        <button
                          type="button"
                          key={`${imagem}-${index}`}
                          className={`miniatura ${
                            imagemSelecionada === imagem ? "ativa" : ""
                          }`}
                          onClick={() => setImagemSelecionada(imagem)}
                        >
                          <Image
                            src={imagem}
                            alt={`${produto.nome || produto.titulo || "Produto"} ${
                              index + 1
                            }`}
                            fill
                            sizes="90px"
                          />
                        </button>
                      ))
                    ) : (
                      <div className="miniatura-vazia">Sem imagem</div>
                    )}
                  </div>

                  <div className="imagem-principal">
                    {imagemSelecionada ? (
                      <Image
                        src={imagemSelecionada}
                        alt={produto.nome || produto.titulo || "Produto"}
                        fill
                        priority
                        sizes="(max-width: 768px) 100vw, 560px"
                      />
                    ) : (
                      <div className="sem-imagem">Sem imagem disponível</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="produto-info">
                <span className="selo">Produto em destaque</span>

                <h1>{produto.nome || produto.titulo || "Produto sem nome"}</h1>

                {produto.subtitulo && <p className="subtitulo">{produto.subtitulo}</p>}

                <div className="info-grid">
                  {produto.marca && (
                    <div>
                      <span>Marca</span>
                      <strong>{produto.marca}</strong>
                    </div>
                  )}

                  {produto.sku && (
                    <div>
                      <span>SKU</span>
                      <strong>{produto.sku}</strong>
                    </div>
                  )}

                  <div>
                    <span>Galeria</span>
                    <strong>{galeria.length} imagem(ns)</strong>
                  </div>
                </div>

                <div className="preco-box">
                  {precoOriginal && (
                    <span className="preco-original">
                      De {formatarPreco(precoOriginal)}
                    </span>
                  )}

                  {precoFinal && (
                    <strong className="preco-final">{formatarPreco(precoFinal)}</strong>
                  )}

                  <p>Oferta especial disponível na vitrine.</p>
                </div>

                <div className="acoes">
                  <button
                    type="button"
                    className="btn-carrinho"
                    onClick={handleAdicionarCarrinho}
                    disabled={loadingCarrinho || loadingComprar}
                  >
                    <FiShoppingCart />
                    {loadingCarrinho ? "Adicionando..." : "Adicionar ao carrinho"}
                  </button>

                  <button
                    type="button"
                    className="btn-comprar"
                    onClick={handleComprarAgora}
                    disabled={loadingComprar || loadingCarrinho}
                  >
                    <FiCreditCard />
                    {loadingComprar ? "Processando..." : "Comprar agora"}
                  </button>
                </div>

                {(produto.descricao_curta || produto.descricao) && (
                  <div className="descricao">
                    <h2>Descrição do produto</h2>
                    <p>{produto.descricao_curta || produto.descricao}</p>
                  </div>
                )}

                <div className="beneficios">
                  <div>
                    <FiTruck />
                    <strong>Entrega rápida</strong>
                    <p>Envio com acompanhamento do pedido.</p>
                  </div>

                  <div>
                    <FiShield />
                    <strong>Compra segura</strong>
                    <p>Seus dados protegidos durante a compra.</p>
                  </div>

                  <div>
                    <FiRefreshCcw />
                    <strong>Suporte</strong>
                    <p>Atendimento para dúvidas e pós-venda.</p>
                  </div>
                </div>

                <div className="destaque">
                  <FiStar />
                  <span>Produto selecionado com carinho para você.</span>
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
          padding: 32px 16px 70px;
          background:
            radial-gradient(circle at 12% 0%, rgba(184, 93, 115, 0.18), transparent 32%),
            radial-gradient(circle at 90% 100%, rgba(232, 201, 187, 0.38), transparent 35%),
            linear-gradient(180deg, #fffaf4 0%, #fff3ec 50%, #fbe9df 100%);
          overflow: hidden;
        }

        .bg-decor {
          position: absolute;
          border-radius: 999px;
          filter: blur(18px);
          pointer-events: none;
          opacity: 0.55;
        }

        .bg-decor-top {
          width: 340px;
          height: 340px;
          top: -130px;
          right: -120px;
          background: #c97a8d;
        }

        .bg-decor-bottom {
          width: 380px;
          height: 380px;
          bottom: -150px;
          left: -140px;
          background: #e8c9bb;
        }

        .container-produto {
          position: relative;
          z-index: 2;
          max-width: 1280px;
          margin: 0 auto;
        }

        .toast-notificacao {
          position: fixed;
          top: 18px;
          right: 18px;
          z-index: 50;
          width: min(430px, calc(100vw - 28px));
          padding: 15px 16px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          box-shadow: 0 22px 55px rgba(95, 51, 64, 0.18);
          backdrop-filter: blur(14px);
        }

        .toast-sucesso {
          background: rgba(238, 250, 242, 0.96);
          border: 1px solid rgba(45, 145, 82, 0.18);
          color: #27663d;
        }

        .toast-erro {
          background: rgba(255, 239, 241, 0.96);
          border: 1px solid rgba(180, 57, 76, 0.18);
          color: #943145;
        }

        .toast-conteudo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 800;
        }

        .toast-notificacao button {
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font-size: 19px;
          display: flex;
        }

        .estado-box {
          min-height: 65vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .estado-card {
          width: 100%;
          max-width: 520px;
          padding: 24px;
          border-radius: 24px;
          text-align: center;
          background: rgba(255, 250, 244, 0.92);
          border: 1px solid rgba(184, 93, 115, 0.18);
          color: #6f4250;
          font-weight: 800;
          box-shadow: 0 20px 50px rgba(95, 51, 64, 0.12);
        }

        .estado-card.erro {
          color: #943145;
        }

        .produto-card {
          display: grid;
          grid-template-columns: minmax(360px, 620px) 1fr;
          gap: 38px;
          padding: 28px;
          border-radius: 36px;
          background: rgba(255, 248, 241, 0.94);
          border: 1px solid rgba(184, 93, 115, 0.16);
          box-shadow:
            0 24px 70px rgba(95, 51, 64, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
        }

        .produto-galeria {
          position: relative;
        }

        .tag-desconto {
          position: absolute;
          top: 18px;
          left: 18px;
          z-index: 5;
          padding: 9px 14px;
          border-radius: 999px;
          background: linear-gradient(135deg, #b85d73, #86475a);
          color: #fff;
          font-size: 12px;
          font-weight: 900;
          box-shadow: 0 16px 32px rgba(184, 93, 115, 0.28);
        }

        .btn-favorito {
          position: absolute;
          top: 18px;
          right: 18px;
          z-index: 5;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 0;
          cursor: pointer;
          display: grid;
          place-items: center;
          background: rgba(255, 250, 245, 0.95);
          color: #9a5c70;
          font-size: 22px;
          box-shadow: 0 15px 32px rgba(95, 51, 64, 0.14);
          transition: 0.25s ease;
        }

        .btn-favorito:hover {
          transform: translateY(-2px) scale(1.04);
        }

        .btn-favorito.ativo {
          background: linear-gradient(135deg, #b85d73, #86475a);
          color: #fff;
        }

        .galeria-layout {
          display: grid;
          grid-template-columns: 92px 1fr;
          gap: 16px;
        }

        .miniaturas {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 620px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .miniatura {
          position: relative;
          width: 92px;
          height: 92px;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(184, 93, 115, 0.16);
          background: #fffaf5;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(95, 51, 64, 0.08);
          transition: 0.22s ease;
        }

        .miniatura:hover {
          transform: translateY(-2px);
        }

        .miniatura.ativa {
          border: 2px solid #b85d73;
          box-shadow: 0 16px 30px rgba(184, 93, 115, 0.2);
        }

        .miniatura img,
        .imagem-principal img {
          object-fit: cover;
          object-position: center;
        }

        .miniatura-vazia {
          width: 92px;
          height: 92px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          text-align: center;
          font-size: 12px;
          color: #8f6572;
          background: #fffaf5;
          border: 1px dashed rgba(184, 93, 115, 0.22);
        }

        .imagem-principal {
          position: relative;
          width: 100%;
          min-height: 540px;
          aspect-ratio: 1 / 1;
          border-radius: 32px;
          overflow: hidden;
          background: linear-gradient(180deg, #fff7f0, #f4d9cc);
          border: 1px solid rgba(184, 93, 115, 0.15);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.8),
            0 20px 42px rgba(95, 51, 64, 0.12);
        }

        .sem-imagem {
          height: 100%;
          min-height: 540px;
          display: grid;
          place-items: center;
          color: #8f6572;
          font-weight: 800;
        }

        .produto-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 18px;
        }

        .selo {
          width: fit-content;
          padding: 9px 15px;
          border-radius: 999px;
          background: rgba(184, 93, 115, 0.12);
          color: #9f5d71;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .produto-info h1 {
          margin: 0;
          color: #5f3340;
          font-size: clamp(2rem, 4vw, 3.4rem);
          line-height: 1.04;
          letter-spacing: -0.04em;
        }

        .subtitulo {
          margin: 0;
          color: #87606d;
          font-size: 1.05rem;
          line-height: 1.75;
        }

        .info-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .info-grid div {
          min-width: 145px;
          padding: 14px 16px;
          border-radius: 18px;
          background: rgba(255, 250, 245, 0.92);
          border: 1px solid rgba(184, 93, 115, 0.12);
          box-shadow: 0 10px 24px rgba(95, 51, 64, 0.07);
        }

        .info-grid span {
          display: block;
          margin-bottom: 5px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          color: #b07a89;
        }

        .info-grid strong {
          color: #6d4050;
          font-size: 15px;
        }

        .preco-box {
          padding: 24px;
          border-radius: 26px;
          background: linear-gradient(180deg, #fffaf6, #f8e8dd);
          border: 1px solid rgba(184, 93, 115, 0.14);
          box-shadow: 0 16px 34px rgba(95, 51, 64, 0.08);
        }

        .preco-original {
          display: block;
          margin-bottom: 6px;
          color: #a87a86;
          text-decoration: line-through;
          font-weight: 700;
        }

        .preco-final {
          display: block;
          color: #803f52;
          font-size: clamp(2.1rem, 4vw, 3.1rem);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .preco-box p {
          margin: 10px 0 0;
          color: #8f6572;
          font-weight: 700;
        }

        .acoes {
          display: flex;
          gap: 12px;
        }

        .acoes button {
          flex: 1;
          min-height: 58px;
          border: 0;
          border-radius: 18px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 15px;
          font-weight: 900;
          transition: 0.25s ease;
        }

        .acoes button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .btn-carrinho {
          color: #fff;
          background: linear-gradient(135deg, #b85d73, #86475a);
          box-shadow: 0 18px 34px rgba(184, 93, 115, 0.26);
        }

        .btn-comprar {
          color: #7a4053;
          background: #fffaf5;
          border: 1px solid rgba(184, 93, 115, 0.18) !important;
          box-shadow: 0 14px 28px rgba(95, 51, 64, 0.09);
        }

        .acoes button:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .descricao {
          padding: 22px;
          border-radius: 24px;
          background: rgba(255, 250, 245, 0.78);
          border: 1px solid rgba(184, 93, 115, 0.12);
        }

        .descricao h2 {
          margin: 0 0 8px;
          color: #5f3340;
          font-size: 1.1rem;
        }

        .descricao p {
          margin: 0;
          color: #82606a;
          line-height: 1.8;
        }

        .beneficios {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .beneficios div {
          padding: 16px;
          border-radius: 20px;
          background: rgba(255, 250, 245, 0.82);
          border: 1px solid rgba(184, 93, 115, 0.12);
        }

        .beneficios svg {
          color: #a9576c;
          font-size: 22px;
          margin-bottom: 8px;
        }

        .beneficios strong {
          display: block;
          color: #653747;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .beneficios p {
          margin: 0;
          color: #8f6572;
          font-size: 12px;
          line-height: 1.5;
        }

        .destaque {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          color: #8b5767;
          font-weight: 800;
          font-size: 14px;
        }

        @media (max-width: 1180px) {
          .produto-card {
            grid-template-columns: 1fr;
          }

          .imagem-principal {
            min-height: 460px;
          }

          .sem-imagem {
            min-height: 460px;
          }
        }

        @media (max-width: 768px) {
          .produto-visualizar-page {
            padding: 14px 10px 42px;
          }

          .produto-card {
            padding: 14px;
            border-radius: 24px;
            gap: 22px;
          }

          .galeria-layout {
            grid-template-columns: 1fr;
          }

          .miniaturas {
            order: 2;
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
            max-height: unset;
            padding-right: 0;
            padding-bottom: 5px;
          }

          .miniatura,
          .miniatura-vazia {
            min-width: 74px;
            width: 74px;
            height: 74px;
            border-radius: 14px;
          }

          .imagem-principal,
          .sem-imagem {
            min-height: 300px;
            border-radius: 20px;
          }

          .produto-info h1 {
            font-size: 1.9rem;
          }

          .info-grid div {
            width: 100%;
          }

          .acoes {
            flex-direction: column;
          }

          .beneficios {
            grid-template-columns: 1fr;
          }

          .toast-notificacao {
            top: 10px;
            right: 10px;
            left: 10px;
            width: auto;
          }
        }

        @media (max-width: 420px) {
          .imagem-principal,
          .sem-imagem {
            min-height: 250px;
          }

          .preco-final {
            font-size: 1.9rem;
          }

          .btn-favorito {
            width: 46px;
            height: 46px;
          }
        }
      `}</style>
    </>
  );
}