"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { ArrowLeft, Image as ImageIcon, Loader2, Save, UploadCloud } from "lucide-react";
import api from "@/Api/conectar";


type FormState = {
  titulo: string;
  descricao: string;
  link: string;
  statusid: string;
  visualizacoes: string;
  cliques: string;
};

const initialState: FormState = {
  titulo: "",
  descricao: "",
  link: "",
  statusid: "1",
  visualizacoes: "0",
  cliques: "0",
};

export default function CadastrarBannerPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [imagem, setImagem] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const imagemLabel = useMemo(() => {
    if (imagem) return imagem.name;
    return "Nenhum arquivo selecionado";
  }, [imagem]);

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleImagemChange(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0] || null;

    setImagem(arquivo);
    setMensagem("");
    setErro("");

    if (!arquivo) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(arquivo);
    setPreview(url);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMensagem("");
    setErro("");

    if (!form.titulo.trim()) {
      setErro("O título é obrigatório.");
      return;
    }

    if (!form.descricao.trim()) {
      setErro("A descrição é obrigatória.");
      return;
    }

    if (!imagem) {
      setErro("A imagem é obrigatória.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("titulo", form.titulo.trim());
      formData.append("descricao", form.descricao.trim());
      formData.append("link", form.link.trim());
      formData.append("statusid", form.statusid);
      formData.append("visualizacoes", form.visualizacoes || "0");
      formData.append("cliques", form.cliques || "0");
      formData.append("imagem", imagem);

      const response = await api.post("/painel/banner", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMensagem(
        response.data?.mensagem || "Banner cadastrado com sucesso."
      );
      setErro("");
      setForm(initialState);
      setImagem(null);
      setPreview("");
    } catch (error: any) {
      console.error("Erro ao cadastrar banner:", error);
      setErro(
        error?.response?.data?.mensagem ||
          "Não foi possível cadastrar o banner."
      );
      setMensagem("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pagina-cadastrar-banner">
      <div className="topo">
        <div className="titulo-box">
          <a href="/admin/banners" className="voltar">
            <ArrowLeft size={18} />
            Voltar
          </a>

          <span className="subtitulo">Painel administrativo</span>
          <h1>Cadastrar banner</h1>
          <p>Preencha os campos abaixo para criar um novo banner.</p>
        </div>
      </div>

      <div className="layout">
        <form onSubmit={handleSubmit} className="card formulario">
          <div className="grupo">
            <label htmlFor="titulo">Título *</label>
            <input
              id="titulo"
              name="titulo"
              type="text"
              placeholder="Digite o título do banner"
              value={form.titulo}
              onChange={handleChange}
            />
          </div>

          <div className="grupo">
            <label htmlFor="descricao">Descrição *</label>
            <textarea
              id="descricao"
              name="descricao"
              placeholder="Digite a descrição do banner"
              value={form.descricao}
              onChange={handleChange}
              rows={5}
            />
          </div>

          <div className="grupo">
            <label htmlFor="link">Link</label>
            <input
              id="link"
              name="link"
              type="text"
              placeholder="https://..."
              value={form.link}
              onChange={handleChange}
            />
          </div>

          <div className="linha">
            <div className="grupo">
              <label htmlFor="statusid">Status *</label>
              <select
                id="statusid"
                name="statusid"
                value={form.statusid}
                onChange={handleChange}
              >
                <option value="1">Ativo</option>
                <option value="2">Inativo</option>
                <option value="3">Bloqueado</option>
              </select>
            </div>

            <div className="grupo">
              <label htmlFor="visualizacoes">Visualizações</label>
              <input
                id="visualizacoes"
                name="visualizacoes"
                type="number"
                min="0"
                value={form.visualizacoes}
                onChange={handleChange}
              />
            </div>

            <div className="grupo">
              <label htmlFor="cliques">Cliques</label>
              <input
                id="cliques"
                name="cliques"
                type="number"
                min="0"
                value={form.cliques}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grupo">
            <label htmlFor="imagem">Imagem *</label>

            <label htmlFor="imagem" className="upload-box">
              <UploadCloud size={22} />
              <div>
                <strong>Selecionar imagem</strong>
                <span>{imagemLabel}</span>
              </div>
            </label>

            <input
              id="imagem"
              name="imagem"
              type="file"
              accept="image/*"
              onChange={handleImagemChange}
              className="input-file"
            />
          </div>

          {erro && <div className="alerta erro">{erro}</div>}
          {mensagem && <div className="alerta sucesso">{mensagem}</div>}

          <div className="acoes">
            <a href="/admin/banners" className="btn btn-cancelar">
              Cancelar
            </a>

            <button type="submit" className="btn btn-salvar" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Cadastrar banner
                </>
              )}
            </button>
          </div>
        </form>

        <div className="card preview-card">
          <div className="preview-header">
            <h2>Pré-visualização</h2>
            <p>Veja como o banner ficará no card.</p>
          </div>

          <div className="banner-preview">
            <div className="imagem-preview-box">
              {preview ? (
                <img src={preview} alt="Preview do banner" className="imagem-preview" />
              ) : (
                <div className="sem-imagem">
                  <ImageIcon size={42} />
                  <span>Sem imagem selecionada</span>
                </div>
              )}

              <span className="status-badge">
                {form.statusid === "1"
                  ? "Ativo"
                  : form.statusid === "2"
                  ? "Inativo"
                  : "Bloqueado"}
              </span>
            </div>

            <div className="preview-conteudo">
              <div className="preview-topo">
                <h3>{form.titulo || "Título do banner"}</h3>
                <span className="preview-id">Novo</span>
              </div>

              <p>
                {form.descricao || "A descrição do banner aparecerá aqui."}
              </p>

              <div className="preview-metricas">
                <div className="metrica-box">
                  <span>{form.visualizacoes || "0"} visualizações</span>
                </div>
                <div className="metrica-box">
                  <span>{form.cliques || "0"} cliques</span>
                </div>
              </div>

              {form.link && <a className="preview-link">{form.link}</a>}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pagina-cadastrar-banner {
          min-height: 100vh;
          padding: 24px;
          background: #f8fafc;
        }

        .topo {
          margin-bottom: 24px;
        }

        .titulo-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .voltar {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #2563eb;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .subtitulo {
          color: #64748b;
          font-size: 14px;
          font-weight: 700;
        }

        h1 {
          margin: 0;
          font-size: 32px;
          color: #0f172a;
        }

        .titulo-box p {
          margin: 0;
          color: #475569;
        }

        .layout {
          display: grid;
          grid-template-columns: 1.25fr 0.9fr;
          gap: 24px;
          align-items: start;
        }

        .card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        }

        .formulario {
          padding: 22px;
        }

        .grupo {
          display: grid;
          gap: 8px;
          margin-bottom: 18px;
        }

        .linha {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        label {
          font-size: 14px;
          font-weight: 700;
          color: #334155;
        }

        input,
        textarea,
        select {
          width: 100%;
          border: 1px solid #dbe2ea;
          border-radius: 12px;
          padding: 14px 14px;
          font-size: 14px;
          color: #0f172a;
          background: #fff;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        textarea {
          resize: vertical;
          min-height: 120px;
        }

        input:focus,
        textarea:focus,
        select:focus {
          border-color: #93c5fd;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
        }

        .upload-box {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border: 1.5px dashed #cbd5e1;
          border-radius: 14px;
          cursor: pointer;
          background: #f8fafc;
          transition: 0.2s ease;
        }

        .upload-box:hover {
          border-color: #60a5fa;
          background: #f0f9ff;
        }

        .upload-box div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .upload-box strong {
          color: #0f172a;
          font-size: 14px;
        }

        .upload-box span {
          color: #64748b;
          font-size: 13px;
          word-break: break-word;
        }

        .input-file {
          display: none;
        }

        .alerta {
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .alerta.erro {
          background: #fff1f2;
          color: #be123c;
          border: 1px solid #fecdd3;
        }

        .alerta.sucesso {
          background: #ecfdf5;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .acoes {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 10px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .btn-cancelar {
          background: #fff;
          color: #334155;
          border: 1px solid #e2e8f0;
        }

        .btn-salvar {
          border: none;
          background: #2563eb;
          color: #fff;
        }

        .btn-salvar:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        .preview-card {
          padding: 22px;
          position: sticky;
          top: 20px;
        }

        .preview-header {
          margin-bottom: 16px;
        }

        .preview-header h2 {
          margin: 0 0 6px;
          color: #0f172a;
          font-size: 22px;
        }

        .preview-header p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .banner-preview {
          overflow: hidden;
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          background: #fff;
        }

        .imagem-preview-box {
          position: relative;
          width: 100%;
          height: 240px;
          background: #e2e8f0;
        }

        .imagem-preview {
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
          justify-content: center;
          align-items: center;
          gap: 10px;
          color: #64748b;
          background: linear-gradient(135deg, #eef2ff, #f8fafc);
        }

        .status-badge {
          position: absolute;
          top: 14px;
          right: 14px;
          background: rgba(255, 255, 255, 0.92);
          color: #0f172a;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .preview-conteudo {
          padding: 18px;
        }

        .preview-topo {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 10px;
        }

        .preview-topo h3 {
          margin: 0;
          color: #0f172a;
          font-size: 20px;
        }

        .preview-id {
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 10px;
          border-radius: 10px;
          flex-shrink: 0;
        }

        .preview-conteudo p {
          margin: 0 0 14px;
          color: #475569;
          line-height: 1.6;
        }

        .preview-metricas {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 14px;
        }

        .metrica-box {
          padding: 12px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          font-size: 14px;
          color: #334155;
          font-weight: 600;
          text-align: center;
        }

        .preview-link {
          display: inline-block;
          color: #2563eb;
          font-weight: 700;
          text-decoration: none;
          word-break: break-word;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 980px) {
          .layout {
            grid-template-columns: 1fr;
          }

          .preview-card {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .pagina-cadastrar-banner {
            padding: 16px;
          }

          h1 {
            font-size: 26px;
          }

          .linha {
            grid-template-columns: 1fr;
          }

          .preview-metricas {
            grid-template-columns: 1fr;
          }

          .acoes {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}