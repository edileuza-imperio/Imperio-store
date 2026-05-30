"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Head from "next/head";

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

  const banner = useMemo(() => banners[index], [banners, index]);

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

  return (
    <section className={styles.banner}>

      {/* 🔥 LCP PRELOAD REAL (resolve PSI warning) */}
      <Head>
        {imagemBanner && (
          <link
            rel="preload"
            as="image"
            href={imagemBanner}
            fetchPriority="high"
          />
        )}
      </Head>

      <div className={styles.background} />

      {/* 🔥 SEM CLS: estrutura fixa sempre existe */}
      <div className={styles.inner}>

        <div className={styles.text}>
          <span className={styles.tag}>Universo Império</span>

          <h1 className={styles.title}>
            {banner?.titulo || "Carregando..."}
          </h1>

          <p className={styles.desc}>
            {banner?.descricao || " "}
          </p>

          <button className={styles.btn} onClick={goLink}>
            Comprar Agora
          </button>
        </div>

        <div className={styles.media}>
          <div className={styles.imageWrap} onClick={goLink}>

            {/* 🔥 SEM SUMIR DOM (evita CLS) */}
            <Image
              src={imagemBanner || "/placeholder.png"}
              alt={banner?.titulo || "Banner"}
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 980px) 100vw, 50vw"
              quality={85}
              style={{ objectFit: "cover" }}
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