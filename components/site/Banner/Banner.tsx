"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { imagemFundo } from "@/components/Bibioteca/imagem";
import { useBanner } from "./useBanner";

import styles from "./Banner.module.css";

export default function Banner() {
  const router = useRouter();

  const {
    banners,
    banner,
    index,
    setIndex,
    loading,
  } = useBanner();

  function goLink() {
    if (!banner?.link) return;

    if (banner.link.startsWith("http")) {
      window.open(
        banner.link,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    router.push(banner.link);
  }

  if (loading) {
    return (
      <section className={styles.skeleton} />
    );
  }

  if (!banner) return null;

  const imagemBanner = imagemFundo(
    banner.imagem
  );

  return (
    <section className={styles.banner}>
      <div className={styles.inner}>
        <div className={styles.text}>
          <span className={styles.tag}>
            Universo Império
          </span>

          <h1 className={styles.title}>
            {banner.titulo}
          </h1>

          <p className={styles.desc}>
            {banner.descricao ??
              "Promoções, lançamentos e ofertas especiais."}
          </p>

          <button
            className={styles.btn}
            onClick={goLink}
          >
            Comprar agora
          </button>
        </div>

        <div
          className={styles.media}
          onClick={goLink}
        >
          <div className={styles.imageWrap}>
            <Image
              src={imagemBanner}
              alt={banner.titulo}
              fill
              priority
              fetchPriority="high"
              sizes="(max-width:980px) 100vw, 50vw"
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
              className={`${styles.dot} ${
                i === index
                  ? styles.active
                  : ""
              }`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}