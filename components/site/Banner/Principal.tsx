"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useBanner from "@/hooks/Banner/useBanner";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";

export default function Banner() {
  // ✅ agora passa a rota pronta
  const { banners, loading, erro } = useBanner(rotas.banners.ativos);

  const [index, setIndex] = useState(0);
  const [isHover, setIsHover] = useState(false);
  const router = useRouter();

  const intervalMs = 5000;
  const timerRef = useRef<number | null>(null);

  const safeBanners = banners || [];
  const hasMany = safeBanners.length > 1;

  // ✅ garante index válido quando banners mudarem
  useEffect(() => {
    if (!safeBanners.length) return;
    setIndex((prev) => Math.min(prev, safeBanners.length - 1));
  }, [safeBanners.length]);

  const banner = safeBanners[index];

  // ✅ monta url correta: baseURL + "/" + caminho sem "//"
  const imagemUrl = useMemo(() => {
    if (!banner?.imagem) return null;

    const base = (api.defaults.baseURL || "").replace(/\/+$/, "");
    const path = String(banner.imagem).replace(/^\/+/, "");
    return `${base}/${path}`;
  }, [banner?.imagem]);

  const goTo = (i: number) => {
    if (!safeBanners.length) return;
    const next = (i + safeBanners.length) % safeBanners.length;
    setIndex(next);
  };

  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  // ✅ view ao trocar banner (se tiver id_banner)
  useEffect(() => {
    if (!banner?.id_banner) return;
    api.put(rotas.banners.incrementarView(banner.id_banner)).catch(() => {});
  }, [banner?.id_banner]);

  const handleClick = async () => {
    if (!banner?.link) return;

    // ✅ incrementa clique (se tiver id_banner)
    if (banner?.id_banner) {
      api.put(rotas.banners.incrementarClick(banner.id_banner)).catch(() => {});
    }

    router.push(banner.link);
  };

  // autoplay (pausa no hover)
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

  // teclado
  useEffect(() => {
    if (!hasMany) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMany, index]);

  if (loading) return <div style={{ height: 460, background: "#eef2f7", borderRadius: 22 }} />;
  if (erro || !safeBanners.length) return null;

  return (
    <>
      <section
        className={`hero ${isHover ? "paused" : ""}`}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        aria-label="Banner principal"
      >
        {/* BG */}
        <div
          className="hero-bg"
          style={{
            backgroundImage: imagemUrl ? `url(${imagemUrl})` : "none",
          }}
          role="img"
          aria-label={banner?.titulo ?? "Banner"}
          onClick={handleClick}
        />

        <div className="hero-overlay" />

        {/* Setas */}
        {hasMany && (
          <>
            <button type="button" className="hero-arrow left" onClick={prev} aria-label="Anterior">
              <i className="bi bi-chevron-left" />
            </button>

            <button type="button" className="hero-arrow right" onClick={next} aria-label="Próximo">
              <i className="bi bi-chevron-right" />
            </button>
          </>
        )}

        {/* Conteúdo */}
        <div className="container hero-inner">
          <div className="row w-100">
            <div className="col-lg-6">
              <div className="hero-card">
                <div className="hero-kicker">
                  <span className="hero-kicker-badge" />
                  Destaque
                </div>

                <h1 className="hero-title">{banner?.titulo}</h1>
                {banner?.descricao && <p className="hero-desc">{banner.descricao}</p>}

                <div className="hero-actions">
                  {banner?.link ? (
                    <button type="button" className="hero-btn primary" onClick={handleClick}>
                      Ver agora <i className="bi bi-arrow-right" />
                    </button>
                  ) : (
                    <span className="hero-btn ghost" style={{ opacity: 0.85 }}>
                      <i className="bi bi-info-circle" /> Sem link
                    </span>
                  )}

                  {hasMany && (
                    <button type="button" className="hero-btn" onClick={next}>
                      Próximo <i className="bi bi-chevron-right" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dots */}
        {hasMany && (
          <div className="hero-dots" aria-label="Seleção de banners">
            {safeBanners.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`hero-dot ${i === index ? "active" : ""}`}
                onClick={() => setIndex(i)}
                aria-label={`Ir para o banner ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Progress */}
        {hasMany && (
          <div className="hero-progress">
            <span />
          </div>
        )}
      </section>

      <style jsx>{`
        :root {
          --rose: #b76e79;
          --roseSoft: #d9a5ad;
          --gold: #d4af37;
          --navy: #0b1220;
          --navySoft: #142445;
        }

        .hero {
          position: relative;
          width: 100%;
          height: 460px;
          border-radius: 22px;
          overflow: hidden;
          background: linear-gradient(135deg, var(--navy) 0%, var(--navySoft) 40%, #2a1c2a 70%, #000 100%);
          box-shadow: 0 30px 80px rgba(2, 6, 23, 0.25);
          isolation: isolate;
        }

        .hero-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          transform: scale(1.04);
          transition: transform 900ms ease;
          filter: saturate(1.05) contrast(1.02);
          cursor: pointer;
        }
        .hero:hover .hero-bg {
          transform: scale(1.1);
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(900px 420px at 20% 40%, rgba(183, 110, 121, 0.45), transparent 60%),
            linear-gradient(90deg, rgba(0, 0, 0, 0.82) 0%, rgba(20, 36, 69, 0.65) 45%, rgba(0, 0, 0, 0.35) 100%);
          z-index: 1;
        }

        .hero-inner {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          align-items: center;
        }

        .hero-card {
          max-width: 560px;
          padding: 26px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(183, 110, 121, 0.35);
          backdrop-filter: blur(14px);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.06);
          animation: fadeIn 420ms ease;
        }

        .hero-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: rgba(243, 215, 220, 0.95);
          margin-bottom: 14px;
        }
        .hero-kicker-badge {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: var(--gold);
          box-shadow: 0 0 0 6px rgba(212, 175, 55, 0.18);
        }

        .hero-title {
          font-size: 2.9rem;
          font-weight: 900;
          line-height: 1.05;
          color: #fff;
          margin: 0 0 12px;
          text-shadow: 0 20px 40px rgba(0, 0, 0, 0.55);
        }

        .hero-desc {
          font-size: 1.05rem;
          margin: 0 0 18px;
          color: rgba(255, 255, 255, 0.88);
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          pointer-events: auto;
        }

        .hero-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: 16px;
          font-weight: 800;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          transition: 0.18s ease;
          user-select: none;
        }
        .hero-btn:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.16);
        }

        .hero-btn.primary {
          background: linear-gradient(135deg, var(--rose), var(--roseSoft));
          border: none;
          color: #1a0f12;
          box-shadow: 0 18px 40px rgba(183, 110, 121, 0.45);
        }
        .hero-btn.primary:hover {
          filter: brightness(1.06);
        }

        .hero-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 3;
          width: 44px;
          height: 44px;
          border-radius: 16px;
          border: 1px solid rgba(183, 110, 121, 0.35);
          background: rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(10px);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.18s ease;
          opacity: 0;
          pointer-events: none;
        }
        .hero:hover .hero-arrow {
          opacity: 1;
          pointer-events: auto;
        }
        .hero-arrow:hover {
          background: rgba(0, 0, 0, 0.33);
          transform: translateY(-50%) scale(1.02);
        }
        .hero-arrow.left {
          left: 14px;
        }
        .hero-arrow.right {
          right: 14px;
        }

        .hero-dots {
          position: absolute;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(183, 110, 121, 0.35);
          backdrop-filter: blur(10px);
          z-index: 3;
        }
        .hero-dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.45);
          border: none;
          transition: 0.2s ease;
          cursor: pointer;
        }
        .hero-dot:hover {
          background: rgba(255, 255, 255, 0.7);
        }
        .hero-dot.active {
          width: 26px;
          background: linear-gradient(135deg, var(--gold), var(--rose));
        }

        .hero-progress {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 4px;
          background: rgba(255, 255, 255, 0.12);
          z-index: 3;
          overflow: hidden;
        }
        .hero-progress > span {
          display: block;
          height: 100%;
          width: 100%;
          transform-origin: left;
          background: linear-gradient(135deg, var(--rose), var(--gold));
          animation: progress ${intervalMs}ms linear infinite;
        }
        .paused .hero-progress > span {
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
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .hero {
            height: 360px;
            border-radius: 18px;
          }
          .hero-title {
            font-size: 2.05rem;
          }
          .hero-card {
            margin: 0 12px;
          }
          .hero-arrow {
            opacity: 1;
            pointer-events: auto;
          }
        }
      `}</style>
    </>
  );
}