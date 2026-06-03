"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/Api/conectar";

import { imagemFundo } from "@/components/Bibioteca/imagem";
import { useCarrinho } from "./useCarrinho";

import { FiHeart } from "react-icons/fi";
import { FiShoppingCart } from "react-icons/fi";
import { FiCreditCard } from "react-icons/fi";
import { FiShield } from "react-icons/fi";
import { FiTruck } from "react-icons/fi";
import { FiRefreshCcw } from "react-icons/fi";
import { FiStar } from "react-icons/fi";
import { FiCheckCircle, FiAlertCircle, FiX } from "react-icons/fi";

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
  const imagensBrutas = [
    produto?.miniatura,
    produto?.imagem,
    produto?.foto,
    produto?.banner,
    produto?.desktop,
    produto?.mobile,
  ];

  const imagensResolvidas = imagensBrutas.map(imagemFundo).filter(Boolean);

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
    preco === null ||
    preco === undefined ||
    preco === "" ||
    precoPromocional === null ||
    precoPromocional === undefined ||
    precoPromocional === "" ||
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
  const router = useRouter();

  const slug = useMemo(() => {
    const valor = params?.slug;
    return Array.isArray(valor) ? valor[0] : valor;
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [produto, setProduto] = useState<Produto | null>(null);
  const [favoritado, setFavoritado] = useState(false);
  const [imagemSelecionada, setImagemSelecionada] = useState("");
  const [adicionandoCarrinho, setAdicionandoCarrinho] = useState(false);
  const [notificacao, setNotificacao] = useState<Notificacao | null>(null);

  const timerNotificacao = useRef<number | null>(null);
  const timerRedirecionamento = useRef<number | null>(null);

  const { adicionarProduto } = useCarrinho();

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
    }

    return () => {
      ativo = false;

      if (timerNotificacao.current) {
        window.clearTimeout(timerNotificacao.current);
      }

      if (timerRedirecionamento.current) {
        window.clearTimeout(timerRedirecionamento.current);
      }
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

  async function handleAdicionarCarrinho() {
    const produtoId = Number(produto?.id || produto?.id_produto);

    if (!produtoId || Number.isNaN(produtoId)) {
      mostrarNotificacao("Produto inválido para adicionar ao carrinho.", "erro");
      return;
    }

    try {
      setAdicionandoCarrinho(true);

      const resultado = await adicionarProduto(produtoId, 1);

      mostrarNotificacao(
        resultado?.mensagem || "Produto adicionado ao carrinho. Redirecionando...",
        "sucesso"
      );

      if (timerRedirecionamento.current) {
        window.clearTimeout(timerRedirecionamento.current);
      }

      timerRedirecionamento.current = window.setTimeout(() => {
        router.push("/carrinho");
      }, 900);
    } catch (error) {
      console.error("Erro ao adicionar no carrinho:", error);
      mostrarNotificacao(
        extrairMensagemErro(
          error,
          "Não foi possível adicionar o produto ao carrinho."
        ),
        "erro"
      );
    } finally {
      setAdicionandoCarrinho(false);
    }
  }

  function handleComprarAgora() {
    mostrarNotificacao("Função de comprar agora ainda não foi ligada.", "sucesso");
    console.log("Comprar agora:", produto);
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
            role="status"
            aria-live="polite"
          >
            <div className="toast-conteudo">
              {notificacao.tipo === "sucesso" ? (
                <FiCheckCircle className="toast-icon" />
              ) : (
                <FiAlertCircle className="toast-icon" />
              )}

              <span>{notificacao.texto}</span>
            </div>

            <button
              type="button"
              className="toast-fechar"
              onClick={() => setNotificacao(null)}
              aria-label="Fechar mensagem"
            >
              <FiX />
            </button>
          </div>
        )}

        <div className="container-produto">
          {loading ? (
            <div className="estado-box">
              <div className="estado-card estado-animado">Carregando produto...</div>
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
                  aria-label={
                    favoritado ? "Remover dos favoritos" : "Adicionar aos favoritos"
                  }
                  title={
                    favoritado ? "Remover dos favoritos" : "Adicionar aos favoritos"
                  }
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
                          aria-label={`Ver imagem ${index + 1}`}
                        >
                          <img
                            src={imagem}
                            alt={`${produto.nome || produto.titulo || "Produto"} ${
                              index + 1
                            }`}
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
                    disabled={adicionandoCarrinho}
                  >
                    <FiShoppingCart className="btn-icon" />
                    <span>
                      {adicionandoCarrinho
                        ? "Adicionando..."
                        : "Adicionar ao carrinho"}
                    </span>
                  </button>

                  <button type="button" className="btn-comprar" onClick={handleComprarAgora}>
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
          background:
            radial-gradient(circle at top left, rgba(201, 122, 141, 0.12), transparent 30%),
            radial-gradient(circle at bottom right, rgba(232, 201, 187, 0.18), transparent 30%),
            linear-gradient(180deg, #fffaf4 0%, #fff4ec 48%, #fdf0e8 100%);
          overflow: hidden;
        }

        .bg-decor {
          position: absolute;
          border-radius: 999px;
          filter: blur(12px);
          opacity: 0.5;
          pointer-events: none;
        }

        .bg-decor-top {
          width: 320px;
          height: 320px;
          top: -100px;
          right: -100px;
          background: radial-gradient(circle, rgba(201, 122, 141, 0.55) 0%, transparent 72%);
          animation: flutuar 12s ease-in-out infinite;
        }

        .bg-decor-bottom {
          width: 360px;
          height: 360px;
          bottom: -140px;
          left: -120px;
          background: radial-gradient(circle, rgba(232, 201, 187, 0.7) 0%, transparent 72%);
          animation: flutuar 14s ease-in-out infinite reverse;
        }

        .container-produto {
          position: relative;
          z-index: 2;
          max-width: 1280px;
          margin: 0 auto;
        }

        .toast-notificacao {
          position: fixed;
          right: 18px;
          top: 18px;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          width: min(420px, calc(100vw - 24px));
          padding: 14px 16px;
          border-radius: 18px;
          backdrop-filter: blur(12px);
          box-shadow: 0 18px 40px rgba(120, 78, 91, 0.16);
          animation: toastEntrar 0.28s ease-out;
        }

        .toast-sucesso {
          background: rgba(236, 248, 240, 0.95);
          border: 1px solid rgba(62, 150, 86, 0.18);
          color: #2f6a41;
        }

        .toast-erro {
          background: rgba(255, 240, 241, 0.95);
          border: 1px solid rgba(203, 84, 96, 0.18);
          color: #9c3140;
        }

        .toast-conteudo {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          font-size: 14px;
          font-weight: 700;
        }

        .toast-conteudo span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .toast-icon {
          flex-shrink: 0;
          font-size: 18px;
        }

        .toast-fechar {
          border: none;
          background: transparent;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: inherit;
          opacity: 0.75;
        }

        .toast-fechar:hover {
          opacity: 1;
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

        .estado-animado {
          animation: pulseCard 1.2s ease-in-out infinite;
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
          animation: aparecer 0.45s ease both;
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
          animation: badgePulse 1.8s ease-in-out infinite;
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
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            background 0.25s ease,
            color 0.25s ease;
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
          height: 6px;
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
          transition:
            transform 0.22s ease,
            border-color 0.22s ease,
            box-shadow 0.22s ease;
        }

        .miniatura-item:hover {
          transform: translateY(-2px) scale(1.02);
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
          animation: imagemEntrar 0.55s ease both;
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
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            background 0.25s ease,
            opacity 0.25s ease;
          font-size: 15px;
        }

        .btn-principal:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        .btn-icon {
          font-size: 18px;
        }

        .btn-principal {
          background: linear-gradient(135deg, #b85d73 0%, #955163 100%);
          color: #fffaf7;
          box-shadow: 0 16px 32px rgba(154, 84, 101, 0.22);
        }

        .btn-principal:hover:not(:disabled) {
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

        @keyframes aparecer {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes toastEntrar {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes pulseCard {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.01);
            opacity: 1;
          }
        }

        @keyframes flutuar {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, 14px, 0);
          }
        }

        @keyframes imagemEntrar {
          from {
            opacity: 0;
            transform: scale(1.02);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes badgePulse {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-1px);
          }
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
            padding: 14px 10px 40px;
          }

          .toast-notificacao {
            top: 10px;
            right: 10px;
            left: 10px;
            width: auto;
            border-radius: 16px;
          }

          .produto-hero-card {
            padding: 14px;
            border-radius: 22px;
            gap: 20px;
          }

          .produto-titulo {
            font-size: 1.9rem;
            line-height: 1.05;
          }

          .produto-subtitulo {
            font-size: 0.98rem;
            line-height: 1.7;
          }

          .btn-favorito-flutuante {
            top: 12px;
            right: 12px;
            width: 46px;
            height: 46px;
          }

          .galeria-layout {
            grid-template-columns: 1fr;
            gap: 12px;
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
            min-width: 74px;
            width: 74px;
            height: 74px;
            flex-shrink: 0;
            border-radius: 14px;
          }

          .imagem-principal-wrap,
          .imagem-principal,
          .sem-imagem {
            min-height: 290px;
            border-radius: 18px;
          }

          .imagem-principal {
            object-fit: cover;
          }

          .mini-info-imagem {
            gap: 8px;
          }

          .mini-info-pill {
            width: 100%;
            justify-content: center;
            font-size: 12px;
          }

          .linha-info {
            gap: 10px;
          }

          .info-pill {
            width: 100%;
            min-width: 0;
          }

          .bloco-preco {
            padding: 18px;
            border-radius: 20px;
          }

          .preco-final {
            font-size: 2rem;
          }

          .acoes-produto {
            flex-direction: column;
            gap: 10px;
          }

          .btn-principal,
          .btn-comprar {
            width: 100%;
            min-height: 52px;
          }

          .bloco-descricao {
            padding: 18px;
          }

          .beneficio-card {
            padding: 16px;
            border-radius: 18px;
          }
        }

        @media (max-width: 420px) {
          .produto-hero-card {
            padding: 12px;
          }

          .produto-titulo {
            font-size: 1.7rem;
          }

          .preco-final {
            font-size: 1.85rem;
          }

          .miniatura-item {
            min-width: 68px;
            width: 68px;
            height: 68px;
          }

          .imagem-principal-wrap,
          .imagem-principal,
          .sem-imagem {
            min-height: 250px;
          }

          .selo-vitrine,
          .tag-desconto {
            font-size: 11px;
          }
        }
      `}</style>
    </>
  );
}