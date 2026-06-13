"use client";

import Image from "next/image";
import Link from "next/link";
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

  const quantidade = Number(produto.quantidade ?? produto.estoque ?? 0);
  const reservado = Number(produto.reservado ?? 0);

  const disponivel = Number(
    produto.disponivel ?? Math.max(quantidade - reservado, 0)
  );

  const emEstoque = disponivel > 0;
  const podeComprar = emEstoque && !adicionando;

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <div className={styles.topbar}>
          <Link href="/" className={styles.voltar}>
            <FiArrowLeft aria-hidden="true" />
            <span>Voltar para loja</span>
          </Link>

          <nav className={styles.breadcrumb} aria-label="Caminho da página">
            <Link href="/">Home</Link>
            <FiChevronRight aria-hidden="true" />
            <span>{produto.categoria_nome || "Produto"}</span>
            <FiChevronRight aria-hidden="true" />
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
                      alt={`Miniatura ${index + 1} de ${produto.nome}`}
                      fill
                      sizes="104px"
                      className={styles.miniaturaImagem}
                    />
                  </button>
                ))}
              </div>
            )}

            <div className={styles.imagemContainer}>
              {emEstoque ? (
                <div className={styles.badge}>Destaque</div>
              ) : (
                <div className={styles.badgeEsgotado}>Esgotado</div>
              )}

              <div className={styles.imagem}>
                {imagemAtiva ? (
                  <Image
                    src={imagemAtiva}
                    alt={produto.nome || "Produto"}
                    fill
                    priority
                    sizes="(max-width: 1100px) 100vw, 52vw"
                    className={`${styles.imagemPrincipal} ${
                      !emEstoque ? styles.imagemEsgotada : ""
                    }`}
                  />
                ) : (
                  <div className={styles.semImagem}>
                    <FiImage aria-hidden="true" />
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

              {produto.marca && (
                <span className={styles.marca}>{produto.marca}</span>
              )}
            </div>

            <h1 className={styles.titulo}>{produto.nome}</h1>

            {produto.descricao_curta && (
              <p className={styles.subtitulo}>{produto.descricao_curta}</p>
            )}

            <div className={styles.avaliacao}>
              <div
                className={styles.estrelas}
                aria-label="Avaliação visual do produto"
              >
                <FiStar aria-hidden="true" />
                <FiStar aria-hidden="true" />
                <FiStar aria-hidden="true" />
                <FiStar aria-hidden="true" />
                <FiStar aria-hidden="true" />
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
                {emEstoque ? (
                  <span className={styles.estoqueOk}>
                    {disponivel} em estoque
                  </span>
                ) : (
                  <span className={styles.estoqueRuim}>
                    Produto indisponível
                  </span>
                )}

                {temDesconto && emEstoque && (
                  <span className={styles.desconto}>Oferta ativa</span>
                )}
              </div>
            </div>

            {!emEstoque && (
              <div className={styles.avisoEsgotado}>
                Este produto está esgotado no momento. A compra foi bloqueada
                até o estoque ser atualizado.
              </div>
            )}

            <div className={styles.beneficios}>
              <div className={styles.beneficio}>
                <FiTruck aria-hidden="true" />
                <span>Entrega rápida</span>
              </div>

              <div className={styles.beneficio}>
                <FiShield aria-hidden="true" />
                <span>Compra 100% segura</span>
              </div>

              <div className={styles.beneficio}>
                <FiCreditCard aria-hidden="true" />
                <span>Parcelamento disponível</span>
              </div>

              <div className={styles.beneficio}>
                <FiCheckCircle aria-hidden="true" />
                <span>Produto verificado</span>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={`${styles.btnComprar} ${
                  !emEstoque ? styles.btnComprarDesativado : ""
                }`}
                onClick={adicionarCarrinho}
                disabled={!podeComprar}
              >
                <FiShoppingCart aria-hidden="true" />
                <span>
                  {!emEstoque
                    ? "Produto esgotado"
                    : adicionando
                    ? "Adicionando..."
                    : "Comprar agora"}
                </span>
              </button>

              <button
                type="button"
                className={styles.btnFavorito}
                aria-label="Favoritar"
              >
                <FiHeart aria-hidden="true" />
              </button>
            </div>

            <div className={styles.cardsExtras}>
              <div className={styles.extraCard}>
                <strong>Frete</strong>
                <span>
                  {emEstoque
                    ? "Simule na finalização da compra"
                    : "Disponível quando voltar ao estoque"}
                </span>
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