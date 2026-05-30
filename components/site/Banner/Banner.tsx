"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";

import styles from "./Banner.module.css";

type BannerItem = {
  id_banner: number;
  titulo: string;
  descricao?: string;
  imagem: string;
  link?: string | null;
  statusid?: number;
};

export default function Banner() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [index, setIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await api.get(rotas.banners.listar);
        const data = res.data?.dados?.dados ?? [];

        const validos = data.filter(
          (b: BannerItem) => b?.statusid === 1 && b?.imagem
        );

        if (mounted) setBanners(validos);
      } catch (err) {
        console.error("Erro banners:", err);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;

    const t = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 6000);

    return () => clearInterval(t);
  }, [banners.length]);

  const banner = banners[index];

  const imagemBanner = useMemo(() => {
    if (!banner?.imagem) return "";
    return banner.imagem.startsWith("http")
      ? banner.imagem
      : `https://lightgrey-cattle-160990.hostingersite.com/${banner.imagem}`;
  }, [banner]);

  function goLink() {
    if (!banner?.link) return;

    if (banner.link.startsWith("http")) {
      window.location.href = banner.link;
    } else {
      router.push(banner.link);
    }
  }

  if (!banner) {
    return (
      <section className={styles.loadingWrap}>
        <div className={styles.loading} />
      </section>
    );
  }

  return (
    <section className={styles.banner}>
      <div className={styles.overlay} />

      <div className={styles.inner}>
        <div className={styles.text}>
          <span className={styles.tag}>Universo Império</span>

          <h1 className={styles.title}>{banner.titulo}</h1>

          {banner.descricao && (
            <p className={styles.desc}>{banner.descricao}</p>
          )}

          <button className={styles.btn} onClick={goLink}>
            Comprar Agora
          </button>
        </div>

        <div className={styles.media} onClick={goLink}>
          <div className={styles.imageWrap}>
            <Image
              src={imagemBanner}
              alt={banner.titulo}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className={styles.img}
            />
          </div>
        </div>
      </div>

      {banners.length > 1 && (
        <div className={styles.dots}>
          {banners.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === index ? styles.active : ""}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}