"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

import api from "@/Api/conectar";
import { imagemFundo } from "@/components/Bibioteca/imagem";
import { useVitrine } from "./useVitrine";
import styles from "./ProdutoVitrine.module.css";

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
    irParaLogin,
    irParaCarrinho,
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

  const produtoId = Number(produto?.id || produto?.id_produto);
  const precoFinal = produto?.preco_promocional || produto?.preco || null;
  const precoOriginal = produto?.preco_promocional ? produto?.preco : null;
  const desconto = calcularDesconto(produto?.preco, produto?.preco_promocional);

  async function handleAdicionarCarrinho() {
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
    try {
      await comprarAgora(produtoId, 1);

      mostrarNotificacao(
        "Produto adicionado. Redirecionando para o carrinho...",
        "sucesso"
      );

      redirecionarDepois(() => {
        irParaCarrinho();
      });
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
    <section className={styles.produtoVisualizarPage}>
      <div className={`${styles.bgDecor} ${styles.bgDecorTop}`} />
      <div className={`${styles.bgDecor} ${styles.bgDecorBottom}`} />

      {notificacao && (
        <div
          className={`${styles.toastNotificacao} ${
            notificacao.tipo === "sucesso"
              ? styles.toastSucesso
              : styles.toastErro
          }`}
        >
          <div className={styles.toastConteudo}>
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

      <div className={styles.containerProduto}>
        {loading ? (
          <div className={styles.estadoBox}>
            <div className={styles.estadoCard}>Carregando produto...</div>
          </div>
        ) : erro ? (
          <div className={styles.estadoBox}>
            <div className={`${styles.estadoCard} ${styles.erro}`}>{erro}</div>
          </div>
        ) : !produto ? (
          <div className={styles.estadoBox}>
            <div className={styles.estadoCard}>Produto não encontrado.</div>
          </div>
        ) : (
          <div className={styles.produtoCard}>
            <div className={styles.produtoGaleria}>
              {desconto && (
                <span className={styles.tagDesconto}>-{desconto}% OFF</span>
              )}

              <button
                type="button"
                className={`${styles.btnFavorito} ${
                  favoritado ? styles.ativo : ""
                }`}
                onClick={handleFavoritar}
                aria-label="Favoritar produto"
              >
                <FiHeart />
              </button>

              <div className={styles.galeriaLayout}>
                <div className={styles.miniaturas}>
                  {galeria.length > 0 ? (
                    galeria.map((imagem, index) => (
                      <button
                        type="button"
                        key={`${imagem}-${index}`}
                        className={`${styles.miniatura} ${
                          imagemSelecionada === imagem ? styles.ativa : ""
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
                    <div className={styles.miniaturaVazia}>Sem imagem</div>
                  )}
                </div>

                <div className={styles.imagemPrincipal}>
                  {imagemSelecionada ? (
                    <Image
                      src={imagemSelecionada}
                      alt={produto.nome || produto.titulo || "Produto"}
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 560px"
                    />
                  ) : (
                    <div className={styles.semImagem}>Sem imagem disponível</div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.produtoInfo}>
              <span className={styles.selo}>Produto em destaque</span>

              <h1>{produto.nome || produto.titulo || "Produto sem nome"}</h1>

              {produto.subtitulo && (
                <p className={styles.subtitulo}>{produto.subtitulo}</p>
              )}

              <div className={styles.infoGrid}>
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

              <div className={styles.precoBox}>
                {precoOriginal && (
                  <span className={styles.precoOriginal}>
                    De {formatarPreco(precoOriginal)}
                  </span>
                )}

                {precoFinal && (
                  <strong className={styles.precoFinal}>
                    {formatarPreco(precoFinal)}
                  </strong>
                )}

                <p>Oferta especial disponível na vitrine.</p>
              </div>

              <div className={styles.acoes}>
                <button
                  type="button"
                  className={styles.btnCarrinho}
                  onClick={handleAdicionarCarrinho}
                  disabled={loadingCarrinho || loadingComprar}
                >
                  <FiShoppingCart />
                  {loadingCarrinho ? "Adicionando..." : "Adicionar ao carrinho"}
                </button>

                <button
                  type="button"
                  className={styles.btnComprar}
                  onClick={handleComprarAgora}
                  disabled={loadingComprar || loadingCarrinho}
                >
                  <FiCreditCard />
                  {loadingComprar ? "Processando..." : "Comprar agora"}
                </button>
              </div>

              {(produto.descricao_curta || produto.descricao) && (
                <div className={styles.descricao}>
                  <h2>Descrição do produto</h2>
                  <p>{produto.descricao_curta || produto.descricao}</p>
                </div>
              )}

              <div className={styles.beneficios}>
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

              <div className={styles.destaque}>
                <FiStar />
                <span>Produto selecionado com carinho para você.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}