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

type ApiResposta<T> = {
  status: number;
  mensagem: string;
  dados: T;
};

type ProdutoPayload = {
  produto?: Produto;
};

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
  preco_numero?: number | string;
  preco_formatado?: string | null;
  preco_promocional?: number | string | null;
  preco_promocional_numero?: number | string | null;
  preco_promocional_formatado?: string | null;
  preco_final?: number | string | null;
  preco_final_formatado?: string | null;
  tem_promocao?: boolean;
  sku?: string;
  marca?: string;
  disponivel?: number | string;
  esgotado?: boolean;
};

type Notificacao = {
  tipo: "sucesso" | "erro";
  texto: string;
};

function extrairProduto(payload: ApiResposta<ProdutoPayload>): Produto | null {
  return payload?.dados?.produto || null;
}

function normalizarNumero(valor?: number | string | null) {
  if (valor === null || valor === undefined || valor === "") return 0;

  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  const texto = String(valor)
    .trim()
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .replace(/[^\d,.-]/g, "");

  if (!texto) return 0;

  const temVirgula = texto.includes(",");
  const temPonto = texto.includes(".");

  let normalizado = texto;

  if (temVirgula && temPonto) {
    const ultimaVirgula = texto.lastIndexOf(",");
    const ultimoPonto = texto.lastIndexOf(".");

    normalizado =
      ultimaVirgula > ultimoPonto
        ? texto.replace(/\./g, "").replace(",", ".")
        : texto.replace(/,/g, "");
  } else if (temVirgula) {
    const partes = texto.split(",");
    const decimal = partes[partes.length - 1] || "";

    normalizado =
      decimal.length <= 2
        ? texto.replace(/\./g, "").replace(",", ".")
        : texto.replace(/,/g, "");
  } else if (temPonto) {
    const partes = texto.split(".");
    const decimal = partes[partes.length - 1] || "";

    if (partes.length > 2) {
      normalizado =
        decimal.length <= 2
          ? `${partes.slice(0, -1).join("")}.${decimal}`
          : texto.replace(/\./g, "");
    } else {
      normalizado = decimal.length <= 2 ? texto : texto.replace(/\./g, "");
    }
  }

  const numero = Number(normalizado);

  return Number.isFinite(numero) ? numero : 0;
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
  const numero = normalizarNumero(valor);

  if (numero <= 0) return null;

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function precoFinalFormatado(produto: Produto) {
  return (
    produto.preco_final_formatado ||
    produto.preco_promocional_formatado ||
    produto.preco_formatado ||
    formatarPreco(produto.preco_final ?? produto.preco_promocional ?? produto.preco)
  );
}

function precoOriginalFormatado(produto: Produto) {
  if (!produto.tem_promocao) return null;

  return produto.preco_formatado || formatarPreco(produto.preco);
}

function calcularDesconto(produto: Produto) {
  const original = normalizarNumero(produto.preco_numero ?? produto.preco);
  const final = normalizarNumero(produto.preco_final ?? produto.preco_promocional);

  if (!original || !final || final >= original) return null;

  return Math.round(((original - final) / original) * 100);
}

function extrairMensagemErro(error: unknown, fallback = "Ocorreu um erro.") {
  if (typeof error === "string") return error;

  if (error && typeof error === "object") {
    const anyError = error as any;
    const data = anyError?.response?.data;

    return (
      data?.dados?.erro ||
      data?.dados?.mensagem ||
      data?.erro ||
      data?.mensagem ||
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

        const response = await api.get<ApiResposta<ProdutoPayload>>(
          `/produto/slug/${slug}`
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
        if (!ativo) return;
        setErro(extrairMensagemErro(error, "Não foi possível carregar o produto."));
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
  const precoFinal = produto ? precoFinalFormatado(produto) : null;
  const precoOriginal = produto ? precoOriginalFormatado(produto) : null;
  const desconto = produto ? calcularDesconto(produto) : null;
  const esgotado = Boolean(produto?.esgotado) || Number(produto?.disponivel ?? 1) <= 0;

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
            notificacao.tipo === "sucesso" ? "pv-toast-success" : "pv-toast-error"
          }`}
        >
          <div className="pv-toast-content">
            {notificacao.tipo === "sucesso" ? <FiCheckCircle /> : <FiAlertCircle />}
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

                {desconto && <span className="pv-discount">-{desconto}% OFF</span>}
              </div>

              <div className="pv-main-image-card">
                <button
                  type="button"
                  className={`pv-favorite ${favoritado ? "pv-favorite-active" : ""}`}
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

                  <span className="pv-price-note">
                    {esgotado ? "Produto esgotado" : "Oferta da vitrine"}
                  </span>
                </div>

                <div className="pv-actions">
                  <button
                    type="button"
                    className="pv-btn pv-btn-secondary"
                    onClick={handleAdicionarCarrinho}
                    disabled={
                      loadingCarrinho || loadingComprar || !produtoId || esgotado
                    }
                  >
                    <FiShoppingCart />
                    {loadingCarrinho ? "Adicionando..." : "Adicionar"}
                  </button>

                  <button
                    type="button"
                    className="pv-btn pv-btn-primary"
                    onClick={handleComprarAgora}
                    disabled={
                      loadingComprar || loadingCarrinho || !produtoId || esgotado
                    }
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