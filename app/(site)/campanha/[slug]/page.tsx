"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import api from "@/Api/conectar";
import styles from "./Campanha.module.css";

import { ShoppingBag, Calendar, Package, ArrowRight } from "lucide-react";

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string | null;
  banner?: string | null;
  imagem?: string | null;
  desktop?: string | null;
  mobile?: string | null;
  foto?: string | null;
  inicio?: string | null;
  fim?: string | null;
};

type Produto = {
  id_produto: number;
  nome: string;
  descricao?: string | null;
  imagem?: string | null;
  preco?: number;
  slug?: string;
};

function extrairDados(payload: any) {
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
    typeof api === "string" ? api : (api as any)?.defaults?.baseURL || "";

  if (!baseURL) return valor;

  if (valor.startsWith("/")) {
    return `${baseURL}${valor}`;
  }

  return `${baseURL}/${valor}`;
}

function obterImagemCampanha(campanha?: Campanha | null) {
  return resolverImagem(
    campanha?.banner ||
      campanha?.imagem ||
      campanha?.desktop ||
      campanha?.mobile ||
      campanha?.foto ||
      ""
  );
}

function formatDateBR(value?: string | null) {
  if (!value) return "";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  return d.toLocaleDateString("pt-BR");
}

export default function CampanhaSlugPage() {
  const params = useParams();

  const slug =
    typeof (params as any)?.slug === "string"
      ? ((params as any).slug as string)
      : ((params as any)?.slug?.[0] as string | undefined);

  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    try {
      setLoading(true);

      const campanhaResponse = await api.get(`/campanha/slug/${slug}`, {
        withCredentials: true,
      });

      const campanhaDados = extrairDados(campanhaResponse.data);

      const campanhaNormalizada: Campanha | null = campanhaDados
        ? {
            id_campanha: campanhaDados.id_campanha,
            titulo: campanhaDados.titulo,
            slug: campanhaDados.slug,
            descricao: campanhaDados.descricao ?? null,
            banner: campanhaDados.banner ?? null,
            imagem: campanhaDados.imagem ?? null,
            desktop: campanhaDados.desktop ?? null,
            mobile: campanhaDados.mobile ?? null,
            foto: campanhaDados.foto ?? null,
            inicio: campanhaDados.inicio ?? null,
            fim: campanhaDados.fim ?? null,
          }
        : null;

      setCampanha(campanhaNormalizada);

      if (campanhaNormalizada?.id_campanha) {
        const produtosResponse = await api.get(
          `/campanha/${campanhaNormalizada.id_campanha}/produtos`
        );

        const produtosDados = extrairDados(produtosResponse.data);

        const listaProdutos = Array.isArray(produtosDados)
          ? produtosDados.map((item: any) => {
              const produto = item?.produto || {};

              return {
                id_produto: produto.id_produto ?? item.produto_id,
                nome: produto.nome || "",
                descricao: produto.descricao || null,
                imagem: produto.imagem || null,
                preco: Number(
                  String(produto.preco || produto["preço"] || 0).replace(
                    ",",
                    "."
                  )
                ),
                slug: produto.slug || produto.lesma || "",
              };
            })
          : [];

        setProdutos(listaProdutos);
      }
    } catch (error) {
      console.error("Erro ao carregar campanha:", error);
      setCampanha(null);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (slug) {
      carregar();
    } else {
      setLoading(false);
    }
  }, [slug]);

  const bannerImg = useMemo(() => obterImagemCampanha(campanha), [campanha]);

  const inicio = formatDateBR(campanha?.inicio);
  const fim = formatDateBR(campanha?.fim);

  const periodo =
    inicio && fim
      ? `${inicio} até ${fim}`
      : inicio || fim || "Sem período definido";

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Carregando campanha...</p>
      </div>
    );
  }

  if (!campanha) {
    return (
      <div className={styles.emptyPage}>
        <div className={styles.emptyCard}>
          <span className={styles.badge}>Campanha</span>
          <h1>Campanha não encontrada</h1>
          <p>Verifique se o link da campanha está correto.</p>
          <Link href="/" className={styles.homeButton}>
            Voltar para home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        {bannerImg ? (
          <Image
            src={bannerImg}
            alt={campanha.titulo || "Banner da campanha"}
            fill
            priority
            sizes="100vw"
            className={styles.heroImage}
          />
        ) : (
          <div className={styles.heroPlaceholder} />
        )}

        <div className={styles.overlay} />

        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <ShoppingBag size={15} />
            Campanha Especial
          </div>

          <h1>{campanha.titulo}</h1>

          {campanha.descricao && <p>{campanha.descricao}</p>}

          <div className={styles.periodo}>
            <Calendar size={16} />
            <span>{periodo}</span>
          </div>
        </div>
      </section>

      <section className={styles.produtosSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.badge}>Produtos</span>
              <h2>Produtos da campanha</h2>
            </div>

            <div className={styles.total}>
              <Package size={18} />
              {produtos.length} produtos
            </div>
          </div>

          {produtos.length === 0 ? (
            <div className={styles.emptyProducts}>
              <Package size={60} />
              <h3>Nenhum produto</h3>
              <p>Ainda não existem produtos nessa campanha.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {produtos.map((produto) => {
                const produtoImg =
                  resolverImagem(produto.imagem) || "/sem-imagem.png";

                return (
                  <Link
                    key={produto.id_produto}
                    href={`/produto/${produto.slug || produto.id_produto}`}
                    className={styles.card}
                  >
                    <div className={styles.imageBox}>
                      <Image
                        src={produtoImg}
                        alt={produto.nome || "Produto"}
                        fill
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className={styles.productImage}
                      />
                    </div>

                    <div className={styles.cardContent}>
                      <h3>{produto.nome}</h3>
                      <p>{produto.descricao || "Sem descrição disponível."}</p>

                      <div className={styles.cardFooter}>
                        <strong>
                          R${" "}
                          {Number(produto.preco || 0).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </strong>

                        <span className={styles.button}>
                          Ver produto
                          <ArrowRight size={16} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
