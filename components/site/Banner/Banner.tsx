"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { imagemFundo } from "@/components/Bibioteca/imagem";
import styles from "./Banner.module.css";

export type BannerItem = {
  id_banner: number;
  titulo: string;
  descricao?: string | null;
  imagem: string;
  link?: string | null;
  statusid?: number;
};

type Props = {
  banners: BannerItem[];
};

export default function Banner({ banners }: Props) {
  const router = useRouter();

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  const banner = useMemo(
    () => banners[index],
    [banners, index]
  );

  if (!banner) return null;

  const imagemBanner = imagemFundo(banner.imagem);

  function goLink() {
    if (!banner.link) return;

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