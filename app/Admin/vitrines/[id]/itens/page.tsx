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

type Opcao = {
  id?: number | string;
  nome?: string;
  titulo?: string;
  slug?: string;
};

function extrairLista(payload: any): any[] {
  if (Array.isArray(payload?.dados?.dados)) return payload.dados.dados;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload)) return payload;
  return [];
}

function obterTextoOpcao(item: any) {
  return item?.nome || item?.titulo || item?.slug || "Sem nome";
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

export default function VitrineItensPage() {
  const router = useRouter();
  const params = useParams();

  const vitrineId = useMemo(() => String(params?.id ?? ""), [params]);

  const [vitrine, setVitrine] = useState<Vitrine | null>(null);
  const [itens, setItens] = useState<VitrineItem[]>([]);
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingOpcoes, setLoadingOpcoes] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [selecionadoId, setSelecionadoId] = useState("");
  const [tituloPersonalizado, setTituloPersonalizado] = useState("");
  const [subtituloPersonalizado, setSubtituloPersonalizado] = useState("");
  const [imagemPersonalizada, setImagemPersonalizada] = useState("");
  const [linkPersonalizado, setLinkPersonalizado] = useState("");
  const [ordem, setOrdem] = useState("0");
  const [adicionando, setAdicionando] = useState(false);
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

  const carregarOpcoes = useCallback(
    async (tipo: string) => {
      setLoadingOpcoes(true);

      try {
        let rota = "";

        switch ((tipo || "").toLowerCase()) {
          case "produto":
            rota = "/produtos";
            break;
          case "campanha":
            rota = "/painel/campanhas";
            break;
          case "categoria":
            rota = "/painel/categorias";
            break;
          case "banner":
            rota = "/banners";
            break;
          default:
            rota = "/produtos";
            break;
        }

        const response = await api.get(rota, {
          withCredentials: true,
        });

        const lista = extrairLista(response?.data);
        setOpcoes(lista);

        if (lista.length > 0) {
          const primeiro =
            lista[0]?.id_produto ??
            lista[0]?.id_campanha ??
            lista[0]?.id_categoria ??
            lista[0]?.id_banner ??
            lista[0]?.id ??
            "";

          setSelecionadoId(String(primeiro));
        } else {
          setSelecionadoId("");
        }
      } catch (error: any) {
        console.error("Erro ao carregar opções:", error);
        toast.error(
          error?.response?.data?.mensagem ||
            error?.message ||
            "Não foi possível carregar os itens disponíveis."
        );
        setOpcoes([]);
        setSelecionadoId("");
      } finally {
        setLoadingOpcoes(false);
      }
    },
    []
  );

  const carregarTudo = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      const vitrineAtual = await carregarVitrine();
      await carregarItens();

      if (vitrineAtual?.tipo) {
        await carregarOpcoes(vitrineAtual.tipo);
      }
    } catch (error: any) {
      console.error("Erro ao carregar página:", error);
      setErro(
        error?.response?.data?.mensagem ||
          error?.message ||
          "Não foi possível carregar os itens da vitrine."
      );
      setVitrine(null);
      setItens([]);
      setOpcoes([]);
    } finally {
      setLoading(false);
    }
  }, [carregarItens, carregarOpcoes, carregarVitrine]);

  useEffect(() => {
    if (vitrineId) {
      carregarTudo();
    }
  }, [vitrineId, carregarTudo]);

  async function adicionarItem() {
    if (!vitrine) {
      toast.warning("Vitrine não carregada.");
      return;
    }

    if (!selecionadoId) {
      toast.warning("Selecione um item.");
      return;
    }

    const tipo = (vitrine.tipo || "").toLowerCase();

    const body: Record<string, any> = {
      titulo_personalizado: tituloPersonalizado.trim() || null,
      subtitulo_personalizado: subtituloPersonalizado.trim() || null,
      imagem_personalizada: imagemPersonalizada.trim() || null,
      link_personalizado: linkPersonalizado.trim() || null,
      status_id: Number(vitrine.status_id || 1),
      nivel_id: Number(vitrine.nivel_id || 1),
      ordem: Number(ordem || 0),
    };

    if (tipo === "produto") body.produto_id = Number(selecionadoId);
    if (tipo === "campanha") body.campanha_id = Number(selecionadoId);
    if (tipo === "categoria") body.categoria_id = Number(selecionadoId);
    if (tipo === "banner") body.banner_id = Number(selecionadoId);

    try {
      setAdicionando(true);

      const response = await api.post(`/painel/vitrine/${vitrineId}/item`, body, {
        withCredentials: true,
      });

      const payload = response?.data;
      const sucesso =
        response?.status === 200 ||
        response?.status === 201 ||
        payload?.status === 200 ||
        payload?.status === 201;

      if (!sucesso) {
        toast.error(payload?.mensagem || "Não foi possível adicionar o item.");
        return;
      }

      toast.success(payload?.mensagem || "Item adicionado com sucesso.");

      setTituloPersonalizado("");
      setSubtituloPersonalizado("");
      setImagemPersonalizada("");
      setLinkPersonalizado("");
      setOrdem("0");

      await carregarItens();
    } catch (error: any) {
      console.error("Erro ao adicionar item:", error);
      toast.error(
        error?.response?.data?.mensagem ||
          error?.message ||
          "Erro ao adicionar item."
      );
    } finally {
      setAdicionando(false);
    }
  }

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

  function renderReferencia(item: VitrineItem) {
    if (item.produto_id) return `Produto #${item.produto_id}`;
    if (item.campanha_id) return `Campanha #${item.campanha_id}`;
    if (item.categoria_id) return `Categoria #${item.categoria_id}`;
    if (item.banner_id) return `Banner #${item.banner_id}`;
    return "Sem referência";
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="pagina">
        <div className="topo">
          <div>
            <span className="badge">Painel Administrativo</span>
            <h1>Itens da vitrine</h1>
            <p>
              {vitrine ? (
                <>
                  Gerencie os itens da vitrine <strong>{vitrine.titulo || vitrine.nome}</strong>{" "}
                  do tipo <strong>{tipoLabel(vitrine.tipo)}</strong>.
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
          </div>
        </div>

        <div className="cardAdicionar">
          <div className="cardAdicionarTexto">
            <h2>Adicionar item</h2>
            <p>
              Selecione um {vitrine?.tipo ? tipoLabel(vitrine.tipo).toLowerCase() : "item"} para
              vincular a esta vitrine.
            </p>
          </div>

          <div className="formGrid">
            <div className="campo campoGrande">
              <label>Selecionar item</label>
              <select
                value={selecionadoId}
                onChange={(e) => setSelecionadoId(e.target.value)}
                disabled={loadingOpcoes}
              >
                {loadingOpcoes ? (
                  <option value="">Carregando opções...</option>
                ) : opcoes.length === 0 ? (
                  <option value="">Nenhuma opção encontrada</option>
                ) : (
                  opcoes.map((item) => {
                    const id =
                      item?.id_produto ??
                      item?.id_campanha ??
                      item?.id_categoria ??
                      item?.id_banner ??
                      item?.id ??
                      "";

                    return (
                      <option key={String(id)} value={String(id)}>
                        {obterTextoOpcao(item)} — ID {String(id)}
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            <div className="campo">
              <label>Ordem</label>
              <input
                type="number"
                min="0"
                value={ordem}
                onChange={(e) => setOrdem(e.target.value)}
              />
            </div>

            <div className="campo campoGrande">
              <label>Título personalizado</label>
              <input
                type="text"
                placeholder="Opcional"
                value={tituloPersonalizado}
                onChange={(e) => setTituloPersonalizado(e.target.value)}
              />
            </div>

            <div className="campo campoGrande">
              <label>Subtítulo personalizado</label>
              <input
                type="text"
                placeholder="Opcional"
                value={subtituloPersonalizado}
                onChange={(e) => setSubtituloPersonalizado(e.target.value)}
              />
            </div>

            <div className="campo campoGrande">
              <label>Imagem personalizada</label>
              <input
                type="text"
                placeholder="URL, caminho ou texto"
                value={imagemPersonalizada}
                onChange={(e) => setImagemPersonalizada(e.target.value)}
              />
            </div>

            <div className="campo campoGrande">
              <label>Link personalizado</label>
              <input
                type="text"
                placeholder="/produto/exemplo"
                value={linkPersonalizado}
                onChange={(e) => setLinkPersonalizado(e.target.value)}
              />
            </div>
          </div>

          <div className="acoes">
            <button
              type="button"
              className="btnPrimario"
              disabled={adicionando || !selecionadoId}
              onClick={adicionarItem}
            >
              {adicionando ? "Adicionando..." : "Adicionar item"}
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
            <p>Adicione o primeiro item usando o formulário acima.</p>
          </div>
        ) : (
          <div className="lista">
            {itens.map((item) => {
              const id = String(item.id_vitrine_item ?? "");

              return (
                <div className="card" key={id}>
                  <div className="cardHeader">
                    <div>
                      <h2>{item.titulo_personalizado || renderReferencia(item)}</h2>
                      <p className="sub">{renderReferencia(item)}</p>
                    </div>

                    <span className="ordem">Ordem {item.ordem ?? 0}</span>
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
                        <span className="label">Imagem personalizada</span>
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

        .cardAdicionar {
          background: #ffffff;
          border-radius: 24px;
          padding: 24px;
          border: 1px solid #e4e7ec;
          box-shadow: 0 18px 45px rgba(16, 24, 40, 0.04);
          margin-bottom: 22px;
        }

        .cardAdicionarTexto h2 {
          margin: 0 0 6px;
          color: #101828;
          font-size: 24px;
        }

        .cardAdicionarTexto p {
          margin: 0 0 18px;
          color: #475467;
        }

        .formGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .campo {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .campoGrande {
          grid-column: span 2;
        }

        .campo label {
          font-size: 14px;
          font-weight: 700;
          color: #344054;
        }

        .campo input,
        .campo select {
          width: 100%;
          border: 1px solid #d0d5dd;
          background: #fff;
          border-radius: 14px;
          padding: 14px 16px;
          font-size: 15px;
          color: #101828;
          outline: none;
        }

        .campo input:focus,
        .campo select:focus {
          border-color: #98a2b3;
          box-shadow: 0 0 0 4px rgba(152, 162, 179, 0.12);
        }

        .acoes {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
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
          background: #111827;
          color: #fff;
          box-shadow: 0 12px 24px rgba(17, 24, 39, 0.15);
        }

        .btnSecundario {
          background: #fff;
          color: #344054;
          border: 1px solid #d0d5dd;
        }

        .btnExcluir {
          background: #fdecec;
          color: #b42318;
          width: 100%;
        }

        .btnPrimario:disabled,
        .btnSecundario:disabled,
        .btnExcluir:disabled {
          opacity: 0.7;
          cursor: not-allowed;
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

        .sub {
          margin: 0;
          color: #667085;
          font-size: 13px;
        }

        .ordem {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 96px;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
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
          padding: 0 20px 20px;
        }

        @media (max-width: 1100px) {
          .lista {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .formGrid {
            grid-template-columns: 1fr;
          }

          .campoGrande {
            grid-column: span 1;
          }
        }

        @media (max-width: 700px) {
          .pagina {
            padding: 16px;
          }

          .topo h1 {
            font-size: 26px;
          }

          .cardAdicionar,
          .estado {
            padding: 18px;
          }

          .linhaInfo {
            grid-template-columns: 1fr;
          }

          .boxFull {
            grid-column: span 1;
          }

          .topoAcoes,
          .acoes {
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