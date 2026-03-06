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
            // tenta próxima rota
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

    if (/^https?:\/\//i.test(img)) {
      return img;
    }

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

  const handleClick = async () => {
    const link = banner?.link;

    if (!link || link === "#") return;

    const id = banner?.id_banner;

    if (id && !clickLockRef.current) {
      clickLockRef.current = true;
      api.put(rotas.banners.incrementarClick(id)).catch(() => {});

      window.setTimeout(() => {
        clickLockRef.current = false;
      }, 800);
    }

    if (/^https?:\/\//i.test(link)) {
      window.location.href = String(link);
      return;
    }

    router.push(String(link));
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

  const tituloPrincipal = banner?.titulo?.trim() || "Universo Império";
  const descricaoPrincipal =
    banner?.descricao?.trim() ||
    "Moda, beleza e estilo que celebram a sua essência. Descubra peças únicas para cada momento da sua vida.";

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
            border-radius: 0;
            overflow: hidden;
            background: linear-gradient(135deg, #2a0411 0%, #5a0a22 45%, #bb7f60 100%);
          }

          .banner-loading-shine {
            position: absolute;
            inset: 0;
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.08) 50%,
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
          className="lux-banner-bg"
          style={{ backgroundImage: `url(${imagemUrl})` }}
          onClick={handleClick}
          aria-label={tituloPrincipal}
        />

        <div className="lux-banner-overlay" />
        <div className="lux-banner-glow" />

        <div className="lux-banner-content">
          <div className="lux-banner-text">
            <span className="lux-badge">✦ NOVA COLEÇÃO 2025 ✦</span>

            <div className="lux-brand-watermark">UNIVERSO IMPÉRIO</div>

            <h1 className="lux-title">
              Viva o seu
              <span>{tituloPrincipal}</span>
            </h1>

            <div className="lux-divider" />

            <p className="lux-desc">{descricaoPrincipal}</p>

            <div className="lux-actions">
              <button type="button" className="lux-btn primary" onClick={handleClick}>
                Comprar Agora <i className="bi bi-arrow-right" />
              </button>

              <button type="button" className="lux-btn secondary" onClick={handleClick}>
                Ver Coleção <i className="bi bi-arrow-right" />
              </button>
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
          background: #2a0411;
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
          cursor: pointer;
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;
          transform: scale(1.02);
          transition: transform 900ms ease;
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
              rgba(23, 0, 8, 0.9) 0%,
              rgba(60, 3, 22, 0.82) 23%,
              rgba(98, 24, 34, 0.56) 45%,
              rgba(127, 52, 41, 0.18) 65%,
              rgba(255, 184, 120, 0.04) 100%
            ),
            radial-gradient(
              circle at 82% 24%,
              rgba(255, 214, 159, 0.28) 0%,
              rgba(255, 214, 159, 0.08) 18%,
              transparent 42%
            ),
            linear-gradient(
              180deg,
              rgba(0, 0, 0, 0.14) 0%,
              rgba(0, 0, 0, 0.26) 100%
            );
          z-index: 1;
        }

        .lux-banner-glow {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            radial-gradient(circle at 72% 55%, rgba(255, 177, 103, 0.22), transparent 24%),
            radial-gradient(circle at 82% 18%, rgba(255, 206, 151, 0.25), transparent 18%),
            radial-gradient(circle at 92% 24%, rgba(255, 209, 164, 0.16), transparent 14%),
            radial-gradient(circle at 87% 70%, rgba(255, 185, 114, 0.12), transparent 16%);
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
          position: relative;
          width: 100%;
          max-width: 540px;
        }

        .lux-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          padding: 0 14px;
          border-radius: 999px;
          margin-bottom: 18px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.26em;
          color: #f1c86b;
          border: 1px solid rgba(241, 200, 107, 0.22);
          background: rgba(59, 0, 16, 0.34);
          backdrop-filter: blur(6px);
        }

        .lux-brand-watermark {
          position: absolute;
          top: -22px;
          left: 0;
          font-size: clamp(2.9rem, 6vw, 5.6rem);
          line-height: 0.95;
          font-family: Georgia, "Times New Roman", serif;
          color: rgba(255, 228, 205, 0.12);
          letter-spacing: 0.03em;
          pointer-events: none;
          user-select: none;
          white-space: nowrap;
          text-transform: uppercase;
        }

        .lux-title {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          margin: 0;
          color: #fff;
          font-family: Georgia, "Times New Roman", serif;
          text-shadow: 0 8px 22px rgba(0, 0, 0, 0.28);
        }

        .lux-title :global(span) {
          margin-top: 2px;
          font-size: clamp(2.8rem, 6vw, 5rem);
          font-weight: 500;
          font-style: italic;
          line-height: 0.95;
          color: #fff8f4;
        }

        .lux-title {
          font-size: clamp(2.6rem, 5vw, 4.6rem);
          font-weight: 700;
          line-height: 0.94;
        }

        .lux-divider {
          width: 320px;
          max-width: 72%;
          height: 1px;
          margin: 18px 0 20px;
          background: linear-gradient(
            90deg,
            rgba(212, 171, 110, 0.9) 0%,
            rgba(212, 171, 110, 0.28) 100%
          );
          position: relative;
        }

        .lux-divider::before {
          content: "✦";
          position: absolute;
          right: -8px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.78rem;
          color: #dcb06d;
          background: transparent;
        }

        .lux-desc {
          max-width: 420px;
          margin: 0 0 26px;
          color: rgba(255, 241, 235, 0.92);
          font-size: 1.08rem;
          line-height: 1.7;
          text-shadow: 0 3px 10px rgba(0, 0, 0, 0.18);
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
          border-radius: 0;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 0.96rem;
          font-weight: 800;
          cursor: pointer;
          transition: 0.22s ease;
        }

        .lux-btn i {
          font-size: 0.92rem;
        }

        .lux-btn.primary {
          background: linear-gradient(135deg, #d10b6e 0%, #f02f83 100%);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 14px 28px rgba(209, 11, 110, 0.3);
        }

        .lux-btn.primary:hover {
          transform: translateY(-2px);
          filter: brightness(1.05);
        }

        .lux-btn.secondary {
          background: rgba(255, 255, 255, 0.04);
          color: #fff;
          border: 1px solid rgba(255, 241, 235, 0.45);
          backdrop-filter: blur(6px);
        }

        .lux-btn.secondary:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.08);
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
          background: rgba(40, 2, 14, 0.5);
          color: #fff;
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
          background: rgba(91, 12, 34, 0.75);
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
          background: rgba(255, 255, 255, 0.42);
          transition: 0.2s ease;
        }

        .lux-dot:hover {
          background: rgba(255, 255, 255, 0.78);
        }

        .lux-dot.active {
          width: 30px;
          background: linear-gradient(135deg, #f02f83 0%, #f1c86b 100%);
        }

        .lux-progress {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 3;
          height: 3px;
          background: rgba(255, 255, 255, 0.08);
          overflow: hidden;
        }

        .lux-progress span {
          display: block;
          width: 100%;
          height: 100%;
          transform-origin: left;
          background: linear-gradient(90deg, #f02f83 0%, #f1c86b 100%);
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
            min-height: 480px;
          }

          .lux-brand-watermark {
            font-size: clamp(2.4rem, 9vw, 4.2rem);
            top: -10px;
          }

          .lux-desc {
            max-width: 100%;
          }
        }

        @media (max-width: 768px) {
          .lux-banner,
          .lux-banner-content {
            min-height: 430px;
          }

          .lux-banner-content {
            padding: 42px 18px 70px;
          }

          .lux-banner-text {
            max-width: 100%;
          }

          .lux-brand-watermark {
            font-size: 2.3rem;
            top: 6px;
            white-space: normal;
            max-width: 90%;
          }

          .lux-title {
            margin-top: 28px;
            font-size: 2.4rem;
            line-height: 0.98;
          }

          .lux-title :global(span) {
            font-size: 3rem;
          }

          .lux-divider {
            width: 190px;
            max-width: 75%;
          }

          .lux-desc {
            font-size: 0.98rem;
            line-height: 1.6;
            margin-bottom: 22px;
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