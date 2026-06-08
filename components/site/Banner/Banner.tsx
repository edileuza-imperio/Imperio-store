"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { imagemFundo } from "@/components/Bibioteca/imagem";
import { useBanner } from "./useBanner";

import styles from "./Banner.module.css";

export default function Banner() {
  const router = useRouter();

  const { banners, banner, index, setIndex, loading } = useBanner();

  const linkBanner = banner?.link?.trim();
  const temLink = Boolean(linkBanner);

  function goLink() {
    if (!linkBanner) return;

    if (linkBanner.startsWith("http")) {
      window.open(linkBanner, "_blank", "noopener,noreferrer");
      return;
    }

    router.push(linkBanner);
  }

  if (loading) {
    return <section className={styles.skeleton} />;
  }

  if (!banner) return null;

  const imagemBanner = imagemFundo(banner.imagem);

  return (
    <section className={styles.banner}>
      <div className={styles.inner}>
        <div className={styles.text}>
          <span className={styles.tag}>Universo Império</span>

          <h1 className={styles.title}>{banner.titulo}</h1>

          <p className={styles.desc}>
            {banner.descricao ??
              "Promoções, lançamentos e ofertas especiais."}
          </p>

          {temLink && (
            <button
              type="button"
              className={styles.btn}
              onClick={goLink}
            >
              Comprar agora
              <span>→</span>
            </button>
          )}
        </div>

        <div
          className={`${styles.media} ${temLink ? styles.clickable : ""}`}
          onClick={temLink ? goLink : undefined}
        >
          <div className={styles.imageWrap}>
            <Image
              src={imagemBanner}
              alt={banner.titulo}
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 980px) 100vw, 50vw"
              className={styles.image}
            />
          </div>
        </div>
      </div>

      {banners.length > 1 && (
        <div className={styles.dots}>
          {banners.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para o banner ${i + 1}`}
              className={`${styles.dot} ${i === index ? styles.active : ""}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}