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

      // =========================
      // ENVIA TUDO JUNTO
      // =========================

      const formData = new FormData();

      formData.append("titulo", titulo.trim());
      formData.append("slug", gerarSlug(slug));

      formData.append(
        "descricao",
        descricao.trim() || ""
      );

      formData.append(
        "statusid",
        String(Number(statusid))
      );

      formData.append(
        "inicio",
        inicio || ""
      );

      formData.append(
        "fim",
        fim || ""
      );

      // imagem
      if (imagem) {
        formData.append("imagem", imagem);
      }

      const response = await api.post(
        rotas.painel.campanhaCadastrar,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
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
      <ToastContainer
        position="top-right"
        autoClose={3000}
      />

      <div className="pagina">
        <div className="efeito efeito1"></div>
        <div className="efeito efeito2"></div>

        {/* HEADER */}
        <div className="header">
          <div>
            <span className="badge">
              NOVA CAMPANHA
            </span>

            <h1>Cadastrar campanha</h1>

            <p>
              Crie campanhas promocionais com
              banner, período e descrição para
              destacar ofertas da loja.
            </p>
          </div>

          <button
            className="btn-voltar"
            onClick={() =>
              router.push("/Admin/campanhas")
            }
          >
            <FiArrowLeft />
            Voltar
          </button>
        </div>

        {/* FORM */}
        <form
          className="container-form"
          onSubmit={handleSubmit}
        >
          <div className="grid">
            {/* TITULO */}
            <div className="campo full">
              <label>
                <FiLayers />
                Título da campanha
              </label>

              <input
                type="text"
                placeholder="Ex: Amor Meu 2026"
                value={titulo}
                onChange={(e) =>
                  setTitulo(e.target.value)
                }
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
                placeholder="amor-meu-2026"
                value={slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setSlug(
                    gerarSlug(e.target.value)
                  );
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
                onChange={(e) =>
                  setStatusid(e.target.value)
                }
                disabled={loadingStatus}
              >
                {statusList.map((item, index) => {
                  const valor = String(
                    item.id_status ??
                      item.id ??
                      index
                  );

                  return (
                    <option
                      key={valor}
                      value={valor}
                    >
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
                onChange={(e) =>
                  setInicio(e.target.value)
                }
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
                onChange={(e) =>
                  setFim(e.target.value)
                }
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
                placeholder="Descreva os detalhes da campanha..."
                value={descricao}
                onChange={(e) =>
                  setDescricao(
                    e.target.value
                  )
                }
              />
            </div>

            {/* UPLOAD */}
            <div className="full">
              <label className="label-upload">
                <FiImage />
                Banner da campanha
              </label>

              <label className="upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagem}
                />

                {preview ? (
                  <img
                    src={preview}
                    alt="preview"
                  />
                ) : (
                  <div className="placeholder">
                    <FiUploadCloud />

                    <span>
                      Clique para selecionar uma
                      imagem
                    </span>

                    <small>
                      PNG, JPG ou WEBP
                    </small>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* AÇÕES */}
          <div className="acoes">
            <button
              type="button"
              className="btn-cancelar"
              onClick={() =>
                router.push("/Admin/campanhas")
              }
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
          background: #0b1120;
          position: relative;
          overflow: hidden;
        }

        .efeito {
          position: absolute;
          border-radius: 999px;
          filter: blur(120px);
        }

        .efeito1 {
          width: 350px;
          height: 350px;
          background: rgba(168, 85, 247, 0.25);
          top: -120px;
          left: -120px;
        }

        .efeito2 {
          width: 350px;
          height: 350px;
          background: rgba(59, 130, 246, 0.2);
          bottom: -120px;
          right: -120px;
        }

        .header {
          position: relative;
          z-index: 2;

          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;

          margin-bottom: 30px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          padding: 8px 16px;
          border-radius: 999px;
          background: rgba(255,255,255,.08);
          color: #cbd5e1;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .5px;
          border: 1px solid rgba(255,255,255,.08);
        }

        .header h1 {
          color: #fff;
          font-size: 52px;
          font-weight: 900;
          margin: 16px 0 10px;
        }

        .header p {
          color: #94a3b8;
          max-width: 700px;
          line-height: 1.6;
        }

        .btn-voltar {
          height: 54px;
          padding: 0 22px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.05);
          color: #fff;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-weight: 700;
          transition: .25s;
        }

        .btn-voltar:hover {
          background: rgba(255,255,255,.08);
        }

        .container-form {
          position: relative;
          z-index: 2;

          background: rgba(15,23,42,.82);
          backdrop-filter: blur(18px);

          border: 1px solid rgba(255,255,255,.08);

          border-radius: 30px;

          padding: 32px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(
            2,
            minmax(0, 1fr)
          );

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

        .campo label,
        .label-upload {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #fff;
          font-weight: 700;
          font-size: 14px;
        }

        .campo input,
        .campo select,
        .campo textarea {
          width: 100%;
          padding: 16px 18px;

          border-radius: 18px;

          border: 1px solid
            rgba(255,255,255,.08);

          background: rgba(255,255,255,.04);

          color: #fff;
          outline: none;

          transition: .25s;
        }

        .campo input::placeholder,
        .campo textarea::placeholder {
          color: #64748b;
        }

        .campo input:focus,
        .campo select:focus,
        .campo textarea:focus {
          border-color: #8b5cf6;

          box-shadow: 0 0 0 4px
            rgba(139,92,246,.15);

          background: rgba(255,255,255,.06);
        }

        .upload {
          margin-top: 12px;

          min-height: 320px;

          border-radius: 24px;

          border: 2px dashed
            rgba(255,255,255,.12);

          background: rgba(255,255,255,.03);

          overflow: hidden;

          display: flex;
          align-items: center;
          justify-content: center;

          cursor: pointer;

          transition: .25s;
        }

        .upload:hover {
          border-color: #8b5cf6;
          background: rgba(139,92,246,.06);
        }

        .upload input {
          display: none;
        }

        .placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          color: #94a3b8;
        }

        .placeholder svg {
          font-size: 72px;
        }

        .placeholder span {
          color: #fff;
          font-size: 17px;
          font-weight: 700;
        }

        .upload img {
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
          padding: 0 28px;

          border-radius: 18px;

          border: none;

          cursor: pointer;

          font-size: 15px;
          font-weight: 800;

          transition: .25s;
        }

        .btn-cancelar {
          background: rgba(255,255,255,.08);
          color: #fff;
        }

        .btn-salvar {
          background: linear-gradient(
            135deg,
            #7c3aed,
            #2563eb
          );

          color: #fff;

          display: flex;
          align-items: center;
          gap: 10px;

          box-shadow:
            0 10px 30px
            rgba(124,58,237,.35);
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

          .header h1 {
            font-size: 38px;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .full {
            grid-column: span 1;
          }

          .container-form {
            padding: 22px;
            border-radius: 24px;
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