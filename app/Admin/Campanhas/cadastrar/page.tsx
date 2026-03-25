"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type StatusItem = {
  id_status?: number | string;
  id?: number | string;
  nome?: string;
  codigo?: string;
  descricao?: string;
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
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false);

  const [descricao, setDescricao] = useState("");
  const [banner, setBanner] = useState("");
  const [statusid, setStatusid] = useState<string>("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  const slugAutomatico = useMemo(() => gerarSlug(titulo), [titulo]);

  useEffect(() => {
    if (!slugEditadoManualmente) {
      setSlug(slugAutomatico);
    }
  }, [slugAutomatico, slugEditadoManualmente]);

  useEffect(() => {
    async function carregarStatus() {
      try {
        setLoadingStatus(true);

        const response = await api.get(rotas.painel.status, {
          withCredentials: true,
        });

        const payload = response?.data;

        // sua API vem em:
        // {
        //   status: 200,
        //   mensagem: "...",
        //   dados: {
        //     status: 200,
        //     mensagem: "...",
        //     dados: [...]
        //   }
        // }

        const lista = Array.isArray(payload?.dados?.dados)
          ? payload.dados.dados
          : Array.isArray(payload?.dados)
          ? payload.dados
          : [];

        if (!lista.length) {
          toast.error("Nenhum status encontrado.");
          setStatusList([]);
          return;
        }

        setStatusList(lista);

        const primeiroId = lista[0]?.id_status ?? lista[0]?.id ?? "";
        setStatusid(String(primeiroId));
      } catch (error: any) {
        console.error("Erro ao buscar status:", error);
        toast.error(
          error?.response?.data?.mensagem ||
            error?.message ||
            "Não foi possível carregar os status."
        );
        setStatusList([]);
      } finally {
        setLoadingStatus(false);
      }
    }

    carregarStatus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!titulo.trim()) {
      toast.warning("Informe o título da campanha.");
      return;
    }

    if (!slug.trim()) {
      toast.warning("Informe o slug da campanha.");
      return;
    }

    if (!statusid) {
      toast.warning("Selecione um status.");
      return;
    }

    if (inicio && fim && new Date(inicio) > new Date(fim)) {
      toast.warning("A data de início não pode ser maior que a data final.");
      return;
    }

    try {
      setLoading(true);

      const body = {
        titulo: titulo.trim(),
        slug: gerarSlug(slug),
        descricao: descricao.trim() || null,
        banner: banner.trim() || null,
        statusid: Number(statusid),
        inicio: inicio || null,
        fim: fim || null,
      };

      const response = await api.post(rotas.painel.campanhaCadastrar, body, {
        withCredentials: true,
      });

      const payload = response?.data;

      const sucesso =
        response?.status === 200 ||
        response?.status === 201 ||
        payload?.status === 200 ||
        payload?.status === 201;

      if (!sucesso) {
        toast.error(payload?.mensagem || "Não foi possível cadastrar a campanha.");
        return;
      }

      toast.success(payload?.mensagem || "Campanha cadastrada com sucesso.");

      setTimeout(() => {
        router.push("/Admin/campanhas");
      }, 1400);
    } catch (error: any) {
      console.error("Erro ao cadastrar campanha:", error);
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

      <div className="campanha-page">
        <div className="campanha-header">
          <div>
            <span className="campanha-badge">Painel Administrativo</span>
            <h1>Cadastrar Campanha</h1>
            <p>
              Crie campanhas promocionais com título, slug, status, período e banner.
            </p>
          </div>

          <button
            type="button"
            className="btn-voltar"
            onClick={() => router.push("/Admin/campanhas")}
          >
            Voltar
          </button>
        </div>

        <form className="campanha-card" onSubmit={handleSubmit}>
          <div className="campanha-grid">
            <div className="campo campo-lg">
              <label htmlFor="titulo">Título *</label>
              <input
                id="titulo"
                type="text"
                placeholder="Ex: Semana do Cliente"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>

            <div className="campo campo-lg">
              <label htmlFor="slug">Slug *</label>
              <input
                id="slug"
                type="text"
                placeholder="semana-do-cliente"
                value={slug}
                onChange={(e) => {
                  setSlugEditadoManualmente(true);
                  setSlug(gerarSlug(e.target.value));
                }}
              />
              <small>
                O slug acompanha o título automaticamente até você editar manualmente.
              </small>
            </div>

            <div className="campo">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                value={statusid}
                onChange={(e) => setStatusid(e.target.value)}
                disabled={loadingStatus}
              >
                {loadingStatus ? (
                  <option value="">Carregando status...</option>
                ) : statusList.length > 0 ? (
                  statusList.map((item, index) => {
                    const valor = String(item.id_status ?? item.id ?? index);
                    return (
                      <option key={valor} value={valor}>
                        {item.nome || item.codigo || `Status ${valor}`}
                      </option>
                    );
                  })
                ) : (
                  <option value="">Nenhum status encontrado</option>
                )}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="banner">Banner</label>
              <input
                id="banner"
                type="text"
                placeholder="Ex: banner-promocao.jpg ou nome-do-banner.png"
                value={banner}
                onChange={(e) => setBanner(e.target.value)}
              />
              <small>
                Aqui é texto mesmo. Não faz upload, só escreve o nome ou caminho do banner.
              </small>
            </div>

            <div className="campo">
              <label htmlFor="inicio">Data de início</label>
              <input
                id="inicio"
                type="datetime-local"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
            </div>

            <div className="campo">
              <label htmlFor="fim">Data final</label>
              <input
                id="fim"
                type="datetime-local"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
              />
            </div>

            <div className="campo campo-full">
              <label htmlFor="descricao">Descrição</label>
              <textarea
                id="descricao"
                placeholder="Descreva a campanha..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={6}
              />
            </div>
          </div>

          <div className="acoes">
            <button
              type="button"
              className="btn-secundario"
              onClick={() => router.push("/Admin/campanhas")}
            >
              Cancelar
            </button>

            <button type="submit" className="btn-primario" disabled={loading}>
              {loading ? "Salvando..." : "Cadastrar campanha"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .campanha-page {
          min-height: 100%;
          padding: 24px;
          background: linear-gradient(180deg, #f8f5f2 0%, #f4ede8 100%);
        }

        .campanha-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }

        .campanha-badge {
          display: inline-block;
          margin-bottom: 10px;
          background: #f3e4d8;
          color: #7a4b2f;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }

        .campanha-header h1 {
          margin: 0 0 8px;
          font-size: 32px;
          line-height: 1.1;
          color: #2d1e17;
          font-weight: 800;
        }

        .campanha-header p {
          margin: 0;
          color: #6f5b4f;
          font-size: 15px;
          max-width: 720px;
        }

        .btn-voltar {
          border: none;
          background: #fff;
          color: #7a4b2f;
          padding: 12px 18px;
          border-radius: 14px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(122, 75, 47, 0.08);
        }

        .campanha-card {
          background: rgba(255, 255, 255, 0.96);
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 18px 45px rgba(68, 42, 24, 0.08);
          border: 1px solid rgba(122, 75, 47, 0.08);
        }

        .campanha-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .campo {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .campo-lg,
        .campo-full {
          grid-column: span 2;
        }

        .campo label {
          font-size: 14px;
          font-weight: 700;
          color: #4a3428;
        }

        .campo input,
        .campo select,
        .campo textarea {
          width: 100%;
          border: 1px solid #e7d7c8;
          background: #fffdfb;
          border-radius: 14px;
          padding: 14px 16px;
          font-size: 15px;
          color: #2d1e17;
          outline: none;
          transition: all 0.2s ease;
        }

        .campo input:focus,
        .campo select:focus,
        .campo textarea:focus {
          border-color: #b07a57;
          box-shadow: 0 0 0 4px rgba(176, 122, 87, 0.12);
        }

        .campo textarea {
          resize: vertical;
          min-height: 140px;
        }

        .campo small {
          color: #8b776a;
          font-size: 12px;
        }

        .acoes {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          flex-wrap: wrap;
        }

        .btn-secundario,
        .btn-primario {
          border: none;
          border-radius: 14px;
          padding: 14px 18px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          min-width: 180px;
          transition: all 0.2s ease;
        }

        .btn-secundario {
          background: #f3ede8;
          color: #5f4434;
        }

        .btn-primario {
          background: linear-gradient(135deg, #8b5e3c 0%, #b07a57 100%);
          color: #fff;
          box-shadow: 0 12px 24px rgba(139, 94, 60, 0.2);
        }

        .btn-primario:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @media (max-width: 900px) {
          .campanha-grid {
            grid-template-columns: 1fr;
          }

          .campo-lg,
          .campo-full {
            grid-column: span 1;
          }

          .campanha-page {
            padding: 16px;
          }

          .campanha-card {
            padding: 18px;
            border-radius: 18px;
          }

          .campanha-header h1 {
            font-size: 26px;
          }

          .acoes {
            flex-direction: column;
          }

          .btn-secundario,
          .btn-primario {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}