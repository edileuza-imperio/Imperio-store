"use client";

import {
  AlertCircle,
  CalendarClock,
  Check,
  ChevronRight,
  Image as ImageIcon,
  Layers,
  LoaderCircle,
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import conexao from "@/Services/Conexao/Conexao";
import ImagemService from "@/Services/Imagem/ImagemService";
import ROTAS from "../../../constants/rotas";

type Campanha = {
  id_campanha: number;
  status_id: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  imagem_url?: string | null;
  inicio_em?: string | null;
  termina_em?: string | null;
  ativo: boolean | number | string;
  criado_em?: string | null;
  atualizado_em?: string | null;
};

type Contadores = {
  total: number;
  ativas: number;
  inativas: number;
  agendadas: number;
  encerradas: number;
};

type ProdutoCatalogo = {
  id: number;
  nome: string;
  sku?: string;
  imagem?: string | null;
  preco?: number | null;
  status_id?: number;
  ativo?: boolean | number | string;
};

type ProdutoCampanha = {
  produto_id?: number;
  id_produto?: number;
  id?: number;
  status_id?: number;
  preco_promocional?: string | number | null;
  ordem?: number;
};

function interpretarJson(texto: string): any {
  const inicio = texto.search(/[\[{]/);
  if (inicio < 0) return texto;

  const pilha: string[] = [];
  let emString = false;
  let escape = false;

  for (let i = inicio; i < texto.length; i += 1) {
    const caractere = texto[i];

    if (emString) {
      if (escape) escape = false;
      else if (caractere === "\\") escape = true;
      else if (caractere === '"') emString = false;
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
        try {
          return JSON.parse(texto.slice(inicio, i + 1));
        } catch {
          return texto;
        }
      }
    }
  }

  return texto;
}

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

function extrairArray<T>(payload: any, chaveLista: string): T[] {
  const raiz = obterCorpoResposta(payload);
  const visitados = new Set<any>();
  const fila: any[] = [raiz];
  const envelopes = ["dados", "data", "resultado", "payload", "body"];

  while (fila.length > 0) {
    const atual = fila.shift();
    if (atual === null || atual === undefined) continue;
    if (Array.isArray(atual)) return atual as T[];
    if (typeof atual !== "object" || visitados.has(atual)) continue;

    visitados.add(atual);

    if (Array.isArray(atual[chaveLista])) {
      return atual[chaveLista] as T[];
    }

    for (const chave of envelopes) {
      const filho = atual[chave];
      if (filho !== undefined && filho !== null) fila.push(filho);
    }
  }

  return [];
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

function estaAtiva(valor: Campanha["ativo"]): boolean {
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

function situacaoPeriodo(
  campanha: Campanha,
): "agendada" | "encerrada" | "vigente" {
  const agora = Date.now();
  const inicio = campanha.inicio_em
    ? new Date(campanha.inicio_em.replace(" ", "T")).getTime()
    : null;
  const fim = campanha.termina_em
    ? new Date(campanha.termina_em.replace(" ", "T")).getTime()
    : null;

  if (inicio !== null && !Number.isNaN(inicio) && inicio > agora)
    return "agendada";
  if (fim !== null && !Number.isNaN(fim) && fim < agora) return "encerrada";
  return "vigente";
}

export default function CampanhasPage() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [excluindo, setExcluindo] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<
    "todas" | "ativas" | "inativas"
  >("todas");
  const [filtroPeriodo, setFiltroPeriodo] = useState<
    "todos" | "agendada" | "vigente" | "encerrada"
  >("todos");

  const [campanhaProdutos, setCampanhaProdutos] = useState<Campanha | null>(
    null,
  );
  const [produtosCatalogo, setProdutosCatalogo] = useState<ProdutoCatalogo[]>(
    [],
  );
  const [produtosVinculados, setProdutosVinculados] = useState<
    ProdutoCampanha[]
  >([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(false);
  const [produtoEmAcao, setProdutoEmAcao] = useState<number | null>(null);
  const [buscaProduto, setBuscaProduto] = useState("");
  const [erroProdutos, setErroProdutos] = useState("");
  const [sucessoProdutos, setSucessoProdutos] = useState("");

  const router = useRouter();

  const carregarCampanhas = useCallback(async (silencioso = false) => {
    try {
      if (silencioso) setAtualizando(true);
      else setCarregando(true);
      setErro("");

      const resposta = await conexao.get(ROTAS.CAMPANHAS.PAINEL.LISTAR, {
        withCredentials: true,
      });

      validarResposta(obterCorpoResposta(resposta));
      setCampanhas(extrairArray<Campanha>(resposta, "campanhas"));
    } catch (error: any) {
      setErro(erroApi(error, "Não foi possível carregar as campanhas."));
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    void carregarCampanhas();
  }, [carregarCampanhas]);

  useEffect(() => {
    if (!sucesso) return;
    const temporizador = window.setTimeout(() => setSucesso(""), 4000);
    return () => window.clearTimeout(temporizador);
  }, [sucesso]);

  const campanhasFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return campanhas.filter((campanha) => {
      const correspondeBusca =
        !termo ||
        (campanha.nome ?? "").toLocaleLowerCase("pt-BR").includes(termo) ||
        (campanha.slug ?? "").toLocaleLowerCase("pt-BR").includes(termo) ||
        (campanha.descricao ?? "").toLocaleLowerCase("pt-BR").includes(termo);

      const ativa = estaAtiva(campanha.ativo);
      const correspondeStatus =
        filtroStatus === "todas" ||
        (filtroStatus === "ativas" && ativa) ||
        (filtroStatus === "inativas" && !ativa);

      const correspondePeriodo =
        filtroPeriodo === "todos" ||
        situacaoPeriodo(campanha) === filtroPeriodo;

      return correspondeBusca && correspondeStatus && correspondePeriodo;
    });
  }, [campanhas, busca, filtroStatus, filtroPeriodo]);

  const totalAtivas = campanhas.filter((item) => estaAtiva(item.ativo)).length;
  const totalInativas = campanhas.length - totalAtivas;
  const totalVigentes = campanhas.filter(
    (item) => estaAtiva(item.ativo) && situacaoPeriodo(item) === "vigente",
  ).length;
  const totalAgendadas = campanhas.filter(
    (item) => estaAtiva(item.ativo) && situacaoPeriodo(item) === "agendada",
  ).length;

  async function excluirCampanha(campanha: Campanha) {
    const confirmar = window.confirm(
      `Deseja realmente excluir a campanha "${campanha.nome}"? Esta ação não poderá ser desfeita.`,
    );
    if (!confirmar) return;

    try {
      setExcluindo(campanha.id_campanha);
      setErro("");

      const resposta = await conexao.delete(
        ROTAS.CAMPANHAS.PAINEL.EXCLUIR(campanha.id_campanha),
        { withCredentials: true },
      );

      validarResposta(obterCorpoResposta(resposta));
      setSucesso("Campanha excluída com sucesso.");
      await carregarCampanhas(true);
    } catch (error: any) {
      setErro(erroApi(error, "Não foi possível excluir a campanha."));
    } finally {
      setExcluindo(null);
    }
  }

  function idDoProdutoVinculado(item: ProdutoCampanha): number {
    return Number(item.produto_id ?? item.id_produto ?? item.id ?? 0);
  }

  async function abrirSelecaoProdutos(campanha: Campanha) {
    setCampanhaProdutos(campanha);
    setBuscaProduto("");
    setErroProdutos("");
    setSucessoProdutos("");
    setCarregandoProdutos(true);

    try {
      const [respostaCatalogo, respostaVinculados] = await Promise.all([
        conexao.get("/painel/produtos", { withCredentials: true }),
        conexao.get(
          ROTAS.CAMPANHAS.PAINEL.PRODUTOS.LISTAR(campanha.id_campanha),
          { withCredentials: true },
        ),
      ]);

      validarResposta(obterCorpoResposta(respostaCatalogo));
      validarResposta(obterCorpoResposta(respostaVinculados));

      const listaCatalogo = extrairArray<any>(respostaCatalogo, "produtos");
      const normalizados = listaCatalogo
        .map((item: any) => {
          const id = Number(item?.id_produto ?? item?.produto_id ?? item?.id);
          if (!Number.isFinite(id) || id <= 0) return null;

          const imagem =
            item?.imagem_url ??
            item?.imagem_principal ??
            item?.imagem ??
            item?.foto ??
            item?.url_imagem ??
            null;

          const preco = Number(item?.preco);
          return {
            id,
            nome: String(
              item?.nome ??
                item?.nome_produto ??
                item?.titulo ??
                `Produto ${id}`,
            ),
            sku: item?.sku ? String(item.sku) : undefined,
            imagem: typeof imagem === "string" ? imagem : null,
            preco: Number.isFinite(preco) ? preco : null,
            status_id: Number(item?.status_id ?? campanha.status_id),
            ativo: item?.ativo,
          } as ProdutoCatalogo;
        })
        .filter(
          (item: ProdutoCatalogo | null): item is ProdutoCatalogo =>
            item !== null,
        );

      setProdutosCatalogo(normalizados);
      setProdutosVinculados(
        extrairArray<ProdutoCampanha>(respostaVinculados, "produtos"),
      );
    } catch (error: any) {
      setErroProdutos(erroApi(error, "Não foi possível carregar os produtos."));
    } finally {
      setCarregandoProdutos(false);
    }
  }

  async function adicionarProdutoCampanha(produto: ProdutoCatalogo) {
    if (!campanhaProdutos) return;

    try {
      setProdutoEmAcao(produto.id);
      setErroProdutos("");
      setSucessoProdutos("");

      const resposta = await conexao.post(
        ROTAS.CAMPANHAS.PAINEL.PRODUTOS.ADICIONAR(campanhaProdutos.id_campanha),
        {
          status_id: produto.status_id || campanhaProdutos.status_id,
          produto_id: produto.id,
          preco_promocional: null,
          ordem: produtosVinculados.length,
        },
        { withCredentials: true },
      );

      validarResposta(obterCorpoResposta(resposta));
      setProdutosVinculados((atuais) => [
        ...atuais,
        {
          produto_id: produto.id,
          status_id: produto.status_id || campanhaProdutos.status_id,
        },
      ]);
      setSucessoProdutos(`${produto.nome} foi adicionado à campanha.`);
    } catch (error: any) {
      setErroProdutos(erroApi(error, "Não foi possível adicionar o produto."));
    } finally {
      setProdutoEmAcao(null);
    }
  }

  async function removerProdutoCampanha(produtoId: number) {
    if (!campanhaProdutos) return;

    try {
      setProdutoEmAcao(produtoId);
      setErroProdutos("");
      setSucessoProdutos("");

      const resposta = await conexao.delete(
        ROTAS.CAMPANHAS.PAINEL.PRODUTOS.REMOVER(
          campanhaProdutos.id_campanha,
          produtoId,
        ),
        { withCredentials: true },
      );

      validarResposta(obterCorpoResposta(resposta));
      setProdutosVinculados((atuais) =>
        atuais.filter((item) => idDoProdutoVinculado(item) !== produtoId),
      );
      setSucessoProdutos("Produto removido da campanha.");
    } catch (error: any) {
      setErroProdutos(erroApi(error, "Não foi possível remover o produto."));
    } finally {
      setProdutoEmAcao(null);
    }
  }

  const produtosFiltrados = produtosCatalogo.filter((produto) => {
    const termo = buscaProduto.trim().toLocaleLowerCase("pt-BR");
    return (
      !termo ||
      produto.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
      (produto.sku ?? "").toLocaleLowerCase("pt-BR").includes(termo)
    );
  });

  function abrirEdicao(id: number) {
    router.push(ROTAS.PAGINAS.PAINEL.CAMPANHAS.EDITAR(id));
  }

  return (
    <main className="campanhas-page">
      <header className="pagina-topo">
        <div>
          <div className="breadcrumb">
            <a href="/painel">Painel</a>
            <ChevronRight size={13} />
            <span>Conteúdo</span>
            <ChevronRight size={13} />
            <span>Campanhas</span>
          </div>

          <div className="titulo-principal">
            <div className="titulo-icone">
              <Megaphone size={23} />
            </div>
            <div>
              <h1>Gerenciamento de campanhas</h1>
              <p>
                Crie promoções, organize produtos e controle o período das
                campanhas.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="botao-primario"
          onClick={() => router.push(ROTAS.PAGINAS.PAINEL.CAMPANHAS.CADASTRAR)}
        >
          <Plus size={17} /> Nova campanha
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
            <small>TOTAL DE CAMPANHAS</small>
            <strong>{campanhas.length}</strong>
          </div>
        </article>
        <article className="indicador">
          <span className="indicador-icone verde">
            <Check size={19} />
          </span>
          <div>
            <small>CAMPANHAS ATIVAS</small>
            <strong>{totalAtivas}</strong>
          </div>
        </article>
        <article className="indicador">
          <span className="indicador-icone azul">
            <CalendarClock size={19} />
          </span>
          <div>
            <small>EM VIGÊNCIA</small>
            <strong>{totalVigentes}</strong>
          </div>
        </article>
        <article className="indicador">
          <span className="indicador-icone amarelo">
            <SlidersHorizontal size={19} />
          </span>
          <div>
            <small>AGENDADAS / INATIVAS</small>
            <strong>{totalAgendadas + totalInativas}</strong>
          </div>
        </article>
      </section>

      <section className="painel-listagem">
        <div className="listagem-topo">
          <div>
            <span className="sobrelinha">CONTEÚDO PROMOCIONAL</span>
            <h2>Campanhas cadastradas</h2>
            <p>
              Pesquise, acompanhe os períodos e gerencie suas campanhas
              promocionais.
            </p>
          </div>
          <button
            type="button"
            className="botao-atualizar"
            onClick={() => void carregarCampanhas(true)}
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
              placeholder="Buscar por nome, descrição ou slug..."
              aria-label="Buscar campanhas"
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
            value={filtroPeriodo}
            onChange={(evento) =>
              setFiltroPeriodo(evento.target.value as typeof filtroPeriodo)
            }
            aria-label="Filtrar por período"
          >
            <option value="todos">Todos os períodos</option>
            <option value="agendada">Agendadas</option>
            <option value="vigente">Em vigência</option>
            <option value="encerrada">Encerradas</option>
          </select>

          <div className="filtro-status">
            <button
              type="button"
              className={filtroStatus === "todas" ? "selecionado" : ""}
              onClick={() => setFiltroStatus("todas")}
            >
              Todas
            </button>
            <button
              type="button"
              className={filtroStatus === "ativas" ? "selecionado" : ""}
              onClick={() => setFiltroStatus("ativas")}
            >
              Ativas
            </button>
            <button
              type="button"
              className={filtroStatus === "inativas" ? "selecionado" : ""}
              onClick={() => setFiltroStatus("inativas")}
            >
              Inativas
            </button>
          </div>
        </div>

        {carregando ? (
          <div className="estado-vazio">
            <LoaderCircle className="girando" size={26} />
            <strong>Carregando campanhas...</strong>
          </div>
        ) : campanhasFiltradas.length === 0 ? (
          <div className="estado-vazio">
            <Megaphone size={32} />
            <strong>
              {busca || filtroStatus !== "todas" || filtroPeriodo !== "todos"
                ? "Nenhuma campanha encontrada"
                : "Nenhuma campanha cadastrada"}
            </strong>
            <span>
              {campanhas.length === 0
                ? "Cadastre sua primeira campanha para começar a organizar as promoções da loja."
                : "Altere os filtros ou tente outra pesquisa."}
            </span>
            {campanhas.length === 0 && (
              <button
                type="button"
                className="botao-primario"
                onClick={() =>
                  router.push(ROTAS.PAGINAS.PAINEL.CAMPANHAS.CADASTRAR)
                }
              >
                <Plus size={16} /> Criar campanha
              </button>
            )}
          </div>
        ) : (
          <div className="tabela-scroll">
            <table className="tabela-campanhas">
              <thead>
                <tr>
                  <th>Campanha</th>
                  <th>Período</th>
                  <th>Situação</th>
                  <th>Status</th>
                  <th className="acoes-coluna">Ações</th>
                </tr>
              </thead>
              <tbody>
                {campanhasFiltradas.map((campanha) => {
                  const ativa = estaAtiva(campanha.ativo);
                  const periodo = situacaoPeriodo(campanha);
                  const imagemSrc = campanha.imagem_url
                    ? ImagemService.resolver(campanha.imagem_url)
                    : null;

                  return (
                    <tr key={campanha.id_campanha}>
                      <td>
                        <div className="campanha-identidade">
                          <span className="campanha-thumb">
                            {imagemSrc ? (
                              <Image
                                src={imagemSrc}
                                alt={`Imagem da campanha ${campanha.nome}`}
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
                                aria-label="Imagem não cadastrada"
                              />
                            )}
                          </span>
                          <div>
                            <strong>{campanha.nome}</strong>
                            <small>
                              {campanha.descricao ||
                                `Campanha #${campanha.id_campanha}`}
                            </small>
                            <span className="slug-campanha">
                              /{campanha.slug}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="periodo">
                          {campanha.inicio_em || campanha.termina_em
                            ? `${formatarData(campanha.inicio_em)} — ${formatarData(campanha.termina_em)}`
                            : "Sem agendamento"}
                        </span>
                      </td>
                      <td>
                        <span className={`tag-periodo ${periodo}`}>
                          {periodo === "agendada"
                            ? "Agendada"
                            : periodo === "encerrada"
                              ? "Encerrada"
                              : "Em vigência"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status ${ativa ? "ativo" : "inativo"}`}
                        >
                          <i />
                          {ativa ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td>
                        <div className="acoes">
                          <button
                            type="button"
                            className="acao-produtos"
                            onClick={() => void abrirSelecaoProdutos(campanha)}
                            title="Selecionar produtos da campanha"
                            aria-label={`Selecionar produtos para ${campanha.nome}`}
                          >
                            <ShoppingBag size={15} />
                          </button>
                          <button
                            type="button"
                            className="acao-editar"
                            onClick={() => abrirEdicao(campanha.id_campanha)}
                            title="Editar campanha"
                            aria-label={`Editar campanha ${campanha.nome}`}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="acao-excluir"
                            onClick={() => void excluirCampanha(campanha)}
                            disabled={excluindo === campanha.id_campanha}
                            title="Excluir campanha"
                            aria-label={`Excluir campanha ${campanha.nome}`}
                          >
                            {excluindo === campanha.id_campanha ? (
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
          Exibindo <strong>{campanhasFiltradas.length}</strong> de{" "}
          <strong>{campanhas.length}</strong> campanhas
        </div>
      </section>

      {campanhaProdutos && (
        <div
          className="modal-overlay"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget && !produtoEmAcao) {
              setCampanhaProdutos(null);
            }
          }}
        >
          <section
            className="modal-produtos"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-produtos"
          >
            <header className="modal-produtos__topo">
              <div>
                <span className="sobrelinha">GERENCIAMENTO DA CAMPANHA</span>
                <h2 id="titulo-modal-produtos">Selecionar produtos</h2>
                <p>{campanhaProdutos.nome}</p>
              </div>
              <button
                type="button"
                className="modal-fechar"
                onClick={() => setCampanhaProdutos(null)}
                disabled={produtoEmAcao !== null}
                aria-label="Fechar seleção de produtos"
              >
                <X size={19} />
              </button>
            </header>

            <div className="resumo-produtos">
              <span>
                <strong>{produtosVinculados.length}</strong> produto(s) nesta
                campanha
              </span>
              <span>Adicione ou remova produtos da promoção.</span>
            </div>

            {erroProdutos && (
              <div className="mensagem mensagem-erro" role="alert">
                <AlertCircle size={16} />
                <span>{erroProdutos}</span>
                <button
                  type="button"
                  onClick={() => setErroProdutos("")}
                  aria-label="Fechar erro"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {sucessoProdutos && (
              <div className="mensagem mensagem-sucesso" role="status">
                <Check size={16} />
                <span>{sucessoProdutos}</span>
              </div>
            )}

            <div className="busca busca-modal">
              <Search size={17} />
              <input
                value={buscaProduto}
                onChange={(evento) => setBuscaProduto(evento.target.value)}
                placeholder="Buscar produto por nome ou SKU..."
                aria-label="Buscar produto"
              />
              {buscaProduto && (
                <button
                  type="button"
                  onClick={() => setBuscaProduto("")}
                  aria-label="Limpar busca"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {carregandoProdutos ? (
              <div className="estado-vazio modal-carregando">
                <LoaderCircle className="girando" size={25} />
                <strong>Carregando catálogo de produtos...</strong>
              </div>
            ) : produtosFiltrados.length === 0 ? (
              <div className="estado-vazio modal-carregando">
                <ShoppingBag size={28} />
                <strong>Nenhum produto encontrado</strong>
                <span>
                  Verifique a pesquisa ou cadastre produtos no catálogo.
                </span>
              </div>
            ) : (
              <div className="grade-produtos">
                {produtosFiltrados.map((produto) => {
                  const vinculado = produtosVinculados.some(
                    (item) => idDoProdutoVinculado(item) === produto.id,
                  );
                  const imagem = produto.imagem
                    ? ImagemService.resolver(produto.imagem)
                    : null;

                  return (
                    <article className="produto-selecao" key={produto.id}>
                      <div className="produto-selecao__imagem">
                        {imagem ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imagem} alt={produto.nome} loading="lazy" />
                        ) : (
                          <ImageIcon size={23} />
                        )}
                      </div>
                      <div className="produto-selecao__dados">
                        <strong>{produto.nome}</strong>
                        {produto.sku && <small>SKU: {produto.sku}</small>}
                        {produto.preco !== null &&
                          produto.preco !== undefined && (
                            <small>
                              {produto.preco.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </small>
                          )}
                      </div>
                      {vinculado ? (
                        <button
                          type="button"
                          className="produto-remover"
                          onClick={() =>
                            void removerProdutoCampanha(produto.id)
                          }
                          disabled={produtoEmAcao !== null}
                        >
                          {produtoEmAcao === produto.id ? (
                            <LoaderCircle size={14} className="girando" />
                          ) : (
                            <>
                              <Check size={14} /> Remover
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="produto-adicionar"
                          onClick={() => void adicionarProdutoCampanha(produto)}
                          disabled={produtoEmAcao !== null}
                        >
                          {produtoEmAcao === produto.id ? (
                            <LoaderCircle size={14} className="girando" />
                          ) : (
                            <>
                              <Plus size={14} /> Adicionar
                            </>
                          )}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            <footer className="modal-produtos__rodape">
              <span>{produtosVinculados.length} produto(s) selecionado(s)</span>
              <button
                type="button"
                className="botao-primario"
                onClick={() => setCampanhaProdutos(null)}
                disabled={produtoEmAcao !== null}
              >
                Concluir seleção
              </button>
            </footer>
          </section>
        </div>
      )}

      <style jsx>{estilos}</style>
    </main>
  );
}

const estilos = `
.campanhas-page{width:100%;max-width:1320px;margin:0 auto;padding:26px clamp(14px,2.5vw,30px) 40px;color:#f5edf1;font-family:Inter,"Segoe UI",Roboto,Arial,sans-serif;box-sizing:border-box}
.campanhas-page *{box-sizing:border-box}
.campanhas-page button{font:inherit;cursor:pointer}
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
.tabela-scroll{width:100%;overflow-x:auto}.tabela-campanhas{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}.tabela-campanhas th{padding:12px 15px;background:#211a20;color:#8f7c88;font-size:8px;font-weight:800;letter-spacing:.8px;text-transform:uppercase}.tabela-campanhas td{padding:12px 15px;border-top:1px solid #342630;color:#cdbdc6;font-size:10px;vertical-align:middle}.tabela-campanhas tbody tr:hover{background:#251c23}.tabela-campanhas .acoes-coluna{text-align:right}
.campanha-identidade{display:flex;align-items:center;gap:11px;min-width:270px;max-width:460px}.campanha-thumb{width:82px;height:48px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;border:1px solid #694153;border-radius:8px;background:#392630;color:#e9a1ba}.campanha-thumb img{width:100%;height:100%;object-fit:cover}.campanha-identidade>div{display:flex;flex-direction:column;gap:4px;min-width:0}.campanha-identidade strong{overflow:hidden;color:#eee2e9;font-size:10px;text-overflow:ellipsis}.campanha-identidade small{overflow:hidden;color:#988590;font-size:8px;text-overflow:ellipsis;max-width:310px}.slug-campanha{color:#c987a1;font-size:8px}
.periodo{display:block;max-width:190px;overflow:hidden;color:#a894a0;font-size:8px;line-height:1.5;text-overflow:ellipsis;white-space:normal}.tag-periodo{display:inline-flex;padding:5px 8px;border:1px solid;border-radius:20px;font-size:8px}.tag-periodo.vigente{border-color:#345d46;background:#1b3025;color:#8fd0a7}.tag-periodo.agendada{border-color:#66502e;background:#342b20;color:#e5c17c}.tag-periodo.encerrada{border-color:#59404d;background:#2c2028;color:#c5a7b6}
.status{display:inline-flex;align-items:center;gap:6px;padding:5px 8px;border:1px solid;border-radius:20px;font-size:8px;font-weight:750}.status i{width:6px;height:6px;border-radius:50%;background:currentColor}.status.ativo{border-color:#345d46;background:#1b3025;color:#8fd0a7}.status.inativo{border-color:#65434a;background:#321f25;color:#e4a0ad}
.acoes{display:flex;justify-content:flex-end;align-items:center;gap:6px}.acoes button{width:30px;height:30px;display:flex;align-items:center;justify-content:center;padding:0;border:1px solid;border-radius:7px;background:transparent;transition:.2s}.acao-editar{border-color:#665044!important;color:#e1bd8a}.acao-editar:hover{background:#3b2b20}.acao-excluir{border-color:#69404a!important;color:#e69aaa}.acao-excluir:hover{background:#3a2028}.acoes button:disabled{opacity:.5;cursor:not-allowed}

.acao-produtos{border-color:#4b5a72!important;color:#a9c5ed}.acao-produtos:hover{background:#263247}
.modal-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(8,5,8,.78);backdrop-filter:blur(7px)}
.modal-produtos{display:flex;flex-direction:column;width:min(920px,100%);max-height:min(88vh,850px);overflow:hidden;border:1px solid #624052;border-radius:16px;background:#1c171b;box-shadow:0 24px 80px #0009}
.modal-produtos__topo{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:21px 23px;border-bottom:1px solid #392832}
.modal-produtos__topo h2{margin:5px 0;color:#f8eff3;font-size:19px}.modal-produtos__topo p{margin:0;color:#b79eac;font-size:11px}
.modal-fechar{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border:1px solid #503644;border-radius:8px;background:#271e25;color:#d8bdca}.modal-fechar:hover{background:#3a2732}.modal-fechar:disabled{opacity:.5}
.resumo-produtos{display:flex;justify-content:space-between;gap:12px;padding:12px 23px;color:#9e8995;font-size:10px}.resumo-produtos strong{color:#f0b2c8;font-size:14px}
.busca-modal{flex:none;max-width:none;margin:0 22px 14px}
.grade-produtos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:0 22px 18px;overflow:auto;min-height:120px}
.produto-selecao{display:flex;align-items:center;gap:10px;min-width:0;padding:10px;border:1px solid #3f2b36;border-radius:10px;background:#211a20}
.produto-selecao__imagem{display:flex;align-items:center;justify-content:center;width:64px;height:64px;flex-shrink:0;overflow:hidden;border:1px solid #59404d;border-radius:8px;background:#30232c;color:#c987a1}.produto-selecao__imagem img{width:100%;height:100%;object-fit:cover}
.produto-selecao__dados{display:flex;flex:1;flex-direction:column;gap:4px;min-width:0}.produto-selecao__dados strong{overflow:hidden;color:#f0e5eb;font-size:10px;text-overflow:ellipsis}.produto-selecao__dados small{color:#9c8793;font-size:9px}
.produto-adicionar,.produto-remover{display:inline-flex;align-items:center;justify-content:center;gap:5px;flex-shrink:0;min-height:31px;padding:7px 9px;border:1px solid;border-radius:7px;font-size:9px;font-weight:750}
.produto-adicionar{border-color:#87506a;background:#563246;color:#f5c5d6}.produto-adicionar:hover{background:#704158}.produto-remover{border-color:#45634f;background:#203328;color:#a7d8b7}.produto-remover:hover{background:#294433}
.produto-adicionar:disabled,.produto-remover:disabled{opacity:.5;cursor:not-allowed}
.modal-carregando{min-height:190px}
.modal-produtos__rodape{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 22px;border-top:1px solid #392832;background:#191418;color:#a894a0;font-size:10px}
.rodape-tabela{padding:12px 18px;border-top:1px solid #392832;color:#8f7d88;font-size:9px}.rodape-tabela strong{color:#d8c4ce}.estado-vazio{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;min-height:220px;padding:30px;color:#8d7b87;text-align:center}.estado-vazio strong{color:#d8c7d0;font-size:12px}.estado-vazio span{font-size:10px}.estado-vazio .botao-primario{margin-top:7px}
.girando{animation:girar 1s linear infinite}@keyframes girar{to{transform:rotate(360deg)}}
@media(max-width:900px){.indicadores{grid-template-columns:repeat(2,minmax(0,1fr))}.pagina-topo{align-items:flex-start;flex-direction:column}.pagina-topo>.botao-primario{align-self:flex-end}.filtros{flex-wrap:wrap}.busca{max-width:none;flex-basis:100%}.filtros>select{flex:1}}
@media(max-width:700px){.grade-produtos{grid-template-columns:1fr}.modal-overlay{padding:8px}.modal-produtos{max-height:94vh}.resumo-produtos{flex-direction:column;gap:4px}.produto-selecao__imagem{width:54px;height:54px}}
@media(max-width:560px){.campanhas-page{padding:18px 12px 28px}.titulo-principal h1{font-size:19px}.titulo-principal p{font-size:10px}.indicadores{gap:8px}.indicador{padding:11px;gap:8px}.indicador-icone{width:33px;height:33px}.indicador small{font-size:7px}.indicador strong{font-size:19px}.listagem-topo{padding:15px;align-items:flex-start}.filtros{align-items:stretch;flex-direction:column;padding:12px}.busca,.filtros>select{width:100%;max-width:none}.filtro-status{width:100%}.filtro-status button{flex:1}.tabela-campanhas th,.tabela-campanhas td{padding:11px 12px}}
`;
