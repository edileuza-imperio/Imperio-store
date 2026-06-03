"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
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

import styles from "./page.module.css";
import { useProduto } from "./useProduto";

export default function ViewProdutoSlugPage() {
  const params = useParams();
  const slug = String(params?.slug || "").trim();

  const {
    loading,
    produto,
    adicionando,
    imagens,
    imagemAtiva,
    setImagemAtiva,
    adicionarCarrinho,
    formatarPreco,
  } = useProduto(slug);

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
                <span className={styles.categoria}>
                  {produto.categoria_nome}
                </span>
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
                  <span className={styles.estoqueNeutro}>
                    Estoque não informado
                  </span>
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