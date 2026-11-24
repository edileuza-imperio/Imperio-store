"use client";

import ROTAS from "@/app/constants/rotas";
import conexao from "@/Services/Conexao/Conexao";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import FormVitrine from "./components/FormVitrine";

interface Vitrine {
  status_id: number;
  id_vitrine: number;
  nome: string;
  codigo: string;
  titulo: string;
  descricao?: string | null;
  tipo: string;
  ordem: number;
  ativo: boolean | number | string;
  criado_em?: string;
  atualizado_em?: string | null;
  total_itens?: number;
  itens?: unknown[];
}

interface ApiEnvelope<T> {
  sucesso?: boolean;
  mensagem?: string;
  dados?: T;
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function extrairDados<T>(resposta: unknown): T {
  let payload: unknown = resposta;

  if (ehObjeto(payload) && "data" in payload && !("dados" in payload)) {
    payload = payload.data;
  }

  if (typeof payload === "string") {
    const texto = payload.trim();
    try {
      payload = JSON.parse(texto);
    } catch {
      const inicio = texto.indexOf("{");
      const fim = texto.lastIndexOf("}");
      if (inicio < 0 || fim <= inicio) {
        throw new Error("A API retornou uma resposta inválida.");
      }
      payload = JSON.parse(texto.slice(inicio, fim + 1));
    }
  }

  if (ehObjeto(payload) && "dados" in payload) {
    return payload.dados as T;
  }

  return payload as T;
}

function ativo(valor: Vitrine["ativo"]): boolean {
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "number") return valor === 1;
  return ["1", "true", "sim", "ativo"].includes(
    String(valor).trim().toLowerCase(),
  );
}

function formatarData(valor?: string | null): string {
  if (!valor) return "Sem data";
  const data = new Date(valor.replace(" ", "T"));
  return Number.isNaN(data.getTime())
    ? valor
    : data.toLocaleDateString("pt-BR");
}

function mensagemErro(erro: unknown, padrao: string): string {
  if (ehObjeto(erro) && ehObjeto(erro.response)) {
    const resposta = erro.response.data;
    if (ehObjeto(resposta) && typeof resposta.mensagem === "string") {
      return resposta.mensagem;
    }
  }
  return erro instanceof Error && erro.message ? erro.message : padrao;
}

export default function SecoesPaginaInicialPage() {
  const router = useRouter();
  const [vitrines, setVitrines] = useState<Vitrine[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todas" | "ativas" | "inativas">(
    "todas",
  );
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<number | null>(
    null,
  );
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const carregarVitrines = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await conexao.get<ApiEnvelope<{ vitrines?: Vitrine[] }>>(
        ROTAS.VITRINES.PAINEL.LISTAR,
      );
      const dados = extrairDados<{ vitrines?: Vitrine[] }>(resposta);
      const lista = Array.isArray(dados?.vitrines) ? dados.vitrines : [];
      setVitrines(lista);
    } catch (e) {
      setErro(
        mensagemErro(
          e,
          "Não foi possível carregar as seções da página inicial.",
        ),
      );
      setVitrines([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarVitrines();
  }, [carregarVitrines]);

  const vitrinesOrdenadas = useMemo(
    () => [...vitrines].sort((a, b) => Number(a.ordem) - Number(b.ordem)),
    [vitrines],
  );

  const vitrinesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return vitrinesOrdenadas.filter((vitrine) => {
      const correspondeBusca =
        !termo ||
        vitrine.nome.toLowerCase().includes(termo) ||
        vitrine.titulo.toLowerCase().includes(termo) ||
        vitrine.codigo.toLowerCase().includes(termo);
      const estaAtiva = ativo(vitrine.ativo);
      const correspondeFiltro =
        filtro === "todas" ||
        (filtro === "ativas" && estaAtiva) ||
        (filtro === "inativas" && !estaAtiva);
      return correspondeBusca && correspondeFiltro;
    });
  }, [vitrinesOrdenadas, busca, filtro]);

  const totalAtivas = vitrines.filter((item) => ativo(item.ativo)).length;
  const totalInativas = vitrines.length - totalAtivas;
  const totalItens = vitrines.reduce(
    (total, item) =>
      total + Number(item.total_itens ?? item.itens?.length ?? 0),
    0,
  );

  async function alternarAtivo(vitrine: Vitrine) {
    setErro("");
    try {
      const novoAtivo = !ativo(vitrine.ativo);
      await conexao.put(
        ROTAS.VITRINES.PAINEL.ALTERAR_ATIVO(vitrine.id_vitrine),
        { ativo: novoAtivo },
      );
      setAviso(
        novoAtivo
          ? "Seção publicada com sucesso."
          : "Seção ocultada com sucesso.",
      );
      await carregarVitrines();
    } catch (e) {
      setErro(
        mensagemErro(e, "Não foi possível alterar a publicação da seção."),
      );
    }
  }

  async function excluirVitrine(vitrine: Vitrine) {
    setErro("");
    try {
      await conexao.delete(ROTAS.VITRINES.PAINEL.EXCLUIR(vitrine.id_vitrine));
      setConfirmandoExclusao(null);
      setAviso("Seção excluída com sucesso.");
      await carregarVitrines();
    } catch (e) {
      setErro(
        mensagemErro(
          e,
          "Não foi possível excluir. Remova os produtos associados primeiro.",
        ),
      );
    }
  }

  async function alterarOrdem(vitrine: Vitrine, direcao: -1 | 1) {
    const indice = vitrinesOrdenadas.findIndex(
      (item) => item.id_vitrine === vitrine.id_vitrine,
    );
    const destino = indice + direcao;
    if (indice < 0 || destino < 0 || destino >= vitrinesOrdenadas.length)
      return;

    const vizinha = vitrinesOrdenadas[destino];
    const ordemAtual = Number(vitrine.ordem ?? indice + 1);
    const ordemVizinha = Number(vizinha.ordem ?? destino + 1);

    try {
      await conexao.put(
        ROTAS.VITRINES.PAINEL.ALTERAR_ORDEM(vitrine.id_vitrine),
        {
          ordem: ordemVizinha,
        },
      );
      await conexao.put(
        ROTAS.VITRINES.PAINEL.ALTERAR_ORDEM(vizinha.id_vitrine),
        {
          ordem: ordemAtual,
        },
      );
      await carregarVitrines();
    } catch (e) {
      setErro(mensagemErro(e, "Não foi possível alterar a ordem das seções."));
    }
  }

  const urlNovaSecao = ROTAS.PAGINAS.PAINEL.SECOES.CADASTRAR;

  return (
    <main className="secoes-page">
      <div className="secoes-shell">
        <nav className="breadcrumb" aria-label="Navegação estrutural">
          <span>Painel</span>
          <span>/</span>
          <span>Conteúdo</span>
          <span>/</span>
          <strong>Seções da página inicial</strong>
        </nav>

        <header className="page-heading">
          <div>
            <div className="eyebrow">
              <span /> CONTEÚDO DA LOJA
            </div>
            <h1>Seções da página inicial</h1>
            <p>
              Organize vitrines, títulos e blocos que aparecem na página inicial
              do Universo Império.
            </p>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={() => router.push(urlNovaSecao)}
          >
            <span className="button-plus">+</span> Nova seção
          </button>
        </header>

        {aviso && (
          <div className="notice notice-success" role="status">
            <span>✓</span>
            {aviso}
            <button
              type="button"
              onClick={() => setAviso("")}
              aria-label="Fechar aviso"
            >
              ×
            </button>
          </div>
        )}
        {erro && (
          <div className="notice notice-error" role="alert">
            <span>!</span>
            {erro}
            <button
              type="button"
              onClick={() => setErro("")}
              aria-label="Fechar erro"
            >
              ×
            </button>
          </div>
        )}

        <section className="stats-grid" aria-label="Resumo das seções">
          <article className="stat-card">
            <span className="stat-icon purple">▤</span>
            <div>
              <span>Total de seções</span>
              <strong>{vitrines.length}</strong>
              <small>Cadastradas na loja</small>
            </div>
          </article>
          <article className="stat-card">
            <span className="stat-icon green">✓</span>
            <div>
              <span>Publicadas</span>
              <strong>{totalAtivas}</strong>
              <small>Visíveis na página inicial</small>
            </div>
          </article>
          <article className="stat-card">
            <span className="stat-icon muted">◷</span>
            <div>
              <span>Ocultas</span>
              <strong>{totalInativas}</strong>
              <small>Não aparecem na loja</small>
            </div>
          </article>
          <article className="stat-card">
            <span className="stat-icon gold">▦</span>
            <div>
              <span>Produtos nas seções</span>
              <strong>{totalItens}</strong>
              <small>Associações cadastradas</small>
            </div>
          </article>
        </section>

        <section className="content-panel">
          <div className="panel-toolbar">
            <div>
              <span className="panel-kicker">ESTRUTURA DA LOJA</span>
              <h2>Todas as seções</h2>
              <p>Gerencie os títulos, a publicação e a ordem de exibição.</p>
            </div>
            <button
              className="refresh-button"
              type="button"
              onClick={() => void carregarVitrines()}
              disabled={carregando}
            >
              <span className={carregando ? "refresh-spin" : ""}>↻</span>{" "}
              Atualizar
            </button>
          </div>

          <div className="filters-row">
            <label className="search-box">
              <span>⌕</span>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Pesquisar por nome, código ou título..."
                aria-label="Pesquisar seções"
              />
            </label>
            <div
              className="filter-tabs"
              role="group"
              aria-label="Filtrar seções"
            >
              <button
                className={filtro === "todas" ? "selected" : ""}
                onClick={() => setFiltro("todas")}
                type="button"
              >
                Todas
              </button>
              <button
                className={filtro === "ativas" ? "selected" : ""}
                onClick={() => setFiltro("ativas")}
                type="button"
              >
                Publicadas
              </button>
              <button
                className={filtro === "inativas" ? "selected" : ""}
                onClick={() => setFiltro("inativas")}
                type="button"
              >
                Ocultas
              </button>
            </div>
          </div>

          {carregando ? (
            <div className="state-box">
              <span className="loader" />
              <strong>Carregando seções...</strong>
              <small>Consultando as vitrines cadastradas.</small>
            </div>
          ) : vitrinesFiltradas.length === 0 ? (
            <div className="state-box empty-state">
              <span className="empty-icon">▤</span>
              <strong>
                {vitrines.length === 0
                  ? "Sua página inicial ainda não tem seções"
                  : "Nenhuma seção encontrada"}
              </strong>
              <small>
                {vitrines.length === 0
                  ? "Crie a primeira seção para começar a organizar o conteúdo da sua loja."
                  : "Tente mudar a busca ou o filtro selecionado."}
              </small>
              {vitrines.length === 0 && (
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => router.push(urlNovaSecao)}
                >
                  + Criar primeira seção
                </button>
              )}
            </div>
          ) : (
            <div className="sections-list">
              {vitrinesFiltradas.map((vitrine, indice) => {
                const estaAtiva = ativo(vitrine.ativo);
                const indiceGeral = vitrinesOrdenadas.findIndex(
                  (item) => item.id_vitrine === vitrine.id_vitrine,
                );
                return (
                  <article
                    className={`section-card ${!estaAtiva ? "is-inactive" : ""}`}
                    key={vitrine.id_vitrine}
                  >
                    <div className="order-control">
                      <button
                        type="button"
                        title="Mover para cima"
                        aria-label="Mover seção para cima"
                        onClick={() => void alterarOrdem(vitrine, -1)}
                        disabled={indiceGeral === 0}
                      >
                        ⌃
                      </button>
                      <strong>{String(vitrine.ordem).padStart(2, "0")}</strong>
                      <button
                        type="button"
                        title="Mover para baixo"
                        aria-label="Mover seção para baixo"
                        onClick={() => void alterarOrdem(vitrine, 1)}
                        disabled={indiceGeral === vitrinesOrdenadas.length - 1}
                      >
                        ⌄
                      </button>
                    </div>
                    <div className="section-symbol">
                      {vitrine.tipo === "produtos"
                        ? "▦"
                        : vitrine.tipo === "categorias"
                          ? "▧"
                          : "▤"}
                    </div>
                    <div className="section-info">
                      <div className="section-title-line">
                        <h3>{vitrine.titulo || vitrine.nome}</h3>
                        <span
                          className={`status-pill ${estaAtiva ? "status-active" : "status-inactive"}`}
                        >
                          <i />
                          {estaAtiva ? "Publicada" : "Oculta"}
                        </span>
                      </div>
                      <p>{vitrine.descricao || "Sem descrição cadastrada."}</p>
                      <div className="section-meta">
                        <span className="meta-code">/{vitrine.codigo}</span>
                        <span>
                          {vitrine.total_itens ?? vitrine.itens?.length ?? 0}{" "}
                          produto(s)
                        </span>
                        <span>
                          Atualizada{" "}
                          {formatarData(
                            vitrine.atualizado_em || vitrine.criado_em,
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="section-actions">
                      <button
                        className="action-outline"
                        type="button"
                        onClick={() =>
                          router.push(
                            ROTAS.PAGINAS.PAINEL.SECOES.ITENS(
                              vitrine.id_vitrine,
                            ),
                          )
                        }
                      >
                        Gerenciar produtos
                      </button>
                      <button
                        className="icon-action"
                        type="button"
                        title="Editar seção"
                        aria-label="Editar seção"
                        onClick={() => setEditandoId(vitrine.id_vitrine)}
                      >
                        ✎
                      </button>
                      <button
                        className="icon-action"
                        type="button"
                        title={estaAtiva ? "Ocultar seção" : "Publicar seção"}
                        aria-label={
                          estaAtiva ? "Ocultar seção" : "Publicar seção"
                        }
                        onClick={() => void alternarAtivo(vitrine)}
                      >
                        {estaAtiva ? "◉" : "◎"}
                      </button>
                      <button
                        className="icon-action danger"
                        type="button"
                        title="Excluir seção"
                        aria-label="Excluir seção"
                        onClick={() =>
                          setConfirmandoExclusao((atual) =>
                            atual === vitrine.id_vitrine
                              ? null
                              : vitrine.id_vitrine,
                          )
                        }
                      >
                        ⌫
                      </button>
                    </div>
                    {confirmandoExclusao === vitrine.id_vitrine && (
                      <div className="inline-confirm">
                        <span>
                          Confirma a exclusão de <strong>{vitrine.nome}</strong>
                          ? A seção precisa estar sem produtos associados.
                        </span>
                        <div>
                          <button
                            type="button"
                            className="confirm-cancel"
                            onClick={() => setConfirmandoExclusao(null)}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className="confirm-delete"
                            onClick={() => void excluirVitrine(vitrine)}
                          >
                            Excluir seção
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          <footer className="panel-footer">
            <span>
              Exibindo <strong>{vitrinesFiltradas.length}</strong> de{" "}
              <strong>{vitrines.length}</strong> seções
            </span>
            <span>As alterações são salvas diretamente na API.</span>
          </footer>
        </section>

        <aside className="helper-banner">
          <span>✦</span>
          <div>
            <strong>Dica para organizar sua loja</strong>
            <p>
              Use a ordem das seções para destacar primeiro os conteúdos mais
              importantes. Seções ocultas continuam salvas e podem ser
              publicadas novamente.
            </p>
          </div>
        </aside>
      </div>

      {editandoId !== null && (
        <FormVitrine
          key={editandoId}
          id={editandoId}
          modal
          onCancel={() => setEditandoId(null)}
          onSuccess={() => {
            setEditandoId(null);
            setAviso("Seção atualizada com sucesso.");
            void carregarVitrines();
          }}
        />
      )}

      <style jsx>{`
        .secoes-page {
          min-height: 100vh;
          width: 100%;
          box-sizing: border-box;
          padding: 34px 28px 60px;
          background: #0f0e0f;
          color: #f5edf3;
          color-scheme: dark;
        }
        .secoes-shell {
          width: 100%;
          max-width: 1420px;
          margin: 0 auto;
        }
        .breadcrumb {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-bottom: 24px;
          color: #8f7e8b;
          font-size: 12px;
        }
        .breadcrumb strong {
          color: #eadde7;
        }
        .breadcrumb span:nth-child(even) {
          color: #66515f;
        }
        .page-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 27px;
        }
        .eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 9px;
          color: #df8bb5;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.8px;
        }
        .eyebrow span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #df8bb5;
          box-shadow: 0 0 0 4px #df8bb51f;
        }
        .page-heading h1 {
          margin: 0;
          color: #fff8fc;
          font-size: clamp(25px, 3vw, 34px);
          line-height: 1.2;
          letter-spacing: -0.8px;
        }
        .page-heading p {
          margin: 10px 0 0;
          color: #a18e9e;
          font-size: 14px;
          line-height: 1.6;
        }
        .primary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 43px;
          padding: 0 17px;
          border: 1px solid #c46f98;
          border-radius: 9px;
          background: linear-gradient(135deg, #d77da6, #a95782);
          color: #21131b;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 6px 18px #ab598233;
          transition: 0.2s;
        }
        .primary-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 9px 22px #ab59824d;
        }
        .primary-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .button-plus {
          font-size: 21px;
          font-weight: 400;
        }
        .notice {
          display: flex;
          align-items: center;
          gap: 11px;
          margin: 0 0 17px;
          padding: 12px 15px;
          border-radius: 9px;
          font-size: 13px;
        }
        .notice button {
          margin-left: auto;
          border: 0;
          background: transparent;
          color: inherit;
          font-size: 20px;
          cursor: pointer;
        }
        .notice-success {
          border: 1px solid #31563f;
          background: #17251c;
          color: #9bd5aa;
        }
        .notice-error {
          border: 1px solid #653747;
          background: #2a171e;
          color: #f0a4b3;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 15px;
          margin-bottom: 22px;
        }
        .stat-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          min-height: 94px;
          padding: 18px;
          border: 1px solid #3d2b38;
          border-radius: 13px;
          background: linear-gradient(135deg, #261b22, #1d171c);
          box-shadow: 0 5px 18px #0002;
        }
        .stat-card:before {
          position: absolute;
          top: -1px;
          left: 20px;
          width: 33px;
          height: 2px;
          border-radius: 2px;
          background: #d77da6;
          content: "";
        }
        .stat-icon {
          display: grid;
          place-items: center;
          width: 43px;
          height: 43px;
          flex: 0 0 43px;
          border: 1px solid #594052;
          border-radius: 12px;
          font-size: 21px;
          font-weight: 700;
        }
        .purple {
          background: #382437;
          color: #e18bb6;
        }
        .green {
          background: #20382d;
          color: #83c99e;
          border-color: #365543;
        }
        .muted {
          background: #29232a;
          color: #a69aa8;
          border-color: #47404a;
        }
        .gold {
          background: #392b23;
          color: #e2ad73;
          border-color: #624832;
        }
        .stat-card div {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .stat-card div span {
          color: #b49eaf;
          font-size: 11px;
        }
        .stat-card strong {
          color: #fff8fc;
          font-size: 25px;
          line-height: 1;
        }
        .stat-card small {
          color: #806f7e;
          font-size: 9px;
        }
        .content-panel {
          overflow: hidden;
          border: 1px solid #3d2b38;
          border-radius: 14px;
          background: linear-gradient(145deg, #21181e, #191419);
          box-shadow: 0 8px 24px #0003;
        }
        .panel-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 22px 24px 17px;
          border-bottom: 1px solid #392833;
        }
        .panel-kicker {
          color: #d77da6;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }
        .panel-toolbar h2 {
          margin: 5px 0 0;
          color: #fff4fa;
          font-size: 16px;
        }
        .panel-toolbar p {
          margin: 6px 0 0;
          color: #a18e9e;
          font-size: 12px;
        }
        .refresh-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 12px;
          border: 1px solid #594052;
          border-radius: 8px;
          background: #281e26;
          color: #e2b5d0;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .refresh-button:disabled {
          opacity: 0.6;
          cursor: wait;
        }
        .refresh-button span {
          font-size: 17px;
        }
        .refresh-spin {
          animation: spin 1s linear infinite;
        }
        .filters-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin: 0 24px 17px;
          padding: 17px 0;
          border-bottom: 1px solid #392833;
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 9px;
          width: min(440px, 100%);
          min-height: 40px;
          padding: 0 12px;
          border: 1px solid #493545;
          border-radius: 8px;
          background: #171217;
          color: #b18ca7;
        }
        .search-box:focus-within {
          border-color: #a96791;
          box-shadow: 0 0 0 3px #ab6f9d1f;
        }
        .search-box span {
          font-size: 23px;
        }
        .search-box input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #f4eaf1;
          font: inherit;
          font-size: 12px;
        }
        .search-box input::placeholder {
          color: #806f7e;
        }
        .filter-tabs {
          display: flex;
          gap: 4px;
          padding: 4px;
          border: 1px solid #3d2e3a;
          border-radius: 9px;
          background: #181319;
        }
        .filter-tabs button {
          padding: 8px 12px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #a995a6;
          font-size: 11px;
          font-weight: 650;
          cursor: pointer;
        }
        .filter-tabs button.selected {
          background: #382536;
          color: #f0b8d3;
          box-shadow: inset 0 0 0 1px #63445c;
        }
        .sections-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 0 24px 18px;
        }
        .section-card {
          display: grid;
          grid-template-columns: 42px 46px minmax(180px, 1fr) auto;
          align-items: center;
          gap: 15px;
          padding: 16px;
          border: 1px solid #40303d;
          border-radius: 11px;
          background: linear-gradient(120deg, #261c23, #1c171d);
          transition: 0.2s;
        }
        .section-card:hover {
          border-color: #76506b;
          background: linear-gradient(120deg, #2b1e28, #201820);
          box-shadow: 0 5px 18px #0003;
        }
        .section-card.is-inactive {
          background: #19151a;
          opacity: 0.78;
        }
        .order-control {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1px;
          color: #a58c9f;
        }
        .order-control button {
          display: grid;
          place-items: center;
          width: 23px;
          height: 17px;
          padding: 0;
          border: 0;
          border-radius: 4px;
          background: transparent;
          color: #b294aa;
          font-size: 15px;
          cursor: pointer;
        }
        .order-control button:disabled {
          opacity: 0.25;
          cursor: not-allowed;
        }
        .order-control strong {
          color: #d5bdcf;
          font-size: 11px;
          font-variant-numeric: tabular-nums;
        }
        .section-symbol {
          display: grid;
          place-items: center;
          width: 43px;
          height: 43px;
          border: 1px solid #5a4054;
          border-radius: 12px;
          background: #302231;
          color: #e08bb5;
          font-size: 21px;
        }
        .section-info {
          min-width: 0;
        }
        .section-title-line {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        .section-info h3 {
          overflow: hidden;
          margin: 0;
          color: #f8edf4;
          font-size: 13px;
          font-weight: 750;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .section-info > p {
          overflow: hidden;
          margin: 6px 0 8px;
          color: #a18f9f;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 8px;
          border-radius: 30px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }
        .status-pill i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }
        .status-active {
          background: #1c3528;
          color: #85c99b;
        }
        .status-inactive {
          background: #302932;
          color: #b0a1b0;
        }
        .section-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 13px;
          color: #928190;
          font-size: 10px;
        }
        .meta-code {
          color: #d493b8;
          font-weight: 650;
        }
        .section-actions {
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .action-outline {
          min-height: 33px;
          padding: 0 10px;
          border: 1px solid #594052;
          border-radius: 7px;
          background: #2a2028;
          color: #e2b5d0;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }
        .action-outline:hover {
          border-color: #b16d98;
          background: #392638;
        }
        .icon-action {
          display: grid;
          place-items: center;
          width: 32px;
          height: 32px;
          padding: 0;
          border: 1px solid #493744;
          border-radius: 7px;
          background: #251c24;
          color: #c6a7bd;
          font-size: 15px;
          cursor: pointer;
        }
        .icon-action:hover {
          border-color: #a36a91;
          background: #362435;
          color: #f1c0d9;
        }
        .icon-action.danger:hover {
          border-color: #98505e;
          background: #3a2028;
          color: #f0a1ac;
        }
        .state-box {
          display: flex;
          min-height: 245px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 30px;
          text-align: center;
        }
        .state-box strong {
          color: #f0e4ed;
          font-size: 14px;
        }
        .state-box small {
          max-width: 390px;
          color: #a18f9e;
          font-size: 12px;
          line-height: 1.6;
        }
        .loader {
          width: 30px;
          height: 30px;
          margin-bottom: 6px;
          border: 3px solid #3c2c3a;
          border-top-color: #d77da6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .empty-icon {
          display: grid;
          place-items: center;
          width: 54px;
          height: 54px;
          border: 1px solid #594052;
          border-radius: 16px;
          background: #302231;
          color: #e08bb5;
          font-size: 27px;
        }
        .empty-state .primary-button {
          margin-top: 9px;
        }
        .panel-footer {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          padding: 13px 24px;
          border-top: 1px solid #392833;
          color: #91818f;
          font-size: 10px;
        }
        .panel-footer strong {
          color: #e5c8dc;
        }
        .helper-banner {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          margin-top: 19px;
          padding: 17px 19px;
          border: 1px solid #493545;
          border-radius: 11px;
          background: linear-gradient(105deg, #241a22, #1a151b);
        }
        .helper-banner > span {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          border: 1px solid #594052;
          border-radius: 10px;
          background: #342435;
          color: #e08bb5;
          font-size: 19px;
        }
        .helper-banner strong {
          color: #e9d4e2;
          font-size: 12px;
        }
        .helper-banner p {
          margin: 5px 0 0;
          color: #a18f9e;
          font-size: 11px;
          line-height: 1.6;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @media (max-width: 1050px) {
          .section-card {
            grid-template-columns: 35px 42px minmax(140px, 1fr);
          }
          .section-actions {
            grid-column: 3;
            justify-content: flex-start;
          }
        }
        @media (max-width: 760px) {
          .secoes-page {
            padding: 25px 16px 45px;
          }
          .page-heading {
            align-items: flex-start;
            flex-direction: column;
          }
          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .filters-row {
            align-items: stretch;
            flex-direction: column;
          }
          .search-box {
            width: auto;
          }
          .filter-tabs {
            align-self: flex-start;
          }
          .section-card {
            grid-template-columns: 30px 40px minmax(0, 1fr);
            gap: 10px;
            padding: 12px;
          }
          .section-info {
            grid-column: 3;
          }
          .section-actions {
            grid-column: 2/4;
            flex-wrap: wrap;
          }
          .panel-footer {
            flex-direction: column;
          }
        }
        @media (max-width: 480px) {
          .inline-confirm {
            align-items: flex-start;
            flex-direction: column;
          }
          .inline-confirm > div {
            width: 100%;
          }
          .inline-confirm button {
            flex: 1;
          }
          .stats-grid {
            gap: 9px;
          }
          .stat-card {
            min-height: 76px;
            gap: 9px;
            padding: 11px;
          }
          .stat-icon {
            width: 35px;
            height: 35px;
            flex-basis: 35px;
            font-size: 17px;
          }
          .stat-card div span {
            font-size: 9px;
          }
          .stat-card strong {
            font-size: 21px;
          }
          .panel-toolbar {
            align-items: flex-start;
            padding: 18px 15px 14px;
          }
          .filters-row {
            margin-right: 15px;
            margin-left: 15px;
          }
          .sections-list {
            padding-right: 12px;
            padding-left: 12px;
          }
          .section-title-line {
            align-items: flex-start;
            flex-direction: column;
            gap: 6px;
          }
          .section-info > p {
            white-space: normal;
          }
          .section-meta {
            gap: 7px 10px;
          }
          .action-outline {
            flex: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </main>
  );
}
