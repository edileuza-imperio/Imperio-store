"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { rotas } from "@/components/Bibioteca/config/rotas";

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
  const [erro, setErro] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [isHover, setIsHover] = useState(false);

  const router = useRouter();
  const timerRef = useRef<number | null>(null);
  const clickLockRef = useRef(false);
  const lastViewRef = useRef<Record<number, number>>({});

  const intervalMs = 5000;
  const viewCooldownMs = 30000;

  useEffect(() => {
    let ativo = true;

    async function carregarBanners() {
      try {
        setLoading(true);
        setErro(null);

        const res = await api.get(rotas.banners.listar);
        const payload = res?.data;

        const listaBase: BannerItem[] =
          (Array.isArray(payload) && payload) ||
          (Array.isArray(payload?.dados) && payload.dados) ||
          (Array.isArray(payload?.banners) && payload.banners) ||
          (Array.isArray(payload?.dados?.banners) && payload.dados.banners) ||
          (Array.isArray(payload?.dados?.dados) && payload.dados.dados) ||
          [];

        const filtrados = listaBase.filter((item) => {
          const status = Number(item?.statusid ?? item?.status_id ?? 1);
          const temImagem =
            typeof item?.imagem === "string" && item.imagem.trim() !== "";

          return !!item && status === 1 && temImagem;
        });

        if (!ativo) return;
        setBanners(filtrados);
      } catch (e: any) {
        if (!ativo) return;
        setErro(
          e?.response?.data?.mensagem ||
            e?.message ||
            "Erro ao carregar banners"
        );
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregarBanners();

    return () => {
      ativo = false;
    };
  }, []);

  const safeBanners = useMemo(() => {
    return Array.isArray(banners) ? banners.filter(Boolean) : [];
  }, [banners]);

  const hasMany = safeBanners.length > 1;

  useEffect(() => {
    if (!safeBanners.length) return;
    setIndex((prev) => Math.min(prev, safeBanners.length - 1));
  }, [safeBanners.length]);

  const banner = safeBanners[index];

  const makeImageUrl = (img?: string | null) => {
    if (!img || img.trim() === "") return null;

    if (/^https?:\/\//i.test(img)) {
      return img;
    }

    const base = String(api.defaults.baseURL || "").replace(/\/+$/, "");
    const path = String(img).replace(/^\/+/, "");

    return `${base}/${path}`;
  };

  const imagemUrl = useMemo(
    () => makeImageUrl(banner?.imagem),
    [banner?.imagem]
  );

  useEffect(() => {
    if (!hasMany || !safeBanners.length) return;

    const nextIndex = (index + 1) % safeBanners.length;
    const nextImg = makeImageUrl(safeBanners[nextIndex]?.imagem);

    if (!nextImg) return;

    const img = new Image();
    img.src = nextImg;
  }, [hasMany, index, safeBanners]);

  const goTo = (i: number) => {
    if (!safeBanners.length) return;
    const next = (i + safeBanners.length) % safeBanners.length;
    setIndex(next);
  };

  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  useEffect(() => {
    const id = banner?.id_banner;
    if (!id) return;

    const now = Date.now();
    const last = lastViewRef.current[id] || 0;

    if (now - last < viewCooldownMs) return;

    lastViewRef.current[id] = now;

    api.put(rotas.banners.incrementarView(id)).catch(() => {});
  }, [banner?.id_banner]);

  const possuiLink = !!banner?.link && banner.link !== "#";

  const handleClick = async () => {
    if (!possuiLink) return;

    const id = banner?.id_banner;
    const link = String(banner?.link);

    if (id && !clickLockRef.current) {
      clickLockRef.current = true;

      api.put(rotas.banners.incrementarClick(id)).catch(() => {});

      window.setTimeout(() => {
        clickLockRef.current = false;
      }, 800);
    }

    if (/^https?:\/\//i.test(link)) {
      window.location.href = link;
      return;
    }

    router.push(link);
  };

  useEffect(() => {
    if (!hasMany || isHover) return;

    timerRef.current = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % safeBanners.length);
    }, intervalMs);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [hasMany, isHover, safeBanners.length]);

  useEffect(() => {
    if (!hasMany) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasMany, index]);

  if (loading) {
    return (
      <section className="banner-loading" aria-label="Carregando banner">
        <div className="banner-loading-shine" />
      </section>
    );
  }

  if (erro || !safeBanners.length || !imagemUrl) {
    return null;
  }

  return (
    <section
      className={`banner-v2 ${isHover ? "paused" : ""}`}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      aria-label="Banner principal"
    >
      <div className="banner-v2__inner">
        <div className="banner-v2__content">
          <span className="banner-v2__badge">Destaque</span>

          <h1 className="banner-v2__title">{banner?.titulo || ""}</h1>

          {banner?.descricao && (
            <p className="banner-v2__description">{banner.descricao}</p>
          )}

          <div className="banner-v2__actions">
            {possuiLink ? (
              <>
                <button
                  type="button"
                  className="banner-v2__btn banner-v2__btn--primary"
                  onClick={handleClick}
                >
                  Acessar
                  <FiChevronRight size={18} />
                </button>

                <button
                  type="button"
                  className="banner-v2__btn banner-v2__btn--secondary"
                  onClick={handleClick}
                >
                  Ver mais
                  <FiChevronRight size={18} />
                </button>
              </>
            ) : (
              <button
                type="button"
                className="banner-v2__btn banner-v2__btn--secondary"
                disabled
              >
                Saiba mais
              </button>
            )}
          </div>
        </div>

        <div className="banner-v2__media">
          <div className="banner-v2__imageWrap">
            <img
              src={imagemUrl}
              alt={banner?.titulo || "Banner"}
              className={`banner-v2__image ${possuiLink ? "is-clickable" : ""}`}
              onClick={possuiLink ? handleClick : undefined}
            />
          </div>
        </div>
      </div>

      {hasMany && (
        <>
          <button
            type="button"
            className="banner-v2__arrow banner-v2__arrow--left"
            onClick={prev}
            aria-label="Banner anterior"
          >
            <FiChevronLeft size={24} />
          </button>

          <button
            type="button"
            className="banner-v2__arrow banner-v2__arrow--right"
            onClick={next}
            aria-label="Próximo banner"
          >
            <FiChevronRight size={24} />
          </button>

          <div className="banner-v2__dots">
            {safeBanners.map((item, i) => (
              <button
                key={item.id_banner ?? i}
                type="button"
                className={`banner-v2__dot ${i === index ? "active" : ""}`}
                onClick={() => setIndex(i)}
                aria-label={`Ir para o banner ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}