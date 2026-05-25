"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";

import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiFileText,
  FiImage,
  FiLayers,
  FiLoader,
  FiTag,
  FiUploadCloud,
} from "react-icons/fi";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type StatusItem = {
  id_status?: number | string;
  id?: number | string;
  nome?: string;
  codigo?: string;
};

function gerarSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function CadastrarCampanhaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [statusList, setStatusList] = useState<StatusItem[]>([]);

  const [titulo, setTitulo] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);

  const [descricao, setDescricao] = useState("");
  const [statusid, setStatusid] = useState("");

  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  const [imagem, setImagem] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const slugAutomatico = useMemo(() => gerarSlug(titulo), [titulo]);

  useEffect(() => {
    if (!slugManual) {
      setSlug(slugAutomatico);
    }
  }, [slugAutomatico, slugManual]);

  useEffect(() => {
    async function carregarStatus() {
      try {
        setLoadingStatus(true);

        const response = await api.get(rotas.painel.status, {
          withCredentials: true,
        });

        const payload = response?.data;

        const lista = Array.isArray(payload?.dados?.dados)
          ? payload.dados.dados
          : Array.isArray(payload?.dados)
          ? payload.dados
          : [];

        setStatusList(lista);

        if (lista.length > 0) {
          const primeiro =
            lista[0]?.id_status ?? lista[0]?.id ?? "";

          setStatusid(String(primeiro));
        }
      } catch (error: any) {
        toast.error(
          error?.response?.data?.mensagem ||
            "Erro ao carregar status."
        );
      } finally {
        setLoadingStatus(false);
      }
    }

    carregarStatus();
  }, []);

  function handleImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    setImagem(file);
    setPreview(URL.createObjectURL(file));
  }

  async function uploadImagem(): Promise<string | null> {
    if (!imagem) return null;

    try {
      const formData = new FormData();

      formData.append("imagem", imagem);
      formData.append("nome_produto", slug);

      const response = await api.post(
        "/painel/upload/testar-produto",
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return (
        response?.data?.dados?.caminho_relativo ||
        null
      );
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!titulo.trim()) {
      toast.warning("Informe o título.");
      return;
    }

    if (!slug.trim()) {
      toast.warning("Informe o slug.");
      return;
    }

    if (!statusid) {
      toast.warning("Selecione um status.");
      return;
    }

    try {
      setLoading(true);

      let bannerPath: string | null = null;

      if (imagem) {
        bannerPath = await uploadImagem();

        if (!bannerPath) {
          toast.error("Falha ao enviar imagem.");
          return;
        }
      }

      const body = {
        titulo: titulo.trim(),
        slug: gerarSlug(slug),
        descricao: descricao.trim() || null,
        banner: bannerPath,
        statusid: Number(statusid),
        inicio: inicio || null,
        fim: fim || null,
      };

      const response = await api.post(
        rotas.painel.campanhaCadastrar,
        body,
        {
          withCredentials: true,
        }
      );

      const payload = response?.data;

      toast.success(
        payload?.mensagem ||
          "Campanha cadastrada com sucesso."
      );

      setTimeout(() => {
        router.push("/Admin/campanhas");
      }, 1200);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.mensagem ||
          "Erro ao cadastrar campanha."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="pagina">
        <div className="blur blur1"></div>
        <div className="blur blur2"></div>

        <div className="topo">
          <div>
            <span className="mini-badge">
              PAINEL ADMINISTRATIVO
            </span>

            <h1>Nova Campanha</h1>

            <p>
              Cadastre campanhas promocionais modernas
              para destacar produtos e ofertas.
            </p>
          </div>

          <button
            className="btn-voltar"
            onClick={() => router.push("/Admin/campanhas")}
          >
            <FiArrowLeft />
            Voltar
          </button>
        </div>

        <form className="card" onSubmit={handleSubmit}>
          <div className="grid">
            {/* TITULO */}
            <div className="campo full">
              <label>
                <FiLayers />
                Título da campanha
              </label>

              <input
                type="text"
                placeholder="Ex: Black Friday 2026"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>

            {/* SLUG */}
            <div className="campo">
              <label>
                <FiTag />
                Slug
              </label>

              <input
                type="text"
                placeholder="black-friday-2026"
                value={slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setSlug(gerarSlug(e.target.value));
                }}
              />
            </div>

            {/* STATUS */}
            <div className="campo">
              <label>
                <FiCheckCircle />
                Status
              </label>

              <select
                value={statusid}
                onChange={(e) => setStatusid(e.target.value)}
                disabled={loadingStatus}
              >
                {statusList.map((item, index) => {
                  const valor = String(
                    item.id_status ?? item.id ?? index
                  );

                  return (
                    <option key={valor} value={valor}>
                      {item.nome ||
                        item.codigo ||
                        `Status ${valor}`}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* DATA */}
            <div className="campo">
              <label>
                <FiCalendar />
                Data inicial
              </label>

              <input
                type="datetime-local"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
            </div>

            <div className="campo">
              <label>
                <FiCalendar />
                Data final
              </label>

              <input
                type="datetime-local"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
              />
            </div>

            {/* DESCRIÇÃO */}
            <div className="campo full">
              <label>
                <FiFileText />
                Descrição
              </label>

              <textarea
                rows={6}
                placeholder="Descreva sua campanha..."
                value={descricao}
                onChange={(e) =>
                  setDescricao(e.target.value)
                }
              />
            </div>

            {/* UPLOAD */}
            <div className="upload-area full">
              <div className="upload-topo">
                <div>
                  <h3>
                    <FiImage />
                    Banner da campanha
                  </h3>

                  <p>
                    Faça upload da imagem principal da
                    campanha.
                  </p>
                </div>
              </div>

              <label className="upload-box">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagem}
                />

                {preview ? (
                  <img src={preview} alt="preview" />
                ) : (
                  <div className="upload-placeholder">
                    <FiUploadCloud />

                    <span>
                      Clique para selecionar uma imagem
                    </span>

                    <small>
                      PNG, JPG, WEBP
                    </small>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="acoes">
            <button
              type="button"
              className="btn-cancelar"
              onClick={() => router.push("/Admin/campanhas")}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn-salvar"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FiLoader className="spin" />
                  Salvando...
                </>
              ) : (
                "Cadastrar campanha"
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .pagina {
          min-height: 100vh;
          padding: 40px;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at top left,
              rgba(255, 120, 120, 0.15),
              transparent 30%),
            radial-gradient(circle at bottom right,
              rgba(120, 180, 255, 0.12),
              transparent 30%),
            #0f172a;
        }

        .blur {
          position: absolute;
          border-radius: 999px;
          filter: blur(120px);
          z-index: 0;
        }

        .blur1 {
          width: 300px;
          height: 300px;
          background: #ff4d6d;
          top: -60px;
          left: -60px;
          opacity: 0.18;
        }

        .blur2 {
          width: 320px;
          height: 320px;
          background: #3b82f6;
          bottom: -100px;
          right: -100px;
          opacity: 0.18;
        }

        .topo,
        .card {
          position: relative;
          z-index: 2;
        }

        .topo {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .mini-badge {
          display: inline-flex;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.08);
          color: #cbd5e1;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .6px;
        }

        .topo h1 {
          margin: 14px 0 10px;
          font-size: 52px;
          line-height: 1;
          color: #fff;
          font-weight: 900;
        }

        .topo p {
          max-width: 700px;
          color: #94a3b8;
          font-size: 16px;
        }

        .btn-voltar {
          height: 54px;
          padding: 0 22px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.06);
          color: #fff;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-weight: 700;
          backdrop-filter: blur(12px);
        }

        .card {
          backdrop-filter: blur(18px);
          background: rgba(15, 23, 42, 0.72);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 32px;
          padding: 34px;
          box-shadow:
            0 10px 40px rgba(0,0,0,.3),
            inset 0 1px 0 rgba(255,255,255,.05);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 22px;
        }

        .full {
          grid-column: span 2;
        }

        .campo {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .campo label {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #e2e8f0;
          font-size: 14px;
          font-weight: 700;
        }

        .campo input,
        .campo select,
        .campo textarea {
          width: 100%;
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.04);
          border-radius: 18px;
          padding: 16px 18px;
          color: #fff;
          outline: none;
          transition: .25s;
          font-size: 15px;
        }

        .campo input::placeholder,
        .campo textarea::placeholder {
          color: #64748b;
        }

        .campo input:focus,
        .campo select:focus,
        .campo textarea:focus {
          border-color: #60a5fa;
          background: rgba(255,255,255,.06);
          box-shadow: 0 0 0 4px rgba(96,165,250,.12);
        }

        .upload-area {
          margin-top: 8px;
        }

        .upload-topo h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #fff;
          margin: 0 0 8px;
        }

        .upload-topo p {
          color: #94a3b8;
          margin: 0 0 18px;
        }

        .upload-box {
          min-height: 320px;
          border-radius: 24px;
          border: 2px dashed rgba(255,255,255,.1);
          background: rgba(255,255,255,.03);
          cursor: pointer;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: .25s;
        }

        .upload-box:hover {
          border-color: #60a5fa;
          background: rgba(96,165,250,.06);
        }

        .upload-box input {
          display: none;
        }

        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          color: #94a3b8;
        }

        .upload-placeholder svg {
          font-size: 70px;
        }

        .upload-placeholder span {
          color: #fff;
          font-size: 17px;
          font-weight: 700;
        }

        .upload-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .acoes {
          margin-top: 34px;
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          flex-wrap: wrap;
        }

        .btn-cancelar,
        .btn-salvar {
          height: 58px;
          padding: 0 26px;
          border-radius: 18px;
          border: none;
          cursor: pointer;
          font-weight: 800;
          font-size: 15px;
          transition: .25s;
        }

        .btn-cancelar {
          background: rgba(255,255,255,.08);
          color: #fff;
        }

        .btn-salvar {
          background: linear-gradient(
            135deg,
            #2563eb,
            #7c3aed
          );

          color: #fff;

          display: flex;
          align-items: center;
          gap: 10px;

          box-shadow:
            0 10px 25px rgba(37,99,235,.35);
        }

        .btn-salvar:hover {
          transform: translateY(-2px);
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          .pagina {
            padding: 20px;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .full {
            grid-column: span 1;
          }

          .card {
            padding: 22px;
            border-radius: 24px;
          }

          .topo h1 {
            font-size: 38px;
          }

          .acoes {
            flex-direction: column;
          }

          .btn-cancelar,
          .btn-salvar {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}