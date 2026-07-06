"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { imagemFundo } from "@/components/Bibioteca/imagem";
import { useBanner } from "./useBanner";
import "../../styles/banner.css";

export default function Banner() {
  const router = useRouter();
  const { banners, banner, index, setIndex, loading } = useBanner();

  if (loading) {
    return <section className="banner-loading" />;
  }

  if (!banner) {
    return null;
  }

  const imagem = imagemFundo(banner.imagem);
  const link = banner.link?.trim() || "";

  function abrirLink() {
    if (!link) return;

    if (link.startsWith("http://") || link.startsWith("https://")) {
      window.open(link, "_blank", "noopener,noreferrer");
      return;
    }

    router.push(link);
  }

  return (
    <section className="banner-home">
      <div className="banner-container">
        <div className="banner-content">
          <span className="banner-badge">Universo Império</span>

          <h1>{banner.titulo}</h1>

          <p>
            {banner.descricao ||
              "Promoções, lançamentos e ofertas especiais."}
          </p>

          {link && (
            <button type="button" className="banner-button" onClick={abrirLink}>
              Comprar agora
              <span>→</span>
            </button>
          )}
        </div>

        <button
          type="button"
          className="banner-image-area"
          onClick={abrirLink}
          disabled={!link}
          aria-label={link ? `Abrir ${banner.titulo}` : banner.titulo}
        >
          <Image
            src={imagem}
            alt={banner.titulo}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 50vw"
            className="banner-image"
          />
        </button>
      </div>

      {banners.length > 1 && (
        <div className="banner-dots">
          {banners.map((item, i) => (
            <button
              key={item.id_banner}
              type="button"
              className={`banner-dot ${i === index ? "active" : ""}`}
              onClick={() => setIndex(i)}
              aria-label={`Ir para o banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}