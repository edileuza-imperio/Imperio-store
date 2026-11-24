"use client";

import ROTAS from "@/app/constants/rotas";
import conexao from "@/Services/Conexao/Conexao";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CircleAlert,
  Eye,
  EyeOff,
  LayoutDashboard,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import "./home-blocos.css";

type Registro = Record<string, unknown>;
type TipoBloco = {
  valor: string;
  nome: string;
  descricao: string;
  referencia: string;
  ordem: number;
};
type Bloco = {
  id_bloco: number;
  pagina: string;
  codigo: string;
  tipo: string;
  referencia_id: number | null;
  titulo_customizado: string | null;
  descricao_customizada: string | null;
  ordem: number;
  status_id: number;
  status_nome?: string | null;
  status_codigo?: string | null;
  ativo: boolean | number | string;
  inicio_em: string | null;
  fim_em: string | null;
  configuracao_json: unknown;
};

function ehObj(valor: unknown): valor is Registro {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function extrairColecao<T>(origem: unknown, chaves: string[]): T[] {
  let atual = origem;
  for (let i = 0; i < 7; i += 1) {
    if (Array.isArray(atual)) return atual as T[];
    if (!ehObj(atual)) return [];
    for (const chave of chaves) {
      if (Array.isArray(atual[chave])) return atual[chave] as T[];
    }
    atual = atual.dados ?? atual.data ?? atual.resultado ?? atual.result;
  }
  return [];
}

function mensagemErro(erro: unknown, padrao: string): string {
  if (ehObj(erro) && ehObj(erro.response) && ehObj(erro.response.data)) {
    const mensagem = erro.response.data.mensagem;
    if (typeof mensagem === "string" && mensagem.trim()) return mensagem;
  }
  return erro instanceof Error && erro.message ? erro.message : padrao;
}

function ativoBooleano(valor: unknown): boolean {
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "number") return valor === 1;
  return ["1", "true", "sim", "ativo"].includes(
    String(valor).trim().toLowerCase(),
  );
}

function normalizarTipo(item: Registro): TipoBloco | null {
  const valor = String(item.codigo ?? item.tipo ?? "")
    .trim()
    .toUpperCase();
  const nome = String(item.nome ?? valor).trim();
  if (!valor || !nome) return null;
  return {
    valor,
    nome,
    descricao: String(item.descricao ?? "").trim(),
    referencia: String(
      item.referencia ?? item.regra_referencia ?? "nenhuma",
    ).toLowerCase(),
    ordem: Number(item.ordem ?? 0),
  };
}

function tituloTipo(tipo: string, tipos: TipoBloco[]): string {
  return tipos.find((item) => item.valor === tipo)?.nome ?? tipo;
}

export default function HomeBlocosPage() {
  const [blocos, setBlocos] = useState<Bloco[]>([]);
  const [tipos, setTipos] = useState<TipoBloco[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoTipos, setCarregandoTipos] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [erroTipos, setErroTipos] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [filtroAtivo, setFiltroAtivo] = useState("TODOS");
  const [alterandoOrdem, setAlterandoOrdem] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await conexao.get(ROTAS.HOME_BLOCOS.PAINEL.LISTAR, {
        params: { pagina: "HOME" },
      });
      if (ehObj(resposta.data) && resposta.data.sucesso === false) {
        throw new Error(
          String(resposta.data.mensagem ?? "A API recusou a listagem."),
        );
      }
      const lista = extrairColecao<Bloco>(resposta.data, ["blocos"]);
      setBlocos(
        [...lista].sort(
          (a, b) =>
            Number(a.ordem) - Number(b.ordem) || a.id_bloco - b.id_bloco,
        ),
      );
    } catch (falha) {
      setErro(
        mensagemErro(
          falha,
          "Não foi possível carregar os blocos da página inicial.",
        ),
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  const carregarTipos = useCallback(async () => {
    setCarregandoTipos(true);
    setErroTipos("");
    try {
      const resposta = await conexao.get(ROTAS.HOME_BLOCOS.PAINEL.LISTAR_TIPOS);
      if (ehObj(resposta.data) && resposta.data.sucesso === false) {
        throw new Error(
          String(
            resposta.data.mensagem ?? "A API recusou o catálogo de tipos.",
          ),
        );
      }
      const lista = extrairColecao<Registro>(resposta.data, ["tipos", "itens"])
        .map(normalizarTipo)
        .filter((item): item is TipoBloco => item !== null)
        .sort(
          (a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR"),
        );
      setTipos(lista);
      if (lista.length === 0) {
        setErroTipos(
          "O catálogo de tipos está vazio. Execute home-bloco-tipos-catalogo.sql.",
        );
      }
    } catch (falha) {
      setErroTipos(
        mensagemErro(
          falha,
          "Não foi possível carregar os tipos de bloco do banco.",
        ),
      );
    } finally {
      setCarregandoTipos(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
    void carregarTipos();
  }, [carregar, carregarTipos]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return blocos.filter((bloco) => {
      const correspondeBusca =
        !termo ||
        [
          bloco.codigo,
          bloco.titulo_customizado,
          bloco.descricao_customizada,
          String(bloco.id_bloco),
          tituloTipo(bloco.tipo, tipos),
        ].some((valor) =>
          String(valor ?? "")
            .toLocaleLowerCase("pt-BR")
            .includes(termo),
        );
      const correspondeTipo =
        filtroTipo === "TODOS" || bloco.tipo === filtroTipo;
      const correspondeAtivo =
        filtroAtivo === "TODOS" ||
        (filtroAtivo === "ATIVOS"
          ? ativoBooleano(bloco.ativo)
          : !ativoBooleano(bloco.ativo));
      return correspondeBusca && correspondeTipo && correspondeAtivo;
    });
  }, [blocos, busca, filtroTipo, filtroAtivo, tipos]);

  const totalAtivos = blocos.filter((bloco) =>
    ativoBooleano(bloco.ativo),
  ).length;

  async function alternarAtivo(bloco: Bloco) {
    setErro("");
    setSucesso("");
    try {
      const novoAtivo = !ativoBooleano(bloco.ativo);
      await conexao.put(
        ROTAS.HOME_BLOCOS.PAINEL.ALTERAR_ATIVO(bloco.id_bloco),
        { dados: { ativo: novoAtivo } },
      );
      setSucesso(
        novoAtivo
          ? "Bloco publicado com sucesso."
          : "Bloco desativado com sucesso.",
      );
      await carregar();
    } catch (falha) {
      setErro(
        mensagemErro(falha, "Não foi possível alterar a publicação do bloco."),
      );
    }
  }

  async function alterarOrdem(bloco: Bloco, direcao: -1 | 1) {
    if (alterandoOrdem) return;

    // A posição visual é definida pelo campo `ordem`; o ID do bloco nunca muda.
    const listaOrdenada = [...blocos].sort(
      (a, b) => Number(a.ordem) - Number(b.ordem) || a.id_bloco - b.id_bloco,
    );
    const indice = listaOrdenada.findIndex(
      (item) => item.id_bloco === bloco.id_bloco,
    );
    const novoIndice = indice + direcao;
    if (indice < 0 || novoIndice < 0 || novoIndice >= listaOrdenada.length)
      return;

    // Troca as posições no array e depois grava uma sequência única 1..N.
    // Isso também corrige ordens duplicadas que tenham ficado de tentativas anteriores.
    const novaLista = [...listaOrdenada];
    [novaLista[indice], novaLista[novoIndice]] = [
      novaLista[novoIndice],
      novaLista[indice],
    ];

    const maiorOrdem = Math.max(
      novaLista.length,
      ...listaOrdenada.map((item) => Number(item.ordem) || 0),
    );
    const inicioTemporario = maiorOrdem + novaLista.length + 1000;

    setAlterandoOrdem(true);
    setErro("");
    setSucesso("");

    try {
      // Primeira etapa: tira todos os registros das posições atuais usando
      // números temporários únicos, evitando colisões durante a reordenação.
      for (let i = 0; i < novaLista.length; i += 1) {
        const item = novaLista[i];
        await conexao.put(
          ROTAS.HOME_BLOCOS.PAINEL.ALTERAR_ORDEM(item.id_bloco),
          { dados: { ordem: inicioTemporario + i } },
        );
      }

      // Segunda etapa: grava a ordem final de exibição começando em 1.
      for (let i = 0; i < novaLista.length; i += 1) {
        const item = novaLista[i];
        await conexao.put(
          ROTAS.HOME_BLOCOS.PAINEL.ALTERAR_ORDEM(item.id_bloco),
          { dados: { ordem: i + 1 } },
        );
      }

      setSucesso(
        "Ordem dos blocos atualizada. Os IDs dos registros foram preservados.",
      );
      await carregar();
    } catch (falha) {
      // Atualiza a tela com o estado real do banco mesmo se uma etapa falhar.
      await carregar();
      setErro(
        mensagemErro(
          falha,
          "Não foi possível concluir a reordenação dos blocos.",
        ),
      );
    } finally {
      setAlterandoOrdem(false);
    }
  }

  async function excluir(bloco: Bloco) {
    const confirmar = window.confirm(
      `Remover “${bloco.titulo_customizado || bloco.codigo}” da página inicial? O conteúdo original não será excluído.`,
    );
    if (!confirmar) return;

    setErro("");
    setSucesso("");
    try {
      await conexao.delete(ROTAS.HOME_BLOCOS.PAINEL.EXCLUIR(bloco.id_bloco));
      setSucesso("Bloco removido da composição da página inicial.");
      await carregar();
    } catch (falha) {
      setErro(mensagemErro(falha, "Não foi possível remover o bloco."));
    }
  }

  return (
    <main className="home-blocos-page">
      <header className="hb-topbar">
        <div className="hb-breadcrumb">
          <Link href="/painel">Painel</Link>
          <span>/</span>
          <strong>Tela inicial</strong>
        </div>
        <span className="hb-version">
          UNIVERSO IMPÉRIO <b>V3</b>
        </span>
      </header>

      <section className="hb-hero">
        <div className="hb-hero-icon">
          <LayoutDashboard size={27} />
        </div>
        <div className="hb-hero-copy">
          <span className="hb-eyebrow">GERENCIADOR DE CONTEÚDO</span>
          <h1>Composição da tela inicial</h1>
          <p>
            Organize banners, vitrines e campanhas e defina exatamente a ordem
            em que cada bloco aparece na loja.
          </p>
          <div className="hb-hero-actions">
            <Link
              className="hb-button hb-button-primary"
              href="/painel/home-blocos/novo"
            >
              <Plus size={17} /> Adicionar bloco
            </Link>
            <button
              type="button"
              className="hb-button hb-button-ghost"
              onClick={() => void carregar()}
              disabled={carregando}
            >
              <RefreshCw size={16} /> Atualizar lista
            </button>
          </div>
        </div>
        <div className="hb-hero-stat">
          <strong>{blocos.length}</strong>
          <span>blocos cadastrados</span>
          <small>{totalAtivos} publicados</small>
        </div>
      </section>

      <section className="hb-stats">
        <article>
          <span className="hb-stat-label">TOTAL DE BLOCOS</span>
          <strong>{blocos.length}</strong>
          <small>Na composição HOME</small>
        </article>
        <article>
          <span className="hb-stat-label">PUBLICADOS</span>
          <strong>{totalAtivos}</strong>
          <small>Marcados como ativos</small>
        </article>
        <article>
          <span className="hb-stat-label">RASCUNHOS</span>
          <strong>{blocos.length - totalAtivos}</strong>
          <small>Desativados no momento</small>
        </article>
      </section>

      {erro && (
        <div className="hb-alert hb-alert-error">
          <CircleAlert size={18} />
          <span>{erro}</span>
          <button type="button" onClick={() => setErro("")} aria-label="Fechar">
            ×
          </button>
        </div>
      )}
      {sucesso && (
        <div className="hb-alert hb-alert-success">
          <span>{sucesso}</span>
          <button
            type="button"
            onClick={() => setSucesso("")}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      )}
      {erroTipos && (
        <div className="hb-alert hb-alert-error">
          <CircleAlert size={18} />
          <span>{erroTipos}</span>
          <button
            type="button"
            onClick={() => void carregarTipos()}
            aria-label="Tentar carregar tipos novamente"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <section className="hb-content-panel">
        <div className="hb-section-heading">
          <div>
            <span className="hb-eyebrow">ORDEM DE EXIBIÇÃO</span>
            <h2>Blocos da página</h2>
            <p>
              Use as setas para mudar a posição. A ordem menor aparece primeiro.
            </p>
          </div>
          <span className="hb-count-pill">
            {filtrados.length} de {blocos.length}
          </span>
        </div>

        <div className="hb-filters">
          <label className="hb-search">
            <Search size={17} />
            <input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por título, código ou ID..."
            />
          </label>
          <select
            value={filtroTipo}
            onChange={(evento) => setFiltroTipo(evento.target.value)}
            aria-label="Filtrar por tipo"
            disabled={carregandoTipos}
          >
            <option value="TODOS">Todos os tipos</option>
            {tipos.map((tipo) => (
              <option key={tipo.valor} value={tipo.valor}>
                {tipo.nome}
              </option>
            ))}
          </select>
          <select
            value={filtroAtivo}
            onChange={(evento) => setFiltroAtivo(evento.target.value)}
            aria-label="Filtrar por publicação"
          >
            <option value="TODOS">Todos os status</option>
            <option value="ATIVOS">Publicados</option>
            <option value="INATIVOS">Desativados</option>
          </select>
        </div>

        {carregando ? (
          <div className="hb-empty">
            <LoaderCircle className="hb-spin" size={25} />
            <strong>Carregando composição...</strong>
            <span>Buscando os blocos cadastrados na API.</span>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="hb-empty">
            <LayoutDashboard size={31} />
            <strong>
              {blocos.length === 0
                ? "Sua tela inicial ainda está vazia"
                : "Nenhum bloco encontrado"}
            </strong>
            <span>
              {blocos.length === 0
                ? "Adicione o primeiro banner, vitrine, campanha ou conteúdo para começar."
                : "Altere os filtros ou a busca para visualizar outros blocos."}
            </span>
            {blocos.length === 0 && (
              <Link
                className="hb-button hb-button-primary"
                href="/painel/home-blocos/novo"
              >
                <Plus size={16} /> Criar primeiro bloco
              </Link>
            )}
          </div>
        ) : (
          <div className="hb-list">
            {filtrados.map((bloco, indice) => {
              const publicado = ativoBooleano(bloco.ativo);
              return (
                <article
                  className={`hb-block-card ${!publicado ? "is-inactive" : ""}`}
                  key={bloco.id_bloco}
                >
                  <div className="hb-order-controls">
                    <button
                      type="button"
                      title="Mover para cima"
                      aria-label="Mover para cima"
                      disabled={
                        alterandoOrdem ||
                        indice === 0 ||
                        busca !== "" ||
                        filtroTipo !== "TODOS" ||
                        filtroAtivo !== "TODOS"
                      }
                      onClick={() => void alterarOrdem(bloco, -1)}
                    >
                      <ArrowUp size={17} />
                    </button>
                    <strong>{bloco.ordem}</strong>
                    <button
                      type="button"
                      title="Mover para baixo"
                      aria-label="Mover para baixo"
                      disabled={
                        alterandoOrdem ||
                        indice === filtrados.length - 1 ||
                        busca !== "" ||
                        filtroTipo !== "TODOS" ||
                        filtroAtivo !== "TODOS"
                      }
                      onClick={() => void alterarOrdem(bloco, 1)}
                    >
                      <ArrowDown size={17} />
                    </button>
                  </div>
                  <div className="hb-block-main">
                    <div className="hb-block-topline">
                      <span className="hb-type-tag">
                        {tituloTipo(bloco.tipo, tipos)}
                      </span>
                      <span
                        className={`hb-status ${publicado ? "published" : "draft"}`}
                      >
                        <i />
                        {publicado ? "Publicado" : "Desativado"}
                      </span>
                    </div>
                    <h3>
                      {bloco.titulo_customizado ||
                        tituloTipo(bloco.tipo, tipos)}
                    </h3>
                    <p>
                      {bloco.descricao_customizada ||
                        "Sem descrição personalizada."}
                    </p>
                    <div className="hb-block-meta">
                      <span>ID #{bloco.id_bloco}</span>
                      <span>{bloco.codigo}</span>
                      {bloco.referencia_id !== null && (
                        <span>Referência #{bloco.referencia_id}</span>
                      )}
                      <span>
                        {bloco.status_nome || `Status #${bloco.status_id}`}
                      </span>
                    </div>
                  </div>
                  <div className="hb-block-actions">
                    <Link
                      className="hb-icon-button"
                      title="Editar bloco"
                      href={`/painel/home-blocos/novo?id=${bloco.id_bloco}`}
                    >
                      <Pencil size={17} />
                    </Link>
                    <button
                      type="button"
                      className="hb-icon-button"
                      title={publicado ? "Desativar bloco" : "Ativar bloco"}
                      onClick={() => void alternarAtivo(bloco)}
                    >
                      {publicado ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                    <button
                      type="button"
                      className="hb-icon-button danger"
                      title="Remover bloco"
                      onClick={() => void excluir(bloco)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="hb-footer">
        <span>Universo Império V3</span>
        <span>Gerenciamento da página inicial</span>
        <Link href="/painel">
          Voltar ao painel <ArrowLeft size={14} />
        </Link>
      </footer>
    </main>
  );
}
