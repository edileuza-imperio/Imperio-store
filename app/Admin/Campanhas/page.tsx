"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Campanha = {
  id_campanha?: number | string;
  id?: number | string;
  titulo?: string;
  nome?: string;
  slug?: string;
  descricao?: string;
  banner?: string;
  statusid?: number | string;
  status_id?: number | string;
  status?:
    | {
        id_status?: number | string;
        nome?: string;
        codigo?: string;
      }
    | string;
  inicio?: string | null;
  fim?: string | null;
  criado?: string;
  atualizado?: string;
};

function formatarData(data?: string | null) {
  if (!data) return "—";

  const dt = new Date(data);

  if (Number.isNaN(dt.getTime())) {
    return data;
  }

  return dt.toLocaleString("pt-BR");
}

function obterIdCampanha(item: Campanha) {
  return item.id_campanha ?? item.id ?? "";
}

function obterTitulo(item: Campanha) {
  return item.titulo ?? item.nome ?? "Campanha sem título";
}

function obterStatusTexto(item: Campanha) {
  if (typeof item.status === "string") return item.status;
  if (item.status?.nome) return item.status.nome;

  const statusId = item.statusid ?? item.status_id;

  if (String(statusId) === "1") return "Ativo";
  if (String(statusId) === "2") return "Inativo";

  return "Sem status";
}

function obterStatusClasse(item: Campanha) {
  const texto = obterStatusTexto(item).toLowerCase();

  if (
    texto.includes("ativo") ||
    texto.includes("aprovado") ||
    texto.includes("entregue")
  ) {
    return "status ativo";
  }

  if (
    texto.includes("inativo") ||
    texto.includes("cancelado") ||
    texto.includes("recusado") ||
    texto.includes("bloqueado")
  ) {
    return "status inativo";
  }

  return "status neutro";
}

function normalizarCampanhas(payload: any): Campanha[] {
  if (Array.isArray(payload?.dados?.dados)) return payload.dados.dados;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload)) return payload;
  return [];
}

export default function CampanhasPage() {
  const router = useRouter();

  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const carregarCampanhas = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      const response = await api.get(rotas.painel.campanhas, {
        withCredentials: true,
      });

      const payload = response?.data;
      const lista = normalizarCampanhas(payload);

      setCampanhas(lista);
    } catch (error: any) {
      console.error("Erro ao carregar campanhas:", error);
      setErro(
        error?.response?.data?.mensagem ||
          error?.message ||
          "Não foi possível carregar as campanhas."
      );
      setCampanhas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarCampanhas();
  }, [carregarCampanhas]);

  async function excluirCampanha(id: string) {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir esta campanha?"
    );

    if (!confirmar) return;

    try {
      setExcluindoId(id);

      const rotaExcluir =
        typeof rotas?.painel?.campanhaAtualizar === "function"
          ? rotas.painel.campanhaAtualizar(id)
          : `/painel/campanha/${id}`;

      const response = await api.delete(rotaExcluir, {
        withCredentials: true,
      });

      const payload = response?.data;
      const sucesso =
        response?.status === 200 ||
        payload?.status === 200 ||
        payload?.status === 204;

      if (!sucesso) {
        toast.error(payload?.mensagem || "Não foi possível excluir a campanha.");
        return;
      }

      toast.success(payload?.mensagem || "Campanha excluída com sucesso.");

      setCampanhas((prev) =>
        prev.filter((item) => String(obterIdCampanha(item)) !== String(id))
      );
    } catch (error: any) {
      console.error("Erro ao excluir campanha:", error);
      toast.error(
        error?.response?.data?.mensagem ||
          error?.message ||
          "Erro ao excluir campanha."
      );
    } finally {
      setExcluindoId(null);
    }
  }

  const campanhasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return campanhas;

    return campanhas.filter((item) => {
      const titulo = obterTitulo(item).toLowerCase();
      const slug = (item.slug || "").toLowerCase();
      const status = obterStatusTexto(item).toLowerCase();
      const banner = (item.banner || "").toLowerCase();

      return (
        titulo.includes(termo) ||
        slug.includes(termo) ||
        status.includes(termo) ||
        banner.includes(termo)
      );
    });
  }, [campanhas, busca]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="campanhas-page">
        <div className="topo">
          <div>
            <span className="badge-topo">Painel Administrativo</span>
            <h1>Campanhas</h1>
            <p>
              Gerencie suas campanhas promocionais, acompanhe status e edite os
              dados rapidamente.
            </p>
          </div>

          <div className="topo-acoes">
            <button
              type="button"
              className="btn-secundario"
              onClick={() => carregarCampanhas()}
            >
              Atualizar
            </button>

            <button
              type="button"
              className="btn-primario"
              onClick={() => router.push("/Admin/campanhas/cadastrar")}
            >
              + Nova campanha
            </button>
          </div>
        </div>

        <div className="barra">
          <input
            type="text"
            placeholder="Buscar por título, slug, status ou banner..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <div className="resumo">
            <strong>{campanhasFiltradas.length}</strong>
            <span>campanha(s)</span>
          </div>
        </div>

        {loading ? (
          <div className="estado estado-loading">
            <div className="loader" />
            <p>Carregando campanhas...</p>
          </div>
        ) : erro ? (
          <div className="estado estado-erro">
            <h3>Erro ao carregar</h3>
            <p>{erro}</p>
            <button
              type="button"
              className="btn-primario"
              onClick={() => carregarCampanhas()}
            >
              Tentar novamente
            </button>
          </div>
        ) : campanhasFiltradas.length === 0 ? (
          <div className="estado estado-vazio">
            <h3>Nenhuma campanha encontrada</h3>
            <p>
              Ainda não há campanhas cadastradas ou nenhuma corresponde à sua
              busca.
            </p>
            <button
              type="button"
              className="btn-primario"
              onClick={() => router.push("/Admin/campanhas/cadastrar")}
            >
              Cadastrar primeira campanha
            </button>
          </div>
        ) : (
          <div className="lista">
            {campanhasFiltradas.map((item) => {
              const id = String(obterIdCampanha(item));
              const titulo = obterTitulo(item);
              const statusTexto = obterStatusTexto(item);

              return (
                <div className="card-campanha" key={id}>
                  <div className="card-head">
                    <div>
                      <h2>{titulo}</h2>
                      <p className="slug">/{item.slug || "sem-slug"}</p>
                    </div>

                    <span className={obterStatusClasse(item)}>{statusTexto}</span>
                  </div>

                  <div className="card-body">
                    <div className="linha-info">
                      <div className="bloco">
                        <span className="label">ID</span>
                        <strong>{id}</strong>
                      </div>

                      <div className="bloco">
                        <span className="label">Início</span>
                        <strong>{formatarData(item.inicio)}</strong>
                      </div>

                      <div className="bloco">
                        <span className="label">Fim</span>
                        <strong>{formatarData(item.fim)}</strong>
                      </div>
                    </div>

                    <div className="linha-info">
                      <div className="bloco bloco-full">
                        <span className="label">Banner</span>
                        <strong>{item.banner || "Não informado"}</strong>
                      </div>
                    </div>

                    <div className="linha-info">
                      <div className="bloco bloco-full">
                        <span className="label">Descrição</span>
                        <p className="descricao">
                          {item.descricao?.trim()
                            ? item.descricao
                            : "Sem descrição cadastrada."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="card-footer">
                    <button
                      type="button"
                      className="btn-card btn-ver"
                      onClick={() => router.push(`/Admin/campanhas/${id}/editar`)}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className="btn-card btn-produtos"
                      onClick={() =>
                        router.push(`/Admin/Campanhas/${id}/produtos`)
                      }
                    >
                      Produtos
                    </button>

                    <button
                      type="button"
                      className="btn-card btn-excluir"
                      disabled={excluindoId === id}
                      onClick={() => excluirCampanha(id)}
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
        .campanhas-page {
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

        .badge-topo {
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
          max-width: 720px;
        }

        .topo-acoes {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn-primario,
        .btn-secundario {
          border: none;
          border-radius: 14px;
          padding: 14px 18px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primario {
          background: #111827;
          color: #fff;
          box-shadow: 0 12px 24px rgba(17, 24, 39, 0.15);
        }

        .btn-secundario {
          background: #fff;
          color: #344054;
          border: 1px solid #d0d5dd;
          box-shadow: 0 10px 25px rgba(16, 24, 40, 0.05);
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

        .card-campanha {
          background: #ffffff;
          border-radius: 22px;
          border: 1px solid #e4e7ec;
          box-shadow: 0 18px 45px rgba(16, 24, 40, 0.04);
          overflow: hidden;
        }

        .card-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          padding: 20px 20px 14px;
          border-bottom: 1px solid #eaecf0;
        }

        .card-head h2 {
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

        .card-body {
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .linha-info {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .bloco {
          background: #f9fafb;
          border: 1px solid #eaecf0;
          border-radius: 16px;
          padding: 14px;
          min-width: 0;
        }

        .bloco-full {
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

        .bloco strong {
          color: #101828;
          font-size: 14px;
          word-break: break-word;
        }

        .descricao {
          margin: 0;
          color: #475467;
          line-height: 1.6;
          word-break: break-word;
        }

        .card-footer {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          padding: 0 20px 20px;
        }

        .btn-card {
          border: none;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-ver {
          background: #f2f4f7;
          color: #344054;
        }

        .btn-produtos {
          background: #eef4ff;
          color: #1d4ed8;
        }

        .btn-excluir {
          background: #fdecec;
          color: #b42318;
        }

        .btn-card:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @media (max-width: 1100px) {
          .lista {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .campanhas-page {
            padding: 16px;
          }

          .topo h1 {
            font-size: 26px;
          }

          .barra {
            padding: 14px;
          }

          .linha-info {
            grid-template-columns: 1fr;
          }

          .bloco-full {
            grid-column: span 1;
          }

          .card-footer {
            flex-direction: column;
          }

          .btn-card,
          .btn-primario,
          .btn-secundario {
            width: 100%;
          }

          .card-head {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
}