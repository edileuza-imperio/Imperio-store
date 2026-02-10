'use client';

import { useRouter } from "next/navigation";
import { FaPlus, FaTrash, FaEye, FaMousePointer } from "react-icons/fa";
import useBanner from "@/hooks/Banner/painelbanner";
import api from "@/Api/conectar";

export default function BannersPage() {
  const router = useRouter();
  const { banners, loading, removerBanner } = useBanner();

  const imagemUrl = (img?: string) =>
    img ? `${api.defaults.baseURL}${img.replace(/^\/+/, "")}` : "";

  if (loading) {
    return (
      <div className="container py-5">
        <div className="placeholder-glow">
          <div className="placeholder col-12" style={{ height: 180 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Banners</h2>
          <p className="text-muted mb-0">
            Gerencie os banners exibidos no site
          </p>
        </div>

        <button
          className="btn btn-warning fw-bold d-flex align-items-center gap-2"
          onClick={() => router.push("/admin/banners/novo")}
        >
          <FaPlus /> Novo Banner
        </button>
      </div>

      {/* GRID */}
      <div className="row g-4">
        {banners.length === 0 && (
          <p className="text-muted">Nenhum banner cadastrado.</p>
        )}

        {banners.map((banner) => (
          <div key={banner.id_banner} className="col-12 col-md-6 col-lg-4">
            <div className="card h-100 border-0 shadow-lg rounded-4 overflow-hidden banner-card">
              
              {/* IMAGEM */}
              <div className="banner-img">
                {banner.imagem && (
                  <img
                    src={imagemUrl(banner.imagem)}
                    alt={banner.titulo}
                  />
                )}
              </div>

              {/* CONTEÚDO */}
              <div className="card-body d-flex flex-column">
                <h5 className="fw-bold mb-2">{banner.titulo}</h5>

                {banner.descricao && (
                  <p className="text-muted small mb-3">
                    {banner.descricao}
                  </p>
                )}

                {/* MÉTRICAS */}
                <div className="d-flex gap-3 text-muted small mb-3">
                  <span className="d-flex align-items-center gap-1">
                    <FaEye /> {banner.visualizacoes}
                  </span>
                  <span className="d-flex align-items-center gap-1">
                    <FaMousePointer /> {banner.cliques}
                  </span>
                </div>

                {/* STATUS */}
                {banner.status && (
                  <span
                    className="badge align-self-start mb-3"
                    style={{
                      backgroundColor: banner.status.cor || "#6b4c4f"
                    }}
                  >
                    {banner.status.nome}
                  </span>
                )}

                {/* AÇÕES */}
                <div className="mt-auto d-flex gap-2">
                  {banner.link && (
                    <button
                      className="btn btn-outline-primary w-100"
                      onClick={() => window.open(banner.link!, "_blank")}
                    >
                      Ver
                    </button>
                  )}

                  <button
                    className="btn btn-outline-danger"
                    onClick={() => removerBanner(banner.id_banner)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CSS LOCAL */}
      <style jsx>{`
        .banner-card {
          transition: transform .3s, box-shadow .3s;
        }

        .banner-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 25px 60px rgba(0,0,0,.18);
        }

        .banner-img {
          height: 180px;
          overflow: hidden;
        }

        .banner-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform .4s;
        }

        .banner-card:hover .banner-img img {
          transform: scale(1.08);
        }
      `}</style>
    </div>
  );
}
