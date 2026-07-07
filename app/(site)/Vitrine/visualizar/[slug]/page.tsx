"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

import api from "@/Api/conectar";
import { imagemFundo } from "@/components/Bibioteca/imagem";
import { useVitrine } from "./useVitrine";
import "./ProdutoVitrine.css";

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
  sku?: string;
  marca?: string;

  preco?: number | string;
  preco_promocional?: number | string;

  preco_numero?: number;
  preco_formatado?: string;
  preco_promocional_numero?: number | null;
  preco_promocional_formatado?: string | null;
  tem_promocao?: boolean;
  preco_final?: number;
  preco_final_formatado?: string;
};

type ApiRespostaProduto = {
  status?: number;
  mensagem?: string;
  dados?: {
    produto?: Produto | null;
  };
};

type Notificacao = {
  tipo: "sucesso" | "erro";
  texto: string;
};

function extrairProduto(payload: ApiRespostaProduto): Produto | null {
  return payload?.dados?.produto ?? null;
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

function calcularDescontoBackend(produto?: Produto | null) {
  if (!produto?.tem_promocao) return null;

  const precoOriginal = Number(produto.preco_numero || 0);
  const precoFinal = Number(produto.preco_final || 0);

  if (!precoOriginal || !precoFinal || precoFinal >= precoOriginal) {
    return null;
  }

  return Math.round(((precoOriginal - precoFinal) / precoOriginal) * 100);
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
    irParaLogin,
  } = useVitrine();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [produto, setProduto] = useState<Produto | null>(null);
  const [favoritado, setFavoritado] = useState(false);
  const [imagemSelecionada, setImagemSelecionada] = useState("");
  const [notificacao, setNotificacao] = useState<Notificacao | null>(null);

  const timerNotificacao = useRef<number | null>(null);
  const timerRedirecionamento = useRef<number | null>(null);

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
    }, 3500);
  }

  function redirecionarDepois(callback: () => void, tempo = 1600) {
    if (timerRedirecionamento.current) {
      window.clearTimeout(timerRedirecionamento.current);
    }

    timerRedirecionamento.current = window.setTimeout(() => {
      callback();
    }, tempo);
  }

  function verificarLoginMensagem(mensagem: string) {
    if (mensagem.toLowerCase().includes("login")) {
      mostrarNotificacao(
        "Você precisa entrar na sua conta. Redirecionando...",
        "erro"
      );

      redirecionarDepois(() => {
        irParaLogin();
      });

      return true;
    }

    return false;
  }

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setLoading(true);
        setErro("");

        const response = await api.get<ApiRespostaProduto>(
          `/produto/slug/${slug}`,
          {
            withCredentials: true,
          }
        );

        const produtoData = extrairProduto(response.data);

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
        if (ativo) {
          setLoading(false);
        }
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

      if (timerRedirecionamento.current) {
        window.clearTimeout(timerRedirecionamento.current);
      }
    };
  }, [slug]);

  const galeria = useMemo(() => montarGaleria(produto), [produto]);

  useEffect(() => {
    setImagemSelecionada(galeria[0] || "");
  }, [galeria]);

  const produtoId = Number(produto?.id_produto || produto?.id || 0);
  const nomeProduto = produto?.nome || produto?.titulo || "Produto sem nome";

  const temPromocao = Boolean(produto?.tem_promocao);

  const precoFinal =
    produto?.preco_final_formatado || produto?.preco_formatado || null;

  const precoOriginal = temPromocao
    ? produto?.preco_formatado || null
    : null;

  const desconto = calcularDescontoBackend(produto);

  async function handleAdicionarCarrinho() {
    if (!produtoId) {
      mostrarNotificacao("Não foi possível identificar o produto.", "erro");
      return;
    }

    try {
      const resultado = await adicionarAoCarrinho(produtoId, 1);

      mostrarNotificacao(
        resultado?.mensagem || "Produto adicionado ao carrinho com sucesso.",
        "sucesso"
      );
    } catch (error) {
      const mensagem = extrairMensagemErro(
        error,
        "Não foi possível adicionar ao carrinho."
      );

      if (!verificarLoginMensagem(mensagem)) {
        mostrarNotificacao(mensagem, "erro");
      }
    }
  }

  async function handleComprarAgora() {
    if (!produtoId) {
      mostrarNotificacao("Não foi possível identificar o produto.", "erro");
      return;
    }

    try {
      await comprarAgora(produtoId, 1);

      mostrarNotificacao(
        "Produto adicionado ao carrinho. Você pode continuar comprando ou finalizar pelo carrinho.",
        "sucesso"
      );
    } catch (error) {
      const mensagem = extrairMensagemErro(
        error,
        "Não foi possível comprar agora."
      );

      if (!verificarLoginMensagem(mensagem)) {
        mostrarNotificacao(mensagem, "erro");
      }
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
    <section className="pv-page">
      {notificacao && (
        <div
          className={`pv-toast ${
            notificacao.tipo === "sucesso"
              ? "pv-toast-success"
              : "pv-toast-error"
          }`}
        >
          <div className="pv-toast-content">
            {notificacao.tipo === "sucesso" ? (
              <FiCheckCircle />
            ) : (
              <FiAlertCircle />
            )}

            <span>{notificacao.texto}</span>
          </div>

          <button
            type="button"
            onClick={() => setNotificacao(null)}
            aria-label="Fechar mensagem"
          >
            <FiX />
          </button>
        </div>
      )}

      <div className="pv-container">
        {loading ? (
          <div className="pv-state">
            <div className="pv-state-card">Carregando produto...</div>
          </div>
        ) : erro ? (
          <div className="pv-state">
            <div className="pv-state-card pv-state-error">{erro}</div>
          </div>
        ) : !produto ? (
          <div className="pv-state">
            <div className="pv-state-card">Produto não encontrado.</div>
          </div>
        ) : (
          <article className="pv-shell">
            <div className="pv-gallery-panel">
              <div className="pv-gallery-head">
                <span className="pv-eyebrow">Universo Império</span>

                {desconto && (
                  <span className="pv-discount">-{desconto}% OFF</span>
                )}
              </div>

              <div className="pv-main-image-card">
                <button
                  type="button"
                  className={`pv-favorite ${
                    favoritado ? "pv-favorite-active" : ""
                  }`}
                  onClick={handleFavoritar}
                  aria-label="Favoritar produto"
                >
                  <FiHeart />
                </button>

                {imagemSelecionada ? (
                  <Image
                    src={imagemSelecionada}
                    alt={nomeProduto}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 620px"
                    className="pv-main-image"
                  />
                ) : (
                  <div className="pv-no-image">Sem imagem disponível</div>
                )}
              </div>

              <div className="pv-thumbs" aria-label="Galeria do produto">
                {galeria.length > 0 ? (
                  galeria.map((imagem, index) => (
                    <button
                      type="button"
                      key={`${imagem}-${index}`}
                      className={`pv-thumb ${
                        imagemSelecionada === imagem ? "pv-thumb-active" : ""
                      }`}
                      onClick={() => setImagemSelecionada(imagem)}
                      aria-label={`Visualizar imagem ${index + 1}`}
                    >
                      <Image
                        src={imagem}
                        alt={`${nomeProduto} ${index + 1}`}
                        fill
                        sizes="86px"
                      />
                    </button>
                  ))
                ) : (
                  <div className="pv-thumb-empty">Sem imagem</div>
                )}
              </div>
            </div>

            <div className="pv-info-panel">
              <div className="pv-title-block">
                <span className="pv-kicker">
                  <FiStar /> Produto selecionado
                </span>

                <h1>{nomeProduto}</h1>

                {produto.subtitulo && (
                  <p className="pv-subtitle">{produto.subtitulo}</p>
                )}
              </div>

              <div className="pv-meta-list">
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
                  <span>Fotos</span>
                  <strong>{galeria.length || 0}</strong>
                </div>
              </div>

              <div className="pv-buy-box">
                <div className="pv-price-row">
                  <div>
                    {precoOriginal && (
                      <span className="pv-old-price">De {precoOriginal}</span>
                    )}

                    {precoFinal ? (
                      <strong className="pv-price">{precoFinal}</strong>
                    ) : (
                      <strong className="pv-price pv-price-small">
                        Consultar preço
                      </strong>
                    )}
                  </div>

                  <span className="pv-price-note">Oferta da vitrine</span>
                </div>

                <div className="pv-actions">
                  <button
                    type="button"
                    className="pv-btn pv-btn-secondary"
                    onClick={handleAdicionarCarrinho}
                    disabled={loadingCarrinho || loadingComprar || !produtoId}
                  >
                    <FiShoppingCart />
                    {loadingCarrinho ? "Adicionando..." : "Adicionar"}
                  </button>

                  <button
                    type="button"
                    className="pv-btn pv-btn-primary"
                    onClick={handleComprarAgora}
                    disabled={loadingComprar || loadingCarrinho || !produtoId}
                  >
                    <FiCreditCard />
                    {loadingComprar ? "Processando..." : "Comprar agora"}
                  </button>
                </div>
              </div>

              {(produto.descricao_curta || produto.descricao) && (
                <div className="pv-description">
                  <h2>Sobre o produto</h2>
                  <p>{produto.descricao_curta || produto.descricao}</p>
                </div>
              )}

              <div className="pv-benefits">
                <div>
                  <FiTruck />
                  <span>
                    <strong>Entrega rápida</strong>
                    <small>Pedido com acompanhamento.</small>
                  </span>
                </div>

                <div>
                  <FiShield />
                  <span>
                    <strong>Compra segura</strong>
                    <small>Ambiente protegido.</small>
                  </span>
                </div>

                <div>
                  <FiRefreshCcw />
                  <span>
                    <strong>Suporte</strong>
                    <small>Atendimento pós-venda.</small>
                  </span>
                </div>
              </div>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}