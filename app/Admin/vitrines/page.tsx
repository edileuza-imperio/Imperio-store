"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Vitrine = {
  id_vitrine?: number | string;
  nome?: string;
  slug?: string;
  titulo?: string;
  subtitulo?: string | null;
  tipo?: string;
  status_id?: number | string;
  nivel_id?: number | string;
  ordem?: number | string;
  criado_em?: string;
  atualizado_em?: string;
};

function extrairLista(payload: any): Vitrine[] {
  if (Array.isArray(payload?.dados?.dados)) return payload.dados.dados;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload)) return payload;
  return [];
}

function obterId(item: Vitrine) {
  return item.id_vitrine ?? "";
}

function formatarData(data?: string | null) {
  if (!data) return "—";

  const dt = new Date(data);

  if (Number.isNaN(dt.getTime())) {
    return data;
  }

  return dt.toLocaleString("pt-BR");
}

function formatarTipo(tipo?: string) {
  if (!tipo) return "Não informado";

  const mapa: Record<string, string> = {
    produto: "Produto",
    campanha: "Campanha",
    categoria: "Categoria",
    banner: "Banner",
    misto: "Misto",
  };

  return mapa[tipo.toLowerCase()] || tipo;
}

function textoStatus(statusId?: number | string) {
  if (String(statusId) === "1") return "Ativo";
  if (String(statusId) === "2") return "Inativo";
  return `Status ${statusId ?? "—"}`;
}

function classeStatus(statusId?: number | string) {
  if (String(statusId) === "1") return "status ativo";
  if (String(statusId) === "2") return "status inativo";
  return "status neutro";
}

export default function VitrinesPage() {
  const router = useRouter();

  const [vitrines, setVitrines] = useState<Vitrine[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  const carregarVitrines = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      const response = await api.get("/painel/vitrines", {
        withCredentials: true,
      });

      const lista = extrairLista(response?.data);
      setVitrines(lista);
    } catch (error: any) {
      console.error("Erro ao carregar vitrines:", error);
      setErro(
        error?.response?.data?.mensagem ||
          error?.message ||
          "Não foi possível carregar as vitrines."
      );
      setVitrines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarVitrines();
  }, [carregarVitrines]);

  async function excluirVitrine(id: string) {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir esta vitrine?"
    );

    if (!confirmar) return;

    try {
      setExcluindoId(id);

      const response = await api.delete(`/painel/vitrine/${id}`, {
        withCredentials: true,
      });

      const payload = response?.data;
      const sucesso =
        response?.status === 200 ||
        response?.status === 204 ||
        payload?.status === 200 ||
        payload?.status === 204;

      if (!sucesso) {
        toast.error(payload?.mensagem || "Não foi possível excluir a vitrine.");
        return;
      }

      toast.success(payload?.mensagem || "Vitrine excluída com sucesso.");

      setVitrines((prev) =>
        prev.filter((item) => String(obterId(item)) !== String(id))
      );
    } catch (error: any) {
      console.error("Erro ao excluir vitrine:", error);
      toast.error(
        error?.response?.data?.mensagem ||
          error?.message ||
          "Erro ao excluir vitrine."
      );
    } finally {
      setExcluindoId(null);
    }
  }

  const vitrinesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return vitrines;

    return vitrines.filter((item) => {
      const nome = (item.nome || "").toLowerCase();
      const slug = (item.slug || "").toLowerCase();
      const titulo = (item.titulo || "").toLowerCase();
      const tipo = (item.tipo || "").toLowerCase();

      return (
        nome.includes(termo) ||
        slug.includes(termo) ||
        titulo.includes(termo) ||
        tipo.includes(termo)
      );
    });
  }, [vitrines, busca]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="pagina">
        <div className="topo">
          <div>
            <span className="badge">Painel Administrativo</span>
            <h1>Vitrines</h1>
            <p>
              Gerencie as vitrines da home, escolha o tipo de conteúdo e controle
              os itens exibidos em cada seção.
            </p>
          </div>

          <div className="topoAcoes">
            <button
              type="button"
              className="btnSecundario"
              onClick={carregarVitrines}
            >
              Atualizar
            </button>

            <button
              type="button"
              className="btnPrimario"
              onClick={() => router.push("/Admin/vitrines/cadastrar")}
            >
              + Nova vitrine
            </button>
          </div>
        </div>

        <div className="barra">
          <input
            type="text"
            placeholder="Buscar por nome, slug, título ou tipo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <div className="resumo">
            <strong>{vitrinesFiltradas.length}</strong>
            <span>vitrine(s)</span>
          </div>
        </div>

        {loading ? (
          <div className="estado">
            <div className="loader" />
            <p>Carregando vitrines...</p>
          </div>
        ) : erro ? (
          <div className="estado">
            <h3>Erro ao carregar</h3>
            <p>{erro}</p>
            <button
              type="button"
              className="btnPrimario"
              onClick={carregarVitrines}
            >
              Tentar novamente
            </button>
          </div>
        ) : vitrinesFiltradas.length === 0 ? (
          <div className="estado">
            <h3>Nenhuma vitrine encontrada</h3>
            <p>
              Ainda não há vitrines cadastradas ou nenhuma corresponde à sua
              busca.
            </p>
            <button
              type="button"
              className="btnPrimario"
              onClick={() => router.push("/Admin/vitrines/cadastrar")}
            >
              Cadastrar primeira vitrine
            </button>
          </div>
        ) : (
          <div className="lista">
            {vitrinesFiltradas.map((item) => {
              const id = String(obterId(item));

              return (
                <div className="card" key={id}>
                  <div className="cardHeader">
                    <div>
                      <h2>{item.titulo || item.nome || "Vitrine sem título"}</h2>
                      <p className="slug">/{item.slug || "sem-slug"}</p>
                    </div>

                    <span className={classeStatus(item.status_id)}>
                      {textoStatus(item.status_id)}
                    </span>
                  </div>

                  <div className="cardBody">
                    <div className="linhaInfo">
                      <div className="box">
                        <span className="label">ID</span>
                        <strong>{id}</strong>
                      </div>

                      <div className="box">
                        <span className="label">Tipo</span>
                        <strong>{formatarTipo(item.tipo)}</strong>
                      </div>

                      <div className="box">
                        <span className="label">Ordem</span>
                        <strong>{item.ordem ?? "0"}</strong>
                      </div>
                    </div>

                    <div className="linhaInfo">
                      <div className="box boxFull">
                        <span className="label">Nome</span>
                        <strong>{item.nome || "Não informado"}</strong>
                      </div>
                    </div>

                    <div className="linhaInfo">
                      <div className="box boxFull">
                        <span className="label">Subtítulo</span>
                        <p>{item.subtitulo?.trim() || "Sem subtítulo cadastrado."}</p>
                      </div>
                    </div>

                    <div className="linhaInfo">
                      <div className="box">
                        <span className="label">Nível</span>
                        <strong>{item.nivel_id ?? "—"}</strong>
                      </div>

                      <div className="box">
                        <span className="label">Criado em</span>
                        <strong>{formatarData(item.criado_em)}</strong>
                      </div>

                      <div className="box">
                        <span className="label">Atualizado em</span>
                        <strong>{formatarData(item.atualizado_em)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="cardFooter">
                    <button
                      type="button"
                      className="btnCard btnEditar"
                      onClick={() => router.push(`/Admin/vitrines/${id}/editar`)}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className="btnCard btnItens"
                      onClick={() => router.push(`/Admin/vitrines/${id}/itens`)}
                    >
                      Itens
                    </button>

                    <button
                      type="button"
                      className="btnCard btnExcluir"
                      disabled={excluindoId === id}
                      onClick={() => excluirVitrine(id)}
                    >
                      {excluindoId === id ? "Excluindo..." : "Excluir"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .pagina {
          min-height: 100%;
          padding: 24px;
          background: #f5f7fa;
        }

        .topo {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }

        .badge {
          display: inline-block;
          margin-bottom: 10px;
          background: #eef2f6;
          color: #344054;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }

        .topo h1 {
          margin: 0 0 8px;
          font-size: 32px;
          line-height: 1.1;
          color: #101828;
          font-weight: 800;
        }

        .topo p {
          margin: 0;
          color: #475467;
          font-size: 15px;
          max-width: 760px;
        }

        .topoAcoes {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btnPrimario,
        .btnSecundario {
          border: none;
          border-radius: 14px;
          padding: 14px 18px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btnPrimario {
          background: #111827;
          color: #fff;
          box-shadow: 0 12px 24px rgba(17, 24, 39, 0.15);
        }

        .btnSecundario {
          background: #fff;
          color: #344054;
          border: 1px solid #d0d5dd;
        }

        .barra {
          display: flex;
          gap: 14px;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          margin-bottom: 22px;
          background: #ffffff;
          border: 1px solid #e4e7ec;
          border-radius: 20px;
          padding: 16px;
          box-shadow: 0 18px 45px rgba(16, 24, 40, 0.04);
        }

        .barra input {
          flex: 1;
          min-width: 260px;
          border: 1px solid #d0d5dd;
          background: #fff;
          border-radius: 14px;
          padding: 14px 16px;
          font-size: 15px;
          color: #101828;
          outline: none;
        }

        .barra input:focus {
          border-color: #98a2b3;
          box-shadow: 0 0 0 4px rgba(152, 162, 179, 0.12);
        }

        .resumo {
          display: flex;
          align-items: baseline;
          gap: 8px;
          color: #475467;
          white-space: nowrap;
        }

        .resumo strong {
          font-size: 24px;
          color: #101828;
        }

        .estado {
          background: #ffffff;
          border-radius: 24px;
          padding: 40px 24px;
          text-align: center;
          border: 1px solid #e4e7ec;
          box-shadow: 0 18px 45px rgba(16, 24, 40, 0.04);
        }

        .estado h3 {
          margin: 0 0 10px;
          color: #101828;
          font-size: 22px;
        }

        .estado p {
          margin: 0 0 18px;
          color: #475467;
        }

        .loader {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 4px solid #eaecf0;
          border-top-color: #111827;
          margin: 0 auto 14px;
          animation: girar 0.9s linear infinite;
        }

        @keyframes girar {
          to {
            transform: rotate(360deg);
          }
        }

        .lista {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .card {
          background: #ffffff;
          border-radius: 22px;
          border: 1px solid #e4e7ec;
          box-shadow: 0 18px 45px rgba(16, 24, 40, 0.04);
          overflow: hidden;
        }

        .cardHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          padding: 20px 20px 14px;
          border-bottom: 1px solid #eaecf0;
        }

        .cardHeader h2 {
          margin: 0 0 6px;
          font-size: 21px;
          color: #101828;
        }

        .slug {
          margin: 0;
          color: #667085;
          font-size: 13px;
          word-break: break-word;
        }

        .status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 96px;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .status.ativo {
          background: #e7f7ee;
          color: #177245;
        }

        .status.inativo {
          background: #fdecec;
          color: #b42318;
        }

        .status.neutro {
          background: #eef2f6;
          color: #344054;
        }

        .cardBody {
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .linhaInfo {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .box {
          background: #f9fafb;
          border: 1px solid #eaecf0;
          border-radius: 16px;
          padding: 14px;
          min-width: 0;
        }

        .boxFull {
          grid-column: span 3;
        }

        .label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #667085;
          margin-bottom: 8px;
        }

        .box strong {
          color: #101828;
          font-size: 14px;
          word-break: break-word;
        }

        .box p {
          margin: 0;
          color: #475467;
          line-height: 1.6;
          word-break: break-word;
        }

        .cardFooter {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          padding: 0 20px 20px;
        }

        .btnCard {
          border: none;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btnEditar {
          background: #f2f4f7;
          color: #344054;
        }

        .btnItens {
          background: #eef4ff;
          color: #1d4ed8;
        }

        .btnExcluir {
          background: #fdecec;
          color: #b42318;
        }

        .btnCard:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @media (max-width: 1100px) {
          .lista {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .pagina {
            padding: 16px;
          }

          .topo h1 {
            font-size: 26px;
          }

          .barra {
            padding: 14px;
          }

          .linhaInfo {
            grid-template-columns: 1fr;
          }

          .boxFull {
            grid-column: span 1;
          }

          .cardFooter {
            flex-direction: column;
          }

          .btnCard,
          .btnPrimario,
          .btnSecundario {
            width: 100%;
          }

          .cardHeader {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
}