"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import api from "@/Api/conectar";
import styles from "./page.module.css";

import {
  FiArrowLeft,
  FiShoppingCart,
  FiTruck,
  FiShield,
  FiCreditCard,
  FiCheckCircle,
  FiHeart,
  FiStar,
  FiImage,
  FiChevronRight,
} from "react-icons/fi";

import { toast } from "react-toastify";

interface Produto {
  id_produto?: number;
  nome?: string;
  slug?: string;
  descricao?: string;
  descricao_curta?: string;
  imagem?: string;
  miniatura?: string;
  banner?: string;
  desktop?: string;
  mobile?: string;
  foto?: string;
  fotos?: string[];
  imagens?: string[];
  preco?: number;
  preco_promocional?: number;
  estoque?: number;
  categoria_nome?: string;
  marca?: string;
}

function normalizar(payload: any) {
  return payload?.dados?.dados ?? payload?.dados ?? payload ?? null;
}

function resolverImagem(src?: string | null) {
  if (!src) return "";

  const valor = String(src).trim();
  if (!valor) return "";

  if (
    valor.startsWith("http://") ||
    valor.startsWith("https://") ||
    valor.startsWith("data:image")
  ) {
    return valor;
  }

  const baseURL =
    typeof api === "string" ? api : (api as any)?.defaults?.baseURL || "";

  if (!baseURL) return valor;

  if (valor.startsWith("/")) {
    return `${baseURL}${valor}`;
  }

  return `${baseURL}/${valor}`;
}

function formatarPreco(valor?: number | null) {
  if (valor === undefined || valor === null) return null;

  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ViewProdutoSlugPage() {
  const params = useParams();
  const slug = String(params?.slug || "").trim();

  const [loading, setLoading] = useState(true);
  const [produto, setProduto] = useState<Produto | null>(null);
  const [adicionando, setAdicionando] = useState(false);
  const [imagemAtiva, setImagemAtiva] = useState("");

  async function carregarProduto() {
    try {
      setLoading(true);

      const response = await api.get(`/produto/slug/${slug}`, {
        withCredentials: true,
      });

      const dados = normalizar(response?.data);
      setProduto(dados);
    } catch (error) {
      console.error("Erro ao carregar produto:", error);
      toast.error("Não foi possível carregar o produto.");
      setProduto(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (slug) {
      carregarProduto();
    }
  }, [slug]);

  const imagens = useMemo(() => {
    if (!produto) return [];

    const listaBase = [
      produto.imagem,
      produto.miniatura,
      produto.banner,
      produto.desktop,
      produto.mobile,
      produto.foto,
      ...(Array.isArray(produto.imagens) ? produto.imagens : []),
      ...(Array.isArray(produto.fotos) ? produto.fotos : []),
    ];

    const resolvidas = listaBase
      .map((src) => resolverImagem(src || ""))
      .filter(Boolean);

    return Array.from(new Set(resolvidas));
  }, [produto]);

  useEffect(() => {
    if (imagens.length > 0) {
      setImagemAtiva(imagens[0]);
    } else {
      setImagemAtiva("");
    }
  }, [imagens]);

  async function adicionarCarrinho() {
    if (!produto?.id_produto) {
      toast.error("Produto inválido.");
      return;
    }

    try {
      setAdicionando(true);

      await api.post(
        "/carrinho/adicionar",
        {
          produto_id: produto.id_produto,
          quantidade: 1,
        },
        {
          withCredentials: true,
        }
      );

      toast.success("Produto adicionado ao carrinho.");
    } catch (error: any) {
      console.error("Erro ao adicionar:", error);

      const mensagem =
        error?.response?.data?.erro ||
        error?.response?.data?.mensagem ||
        "Não foi possível adicionar o produto.";

      toast.error(mensagem);
    } finally {
      setAdicionando(false);
    }
  }

  if (loading) {
    return <div className={styles.loading}>Carregando produto...</div>;
  }

  if (!produto) {
    return <div className={styles.loading}>Produto não encontrado.</div>;
  }

  const precoPromocional = produto.preco_promocional || null;
  const precoOriginal = produto.preco || null;
  const precoFinal = precoPromocional || precoOriginal || 0;
  const temDesconto = Boolean(precoPromocional && precoOriginal);
  const emEstoque =
    typeof produto.estoque === "number" ? produto.estoque > 0 : null;

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <div className={styles.topbar}>
          <Link href="/" className={styles.voltar}>
            <FiArrowLeft />
            <span>Voltar para loja</span>
          </Link>

          <nav className={styles.breadcrumb}>
            <Link href="/">Home</Link>
            <FiChevronRight />
            <span>{produto.categoria_nome || "Produto"}</span>
            <FiChevronRight />
            <strong>{produto.nome}</strong>
          </nav>
        </div>

        <div className={styles.grid}>
          <div className={styles.galeria}>
            {imagens.length > 1 && (
              <div className={styles.miniaturasVertical}>
                {imagens.map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    type="button"
                    className={`${styles.miniatura} ${
                      imagemAtiva === img ? styles.miniaturaAtiva : ""
                    }`}
                    onClick={() => setImagemAtiva(img)}
                    aria-label={`Ver imagem ${index + 1}`}
                  >
                    <Image
                      src={img}
                      alt={`Miniatura ${index + 1}`}
                      width={96}
                      height={96}
                      className={styles.miniaturaImagem}
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}

            <div className={styles.imagemContainer}>
              <div className={styles.badge}>Destaque</div>

              <div className={styles.imagem}>
                {imagemAtiva ? (
                  <Image
                    src={imagemAtiva}
                    alt={produto.nome || "Produto"}
                    fill
                    className={styles.imagemPrincipal}
                    sizes="(max-width: 1100px) 100vw, 55vw"
                    unoptimized
                    priority
                  />
                ) : (
                  <div className={styles.semImagem}>
                    <FiImage />
                    <span>Sem imagem disponível</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.info}>
            <div className={styles.metaRow}>
              {produto.categoria_nome && (
                <span className={styles.categoria}>{produto.categoria_nome}</span>
              )}

              {produto.marca && <span className={styles.marca}>{produto.marca}</span>}
            </div>

            <h1 className={styles.titulo}>{produto.nome}</h1>

            {produto.descricao_curta && (
              <p className={styles.subtitulo}>{produto.descricao_curta}</p>
            )}

            <div className={styles.avaliacao}>
              <div className={styles.estrelas} aria-label="Avaliação do produto">
                <FiStar />
                <FiStar />
                <FiStar />
                <FiStar />
                <FiStar />
              </div>
              <span>Produto popular</span>
            </div>

            <div className={styles.precoBox}>
              <div className={styles.precoLinha}>
                {temDesconto && (
                  <span className={styles.precoAntigo}>
                    {formatarPreco(precoOriginal)}
                  </span>
                )}

                <strong className={styles.preco}>
                  {formatarPreco(precoFinal)}
                </strong>
              </div>

              <div className={styles.precoInfo}>
                {emEstoque === null ? (
                  <span className={styles.estoqueNeutro}>Estoque não informado</span>
                ) : emEstoque ? (
                  <span className={styles.estoqueOk}>
                    {produto.estoque} em estoque
                  </span>
                ) : (
                  <span className={styles.estoqueRuim}>Produto indisponível</span>
                )}

                {temDesconto && <span className={styles.desconto}>Oferta ativa</span>}
              </div>
            </div>

            <div className={styles.beneficios}>
              <div className={styles.beneficio}>
                <FiTruck />
                <span>Entrega rápida</span>
              </div>

              <div className={styles.beneficio}>
                <FiShield />
                <span>Compra 100% segura</span>
              </div>

              <div className={styles.beneficio}>
                <FiCreditCard />
                <span>Parcelamento disponível</span>
              </div>

              <div className={styles.beneficio}>
                <FiCheckCircle />
                <span>Produto verificado</span>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btnComprar}
                onClick={adicionarCarrinho}
                disabled={adicionando}
              >
                <FiShoppingCart />
                <span>{adicionando ? "Adicionando..." : "Comprar agora"}</span>
              </button>

              <button type="button" className={styles.btnFavorito} aria-label="Favoritar">
                <FiHeart />
              </button>
            </div>

            <div className={styles.cardsExtras}>
              <div className={styles.extraCard}>
                <strong>Frete</strong>
                <span>Simule na finalização da compra</span>
              </div>

              <div className={styles.extraCard}>
                <strong>Garantia</strong>
                <span>Compra protegida e segura</span>
              </div>
            </div>

            {produto.descricao && (
              <section className={styles.descricao}>
                <h2>Descrição do produto</h2>
                <p>{produto.descricao}</p>
              </section>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}