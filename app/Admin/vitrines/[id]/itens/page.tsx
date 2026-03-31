"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

type VitrineItem = {
  id_vitrine_item?: number | string;
  vitrine_id?: number | string;
  produto_id?: number | string | null;
  campanha_id?: number | string | null;
  categoria_id?: number | string | null;
  banner_id?: number | string | null;
  titulo_personalizado?: string | null;
  subtitulo_personalizado?: string | null;
  imagem_personalizada?: string | null;
  link_personalizado?: string | null;
  status_id?: number | string;
  nivel_id?: number | string;
  ordem?: number | string;
  criado_em?: string;
  atualizado_em?: string;
};

function extrairLista(payload: any): any[] {
  if (Array.isArray(payload?.dados?.dados)) return payload.dados.dados;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload)) return payload;
  return [];
}

function formatarData(data?: string | null) {
  if (!data) return "—";
  const dt = new Date(data);
  if (Number.isNaN(dt.getTime())) return data;
  return dt.toLocaleString("pt-BR");
}

function tipoLabel(tipo?: string) {
  switch ((tipo || "").toLowerCase()) {
    case "produto":
      return "Produto";
    case "campanha":
      return "Campanha";
    case "categoria":
      return "Categoria";
    case "banner":
      return "Banner";
    case "misto":
      return "Misto";
    default:
      return tipo || "Não informado";
  }
}

function textoReferencia(item: VitrineItem) {
  if (item.produto_id) return `Produto #${item.produto_id}`;
  if (item.campanha_id) return `Campanha #${item.campanha_id}`;
  if (item.categoria_id) return `Categoria #${item.categoria_id}`;
  if (item.banner_id) return `Banner #${item.banner_id}`;
  if (item.imagem_personalizada) return item.imagem_personalizada;
  return "Sem referência";
}

export default function VitrineItensPage() {
  const router = useRouter();
  const params = useParams();

  const vitrineId = useMemo(() => String(params?.id ?? ""), [params]);

  const [vitrine, setVitrine] = useState<Vitrine | null>(null);
  const [itens, setItens] = useState<VitrineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [removendoId, setRemovendoId] = useState<string | null>(null);

  const carregarVitrine = useCallback(async () => {
    const response = await api.get(`/painel/vitrine/${vitrineId}`, {
      withCredentials: true,
    });

    const payload = response?.data;
    const dados = payload?.dados?.dados ?? payload?.dados ?? payload;

    setVitrine(dados || null);
    return dados || null;
  }, [vitrineId]);

  const carregarItens = useCallback(async () => {
    const response = await api.get(`/painel/vitrine/${vitrineId}/itens`, {
      withCredentials: true,
    });

    const lista = extrairLista(response?.data);
    setItens(lista);
    return lista;
  }, [vitrineId]);

  const carregarTudo = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      await carregarVitrine();
      await carregarItens();
    } catch (error: any) {
      console.error("Erro ao carregar página:", error);
      setErro(
        error?.response?.data?.mensagem ||
          error?.message ||
          "Não foi possível carregar os itens da vitrine."
      );
      setVitrine(null);
      setItens([]);
    } finally {
      setLoading(false);
    }
  }, [carregarItens, carregarVitrine]);

  useEffect(() => {
    if (vitrineId) {
      carregarTudo();
    }
  }, [vitrineId, carregarTudo]);

  async function removerItem(itemId: string) {
    const confirmar = window.confirm(
      "Tem certeza que deseja remover este item da vitrine?"
    );

    if (!confirmar) return;

    try {
      setRemovendoId(itemId);

      const response = await api.delete(`/painel/vitrine/item/${itemId}`, {
        withCredentials: true,
      });

      const payload = response?.data;
      const sucesso =
        response?.status === 200 ||
        response?.status === 204 ||
        payload?.status === 200 ||
        payload?.status === 204;

      if (!sucesso) {
        toast.error(payload?.mensagem || "Não foi possível remover o item.");
        return;
      }

      toast.success(payload?.mensagem || "Item removido com sucesso.");

      setItens((prev) =>
        prev.filter(
          (item) => String(item.id_vitrine_item ?? "") !== String(itemId)
        )
      );
    } catch (error: any) {
      console.error("Erro ao remover item:", error);
      toast.error(
        error?.response?.data?.mensagem ||
          error?.message ||
          "Erro ao remover item."
      );
    } finally {
      setRemovendoId(null);
    }
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="pagina">
        <div className="conteudoPrincipal">
          <div className="topo">
            <div>
              <span className="badge">Painel Administrativo</span>
              <h1>Itens da vitrine</h1>
              <p>
                {vitrine ? (
                  <>
                    Gerencie os itens da vitrine{" "}
                    <strong>{vitrine.titulo || vitrine.nome}</strong> do tipo{" "}
                    <strong>{tipoLabel(vitrine.tipo)}</strong>.
                  </>
                ) : (
                  "Gerencie os itens da vitrine."
                )}
              </p>
            </div>

            <div className="topoAcoes">
              <button
                type="button"
                className="btnSecundario"
                onClick={() => router.push("/Admin/vitrines")}
              >
                Voltar
              </button>

              <button
                type="button"
                className="btnSecundario"
                onClick={carregarTudo}
              >
                Atualizar
              </button>

              <button
                type="button"
                className="btnPrimario"
                onClick={() =>
                  router.push(`/Admin/vitrines/${vitrineId}/itens/novo`)
                }
              >
                + Adicionar item
              </button>
            </div>
          </div>

          {loading ? (
            <div className="estado">
              <div className="loader" />
              <p>Carregando itens da vitrine...</p>
            </div>
          ) : erro ? (
            <div className="estado">
              <h3>Erro ao carregar</h3>
              <p>{erro}</p>
              <button type="button" className="btnPrimario" onClick={carregarTudo}>
                Tentar novamente
              </button>
            </div>
          ) : itens.length === 0 ? (
            <div className="estado">
              <h3>Nenhum item cadastrado</h3>
              <p>Clique em “Adicionar item” para cadastrar o primeiro item.</p>
            </div>
          ) : (
            <div className="lista">
              {itens.map((item) => {
                const id = String(item.id_vitrine_item ?? "");

                return (
                  <div className="card" key={id}>
                    <div className="cardHeader">
                      <div>
                        <h2>{item.titulo_personalizado || textoReferencia(item)}</h2>
                        <p className="sub">{textoReferencia(item)}</p>
                      </div>

                      <span className="ordemTag">Ordem {item.ordem ?? 0}</span>
                    </div>

                    <div className="cardBody">
                      <div className="linhaInfo">
                        <div className="box">
                          <span className="label">ID do item</span>
                          <strong>{id}</strong>
                        </div>

                        <div className="box">
                          <span className="label">Status</span>
                          <strong>{item.status_id ?? "—"}</strong>
                        </div>

                        <div className="box">
                          <span className="label">Nível</span>
                          <strong>{item.nivel_id ?? "—"}</strong>
                        </div>
                      </div>

                      <div className="linhaInfo">
                        <div className="box boxFull">
                          <span className="label">Subtítulo personalizado</span>
                          <p>{item.subtitulo_personalizado?.trim() || "Não informado"}</p>
                        </div>
                      </div>

                      <div className="linhaInfo">
                        <div className="box boxFull">
                          <span className="label">Imagem / Banner</span>
                          <p>{item.imagem_personalizada?.trim() || "Não informado"}</p>
                        </div>
                      </div>

                      <div className="linhaInfo">
                        <div className="box boxFull">
                          <span className="label">Link personalizado</span>
                          <p>{item.link_personalizado?.trim() || "Não informado"}</p>
                        </div>
                      </div>

                      <div className="linhaInfo">
                        <div className="box">
                          <span className="label">Criado em</span>
                          <strong>{formatarData(item.criado_em)}</strong>
                        </div>

                        <div className="box">
                          <span className="label">Atualizado em</span>
                          <strong>{formatarData(item.atualizado_em)}</strong>
                        </div>

                        <div className="box">
                          <span className="label">Vitrine</span>
                          <strong>{item.vitrine_id ?? "—"}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="cardFooter">
                      <button
                        type="button"
                        className="btnExcluir"
                        disabled={removendoId === id}
                        onClick={() => removerItem(id)}
                      >
                        {removendoId === id ? "Removendo..." : "Remover item"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .pagina {
          min-height: 100%;
          padding: 24px;
          background: linear-gradient(180deg, #fffaf7 0%, #fff3ec 100%);
          display: block;
        }

        .conteudoPrincipal {
          width: 100%;
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
          background: #f8e5df;
          color: #8b5e5a;
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
          color: #5c3a36;
          font-weight: 800;
        }

        .topo p {
          margin: 0;
          color: #7a5c57;
          font-size: 15px;
          max-width: 760px;
        }

        .topoAcoes {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btnPrimario,
        .btnSecundario,
        .btnExcluir {
          border: none;
          border-radius: 14px;
          padding: 14px 18px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btnPrimario {
          background: #b76e79;
          color: #fff;
          box-shadow: 0 12px 24px rgba(183, 110, 121, 0.24);
        }

        .btnPrimario:hover {
          background: #a85f6a;
        }

        .btnSecundario {
          background: #fffdfb;
          color: #6d4c47;
          border: 1px solid #ead7cf;
        }

        .btnSecundario:hover {
          background: #fff6f1;
        }

        .btnExcluir {
          background: #fff1ef;
          color: #b54738;
          width: 100%;
        }

        .estado {
          background: #fffdfb;
          border-radius: 24px;
          padding: 40px 24px;
          text-align: center;
          border: 1px solid #f0dfd7;
          box-shadow: 0 18px 45px rgba(128, 86, 78, 0.06);
        }

        .estado h3 {
          margin: 0 0 10px;
          color: #5c3a36;
          font-size: 22px;
        }

        .estado p {
          margin: 0 0 18px;
          color: #7a5c57;
        }

        .loader {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 4px solid #f2dfd7;
          border-top-color: #b76e79;
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
          background: #fffdfb;
          border-radius: 22px;
          border: 1px solid #f0dfd7;
          box-shadow: 0 18px 45px rgba(128, 86, 78, 0.06);
          overflow: hidden;
        }

        .cardHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          padding: 20px 20px 14px;
          border-bottom: 1px solid #f4e6df;
        }

        .cardHeader h2 {
          margin: 0 0 6px;
          font-size: 21px;
          color: #5c3a36;
        }

        .sub {
          margin: 0;
          color: #8e6f68;
          font-size: 13px;
        }

        .ordemTag {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 96px;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          background: #f9ebe6;
          color: #8b5e5a;
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
          background: #fff8f4;
          border: 1px solid #f3e3dc;
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
          color: #9b7b74;
          margin-bottom: 8px;
        }

        .box strong {
          color: #5c3a36;
          font-size: 14px;
          word-break: break-word;
        }

        .box p {
          margin: 0;
          color: #7a5c57;
          line-height: 1.6;
          word-break: break-word;
        }

        .cardFooter {
          padding: 0 20px 20px;
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

          .estado {
            padding: 18px;
          }

          .linhaInfo {
            grid-template-columns: 1fr;
          }

          .boxFull {
            grid-column: span 1;
          }

          .topoAcoes {
            width: 100%;
          }

          .btnPrimario,
          .btnSecundario,
          .btnExcluir {
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