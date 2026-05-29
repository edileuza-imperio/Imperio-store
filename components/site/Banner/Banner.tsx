"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { rotas } from "@/components/Bibioteca/config/rotas";

import styles from "./Banner.module.css";

type BannerItem = {
  id_banner?: number;
  titulo?: string;
  descricao?: string;
  imagem?: string;
  link?: string | null;
  statusid?: number;
  status_id?: number;
};

export default function Banner() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);

  const router = useRouter();
  const timer = useRef<number | null>(null);

  const safe = useMemo(() => banners.filter(Boolean), [banners]);
  const many = safe.length > 1;

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      try {
        const res = await api.get(rotas.banners.listar);
        const data = res?.data;

        const list =
          data?.dados ??
          data?.banners ??
          (Array.isArray(data) ? data : []);

        const filtered = list.filter(
          (b: BannerItem) =>
            Number(b?.statusid ?? b?.status_id ?? 1) === 1 && b?.imagem
        );

        if (!active) return;
        setBanners(filtered);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!many || hover) return;

    timer.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % safe.length);
    }, 5000);

    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [many, hover, safe.length]);

  const item = safe[index];

  const imgUrl = useMemo(() => {
    if (!item?.imagem) return null;

    if (item.imagem.startsWith("http")) return item.imagem;

    const base = api.defaults.baseURL?.replace(/\/$/, "");
    return `${base}/${item.imagem.replace(/^\/+/, "")}`;
  }, [item?.imagem]);

  const go = (i: number) => {
    if (!safe.length) return;
    setIndex((i + safe.length) % safe.length);
  };

  const click = () => {
    if (!item?.link) return;

    if (item.link.startsWith("http")) {
      window.location.href = item.link;
    } else {
      router.push(item.link);
    }
  };

  if (loading) {
    return <div className={styles.loading} />;
  }

  if (!imgUrl) return null;

  return (
    <section
      className={styles.banner}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className={styles.inner}>
        <div className={styles.text}>
          <span className={styles.tag}>Destaque</span>

          <h1 className={styles.title}>{item?.titulo}</h1>

          {item?.descricao && (
            <p className={styles.desc}>{item.descricao}</p>
          )}

          {item?.link && (
            <button className={styles.btn} onClick={click}>
              Ver mais
            </button>
          )}
        </div>

        <div className={styles.media}>
          <div className={styles.imageWrap}>
            <img
              src={imgUrl}
              alt={item?.titulo || "Banner"}
              className={styles.img}
              onClick={click}
            />
          </div>
        </div>
      </div>

      {many && (
        <>
          <button className={styles.prev} onClick={() => go(index - 1)}>
            <FiChevronLeft />
          </button>

          <button className={styles.next} onClick={() => go(index + 1)}>
            <FiChevronRight />
          </button>

          <div className={styles.dots}>
            {safe.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === index ? styles.active : ""}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}