"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "react-icons/fi";

import { toast } from "react-toastify";
import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";

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
  if (!valor) return null;

  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ViewProdutoSlugPage() {
  const params = useParams();
  const slug = String(params?.slug || "");

  const [loading, setLoading] = useState(true);
  const [produto, setProduto] = useState<Produto | null>(null);
  const [adicionando, setAdicionando] = useState(false);
  const [imagemAtiva, setImagemAtiva] = useState<string>("");

  async function carregarProduto() {
    try {
      setLoading(true);

      const response = await api.get(`/produto/slug/${slug}`);
      const dados = normalizar(response?.data);

      setProduto(dados);
    } catch (error) {
      console.error("Erro ao carregar produto:", error);
      toast.error("Não foi possível carregar o produto.");
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
    if (!produto?.id_produto) return;

    try {
      setAdicionando(true);

      await api.post(
        "/carrinho/adicionar",
        {
          produto_id: produto.id_produto,
          quantidade: 1,
          preco: produto.preco_promocional || produto.preco || 0,
          preco_promocional: produto.preco_promocional || null,
        },
        {
          withCredentials: true,
        }
      );

      toast.success("Produto adicionado ao carrinho.");
    } catch (error) {
      console.error("Erro ao adicionar:", error);
      toast.error("Não foi possível adicionar o produto.");
    } finally {
      setAdicionando(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.loading}>Carregando produto...</div>
        <Footer />
      </>
    );
  }

  if (!produto) {
    return (
      <>
        <Navbar />
        <div className={styles.loading}>Produto não encontrado.</div>
        <Footer />
      </>
    );
  }

  const precoPromocional = produto.preco_promocional || null;
  const precoFinal = precoPromocional || produto.preco || 0;

  return (
    <>
      <Navbar />

      <section className={styles.page}>
        <div className={styles.backgroundGlow}></div>

        <div className={styles.container}>
          <Link href="/" className={styles.voltar}>
            <FiArrowLeft />
            <span>Voltar para loja</span>
          </Link>

          <div className={styles.grid}>
            <div className={styles.galeria}>
              <div className={styles.badge}>
                <FiStar />
                <span>Destaque</span>
              </div>

              <div className={styles.imagem}>
                {imagemAtiva ? (
                  <img src={imagemAtiva} alt={produto.nome || "Produto"} />
                ) : (
                  <div className={styles.semImagem}>
                    <FiImage />
                    <span>Sem imagem</span>
                  </div>
                )}
              </div>

              {imagens.length > 1 && (
                <div className={styles.miniaturas}>
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
                      <img src={img} alt={`Miniatura ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.info}>
              {produto.categoria_nome && (
                <span className={styles.categoria}>
                  {produto.categoria_nome}
                </span>
              )}

              <h1 className={styles.titulo}>{produto.nome}</h1>

              {produto.descricao_curta && (
                <p className={styles.subtitulo}>{produto.descricao_curta}</p>
              )}

              <div className={styles.avaliacao}>
                <div className={styles.estrelas}>
                  <FiStar />
                  <FiStar />
                  <FiStar />
                  <FiStar />
                  <FiStar />
                </div>
                <span>Produto popular</span>
              </div>

              <div className={styles.precos}>
                {precoPromocional && (
                  <span className={styles.precoAntigo}>
                    {formatarPreco(produto.preco)}
                  </span>
                )}

                <strong className={styles.preco}>
                  {formatarPreco(precoFinal)}
                </strong>
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
                  className={styles.btnCarrinho}
                  onClick={adicionarCarrinho}
                  disabled={adicionando}
                >
                  <FiShoppingCart />
                  <span>
                    {adicionando ? "Adicionando..." : "Adicionar ao carrinho"}
                  </span>
                </button>

                <button type="button" className={styles.btnFavorito}>
                  <FiHeart />
                </button>
              </div>

              {produto.descricao && (
                <div className={styles.descricao}>
                  <h2>Descrição do produto</h2>
                  <p>{produto.descricao}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}