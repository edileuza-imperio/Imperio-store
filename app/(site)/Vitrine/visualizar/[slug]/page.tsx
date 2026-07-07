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

    // Formato brasileiro: 1.234,56
    if (ultimaVirgula > ultimoPonto) {
      normalizado = texto.replace(/\./g, "").replace(",", ".");
    } else {
      // Formato americano/API: 1,234.56
      normalizado = texto.replace(/,/g, "");
    }
  } else if (temVirgula) {
    const partes = texto.split(",");
    const decimal = partes[partes.length - 1] || "";

    // 39,90 vira 39.90 | 1,234 vira 1234
    normalizado =
      decimal.length <= 2
        ? texto.replace(/\./g, "").replace(",", ".")
        : texto.replace(/,/g, "");
  } else if (temPonto) {
    const partes = texto.split(".");
    const decimal = partes[partes.length - 1] || "";

    if (partes.length > 2) {
      // 1.234.567, caso sem vírgula
      normalizado =
        decimal.length <= 2
          ? `${partes.slice(0, -1).join("")}.${decimal}`
          : texto.replace(/\./g, "");
    } else {
      // Importante: 39.00 vindo da API deve continuar 39.00,
      // não pode virar 3900.
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

function calcularDesconto(
  preco?: number | string | null,
  precoPromocional?: number | string | null
) {
  const original = normalizarNumero(preco);
  const promocional = normalizarNumero(precoPromocional);

  if (!original || !promocional || promocional >= original) return null;

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
      } catch {
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

      if (timerRedirecionamento.current) {
        window.clearTimeout(timerRedirecionamento.current);
      }
    };
  }, [slug]);

  const galeria = useMemo(() => montarGaleria(produto), [produto]);

  useEffect(() => {
    setImagemSelecionada(galeria[0] || "");
  }, [galeria]);

  const produtoId = Number(produto?.id || produto?.id_produto || 0);
  const precoProduto = normalizarNumero(produto?.preco);
  const precoPromocional = normalizarNumero(produto?.preco_promocional);
  const temPromocao = precoPromocional > 0 && precoPromocional < precoProduto;
  const precoFinal = temPromocao ? produto?.preco_promocional : produto?.preco || null;
  const precoOriginal = temPromocao ? produto?.preco : null;
  const desconto = calcularDesconto(produto?.preco, produto?.preco_promocional);
  const nomeProduto = produto?.nome || produto?.titulo || "Produto sem nome";

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
                      <span className="pv-old-price">
                        De {formatarPreco(precoOriginal)}
                      </span>
                    )}

                    {precoFinal ? (
                      <strong className="pv-price">{formatarPreco(precoFinal)}</strong>
                    ) : (
                      <strong className="pv-price pv-price-small">Consultar preço</strong>
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