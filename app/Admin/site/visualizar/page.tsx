"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";

type SiteConfig = {
  id_site_config: number;
  nome_site: string;
  titulo: string;
  subtitulo: string;
  logo: string;
  favicon: string;
};

export default function VisualizarSitePage() {
  const router = useRouter();

  const [sites, setSites] = useState<SiteConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarSites() {
      try {
        setLoading(true);
        setErro(null);

        const response = await api.get("/painel/site/visualizar", {
          withCredentials: true,
        });

        const data = response.data;

        setSites(data?.dados?.dados?.sites || []);
      } catch (error: any) {
        console.error(
          "Erro ao carregar site_config:",
          error?.response?.data || error
        );

        setErro(
          error?.response?.data?.mensagem ||
            error?.message ||
            "Erro ao carregar configurações do site."
        );
        setSites([]);
      } finally {
        setLoading(false);
      }
    }

    carregarSites();
  }, []);

  function abrirEdicao(site: SiteConfig) {
    router.push(`/Admin/site/editar?id=${site.id_site_config}`);
  }

  function isImageUrl(url?: string) {
    if (!url) return false;
    return /^https?:\/\/|^\//i.test(url);
  }

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-content">
          <span className="badge">Configuração do Site</span>
          <h1>Visualizar Configurações</h1>
          <p>
            Gerencie nome, identidade visual, logo, favicon e outras
            informações principais do site.
          </p>
        </div>

        <button
          type="button"
          className="hero-edit-button"
          onClick={() => {
            if (sites[0]) abrirEdicao(sites[0]);
          }}
          disabled={!sites.length}
        >
          <span>✏</span>
          <span>Editar configuração</span>
        </button>
      </section>

      {loading && (
        <div className="loading-card">
          <div className="loader" />
          <p>Carregando dados do site...</p>
        </div>
      )}

      {erro && <div className="error">{erro}</div>}

      {!loading && !erro && sites.length > 0 && (
        <div className="grid">
          {sites.map((site) => (
            <article className="card" key={site.id_site_config}>
              <div className="card-top">
                <div className="card-title-area">
                  <div className="card-icon">🌐</div>

                  <div>
                    <span className="card-kicker">Site Config</span>
                    <h2>{site.nome_site || "Sem nome"}</h2>
                  </div>
                </div>

                <button
                  type="button"
                  className="edit-button"
                  onClick={() => abrirEdicao(site)}
                  title="Editar configuração"
                >
                  <span>✏</span>
                  <span>Editar</span>
                </button>
              </div>

              <div className="id-row">
                <span>ID #{site.id_site_config}</span>
              </div>

              <div className="preview-grid">
                <div className="preview-box">
                  <p className="preview-label">Logo</p>

                  {isImageUrl(site.logo) ? (
                    <div className="image-preview">
                      <img src={site.logo} alt="Logo do site" />
                    </div>
                  ) : (
                    <div className="image-empty">Sem preview</div>
                  )}

                  <small>{site.logo || "-"}</small>
                </div>

                <div className="preview-box">
                  <p className="preview-label">Favicon</p>

                  {isImageUrl(site.favicon) ? (
                    <div className="image-preview favicon-preview">
                      <img src={site.favicon} alt="Favicon do site" />
                    </div>
                  ) : (
                    <div className="image-empty">Sem preview</div>
                  )}

                  <small>{site.favicon || "-"}</small>
                </div>
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Nome do site</span>
                  <strong>{site.nome_site || "-"}</strong>
                </div>

                <div className="info-item">
                  <span className="label">Título</span>
                  <strong>{site.titulo || "-"}</strong>
                </div>

                <div className="info-item full">
                  <span className="label">Subtítulo</span>
                  <p>{site.subtitulo || "-"}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !erro && sites.length === 0 && (
        <div className="empty">
          <div className="empty-icon">📄</div>
          <h3>Nenhuma configuração encontrada</h3>
          <p>
            Ainda não existe nenhum registro em <strong>site_config</strong>.
          </p>

          <button
            type="button"
            className="empty-button"
            onClick={() => router.push("/Admin/site/cadastrar")}
          >
            <span>＋</span>
            <span>Cadastrar configuração</span>
          </button>
        </div>
      )}

      <style jsx>{`
        .page {
          display: flex;
          flex-direction: column;
          gap: 26px;
        }

        .hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 30px;
          border-radius: 30px;
          background:
            radial-gradient(circle at top right, rgba(255, 255, 255, 0.14), transparent 30%),
            linear-gradient(135deg, #2563eb 0%, #1d4ed8 52%, #4338ca 100%);
          color: #fff;
          box-shadow: 0 20px 50px rgba(37, 99, 235, 0.24);
        }

        .hero-content {
          max-width: 760px;
        }

        .badge {
          display: inline-block;
          margin-bottom: 12px;
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .hero h1 {
          margin: 0 0 10px 0;
          font-size: 34px;
          line-height: 1.08;
        }

        .hero p {
          margin: 0;
          max-width: 650px;
          color: rgba(255, 255, 255, 0.92);
          font-size: 15px;
          line-height: 1.6;
        }

        .hero-edit-button {
          border: none;
          border-radius: 18px;
          padding: 14px 18px;
          background: rgba(255, 255, 255, 0.14);
          color: #fff;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .hero-edit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.2);
        }

        .hero-edit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 20px;
          border-radius: 18px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.05);
        }

        .loading-card p {
          margin: 0;
          color: #475569;
          font-size: 14px;
        }

        .loader {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid #cbd5e1;
          border-top-color: #2563eb;
          animation: spin 0.8s linear infinite;
          flex-shrink: 0;
        }

        .error {
          color: #b91c1c;
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 16px;
          padding: 14px 16px;
          font-size: 14px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 22px;
        }

        .card {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 50px rgba(15, 23, 42, 0.1);
        }

        .card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 12px;
        }

        .card-title-area {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .card-icon {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          color: #1d4ed8;
          font-size: 26px;
          flex-shrink: 0;
        }

        .card-kicker {
          display: inline-block;
          margin-bottom: 6px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #2563eb;
        }

        .card-title-area h2 {
          margin: 0;
          font-size: 24px;
          color: #0f172a;
          line-height: 1.2;
          word-break: break-word;
        }

        .edit-button {
          border: none;
          border-radius: 16px;
          padding: 11px 14px;
          background: #0f172a;
          color: #fff;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .edit-button:hover {
          transform: translateY(-1px);
          background: #1e293b;
        }

        .id-row {
          margin-bottom: 20px;
        }

        .id-row span {
          display: inline-flex;
          align-items: center;
          padding: 7px 11px;
          border-radius: 999px;
          background: #f8fafc;
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid #e2e8f0;
        }

        .preview-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 18px;
        }

        .preview-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 16px;
        }

        .preview-label {
          margin: 0 0 12px 0;
          font-size: 13px;
          font-weight: 700;
          color: #334155;
        }

        .image-preview {
          height: 110px;
          border-radius: 16px;
          background: #fff;
          border: 1px dashed #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .image-preview img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .favicon-preview img {
          width: 42px;
          height: 42px;
          object-fit: contain;
        }

        .image-empty {
          height: 110px;
          border-radius: 16px;
          background: #fff;
          border: 1px dashed #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-size: 13px;
          margin-bottom: 10px;
        }

        .preview-box small {
          display: block;
          color: #64748b;
          font-size: 12px;
          word-break: break-all;
          line-height: 1.45;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .info-item {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 16px;
        }

        .info-item.full {
          grid-column: 1 / -1;
        }

        .label {
          display: block;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: #64748b;
        }

        .info-item strong {
          display: block;
          color: #0f172a;
          font-size: 16px;
          line-height: 1.45;
          word-break: break-word;
        }

        .info-item p {
          margin: 0;
          color: #334155;
          line-height: 1.6;
          word-break: break-word;
        }

        .empty {
          background: rgba(255, 255, 255, 0.96);
          border: 1px dashed #cbd5e1;
          border-radius: 24px;
          padding: 34px 24px;
          text-align: center;
          color: #64748b;
        }

        .empty-icon {
          font-size: 42px;
          margin-bottom: 12px;
        }

        .empty h3 {
          margin: 0 0 8px 0;
          color: #0f172a;
          font-size: 22px;
        }

        .empty p {
          margin: 0 0 18px 0;
        }

        .empty-button {
          border: none;
          border-radius: 16px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #fff;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          .hero {
            flex-direction: column;
            align-items: flex-start;
          }

          .hero-edit-button {
            width: 100%;
            justify-content: center;
          }

          .grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .hero {
            padding: 22px;
            border-radius: 22px;
          }

          .hero h1 {
            font-size: 28px;
          }

          .card {
            padding: 18px;
            border-radius: 22px;
          }

          .card-top {
            flex-direction: column;
            align-items: stretch;
          }

          .edit-button {
            width: 100%;
            justify-content: center;
          }

          .preview-grid,
          .info-grid {
            grid-template-columns: 1fr;
          }

          .image-preview,
          .image-empty {
            height: 100px;
          }
        }
      `}</style>
    </div>
  );
}