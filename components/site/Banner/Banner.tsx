"use client";

import { useEffect, useState } from "react";
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
    async function load() {
      try {
        const res = await api.get(rotas.banners.listar);

        const data = res.data?.dados?.dados ?? [];

        const validos = data.filter(
          (b: BannerItem) => b?.statusid === 1 && b?.imagem
        );

        setBanners(validos);
      } catch (err) {
        console.error("Erro banners:", err);
      }
    }

    load();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;

    const t = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 5000);

    return () => clearInterval(t);
  }, [banners.length]);

  const banner = banners[index];

  if (!banner) {
    return (
      <section className={styles.loadingWrap}>
        <div className={styles.loading}></div>
      </section>
    );
  }

  const imagemBanner = banner.imagem.startsWith("http")
    ? banner.imagem
    : `https://lightgrey-cattle-160990.hostingersite.com/${banner.imagem}`;

  function goLink() {
    if (!banner.link) return;

    if (banner.link.startsWith("http")) {
      window.location.href = banner.link;
      return;
    }

    router.push(banner.link);
  }

  return (
    <section className={styles.banner}>
      <div className={styles.background}></div>

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

        <div className={styles.media}>
          <div className={styles.imageWrap} onClick={goLink}>
            <Image
              src={imagemBanner}
              alt={banner.titulo}
              fill
              priority
              sizes="(max-width: 980px) 100vw, 50vw"
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
              className={`${styles.dot} ${
                i === index ? styles.active : ""
              }`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}