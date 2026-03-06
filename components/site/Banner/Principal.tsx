"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";

type BannerItem = {
  id_banner?: number;
  titulo?: string;
  descricao?: string;
  imagem?: string;
  link?: string | null;
  statusid?: number;
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

        const tentativas = [rotas.banners.ativos, rotas.banners.listar];
        let encontrados: BannerItem[] = [];

        for (const rota of tentativas) {
          try {
            const res = await api.get(rota);
            const payload = res?.data;

            const lista =
              (Array.isArray(payload) && payload) ||
              (Array.isArray(payload?.dados) && payload.dados) ||
              (Array.isArray(payload?.dados?.banners) && payload.dados.banners) ||
              (Array.isArray(payload?.banners) && payload.banners) ||
              [];

            if (lista.length > 0) {
              encontrados = lista;
              break;
            }
          } catch {
            // tenta a próxima rota
          }
        }

        if (!ativo) return;
        setBanners(encontrados);
      } catch (e: any) {
        if (!ativo) return;
        setErro(e?.message || "Erro ao carregar banners");
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
    if (!img) return null;

    if (/^https?:\/\//i.test(img)) return img;

    const base = String(api.defaults.baseURL || "").replace(/\/+$/, "");
    const path = String(img).replace(/^\/+/, "");
    return `${base}/${path}`;
  };

  const imagemUrl = useMemo(() => makeImageUrl(banner?.imagem), [banner?.imagem]);

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
      <>
        <section className="banner-loading" aria-label="Carregando banner">
          <div className="banner-loading-shine" />
        </section>

        <style jsx>{`
          .banner-loading {
            position: relative;
            width: 100%;
            min-height: 520px;
            overflow: hidden;
            background: linear-gradient(135deg, #7f4a57 0%, #b97c89 45%, #f3e7da 100%);
          }

          .banner-loading-shine {
            position: absolute;
            inset: 0;
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.12) 50%,
              transparent 100%
            );
            transform: translateX(-40%);
            animation: shine 1.2s linear infinite;
          }

          @keyframes shine {
            to {
              transform: translateX(40%);
            }
          }
        `}</style>
      </>
    );
  }

  if (erro || !safeBanners.length || !imagemUrl) {
    return null;
  }

  return (
    <>
      <section
        className={`lux-banner ${isHover ? "paused" : ""}`}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        aria-label="Banner principal"
      >
        <button
          type="button"
          className={`lux-banner-bg ${possuiLink ? "clickable" : "no-click"}`}
          style={{ backgroundImage: `url(${imagemUrl})` }}
          onClick={possuiLink ? handleClick : undefined}
          aria-label={banner?.titulo || "Banner"}
        />

        <div className="lux-banner-overlay" />
        <div className="lux-banner-glow" />

        <div className="lux-banner-content">
          <div className="lux-banner-text">
            <h1 className="lux-title">{banner?.titulo || ""}</h1>

            {banner?.descricao ? (
              <p className="lux-desc">{banner.descricao}</p>
            ) : null}

            <div className="lux-actions">
              {possuiLink ? (
                <>
                  <button type="button" className="lux-btn primary" onClick={handleClick}>
                    Acessar <i className="bi bi-arrow-right" />
                  </button>

                  <button type="button" className="lux-btn secondary" onClick={handleClick}>
                    Ver Mais <i className="bi bi-arrow-right" />
                  </button>
                </>
              ) : (
                <button type="button" className="lux-btn secondary neutral" disabled>
                  Saiba mais
                </button>
              )}
            </div>
          </div>
        </div>

        {hasMany && (
          <>
            <button type="button" className="lux-arrow left" onClick={prev} aria-label="Anterior">
              <i className="bi bi-chevron-left" />
            </button>

            <button type="button" className="lux-arrow right" onClick={next} aria-label="Próximo">
              <i className="bi bi-chevron-right" />
            </button>

            <div className="lux-dots">
              {safeBanners.map((item, i) => (
                <button
                  key={item.id_banner ?? i}
                  type="button"
                  className={`lux-dot ${i === index ? "active" : ""}`}
                  onClick={() => setIndex(i)}
                  aria-label={`Ir para o banner ${i + 1}`}
                />
              ))}
            </div>

            <div className="lux-progress">
              <span />
            </div>
          </>
        )}
      </section>

      <style jsx>{`
        .lux-banner {
          position: relative;
          width: 100%;
          min-height: 520px;
          overflow: hidden;
          background: #8f5f69;
          isolation: isolate;
        }

        .lux-banner-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
          padding: 0;
          margin: 0;
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;
          transform: scale(1.02);
          transition: transform 900ms ease;
        }

        .lux-banner-bg.clickable {
          cursor: pointer;
        }

        .lux-banner-bg.no-click {
          cursor: default;
        }

        .lux-banner:hover .lux-banner-bg {
          transform: scale(1.06);
        }

        .lux-banner-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              rgba(71, 39, 46, 0.90) 0%,
              rgba(127, 74, 87, 0.82) 24%,
              rgba(168, 113, 125, 0.56) 46%,
              rgba(232, 214, 198, 0.18) 70%,
              rgba(245, 236, 226, 0.05) 100%
            ),
            linear-gradient(
              180deg,
              rgba(45, 18, 25, 0.16) 0%,
              rgba(45, 18, 25, 0.28) 100%
            );
          z-index: 1;
        }

        .lux-banner-glow {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            radial-gradient(circle at 82% 16%, rgba(255, 248, 241, 0.20), transparent 14%),
            radial-gradient(circle at 91% 26%, rgba(246, 235, 223, 0.16), transparent 12%),
            radial-gradient(circle at 76% 74%, rgba(244, 229, 214, 0.14), transparent 18%);
          mix-blend-mode: screen;
        }

        .lux-banner-content {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1320px;
          min-height: 520px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          padding: 60px 32px;
        }

        .lux-banner-text {
          width: 100%;
          max-width: 560px;
        }

        .lux-title {
          margin: 0 0 18px;
          color: #fffaf5;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(2.8rem, 5vw, 4.8rem);
          line-height: 0.95;
          font-weight: 700;
          text-shadow: 0 10px 24px rgba(42, 18, 23, 0.35);
        }

        .lux-desc {
          max-width: 430px;
          margin: 0 0 28px;
          color: rgba(255, 248, 241, 0.95);
          font-size: 1.04rem;
          line-height: 1.75;
          text-shadow: 0 3px 10px rgba(42, 18, 23, 0.18);
        }

        .lux-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .lux-btn {
          height: 50px;
          padding: 0 22px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 0.96rem;
          font-weight: 800;
          cursor: pointer;
          transition: 0.22s ease;
        }

        .lux-btn.primary {
          background: linear-gradient(135deg, #a86674 0%, #c98493 100%);
          color: #fffaf5;
          border: 1px solid rgba(255, 250, 245, 0.10);
          box-shadow: 0 14px 28px rgba(127, 74, 87, 0.28);
        }

        .lux-btn.primary:hover {
          transform: translateY(-2px);
          filter: brightness(1.04);
        }

        .lux-btn.secondary {
          background: rgba(255, 250, 245, 0.08);
          color: #fffaf5;
          border: 1px solid rgba(255, 244, 235, 0.60);
          backdrop-filter: blur(6px);
        }

        .lux-btn.secondary:hover {
          transform: translateY(-2px);
          background: rgba(255, 250, 245, 0.14);
        }

        .lux-btn.neutral {
          cursor: default;
          opacity: 1;
        }

        .lux-btn.neutral:hover {
          transform: none;
          background: rgba(255, 250, 245, 0.08);
        }

        .lux-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 3;
          width: 46px;
          height: 46px;
          border: none;
          border-radius: 999px;
          background: rgba(127, 74, 87, 0.45);
          color: #fffaf5;
          backdrop-filter: blur(8px);
          transition: 0.2s ease;
          opacity: 0;
          pointer-events: none;
        }

        .lux-banner:hover .lux-arrow {
          opacity: 1;
          pointer-events: auto;
        }

        .lux-arrow:hover {
          background: rgba(143, 95, 105, 0.76);
          transform: translateY(-50%) scale(1.05);
        }

        .lux-arrow.left {
          left: 18px;
        }

        .lux-arrow.right {
          right: 18px;
        }

        .lux-dots {
          position: absolute;
          left: 32px;
          bottom: 28px;
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .lux-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          border: none;
          background: rgba(255, 250, 245, 0.48);
          transition: 0.2s ease;
        }

        .lux-dot:hover {
          background: rgba(255, 250, 245, 0.86);
        }

        .lux-dot.active {
          width: 30px;
          background: linear-gradient(135deg, #a86674 0%, #f1e4d6 100%);
        }

        .lux-progress {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 3;
          height: 3px;
          background: rgba(255, 250, 245, 0.12);
          overflow: hidden;
        }

        .lux-progress span {
          display: block;
          width: 100%;
          height: 100%;
          transform-origin: left;
          background: linear-gradient(90deg, #b57684 0%, #f1e4d6 100%);
          animation: progress ${intervalMs}ms linear infinite;
        }

        .paused .lux-progress span {
          animation-play-state: paused;
        }

        @keyframes progress {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }

        @media (max-width: 991px) {
          .lux-banner,
          .lux-banner-content {
            min-height: 470px;
          }
        }

        @media (max-width: 768px) {
          .lux-banner,
          .lux-banner-content {
            min-height: 420px;
          }

          .lux-banner-content {
            padding: 38px 18px 74px;
          }

          .lux-banner-text {
            max-width: 100%;
          }

          .lux-title {
            font-size: 2.4rem;
            line-height: 1;
          }

          .lux-desc {
            max-width: 100%;
            font-size: 0.98rem;
            line-height: 1.65;
          }

          .lux-btn {
            width: 100%;
            justify-content: center;
          }

          .lux-arrow {
            opacity: 1;
            pointer-events: auto;
            width: 40px;
            height: 40px;
            top: auto;
            bottom: 18px;
            transform: none;
          }

          .lux-arrow:hover {
            transform: scale(1.04);
          }

          .lux-arrow.left {
            left: auto;
            right: 64px;
          }

          .lux-arrow.right {
            right: 18px;
          }

          .lux-dots {
            left: 18px;
            bottom: 30px;
          }
        }
      `}</style>
    </>
  );
}