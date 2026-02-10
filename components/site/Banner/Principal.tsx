'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useBanner from "@/hooks/Banner/useBanner";
import api from "@/Api/conectar"; // 🔹 import do Axios

export default function Banner() {
  const { banners, loading, erro } = useBanner("ativos");
  const [index, setIndex] = useState(0);
  const router = useRouter();

  // Autoplay
  useEffect(() => {
    if (!banners || banners.length <= 1) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners]);

  if (loading) return <div style={{ height: 420, background: "#eee" }} />;
  if (erro || !banners?.length) return null;

  const banner = banners[index];

  // Monta URL completa da imagem
  const imagemUrl = banner.imagem
    ? `${api.defaults.baseURL}${banner.imagem.replace(/^\/+/, "")}`
    : null;

  const handleClick = () => {
    if (banner.link) {
      router.push(banner.link);
    }
  };

  return (
    <>
      <style jsx>{`
        .hero-banner {
          position: relative;
          width: 100%;
          height: 420px;
          background-size: cover;
          background-position: center;
          cursor: pointer;
        }
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.75) 0%,
            rgba(183, 110, 121, 0.55) 45%,
            rgba(212, 175, 55, 0.35) 100%
          );
        }
        .hero-content {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          align-items: center;
          pointer-events: none;
        }
        .hero-text {
          max-width: 520px;
          color: #fff;
        }
        .hero-title {
          font-size: 2.8rem;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 12px;
        }
        .hero-desc {
          font-size: 1.05rem;
          opacity: 0.9;
        }
        .hero-dots {
          position: absolute;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 3;
        }
        .hero-dot {
          width: 10px;
          height: 10px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 50%;
        }
        .hero-dot.active {
          width: 28px;
          border-radius: 20px;
          background: #d4af37;
        }
        @media (max-width: 768px) {
          .hero-banner {
            height: 340px;
          }
          .hero-title {
            font-size: 2rem;
          }
        }
      `}</style>

      <section
        className="hero-banner"
        style={{ backgroundImage: `url(${imagemUrl})` }}
        onClick={handleClick}
      >
        <div className="hero-overlay" />

        <div className="container hero-content">
          <div className="row w-100">
            <div className="col-md-6">
              <div className="hero-text">
                <h1 className="hero-title">{banner.titulo}</h1>
                <p className="hero-desc">{banner.descricao}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-dots">
          {banners.map((_, i) => (
            <div
              key={i}
              className={`hero-dot ${i === index ? "active" : ""}`}
            />
          ))}
        </div>
      </section>
    </>
  );
}
