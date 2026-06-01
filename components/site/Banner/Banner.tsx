"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";
import { imagemFundo } from "@/components/Bibioteca/imagem";

import styles from "./Banner.module.css";

type BannerItem = {
  id_banner: number;
  titulo: string;
  descricao?: string | null;
  imagem: string;
  link?: string | null;
  statusid?: number;
};

export default function Banner() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const res = await api.get(rotas.banners.listar);
        const data = res.data?.dados?.dados ?? [];

        const validos = Array.isArray(data)
          ? data.filter(
              (b: BannerItem) => b?.statusid === 1 && Boolean(b?.imagem)
            )
          : [];

        setBanners(validos);
        setIndex(0);
      } catch (err) {
        console.error("Erro banners:", err);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;

    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 5000);

    return () => window.clearInterval(t);
  }, [banners.length]);

  const banner = useMemo(() => banners[index], [banners, index]);
  const imagemBanner = banner?.imagem ? imagemFundo(banner.imagem) : "";

  function goLink() {
    if (!banner?.link) return;

    if (banner.link.startsWith("http")) {
      window.open(banner.link, "_blank", "noopener,noreferrer");
      return;
    }

    router.push(banner.link);
  }

  if (loading) {
    return <section className={styles.skeleton} aria-hidden="true" />;
  }

  if (!banner) {
    return null;
  }

  return (
    <section className={styles.banner}>
      <div className={styles.background} />

      <div className={styles.inner}>
        <div className={styles.text}>
          <span className={styles.tag}>Universo Império</span>

          <h1 className={styles.title}>{banner.titulo}</h1>

          {banner.descricao ? (
            <p className={styles.desc}>{banner.descricao}</p>
          ) : (
            <p className={styles.desc}>
              Promoções, lançamentos e ofertas especiais em um só lugar.
            </p>
          )}

          <button
            type="button"
            className={styles.btn}
            onClick={goLink}
            disabled={!banner.link}
          >
            Comprar agora
          </button>
        </div>

        <div className={styles.media}>
          <div
            className={`${styles.imageWrap} ${banner.link ? styles.clickable : ""}`}
            onClick={goLink}
            role={banner.link ? "button" : undefined}
            tabIndex={banner.link ? 0 : undefined}
            onKeyDown={(e) => {
              if (!banner.link) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                goLink();
              }
            }}
            aria-label={banner.link ? "Abrir banner" : undefined}
          >
            {imagemBanner ? (
              <Image
                src={imagemBanner}
                alt={banner.titulo || "Banner"}
                fill
                priority
                fetchPriority="high"
                sizes="(max-width: 980px) 100vw, 50vw"
                className={styles.img}
              />
            ) : (
              <div className={styles.imageFallback}>
                <span>Imagem em destaque</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {banners.length > 1 && (
        <div className={styles.dots} aria-label="Navegação do banner">
          {banners.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.dot} ${i === index ? styles.active : ""}`}
              onClick={() => setIndex(i)}
              aria-label={`Ver banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}