"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  Eye,
  MousePointerClick,
  Pencil,
  Trash2,
  Image as ImageIcon,
  RefreshCw,
  Plus,
  Search,
  Save,
  X,
  UploadCloud,
} from "lucide-react";
import api from "@/Api/conectar";

type Banner = {
  id_banner?: number;
  id?: number;
  titulo?: string;
  descricao?: string;
  imagem?: string;
  link?: string | null;
  statusid?: number;
  status_id?: number;
  visualizacoes?: number;
  cliques?: number;
  criado?: string;
  atualizado?: string;
};

type EditForm = {
  titulo: string;
  descricao: string;
  link: string;
  statusid: string;
  visualizacoes: string;
  cliques: string;
};

function getBannerId(banner: Banner): number {
  return Number(banner.id_banner ?? banner.id ?? 0);
}

function getImagemUrl(imagem?: string): string {
  if (!imagem) return "";

  if (imagem.startsWith("http://") || imagem.startsWith("https://")) {
    return imagem;
  }

  const caminho = imagem.replace(/^\/+/, "");
  return `https://lightgrey-cattle-160990.hostingersite.com/${caminho}`;
}

function formatarData(data?: string): string {
  if (!data) return "-";

  const normalizada = data.replace(" ", "T");
  const dt = new Date(normalizada);

  if (Number.isNaN(dt.getTime())) return data;

  return dt.toLocaleString("pt-BR");
}

function getStatusTexto(status?: number): string {
  if (status === 1) return "Ativo";
  if (status === 2) return "Inativo";
  if (status === 3) return "Bloqueado";
  return "Sem status";
}

function criarFormDoBanner(banner: Banner): EditForm {
  return {
    titulo: banner.titulo || "",
    descricao: banner.descricao || "",
    link: banner.link || "",
    statusid: String(banner.statusid ?? banner.status_id ?? 1),
    visualizacoes: String(banner.visualizacoes ?? 0),
    cliques: String(banner.cliques ?? 0),
  };
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [imagemArquivo, setImagemArquivo] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState("");
  const [salvandoId, setSalvandoId] = useState<number | null>(null);

  const carregarBanners = async () => {
    try {
      setLoading(true);
      setErro("");

      const response = await api.get("/painel/banners");

      const lista = Array.isArray(response.data?.dados?.dados)
        ? response.data.dados.dados
        : [];

      setBanners(lista);
    } catch (error: any) {
      console.error("Erro ao carregar banners:", error);
      setErro(error?.response?.data?.mensagem || "Erro ao carregar banners.");
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const excluirBanner = async (id: number) => {
    const confirmar = window.confirm("Deseja excluir este banner?");
    if (!confirmar) return;

    try {
      await api.delete(`/painel/banner/${id}`);
      setBanners((prev) => prev.filter((banner) => getBannerId(banner) !== id));

      if (editandoId === id) {
        cancelarEdicao();
      }
    } catch (error: any) {
      console.error("Erro ao excluir banner:", error);
      alert(error?.response?.data?.mensagem || "Erro ao excluir banner.");
    }
  };

  const iniciarEdicao = (banner: Banner) => {
    const id = getBannerId(banner);
    setEditandoId(id);
    setEditForm(criarFormDoBanner(banner));
    setImagemArquivo(null);
    setPreviewImagem(getImagemUrl(banner.imagem));
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setEditForm(null);
    setImagemArquivo(null);
    setPreviewImagem("");
  };

  const handleEditChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setEditForm((prev) =>
      prev
        ? {
            ...prev,
            [name]: value,
          }
        : prev
    );
  };

  const handleImagemChange = (e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0] || null;
    setImagemArquivo(arquivo);

    if (!arquivo) {
      return;
    }

    const url = URL.createObjectURL(arquivo);
    setPreviewImagem(url);
  };

  const salvarEdicao = async (id: number) => {
    if (!editForm) return;

    if (!editForm.titulo.trim()) {
      alert("O título é obrigatório.");
      return;
    }

    if (!editForm.descricao.trim()) {
      alert("A descrição é obrigatória.");
      return;
    }

    try {
      setSalvandoId(id);

      const formData = new FormData();
      formData.append("titulo", editForm.titulo.trim());
      formData.append("descricao", editForm.descricao.trim());
      formData.append("link", editForm.link.trim());
      formData.append("statusid", editForm.statusid);
      formData.append("visualizacoes", editForm.visualizacoes || "0");
      formData.append("cliques", editForm.cliques || "0");

      if (imagemArquivo) {
        formData.append("imagem", imagemArquivo);
      }

      await api.post(`/painel/banner/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await carregarBanners();
      cancelarEdicao();
    } catch (error: any) {
      console.error("Erro ao atualizar banner:", error);
      alert(error?.response?.data?.mensagem || "Erro ao atualizar banner.");
    } finally {
      setSalvandoId(null);
    }
  };

  useEffect(() => {
    carregarBanners();
  }, []);

  const bannersFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return banners;

    return banners.filter((banner) => {
      const titulo = (banner.titulo || "").toLowerCase();
      const descricao = (banner.descricao || "").toLowerCase();
      const link = (banner.link || "").toLowerCase();

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
          <span className="subtitulo">Painel administrativo</span>
          <h1>Banners</h1>
          <p>Gerencie seus banners em cards com edição inline.</p>
        </div>

        <div className="acoes-topo">
          <button
            onClick={carregarBanners}
            className="btn-secundario"
            type="button"
          >
            <RefreshCw size={18} />
            Atualizar
          </button>

          <a href="/Admin/banners/cadastrar" className="btn-primario">
            <Plus size={18} />
            Novo banner
          </a>
        </div>
      </div>

      <div className="barra">
        <div className="campo-busca">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar banner..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="contador">
          {loading ? "Carregando..." : `${bannersFiltrados.length} banner(s)`}
        </div>
      </div>

      {loading && (
        <div className="estado">
          <p>Carregando banners...</p>
        </div>
      )}

      {!loading && erro && (
        <div className="estado erro">
          <p>{erro}</p>
        </div>
      )}

      {!loading && !erro && bannersFiltrados.length === 0 && (
        <div className="estado vazio">
          <ImageIcon size={42} />
          <h3>Nenhum banner encontrado</h3>
          <p>Cadastre um banner ou ajuste a busca.</p>
        </div>
      )}

      {!loading && !erro && bannersFiltrados.length > 0 && (
        <div className="grid">
          {bannersFiltrados.map((banner) => {
            const id = getBannerId(banner);
            const imagemUrl = getImagemUrl(banner.imagem);
            const status = banner.statusid ?? banner.status_id;
            const estaEditando = editandoId === id;

            return (
              <div key={id} className="card">
                <div className="imagem-box">
                  {estaEditando ? (
                    <>
                      {previewImagem ? (
                        <img
                          src={previewImagem}
                          alt={editForm?.titulo || "Banner"}
                          className="imagem"
                        />
                      ) : (
                        <div className="sem-imagem">
                          <ImageIcon size={36} />
                          <span>Sem imagem</span>
                        </div>
                      )}

                      <label className="trocar-imagem">
                        <UploadCloud size={16} />
                        Trocar imagem
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImagemChange}
                          hidden
                        />
                      </label>
                    </>
                  ) : imagemUrl ? (
                    <img
                      src={imagemUrl}
                      alt={banner.titulo || "Banner"}
                      className="imagem"
                    />
                  ) : (
                    <div className="sem-imagem">
                      <ImageIcon size={36} />
                      <span>Sem imagem</span>
                    </div>
                  )}

                  <span className="status">
                    {estaEditando
                      ? getStatusTexto(Number(editForm?.statusid || 1))
                      : getStatusTexto(status)}
                  </span>
                </div>

                <div className="conteudo">
                  {estaEditando && editForm ? (
                    <>
                      <div className="cabecalho-card">
                        <h2>Editando banner</h2>
                        <span className="id">#{id}</span>
                      </div>

                      <div className="form-grid">
                        <div className="grupo">
                          <label>Título</label>
                          <input
                            name="titulo"
                            type="text"
                            value={editForm.titulo}
                            onChange={handleEditChange}
                          />
                        </div>

                        <div className="grupo">
                          <label>Descrição</label>
                          <textarea
                            name="descricao"
                            rows={4}
                            value={editForm.descricao}
                            onChange={handleEditChange}
                          />
                        </div>

                        <div className="grupo">
                          <label>Link</label>
                          <input
                            name="link"
                            type="text"
                            value={editForm.link}
                            onChange={handleEditChange}
                          />
                        </div>

                        <div className="linha-3">
                          <div className="grupo">
                            <label>Status</label>
                            <select
                              name="statusid"
                              value={editForm.statusid}
                              onChange={handleEditChange}
                            >
                              <option value="1">Ativo</option>
                              <option value="2">Inativo</option>
                              <option value="3">Bloqueado</option>
                            </select>
                          </div>

                          <div className="grupo">
                            <label>Visualizações</label>
                            <input
                              name="visualizacoes"
                              type="number"
                              min="0"
                              value={editForm.visualizacoes}
                              onChange={handleEditChange}
                            />
                          </div>

                          <div className="grupo">
                            <label>Cliques</label>
                            <input
                              name="cliques"
                              type="number"
                              min="0"
                              value={editForm.cliques}
                              onChange={handleEditChange}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="datas">
                        <span>
                          <strong>Criado:</strong> {formatarData(banner.criado)}
                        </span>
                        <span>
                          <strong>Atualizado:</strong>{" "}
                          {formatarData(banner.atualizado)}
                        </span>
                      </div>

                      <div className="acoes-card">
                        <button
                          type="button"
                          className="btn-salvar"
                          onClick={() => salvarEdicao(id)}
                          disabled={salvandoId === id}
                        >
                          <Save size={16} />
                          {salvandoId === id ? "Salvando..." : "Salvar"}
                        </button>

                        <button
                          type="button"
                          className="btn-cancelar"
                          onClick={cancelarEdicao}
                        >
                          <X size={16} />
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="cabecalho-card">
                        <h2>{banner.titulo || "Sem título"}</h2>
                        <span className="id">#{id}</span>
                      </div>

                      <p className="descricao">
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

                      {banner.link && (
                        <a
                          href={banner.link}
                          target="_blank"
                          rel="noreferrer"
                          className="link-banner"
                        >
                          Abrir link do banner
                        </a>
                      )}

                      <div className="datas">
                        <span>
                          <strong>Criado:</strong> {formatarData(banner.criado)}
                        </span>
                        <span>
                          <strong>Atualizado:</strong>{" "}
                          {formatarData(banner.atualizado)}
                        </span>
                      </div>

                      <div className="acoes-card">
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(banner)}
                          className="btn-editar"
                        >
                          <Pencil size={16} />
                          Editar
                        </button>

                        <button
                          onClick={() => excluirBanner(id)}
                          className="btn-excluir"
                          type="button"
                        >
                          <Trash2 size={16} />
                          Excluir
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .pagina-banners {
          padding: 24px;
          min-height: 100vh;
          background: #f8fafc;
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
          display: inline-block;
          margin-bottom: 6px;
          color: #64748b;
          font-size: 14px;
          font-weight: 600;
        }

        .topo h1 {
          margin: 0;
          font-size: 32px;
          color: #0f172a;
        }

        .topo p {
          margin: 8px 0 0;
          color: #475569;
        }

        .acoes-topo {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn-primario,
        .btn-secundario {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 12px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .btn-primario {
          background: #2563eb;
          color: #fff;
          border: none;
        }

        .btn-secundario {
          background: #fff;
          color: #0f172a;
          border: 1px solid #e2e8f0;
        }

        .barra {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 24px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
        }

        .campo-busca {
          flex: 1;
          min-width: 260px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 0 12px;
          background: #fff;
        }

        .campo-busca input {
          width: 100%;
          border: none;
          outline: none;
          padding: 12px 0;
          background: transparent;
          font-size: 14px;
        }

        .contador {
          font-size: 14px;
          font-weight: 700;
          color: #334155;
        }

        .estado {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 40px 20px;
          text-align: center;
          color: #475569;
        }

        .estado.erro {
          color: #b91c1c;
          background: #fff1f2;
          border-color: #fecdd3;
        }

        .estado.vazio h3 {
          margin: 12px 0 6px;
          color: #0f172a;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 20px;
        }

        .card {
          background: #fff;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        }

        .imagem-box {
          position: relative;
          width: 100%;
          height: 220px;
          background: #e2e8f0;
        }

        .imagem {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .sem-imagem {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #64748b;
        }

        .trocar-imagem {
          position: absolute;
          left: 12px;
          bottom: 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(15, 23, 42, 0.82);
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .status {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255, 255, 255, 0.9);
          color: #0f172a;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .conteudo {
          padding: 18px;
        }

        .cabecalho-card {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 10px;
        }

        .cabecalho-card h2 {
          margin: 0;
          font-size: 20px;
          color: #0f172a;
        }

        .id {
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 10px;
          border-radius: 10px;
        }

        .descricao {
          margin: 0 0 14px;
          color: #475569;
          line-height: 1.5;
          min-height: 48px;
        }

        .metricas {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 14px;
        }

        .metrica {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          font-size: 14px;
          color: #334155;
          font-weight: 600;
        }

        .link-banner {
          display: inline-block;
          margin-bottom: 14px;
          text-decoration: none;
          font-weight: 700;
          color: #2563eb;
          word-break: break-word;
        }

        .datas {
          display: grid;
          gap: 6px;
          margin-bottom: 16px;
          font-size: 13px;
          color: #475569;
        }

        .acoes-card {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn-editar,
        .btn-excluir,
        .btn-salvar,
        .btn-cancelar {
          flex: 1;
          min-width: 130px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 14px;
          border-radius: 12px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          border: none;
        }

        .btn-editar {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }

        .btn-excluir {
          background: #fff1f2;
          color: #be123c;
          border: 1px solid #fecdd3;
        }

        .btn-salvar {
          background: #ecfdf5;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .btn-cancelar {
          background: #fff7ed;
          color: #c2410c;
          border: 1px solid #fed7aa;
        }

        .form-grid {
          display: grid;
          gap: 14px;
          margin-bottom: 14px;
        }

        .grupo {
          display: grid;
          gap: 8px;
        }

        .grupo label {
          font-size: 13px;
          font-weight: 700;
          color: #334155;
        }

        .grupo input,
        .grupo textarea,
        .grupo select {
          width: 100%;
          border: 1px solid #dbe2ea;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          color: #0f172a;
          background: #fff;
          outline: none;
        }

        .grupo textarea {
          resize: vertical;
          min-height: 100px;
        }

        .linha-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        @media (max-width: 768px) {
          .pagina-banners {
            padding: 16px;
          }

          .topo h1 {
            font-size: 26px;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .metricas,
          .linha-3 {
            grid-template-columns: 1fr;
          }

          .acoes-card {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}