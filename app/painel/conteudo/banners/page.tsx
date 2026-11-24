"use client";

import {
  AlertCircle,
  CalendarClock,
  Check,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  Layers,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import conexao from "@/Services/Conexao/Conexao";
import ImagemService from "@/Services/Imagem/ImagemService";
import ROTAS from "../../../constants/rotas";

type Banner = {
  id_banner: number;
  status_id: number;
  titulo: string;
  descricao?: string | null;
  imagem_url: string;
  link_url?: string | null;
  posicao: string;
  ordem: number;
  inicio_em?: string | null;
  termina_em?: string | null;
  ativo: boolean | number | string;
  criado_em?: string | null;
  atualizado_em?: string | null;
};

type StatusCatalogo = {
  id_status: number;
  grupo?: string;
  codigo?: string;
  nome: string;
  ativo?: boolean | number | string;
};

type Contadores = {
  total: number;
  ativos: number;
  inativos: number;
};

/**
 * Algumas respostas da API chegam como JSON seguido de "null".
 * Extrai o primeiro objeto/array JSON completo sem tentar interpretar
 * propriedades da configuração do Axios como dados da API.
 */
function interpretarJson(texto: string): any {
  const inicio = texto.search(/[\[{]/);
  if (inicio < 0) return texto;

  const pilha: string[] = [];
  let emString = false;
  let escape = false;

  for (let i = inicio; i < texto.length; i += 1) {
    const caractere = texto[i];

    if (emString) {
      if (escape) {
        escape = false;
      } else if (caractere === "\\") {
        escape = true;
      } else if (caractere === '"') {
        emString = false;
      }
      continue;
    }

    if (caractere === '"') {
      emString = true;
      continue;
    }

    if (caractere === "{" || caractere === "[") {
      pilha.push(caractere);
      continue;
    }

    if (caractere === "}" || caractere === "]") {
      pilha.pop();

      if (pilha.length === 0) {
        const trecho = texto.slice(inicio, i + 1);
        try {
          return JSON.parse(trecho);
        } catch {
          return texto;
        }
      }
    }
  }

  return texto;
}

/** Normaliza resposta Axios, interceptor e JSON serializado. */
function obterCorpoResposta(resposta: any): any {
  let corpo = resposta;

  if (
    corpo &&
    typeof corpo === "object" &&
    Object.prototype.hasOwnProperty.call(corpo, "data")
  ) {
    corpo = corpo.data ?? corpo;
  }

  if (typeof corpo === "string") {
    corpo = interpretarJson(corpo.trim());
  }

  return corpo;
}

function extrairArray<T>(payload: any, chaveLista: "banners" | "status"): T[] {
  const raiz = obterCorpoResposta(payload);
  const visitados = new Set<any>();
  const fila: any[] = [raiz];
  const envelopes = ["dados", "data", "resultado", "payload", "body"];

  while (fila.length > 0) {
    const atual = fila.shift();
    if (atual === null || atual === undefined) continue;

    if (Array.isArray(atual)) {
      return atual as T[];
    }

    if (typeof atual !== "object" || visitados.has(atual)) continue;
    visitados.add(atual);

    const lista = atual[chaveLista];
    if (Array.isArray(lista)) return lista as T[];

    // Mantém compatibilidade com respostas antigas que colocam a lista
    // diretamente em dados/data, mas não percorre config, headers ou request.
    for (const chave of envelopes) {
      const filho = atual[chave];
      if (filho !== undefined && filho !== null) fila.push(filho);
    }
  }

  return [];
}
function extrairObjeto(payload: any): any {
  let atual = obterCorpoResposta(payload);
  for (let i = 0; i < 5 && atual && !Array.isArray(atual); i += 1) {
    if (typeof atual.total === "number" || atual.total !== undefined)
      return atual;
    const proximo = atual.dados ?? atual.data ?? atual.resultado;
    if (proximo === undefined || proximo === atual) break;
    atual = proximo;
  }
  return atual ?? {};
}

function validarResposta(resposta: any): void {
  const payload = obterCorpoResposta(resposta);

  if (
    payload?.sucesso === false ||
    payload?.dados?.sucesso === false ||
    (typeof payload?.status === "number" && payload.status >= 400) ||
    (typeof resposta?.status === "number" && resposta.status >= 400)
  ) {
    throw new Error(
      payload?.mensagem ||
        payload?.dados?.mensagem ||
        payload?.erro ||
        "A operação não foi concluída.",
    );
  }
}

function erroApi(error: any, padrao: string): string {
  return (
    error?.response?.data?.mensagem ||
    error?.response?.data?.erro ||
    error?.response?.data?.message ||
    error?.message ||
    padrao
  );
}

function estaAtivo(valor: Banner["ativo"] | StatusCatalogo["ativo"]): boolean {
  return (
    valor === true ||
    valor === 1 ||
    String(valor).toLowerCase() === "true" ||
    String(valor) === "1"
  );
}

function formatarData(valor?: string | null): string {
  if (!valor) return "—";
  const data = new Date(valor.replace(" ", "T"));
  return Number.isNaN(data.getTime()) ? valor : data.toLocaleString("pt-BR");
}

function normalizarPosicao(valor: string): string {
  return valor
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [statusDisponiveis, setStatusDisponiveis] = useState<StatusCatalogo[]>(
    [],
  );
  const [contadoresApi, setContadoresApi] = useState<Contadores | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [excluindo, setExcluindo] = useState<number | null>(null);
  const [alterandoAtivo, setAlterandoAtivo] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<
    "todos" | "ativos" | "inativos"
  >("todos");
  const [filtroPosicao, setFiltroPosicao] = useState("todas");
  const router = useRouter();

  const carregarBanners = useCallback(async (silencioso = false) => {
    try {
      if (silencioso) setAtualizando(true);
      else setCarregando(true);
      setErro("");

      const [respostaBanners, respostaContadores, respostaStatus] =
        await Promise.all([
          conexao.get(ROTAS.BANNERS.PAINEL.LISTAR, { withCredentials: true }),
          conexao
            .get(ROTAS.BANNERS.PAINEL.CONTADORES, { withCredentials: true })
            .catch(() => null),
          conexao
            .get(ROTAS.PERMISSOES.STATUS.LISTAR_POR_GRUPO("GERAL"), {
              withCredentials: true,
            })
            .catch(() => null),
        ]);

      // A conexão pode entregar AxiosResponse ou o corpo direto do interceptor.
      const corpoBanners = obterCorpoResposta(respostaBanners);
      validarResposta(corpoBanners);

      const listaBanners = extrairArray<Banner>(corpoBanners, "banners");
      setBanners(listaBanners);

      if (respostaContadores) {
        const corpoContadores = obterCorpoResposta(respostaContadores);
        validarResposta(corpoContadores);
        const dados = extrairObjeto(corpoContadores);
        setContadoresApi({
          total: Number(dados.total ?? 0),
          ativos: Number(dados.ativos ?? 0),
          inativos: Number(dados.inativos ?? 0),
        });
      }

      if (respostaStatus) {
        const corpoStatus = obterCorpoResposta(respostaStatus);
        validarResposta(corpoStatus);
        setStatusDisponiveis(
          extrairArray<StatusCatalogo>(corpoStatus, "status"),
        );
      }
    } catch (error: any) {
      setErro(erroApi(error, "Não foi possível carregar os banners."));
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    void carregarBanners();
  }, [carregarBanners]);

  useEffect(() => {
    if (!sucesso) return;
    const temporizador = window.setTimeout(() => setSucesso(""), 4000);
    return () => window.clearTimeout(temporizador);
  }, [sucesso]);

  const posicoes = useMemo(
    () =>
      Array.from(
        new Set(banners.map((banner) => banner.posicao).filter(Boolean)),
      ).sort(),
    [banners],
  );

  const bannersFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return banners.filter((banner) => {
      const correspondeBusca =
        !termo ||
        (banner.titulo ?? "").toLocaleLowerCase("pt-BR").includes(termo) ||
        (banner.descricao ?? "").toLocaleLowerCase("pt-BR").includes(termo) ||
        (banner.posicao ?? "").toLocaleLowerCase("pt-BR").includes(termo);
      const correspondeStatus =
        filtroStatus === "todos" ||
        (filtroStatus === "ativos" && estaAtivo(banner.ativo)) ||
        (filtroStatus === "inativos" && !estaAtivo(banner.ativo));
      const correspondePosicao =
        filtroPosicao === "todas" || banner.posicao === filtroPosicao;
      return correspondeBusca && correspondeStatus && correspondePosicao;
    });
  }, [banners, busca, filtroStatus, filtroPosicao]);

  const totalAtivos =
    contadoresApi?.total === banners.length
      ? contadoresApi.ativos
      : banners.filter((banner) => estaAtivo(banner.ativo)).length;
  const totalInativos =
    contadoresApi?.total === banners.length
      ? contadoresApi.inativos
      : banners.length -
        banners.filter((banner) => estaAtivo(banner.ativo)).length;
  const totalPublicaveis = banners.filter(
    (banner) =>
      estaAtivo(banner.ativo) &&
      (!banner.inicio_em ||
        new Date(banner.inicio_em.replace(" ", "T")).getTime() <= Date.now()) &&
      (!banner.termina_em ||
        new Date(banner.termina_em.replace(" ", "T")).getTime() >= Date.now()),
  ).length;

  async function alternarAtivo(banner: Banner) {
    const novoAtivo = !estaAtivo(banner.ativo);
    try {
      setAlterandoAtivo(banner.id_banner);
      setErro("");
      const resposta = await conexao.put(
        ROTAS.BANNERS.PAINEL.ALTERAR_ATIVO(banner.id_banner),
        { ativo: novoAtivo },
        { withCredentials: true },
      );
      validarResposta(obterCorpoResposta(resposta));
      setSucesso(
        novoAtivo
          ? "Banner ativado com sucesso."
          : "Banner desativado com sucesso.",
      );
      await carregarBanners(true);
    } catch (error: any) {
      setErro(erroApi(error, "Não foi possível alterar o estado do banner."));
    } finally {
      setAlterandoAtivo(null);
    }
  }

  async function excluirBanner(banner: Banner) {
    const confirmar = window.confirm(
      `Deseja realmente excluir o banner "${banner.titulo}"? Esta ação não poderá ser desfeita.`,
    );
    if (!confirmar) return;

    try {
      setExcluindo(banner.id_banner);
      setErro("");
      const resposta = await conexao.delete(
        ROTAS.BANNERS.PAINEL.EXCLUIR(banner.id_banner),
        { withCredentials: true },
      );
      validarResposta(obterCorpoResposta(resposta));
      setSucesso("Banner excluído com sucesso.");
      await carregarBanners(true);
    } catch (error: any) {
      setErro(erroApi(error, "Não foi possível excluir o banner."));
    } finally {
      setExcluindo(null);
    }
  }

  async function alterarOrdem(banner: Banner, valor: string) {
    const ordem = Number(valor);
    if (!Number.isInteger(ordem) || ordem < 0 || ordem === Number(banner.ordem))
      return;
    try {
      const resposta = await conexao.put(
        ROTAS.BANNERS.PAINEL.ALTERAR_ORDEM(banner.id_banner),
        { ordem },
        { withCredentials: true },
      );
      validarResposta(obterCorpoResposta(resposta));
      setBanners((atuais) =>
        atuais.map((item) =>
          item.id_banner === banner.id_banner ? { ...item, ordem } : item,
        ),
      );
      setSucesso("Ordem do banner atualizada.");
    } catch (error: any) {
      setErro(erroApi(error, "Não foi possível atualizar a ordem."));
    }
  }

  async function alterarStatus(banner: Banner, statusId: number) {
    if (
      !Number.isInteger(statusId) ||
      statusId <= 0 ||
      statusId === Number(banner.status_id)
    )
      return;
    try {
      const resposta = await conexao.put(
        ROTAS.BANNERS.PAINEL.ALTERAR_STATUS(banner.id_banner),
        { statusId },
        { withCredentials: true },
      );
      validarResposta(obterCorpoResposta(resposta));
      setBanners((atuais) =>
        atuais.map((item) =>
          item.id_banner === banner.id_banner
            ? { ...item, status_id: statusId }
            : item,
        ),
      );
      setSucesso("Status cadastral atualizado.");
    } catch (error: any) {
      setErro(erroApi(error, "Não foi possível alterar o status cadastral."));
    }
  }

  return (
    <main className="banners-page">
      <header className="pagina-topo">
        <div>
          <div className="breadcrumb">
            <a href="/painel">Painel</a>
            <ChevronRight size={13} />
            <span>Conteúdo</span>
            <ChevronRight size={13} />
            <span>Banners</span>
          </div>
          <div className="titulo-principal">
            <div className="titulo-icone">
              <ImageIcon size={23} />
            </div>
            <div>
              <h1>Gerenciamento de banners</h1>
              <p>
                Gerencie imagens, links, posição e período de exibição da loja.
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="botao-primario"
          onClick={() => router.push(ROTAS.PAGINAS.PAINEL.BANNERS.CADASTRAR)}
        >
          <Plus size={17} /> Novo banner
        </button>
      </header>

      {erro && (
        <div className="mensagem mensagem-erro" role="alert">
          <AlertCircle size={17} />
          <span>{erro}</span>
          <button type="button" onClick={() => setErro("")} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>
      )}
      {sucesso && (
        <div className="mensagem mensagem-sucesso" role="status">
          <Check size={17} />
          <span>{sucesso}</span>
          <button
            type="button"
            onClick={() => setSucesso("")}
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className="indicadores">
        <article className="indicador">
          <span className="indicador-icone">
            <Layers size={19} />
          </span>
          <div>
            <small>TOTAL DE BANNERS</small>
            <strong>{banners.length}</strong>
          </div>
        </article>
        <article className="indicador">
          <span className="indicador-icone verde">
            <Check size={19} />
          </span>
          <div>
            <small>BANNERS ATIVOS</small>
            <strong>{totalAtivos}</strong>
          </div>
        </article>
        <article className="indicador">
          <span className="indicador-icone azul">
            <CalendarClock size={19} />
          </span>
          <div>
            <small>NO PERÍODO DE EXIBIÇÃO</small>
            <strong>{totalPublicaveis}</strong>
          </div>
        </article>
        <article className="indicador">
          <span className="indicador-icone amarelo">
            <SlidersHorizontal size={19} />
          </span>
          <div>
            <small>BANNERS INATIVOS</small>
            <strong>{totalInativos}</strong>
          </div>
        </article>
      </section>

      <section className="painel-listagem">
        <div className="listagem-topo">
          <div>
            <span className="sobrelinha">CONTEÚDO DA LOJA</span>
            <h2>Banners cadastrados</h2>
            <p>Pesquise, organize e configure os banners exibidos no site.</p>
          </div>
          <button
            type="button"
            className="botao-atualizar"
            onClick={() => void carregarBanners(true)}
            disabled={atualizando || carregando}
          >
            <RefreshCw size={15} className={atualizando ? "girando" : ""} />
            Atualizar
          </button>
        </div>

        <div className="filtros">
          <div className="busca">
            <Search size={17} />
            <input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por título, descrição ou posição..."
              aria-label="Buscar banners"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca("")}
                aria-label="Limpar busca"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <select
            value={filtroPosicao}
            onChange={(evento) => setFiltroPosicao(evento.target.value)}
            aria-label="Filtrar por posição"
          >
            <option value="todas">Todas as posições</option>
            {posicoes.map((posicao) => (
              <option key={posicao} value={posicao}>
                {normalizarPosicao(posicao)}
              </option>
            ))}
          </select>
          <div className="filtro-status">
            <button
              type="button"
              className={filtroStatus === "todos" ? "selecionado" : ""}
              onClick={() => setFiltroStatus("todos")}
            >
              Todos
            </button>
            <button
              type="button"
              className={filtroStatus === "ativos" ? "selecionado" : ""}
              onClick={() => setFiltroStatus("ativos")}
            >
              Ativos
            </button>
            <button
              type="button"
              className={filtroStatus === "inativos" ? "selecionado" : ""}
              onClick={() => setFiltroStatus("inativos")}
            >
              Inativos
            </button>
          </div>
        </div>

        {carregando ? (
          <div className="estado-vazio">
            <LoaderCircle className="girando" size={26} />
            <strong>Carregando banners...</strong>
          </div>
        ) : bannersFiltrados.length === 0 ? (
          <div className="estado-vazio">
            <ImageIcon size={32} />
            <strong>
              {busca || filtroPosicao !== "todas" || filtroStatus !== "todos"
                ? "Nenhum banner encontrado"
                : "Nenhum banner cadastrado"}
            </strong>
            <span>
              {banners.length === 0
                ? "Cadastre o primeiro banner para começar a organizar o conteúdo da loja."
                : "Altere os filtros ou tente outra pesquisa."}
            </span>
            {banners.length === 0 && (
              <button
                type="button"
                className="botao-primario"
                onClick={() =>
                  router.push(ROTAS.PAGINAS.PAINEL.BANNERS.CADASTRAR)
                }
              >
                <Plus size={16} /> Criar banner
              </button>
            )}
          </div>
        ) : (
          <div className="tabela-scroll">
            <table className="tabela-banners">
              <thead>
                <tr>
                  <th>Banner</th>
                  <th>Posição</th>
                  <th>Ordem</th>
                  <th>Período</th>
                  <th>Status</th>
                  <th className="acoes-coluna">Ações</th>
                </tr>
              </thead>
              <tbody>
                {bannersFiltrados.map((banner) => {
                  const ativo = estaAtivo(banner.ativo);
                  const imagemSrc = ImagemService.resolver(banner.imagem_url);
                  const statusNome = statusDisponiveis.find(
                    (status) =>
                      Number(status.id_status) === Number(banner.status_id),
                  )?.nome;
                  return (
                    <tr key={banner.id_banner}>
                      <td>
                        <div className="banner-identidade">
                          <span className="banner-thumb">
                            {imagemSrc ? (
                              <Image
                                src={imagemSrc}
                                alt={`Banner ${banner.titulo}`}
                                width={164}
                                height={96}
                                sizes="82px"
                                unoptimized
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <ImageIcon
                                size={20}
                                aria-label="Imagem indisponível"
                              />
                            )}
                          </span>
                          <div>
                            <strong>{banner.titulo}</strong>
                            <small>
                              {banner.descricao ||
                                `Banner #${banner.id_banner}`}
                            </small>
                            {banner.link_url && (
                              <a
                                href={banner.link_url}
                                target="_blank"
                                rel="noreferrer"
                                className="link-banner"
                              >
                                Abrir destino <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="tag-posicao">
                          {normalizarPosicao(banner.posicao || "principal")}
                        </span>
                      </td>
                      <td>
                        <input
                          className="ordem-inline"
                          type="number"
                          min="0"
                          defaultValue={banner.ordem ?? 0}
                          aria-label={`Ordem do banner ${banner.titulo}`}
                          onBlur={(evento) =>
                            void alterarOrdem(banner, evento.target.value)
                          }
                          onKeyDown={(evento) => {
                            if (evento.key === "Enter")
                              evento.currentTarget.blur();
                          }}
                        />
                      </td>
                      <td>
                        <span className="periodo">
                          {banner.inicio_em || banner.termina_em
                            ? `${formatarData(banner.inicio_em)} — ${formatarData(banner.termina_em)}`
                            : "Sem agendamento"}
                        </span>
                      </td>
                      <td>
                        <div className="status-stack">
                          <span
                            className={`status ${ativo ? "ativo" : "inativo"}`}
                          >
                            <i />
                            {ativo ? "Ativo" : "Inativo"}
                          </span>
                          <small>
                            {statusNome || `Status #${banner.status_id}`}
                          </small>
                          {statusDisponiveis.length > 0 && (
                            <select
                              className="status-select"
                              value={String(banner.status_id)}
                              onChange={(evento) =>
                                void alterarStatus(
                                  banner,
                                  Number(evento.target.value),
                                )
                              }
                              aria-label={`Status cadastral do banner ${banner.titulo}`}
                            >
                              {statusDisponiveis.map((status) => (
                                <option
                                  key={status.id_status}
                                  value={status.id_status}
                                >
                                  {status.nome}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="acoes">
                          <button
                            type="button"
                            className="acao-ativo"
                            onClick={() => void alternarAtivo(banner)}
                            disabled={alterandoAtivo === banner.id_banner}
                            title={ativo ? "Desativar banner" : "Ativar banner"}
                          >
                            {alterandoAtivo === banner.id_banner ? (
                              <LoaderCircle size={15} className="girando" />
                            ) : (
                              <span>{ativo ? "Desativar" : "Ativar"}</span>
                            )}
                          </button>
                          <button
                            type="button"
                            className="acao-editar"
                            onClick={() =>
                              router.push(
                                ROTAS.PAGINAS.PAINEL.BANNERS.EDITAR(
                                  banner.id_banner,
                                ),
                              )
                            }
                            title="Editar banner"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="acao-excluir"
                            onClick={() => void excluirBanner(banner)}
                            disabled={excluindo === banner.id_banner}
                            title="Excluir banner"
                          >
                            {excluindo === banner.id_banner ? (
                              <LoaderCircle size={15} className="girando" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="rodape-tabela">
          Exibindo <strong>{bannersFiltrados.length}</strong> de{" "}
          <strong>{banners.length}</strong> banners
        </div>
      </section>

      <style jsx>{estilos}</style>
    </main>
  );
}

const estilos = `
  .banners-page{width:100%;max-width:1320px;margin:0 auto;padding:26px clamp(14px,2.5vw,30px) 40px;color:#f5edf1;font-family:Inter,"Segoe UI",Roboto,Arial,sans-serif;box-sizing:border-box}
  .banners-page *{box-sizing:border-box}button{font:inherit;cursor:pointer}
  .pagina-topo{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:22px}
  .breadcrumb{display:flex;align-items:center;gap:8px;margin-bottom:13px;color:#8e7c87;font-size:11px}.breadcrumb a{color:#a8949e;text-decoration:none}.breadcrumb a:hover{color:#e9a1ba}
  .titulo-principal{display:flex;align-items:center;gap:12px}.titulo-icone{width:46px;height:46px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid #684153;border-radius:12px;background:linear-gradient(135deg,#50303e,#30202a);color:#eda8c0}
  .titulo-principal h1{margin:0 0 5px;color:#f8eff3;font-size:clamp(20px,2vw,26px);font-weight:750;letter-spacing:-.7px}.titulo-principal p{margin:0;color:#a894a0;font-size:12px}
  .botao-primario{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:10px 15px;border:1px solid #bd7894;border-radius:9px;background:linear-gradient(135deg,#a85f7b,#87445f);color:#fff;font-size:11px;font-weight:750;box-shadow:0 5px 16px #9b557526;transition:.2s}.botao-primario:hover{filter:brightness(1.12);transform:translateY(-1px)}.botao-primario:disabled{opacity:.6;cursor:not-allowed}
  .mensagem{display:flex;align-items:center;gap:10px;padding:12px 14px;margin-bottom:14px;border:1px solid;border-radius:9px;font-size:11px}.mensagem span{flex:1}.mensagem button{display:flex;border:0;background:transparent;color:inherit}.mensagem-erro{background:#351c25;border-color:#75404f;color:#f2aabd}.mensagem-sucesso{background:#192b22;border-color:#365b46;color:#a8dfbd}
  .indicadores{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:17px}.indicador{display:flex;align-items:center;gap:12px;min-width:0;padding:16px;border:1px solid #3f2b36;border-radius:12px;background:linear-gradient(145deg,#211a20,#1b161b)}
  .indicador-icone{width:39px;height:39px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid #694153;border-radius:10px;background:#392630;color:#e9a1ba}.indicador-icone.verde{background:#1c3026;border-color:#365b46;color:#8ed0a8}.indicador-icone.azul{background:#202b38;border-color:#3c526e;color:#9fc8ef}.indicador-icone.amarelo{background:#342b20;border-color:#66502e;color:#e5c17c}.indicador div{display:flex;flex-direction:column;gap:5px;min-width:0}.indicador small{color:#978590;font-size:8px;font-weight:750;letter-spacing:.7px}.indicador strong{color:#f7edf2;font-size:23px;line-height:1.1}
  .painel-listagem{overflow:hidden;border:1px solid #3f2b36;border-radius:13px;background:radial-gradient(circle at top right,rgba(126,65,91,.06),transparent 38%),#1c171b;box-shadow:0 8px 24px #0002}.listagem-topo{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:20px 21px 16px;border-bottom:1px solid #392832}
  .sobrelinha{color:#c987a1;font-size:8px;font-weight:800;letter-spacing:1.2px}.listagem-topo h2{margin:5px 0;color:#f1e7ec;font-size:15px}.listagem-topo p{margin:0;color:#94818d;font-size:10px}.botao-atualizar{display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid #493440;border-radius:8px;background:#211a20;color:#cdbac5;font-size:10px}.botao-atualizar:hover{border-color:#936078;color:#f0b2c8}.botao-atualizar:disabled{opacity:.6;cursor:not-allowed}
  .filtros{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px;border-bottom:1px solid #392832}.busca{display:flex;align-items:center;gap:9px;flex:1;max-width:410px;height:38px;padding:0 11px;border:1px solid #493440;border-radius:8px;background:#151115;color:#9d8995}.busca:focus-within{border-color:#a96b85}.busca input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#f1e9ed;font:inherit;font-size:10px}.busca input::placeholder{color:#74636d}.busca button{display:flex;border:0;background:transparent;color:#a8949e}
  .filtros>select{height:38px;padding:0 10px;border:1px solid #493440;border-radius:8px;background:#151115;color:#cdbac5;font:inherit;font-size:10px}.filtro-status{display:flex;gap:4px;padding:3px;border:1px solid #3f2b36;border-radius:8px;background:#171216;white-space:nowrap}.filtro-status button{padding:7px 11px;border:0;border-radius:6px;background:transparent;color:#988590;font-size:9px}.filtro-status button.selecionado{background:#573344;color:#f4c4d5}
  .tabela-scroll{width:100%;overflow-x:auto}.tabela-banners{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}.tabela-banners th{padding:12px 15px;background:#211a20;color:#8f7c88;font-size:8px;font-weight:800;letter-spacing:.8px;text-transform:uppercase}.tabela-banners td{padding:12px 15px;border-top:1px solid #342630;color:#cdbdc6;font-size:10px;vertical-align:middle}.tabela-banners tbody tr:hover{background:#251c23}.tabela-banners .acoes-coluna{text-align:right}
  .banner-identidade{display:flex;align-items:center;gap:11px;min-width:270px;max-width:460px}.banner-thumb{width:82px;height:48px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;border:1px solid #694153;border-radius:8px;background:#392630;color:#e9a1ba}.banner-thumb img{width:100%;height:100%;object-fit:cover}.banner-identidade>div{display:flex;flex-direction:column;gap:4px;min-width:0}.banner-identidade strong{overflow:hidden;color:#eee2e9;font-size:10px;text-overflow:ellipsis}.banner-identidade small{overflow:hidden;color:#806f7a;font-size:8px;text-overflow:ellipsis;max-width:310px}.link-banner{display:inline-flex;align-items:center;gap:4px;width:max-content;color:#d69ab1;text-decoration:none;font-size:8px}.link-banner:hover{color:#ffd2e2}
  .tag-posicao{display:inline-flex;padding:5px 8px;border:1px solid #59404d;border-radius:20px;background:#2c2028;color:#d6a5b8;font-size:8px}.ordem-inline{width:58px;padding:7px;border:1px solid #493440;border-radius:7px;outline:0;background:#151115;color:#e8dce3;text-align:center;font:inherit;font-size:10px}.ordem-inline:focus{border-color:#b57491}.periodo{display:block;max-width:190px;overflow:hidden;color:#a894a0;font-size:8px;line-height:1.5;text-overflow:ellipsis;white-space:normal}.status-stack{display:flex;flex-direction:column;align-items:flex-start;gap:5px}.status-stack>small{color:#8f7d88;font-size:8px}.status{display:inline-flex;align-items:center;gap:6px;padding:5px 8px;border:1px solid;border-radius:20px;font-size:8px;font-weight:750}.status i{width:6px;height:6px;border-radius:50%;background:currentColor}.status.ativo{border-color:#345d46;background:#1b3025;color:#8fd0a7}.status.inativo{border-color:#65434a;background:#321f25;color:#e4a0ad}.status-select{max-width:130px;padding:4px 6px;border:1px solid #493440;border-radius:6px;background:#151115;color:#aa98a2;font:inherit;font-size:8px}
  .acoes{display:flex;justify-content:flex-end;align-items:center;gap:6px}.acoes button{height:30px;display:flex;align-items:center;justify-content:center;gap:5px;padding:0 8px;border:1px solid;border-radius:7px;background:transparent;transition:.2s}.acao-ativo{border-color:#4b594a!important;color:#a9cda9;font-size:8px}.acao-ativo:hover{background:#223127}.acao-editar{width:30px;border-color:#665044!important;color:#e1bd8a}.acao-editar:hover{background:#3b2b20}.acao-excluir{width:30px;border-color:#69404a!important;color:#e69aaa}.acao-excluir:hover{background:#3a2028}.acoes button:disabled{opacity:.5;cursor:not-allowed}
  .rodape-tabela{padding:12px 18px;border-top:1px solid #392832;color:#8f7d88;font-size:9px}.rodape-tabela strong{color:#d8c4ce}.estado-vazio{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;min-height:220px;padding:30px;color:#8d7b87;text-align:center}.estado-vazio strong{color:#d8c7d0;font-size:12px}.estado-vazio span{font-size:10px}.estado-vazio .botao-primario{margin-top:7px}.botao-cancelar{padding:10px 14px;border:1px solid #493440;border-radius:8px;background:transparent;color:#cdbac5;font-size:10px}.botao-cancelar:hover{background:#30232c}
  .girando{animation:girar 1s linear infinite}@keyframes girar{to{transform:rotate(360deg)}}
  @media(max-width:900px){.indicadores{grid-template-columns:repeat(2,minmax(0,1fr))}.pagina-topo{align-items:flex-start;flex-direction:column}.pagina-topo>.botao-primario{align-self:flex-end}.filtros{flex-wrap:wrap}.busca{max-width:none;flex-basis:100%}.filtros>select{flex:1}}
  @media(max-width:560px){.banners-page{padding:18px 12px 28px}.titulo-principal h1{font-size:19px}.titulo-principal p{font-size:10px}.indicadores{gap:8px}.indicador{padding:11px;gap:8px}.indicador-icone{width:33px;height:33px}.indicador small{font-size:7px}.indicador strong{font-size:19px}.listagem-topo{padding:15px;align-items:flex-start}.filtros{align-items:stretch;flex-direction:column;padding:12px}.busca,.filtros>select{width:100%;max-width:none}.filtro-status{width:100%}.filtro-status button{flex:1}.tabela-banners th,.tabela-banners td{padding:11px 12px}.campos-duplos{grid-template-columns:1fr;gap:0}.modal-fundo{padding:10px}.modal-banner{max-height:calc(100vh - 20px)}}
`;
