"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Eye,
  MousePointerClick,
  Pencil,
  Trash2,
  ImageIcon,
  ExternalLink,
  Plus,
  Search,
  RefreshCcw,
} from "lucide-react";

type Banner = {
  id?: number;
  id_banner?: number;
  titulo: string;
  descricao: string;
  imagem: string;
  link?: string | null;
  statusid?: number;
  status_id?: number;
  visualizacoes?: number;
  cliques?: number;
  criado?: string;
  atualizado?: string;
};

const api = axios.create({
  baseURL: "https://lightgrey-cattle-160990.hostingersite.com",
  withCredentials: true,
});

function getBannerId(banner: Banner) {
  return banner.id_banner ?? banner.id ?? 0;
}

function getStatusLabel(status?: number) {
  if (status === 1) return "Ativo";
  if (status === 2) return "Inativo";
  if (status === 3) return "Bloqueado";
  return "Sem status";
}

function getStatusClass(status?: number) {
  if (status === 1) return "ativo";
  if (status === 2) return "inativo";
  if (status === 3) return "bloqueado";
  return "padrao";
}

function resolveImageUrl(src?: string) {
  if (!src) return "";

  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  const clean = src.replace(/^\/+/, "");
  return `https://lightgrey-cattle-160990.hostingersite.com/${clean}`;
}

function formatarData(data?: string) {
  if (!data) return "—";

  const dt = new Date(data.replace(" ", "T"));
  if (Number.isNaN(dt.getTime())) return data;

  return dt.toLocaleString("pt-BR");
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");

  async function carregarBanners() {
    try {
      setCarregando(true);
      setErro("");

      const response = await api.get("/painel/banners");

      const lista = Array.isArray(response.data?.dados)
        ? response.data.dados
        : [];

      setBanners(lista);
    } catch (error: any) {
      console.error("Erro ao carregar banners:", error);
      setErro(
        error?.response?.data?.mensagem ||
          "Não foi possível carregar os banners."
      );
      setBanners([]);
    } finally {
      setCarregando(false);
    }
  }

  async function excluirBanner(id: number) {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este banner?"
    );

    if (!confirmar) return;

    try {
      await api.delete(`/painel/banner/${id}`);
      setBanners((prev) => prev.filter((banner) => getBannerId(banner) !== id));
    } catch (error: any) {
      console.error("Erro ao excluir banner:", error);
      alert(
        error?.response?.data?.mensagem ||
          "Não foi possível excluir o banner."
      );
    }
  }

  useEffect(() => {
    carregarBanners();
  }, []);

  const bannersFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return banners;

    return banners.filter((banner) => {
      const titulo = banner.titulo?.toLowerCase() || "";
      const descricao = banner.descricao?.toLowerCase() || "";
      const link = banner.link?.toLowerCase() || "";

      return (
        titulo.includes(termo) ||
        descricao.includes(termo) ||
        link.includes(termo)
      );
    });
  }, [banners, busca]);

  return (
    <div className="pagina-banners">
      <div className="topo">
        <div>
          <p className="subtitulo">Painel administrativo</p>
          <h1>Banners</h1>
          <span className="descricao-topo">
            Gerencie os banners cadastrados em cards.
          </span>
        </div>

        <div className="acoes-topo">
          <button className="botao-secundario" onClick={carregarBanners}>
            <RefreshCcw size={18} />
            Atualizar
          </button>

          <a href="/Admin/banners/novo" className="botao-primario">
            <Plus size={18} />
            Novo banner
          </a>
        </div>
      </div>

      <div className="barra-filtros">
        <div className="campo-busca">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por título, descrição ou link..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="contador">
          {carregando ? "Carregando..." : `${bannersFiltrados.length} banner(s)`}
        </div>
      </div>

      {carregando && (
        <div className="estado estado-carregando">
          <div className="loader" />
          <p>Carregando banners...</p>
        </div>
      )}

      {!carregando && erro && (
        <div className="estado estado-erro">
          <p>{erro}</p>
        </div>
      )}

      {!carregando && !erro && bannersFiltrados.length === 0 && (
        <div className="estado estado-vazio">
          <ImageIcon size={42} />
          <h3>Nenhum banner encontrado</h3>
          <p>Cadastre um novo banner ou ajuste sua busca.</p>
        </div>
      )}

      {!carregando && !erro && bannersFiltrados.length > 0 && (
        <div className="grid-banners">
          {bannersFiltrados.map((banner) => {
            const id = getBannerId(banner);
            const imagemUrl = resolveImageUrl(banner.imagem);
            const status = banner.statusid ?? banner.status_id;

            return (
              <div className="card-banner" key={id}>
                <div className="imagem-wrap">
                  {imagemUrl ? (
                    <img
                      src={imagemUrl}
                      alt={banner.titulo}
                      className="imagem-banner"
                    />
                  ) : (
                    <div className="imagem-placeholder">
                      <ImageIcon size={34} />
                      <span>Sem imagem</span>
                    </div>
                  )}

                  <span className={`status ${getStatusClass(status)}`}>
                    {getStatusLabel(status)}
                  </span>
                </div>

                <div className="conteudo-card">
                  <div className="cabecalho-card">
                    <h2>{banner.titulo}</h2>
                    <span className="id-banner">#{id}</span>
                  </div>

                  <p className="descricao-banner">
                    {banner.descricao || "Sem descrição."}
                  </p>

                  <div className="metricas">
                    <div className="metrica">
                      <Eye size={16} />
                      <span>{banner.visualizacoes ?? 0} visualizações</span>
                    </div>

                    <div className="metrica">
                      <MousePointerClick size={16} />
                      <span>{banner.cliques ?? 0} cliques</span>
                    </div>
                  </div>

                  <div className="infos">
                    <div>
                      <strong>Criado:</strong> {formatarData(banner.criado)}
                    </div>
                    <div>
                      <strong>Atualizado:</strong> {formatarData(banner.atualizado)}
                    </div>
                  </div>

                  {banner.link && (
                    <a
                      className="link-banner"
                      href={banner.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink size={16} />
                      Abrir link do banner
                    </a>
                  )}

                  <div className="acoes-card">
                    <a href={`/Admin/banners/${id}`} className="botao-card editar">
                      <Pencil size={16} />
                      Editar
                    </a>

                    <button
                      className="botao-card excluir"
                      onClick={() => excluirBanner(id)}
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .pagina-banners {
          min-height: 100vh;
          padding: 24px;
          background:
            radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 25%),
            radial-gradient(circle at top right, rgba(236, 72, 153, 0.08), transparent 25%),
            #f8fafc;
        }

        .topo {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .subtitulo {
          margin: 0 0 6px;
          color: #64748b;
          font-size: 14px;
          font-weight: 600;
        }

        h1 {
          margin: 0;
          font-size: 32px;
          color: #0f172a;
        }

        .descricao-topo {
          display: inline-block;
          margin-top: 8px;
          color: #475569;
        }

        .acoes-topo {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .botao-primario,
        .botao-secundario {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          border-radius: 14px;
          padding: 12px 16px;
          text-decoration: none;
          cursor: pointer;
          font-weight: 600;
          transition: 0.2s ease;
        }

        .botao-primario {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          box-shadow: 0 12px 30px rgba(37, 99, 235, 0.22);
        }

        .botao-secundario {
          background: white;
          color: #0f172a;
          border: 1px solid #e2e8f0;
        }

        .botao-primario:hover,
        .botao-secundario:hover {
          transform: translateY(-1px);
        }

        .barra-filtros {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 20px;
          padding: 16px;
        }

        .campo-busca {
          flex: 1;
          min-width: 260px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 0 14px;
        }

        .campo-busca input {
          width: 100%;
          border: none;
          outline: none;
          padding: 14px 0;
          background: transparent;
          font-size: 14px;
        }

        .contador {
          font-size: 14px;
          font-weight: 700;
          color: #334155;
          white-space: nowrap;
        }

        .estado {
          background: white;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          padding: 42px 20px;
          text-align: center;
          color: #475569;
        }

        .estado-erro {
          color: #b91c1c;
          background: #fff1f2;
          border-color: #fecdd3;
        }

        .estado-vazio h3 {
          margin: 12px 0 6px;
          color: #0f172a;
        }

        .estado-carregando .loader {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          margin: 0 auto 12px;
          border: 4px solid #dbeafe;
          border-top-color: #2563eb;
          animation: spin 0.8s linear infinite;
        }

        .grid-banners {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 22px;
        }

        .card-banner {
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(226, 232, 240, 0.95);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
          transition: 0.25s ease;
        }

        .card-banner:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
        }

        .imagem-wrap {
          position: relative;
          width: 100%;
          height: 220px;
          background: #e2e8f0;
        }

        .imagem-banner {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .imagem-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 8px;
          color: #64748b;
          background: linear-gradient(135deg, #e2e8f0, #f8fafc);
        }

        .status {
          position: absolute;
          top: 14px;
          right: 14px;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          backdrop-filter: blur(10px);
        }

        .status.ativo {
          background: rgba(34, 197, 94, 0.15);
          color: #166534;
          border: 1px solid rgba(34, 197, 94, 0.25);
        }

        .status.inativo {
          background: rgba(245, 158, 11, 0.15);
          color: #92400e;
          border: 1px solid rgba(245, 158, 11, 0.25);
        }

        .status.bloqueado {
          background: rgba(239, 68, 68, 0.15);
          color: #991b1b;
          border: 1px solid rgba(239, 68, 68, 0.25);
        }

        .status.padrao {
          background: rgba(148, 163, 184, 0.18);
          color: #334155;
          border: 1px solid rgba(148, 163, 184, 0.25);
        }

        .conteudo-card {
          padding: 20px;
        }

        .cabecalho-card {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }

        .cabecalho-card h2 {
          margin: 0;
          color: #0f172a;
          font-size: 20px;
          line-height: 1.3;
        }

        .id-banner {
          flex-shrink: 0;
          background: #eff6ff;
          color: #1d4ed8;
          border-radius: 10px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .descricao-banner {
          margin: 0 0 16px;
          color: #475569;
          line-height: 1.6;
          min-height: 48px;
        }

        .metricas {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        .metrica {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 12px;
          color: #334155;
          font-size: 14px;
          font-weight: 600;
        }

        .infos {
          display: grid;
          gap: 8px;
          margin-bottom: 16px;
          font-size: 13px;
          color: #475569;
        }

        .link-banner {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #2563eb;
          font-weight: 700;
          margin-bottom: 18px;
        }

        .acoes-card {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .botao-card {
          flex: 1;
          min-width: 130px;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          border-radius: 14px;
          padding: 12px 14px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          text-decoration: none;
          transition: 0.2s ease;
        }

        .botao-card.editar {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }

        .botao-card.excluir {
          background: #fff1f2;
          color: #be123c;
          border: 1px solid #fecdd3;
        }

        .botao-card:hover {
          transform: translateY(-1px);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .pagina-banners {
            padding: 16px;
          }

          h1 {
            font-size: 26px;
          }

          .grid-banners {
            grid-template-columns: 1fr;
          }

          .metricas {
            grid-template-columns: 1fr;
          }

          .acoes-card {
            flex-direction: column;
          }

          .botao-card {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}