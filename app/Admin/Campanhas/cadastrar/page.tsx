"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";

import { ToastContainer, toast } from "react-toastify";

import {
  FiArrowLeft,
  FiCalendar,
  FiFileText,
  FiImage,
  FiLayers,
  FiTag,
  FiUploadCloud,
} from "react-icons/fi";

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

  const [bannerFile, setBannerFile] = useState<File | null>(null);
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
        console.error(error);

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

  function handleBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    setBannerFile(file);

    const url = URL.createObjectURL(file);

    setPreview(url);
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

      const formData = new FormData();

      formData.append("titulo", titulo.trim());
      formData.append("slug", gerarSlug(slug));
      formData.append("descricao", descricao.trim());

      formData.append("statusid", statusid);

      if (inicio) {
        formData.append("inicio", inicio);
      }

      if (fim) {
        formData.append("fim", fim);
      }

      if (bannerFile) {
        formData.append("banner", bannerFile);
      }

      const response = await api.post(
        rotas.painel.campanhaCadastrar,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const payload = response?.data;

      const sucesso =
        response?.status === 200 ||
        response?.status === 201 ||
        payload?.status === 200 ||
        payload?.status === 201;

      if (!sucesso) {
        toast.error(
          payload?.mensagem ||
            "Não foi possível cadastrar."
        );

        return;
      }

      toast.success(
        payload?.mensagem ||
          "Campanha cadastrada com sucesso."
      );

      setTimeout(() => {
        router.push("/Admin/campanhas");
      }, 1600);
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.mensagem ||
          error?.message ||
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
        <div className="backgroundGlow top" />
        <div className="backgroundGlow bottom" />

        <div className="topbar">
          <button
            type="button"
            className="btnVoltar"
            onClick={() => router.push("/Admin/campanhas")}
          >
            <FiArrowLeft />
            Voltar
          </button>

          <div className="topbarTextos">
            <span className="badge">
              Painel Administrativo
            </span>

            <h1>Nova Campanha</h1>

            <p>
              Crie campanhas promocionais com imagem,
              período, status e descrição personalizada.
            </p>
          </div>
        </div>

        <form className="card" onSubmit={handleSubmit}>
          <div className="grid">
            <div className="campo span2">
              <label>
                <FiLayers />
                Título da campanha
              </label>

              <input
                type="text"
                placeholder="Ex: Semana Black Friday"
                value={titulo}
                onChange={(e) =>
                  setTitulo(e.target.value)
                }
              />
            </div>

            <div className="campo span2">
              <label>
                <FiTag />
                Slug da campanha
              </label>

              <input
                type="text"
                placeholder="semana-black-friday"
                value={slug}
                onChange={(e) => {
                  setSlugManual(true);

                  setSlug(
                    gerarSlug(e.target.value)
                  );
                }}
              />

              <small>
                URL amigável da campanha.
              </small>
            </div>

            <div className="campo">
              <label>
                <FiCalendar />
                Data início
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

            <div className="campo">
              <label>Status</label>

              <select
                value={statusid}
                onChange={(e) =>
                  setStatusid(e.target.value)
                }
                disabled={loadingStatus}
              >
                {loadingStatus ? (
                  <option>
                    Carregando...
                  </option>
                ) : (
                  statusList.map((item, index) => {
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
                          item.codigo}
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            <div className="campo">
              <label>
                <FiImage />
                Banner da campanha
              </label>

              <label className="uploadArea">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBanner}
                />

                <div className="uploadContent">
                  <FiUploadCloud />

                  <span>
                    Clique para selecionar
                    uma imagem
                  </span>

                  <small>
                    PNG, JPG, WEBP...
                  </small>
                </div>
              </label>
            </div>

            {preview && (
              <div className="previewContainer span2">
                <div className="previewCard">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="previewImage"
                  />
                </div>
              </div>
            )}

            <div className="campo span2">
              <label>
                <FiFileText />
                Descrição
              </label>

              <textarea
                placeholder="Digite a descrição da campanha..."
                value={descricao}
                onChange={(e) =>
                  setDescricao(e.target.value)
                }
              />
            </div>
          </div>

          <div className="acoes">
            <button
              type="button"
              className="btnCancelar"
              onClick={() =>
                router.push("/Admin/campanhas")
              }
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btnSalvar"
              disabled={loading}
            >
              {loading
                ? "Cadastrando..."
                : "Cadastrar campanha"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .pagina {
          min-height: 100vh;
          padding: 32px;
          position: relative;
          overflow: hidden;
          background: #0f172a;
        }

        .backgroundGlow {
          position: absolute;
          width: 450px;
          height: 450px;
          border-radius: 999px;
          filter: blur(120px);
          opacity: 0.2;
        }

        .backgroundGlow.top {
          top: -120px;
          left: -120px;
          background: #7c3aed;
        }

        .backgroundGlow.bottom {
          bottom: -120px;
          right: -120px;
          background: #2563eb;
        }

        .topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
          position: relative;
          z-index: 2;
        }

        .badge {
          display: inline-flex;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          color: #cbd5e1;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 14px;
        }

        .topbar h1 {
          margin: 0;
          font-size: 42px;
          color: #fff;
          font-weight: 900;
        }

        .topbar p {
          margin-top: 12px;
          color: #94a3b8;
          max-width: 720px;
          line-height: 1.6;
        }

        .btnVoltar {
          border: none;
          height: 48px;
          padding: 0 18px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.08);
          color: #fff;
          cursor: pointer;
          font-weight: 700;
          backdrop-filter: blur(20px);
        }

        .card {
          position: relative;
          z-index: 2;
          background: rgba(15, 23, 42, 0.72);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
          border-radius: 28px;
          padding: 30px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
        }

        .campo {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .span2 {
          grid-column: span 2;
        }

        .campo label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #e2e8f0;
          font-size: 14px;
          font-weight: 700;
        }

        .campo input,
        .campo textarea,
        .campo select {
          width: 100%;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #fff;
          border-radius: 18px;
          padding: 16px;
          outline: none;
          transition: 0.2s;
          font-size: 15px;
        }

        .campo textarea {
          min-height: 180px;
          resize: vertical;
        }

        .campo input:focus,
        .campo textarea:focus,
        .campo select:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 4px rgba(139,92,246,0.15);
        }

        .campo small {
          color: #94a3b8;
        }

        .uploadArea {
          position: relative;
          overflow: hidden;
          cursor: pointer;
          min-height: 180px;
          border-radius: 24px;
          border: 2px dashed rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.03);
        }

        .uploadArea input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .uploadContent {
          min-height: 180px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #cbd5e1;
        }

        .uploadContent svg {
          font-size: 42px;
        }

        .previewContainer {
          margin-top: 6px;
        }

        .previewCard {
          position: relative;
          width: 100%;
          height: 320px;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .previewImage {
          object-fit: cover;
        }

        .acoes {
          display: flex;
          justify-content: flex-end;
          gap: 14px;
          margin-top: 28px;
          flex-wrap: wrap;
        }

        .btnCancelar,
        .btnSalvar {
          border: none;
          height: 54px;
          padding: 0 24px;
          border-radius: 18px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s;
        }

        .btnCancelar {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }

        .btnSalvar {
          background: linear-gradient(
            135deg,
            #7c3aed,
            #2563eb
          );
          color: #fff;
          min-width: 240px;
          box-shadow: 0 18px 40px rgba(124,58,237,0.3);
        }

        .btnSalvar:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @media (max-width: 900px) {
          .pagina {
            padding: 18px;
          }

          .topbar {
            flex-direction: column;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .span2 {
            grid-column: span 1;
          }

          .topbar h1 {
            font-size: 32px;
          }

          .card {
            padding: 20px;
            border-radius: 24px;
          }

          .acoes {
            flex-direction: column;
          }

          .btnSalvar,
          .btnCancelar {
            width: 100%;
          }

          .previewCard {
            height: 240px;
          }
        }
      `}</style>
    </>
  );
}