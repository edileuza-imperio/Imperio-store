"use client";

import ROTAS from "@/app/constants/rotas";
import conexao from "@/Services/Conexao/Conexao";

import { useCallback, useEffect, useMemo, useState } from "react";

import "./NavbarPage.css";

type ApiItem = {
  id_menu_item: number;
  menu_id: number;
  item_pai_id: number | null;
  nome: string;
  rota: string | null;
  url_externa: boolean;
  icone: string | null;
  ordem: number;
  ativo: boolean;
  status_id: number;
};

type ApiRegistroItem = {
  item: ApiItem;
  papeis_ids?: number[];
};

type ApiMenu = {
  id_menu: number;
  nome: string;
  codigo: string;
  localizacao: string;
  ativo: boolean;
  status_id: number;
  criado_em?: string;
  atualizado_em?: string;
};

type ApiGrupo = {
  menu: ApiMenu;
  itens: ApiRegistroItem[];
};

type ItemArvore = ApiItem & {
  filhos: ItemArvore[];
  papeis_ids: number[];
};

type ApiPapel = {
  id_papel?: number;
  id?: number;
  nome: string;
  codigo?: string;
  ativo?: boolean | number | string;
  sistema?: boolean | number | string;
};

function idPapel(papel: ApiPapel): number {
  return Number(papel.id_papel ?? papel.id ?? 0);
}

function lerArray(payload: unknown): ApiGrupo[] {
  let atual: any = payload;

  if (atual && !Array.isArray(atual) && "data" in atual) {
    atual = atual.data;
  }

  for (let i = 0; i < 4 && atual && !Array.isArray(atual); i++) {
    const proximo =
      atual.dados ?? atual.resultado ?? atual.estrutura ?? atual.navbar;

    if (proximo === undefined) break;

    atual = proximo;
  }

  if (!Array.isArray(atual)) {
    throw new Error(
      "A API não retornou uma lista de menus no formato esperado.",
    );
  }

  return atual.filter(
    (registro: any) => registro?.menu && Array.isArray(registro?.itens),
  ) as ApiGrupo[];
}

function lerPapeis(payload: any): ApiPapel[] {
  let atual = payload?.data ?? payload;

  for (let i = 0; i < 4 && atual && !Array.isArray(atual); i++) {
    const proximo =
      atual.dados ?? atual.resultado ?? atual.papeis ?? atual.itens;

    if (proximo === undefined) break;

    atual = proximo;
  }

  return Array.isArray(atual)
    ? atual.filter((papel: ApiPapel) => idPapel(papel) > 0)
    : [];
}

function ativo(valor: unknown): boolean {
  return valor === true || valor === 1 || valor === "1" || valor === "true";
}

function montarArvore(registros: ApiRegistroItem[]): ItemArvore[] {
  const itens = registros
    .filter((registro) => Boolean(registro?.item))
    .sort((a, b) => (a.item.ordem ?? 0) - (b.item.ordem ?? 0));

  const mapa = new Map<number, ItemArvore>();

  itens.forEach(({ item, papeis_ids }) => {
    mapa.set(item.id_menu_item, {
      ...item,
      filhos: [],
      papeis_ids: (papeis_ids ?? []).map(Number).filter((id) => id > 0),
    });
  });

  const raizes: ItemArvore[] = [];

  mapa.forEach((item) => {
    if (item.item_pai_id !== null && mapa.has(item.item_pai_id)) {
      mapa.get(item.item_pai_id)!.filhos.push(item);
    } else {
      raizes.push(item);
    }
  });

  return raizes;
}

function formatarLocalizacao(valor?: string): string {
  if (!valor) return "Não informada";

  return valor
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function formatarData(valor?: string): string {
  if (!valor) return "Não informada";

  const data = new Date(valor.replace(" ", "T"));

  if (Number.isNaN(data.getTime())) return valor;

  return data.toLocaleString("pt-BR");
}

/* =====================================================
   LINHA DE ITEM E BADGES DOS PAPÉIS
===================================================== */

function ItemLinha({
  item,
  nivel = 0,
  onPermissions,
  papeisDisponiveis,
}: {
  item: ItemArvore;
  nivel?: number;
  onPermissions: (item: ApiItem) => void;
  papeisDisponiveis: ApiPapel[];
}) {
  return (
    <>
      <div className={`navbar-item-row ${nivel > 0 ? "is-child" : ""}`}>
        <div className="navbar-item-main">
          <span className="navbar-item-order">{item.ordem}</span>

          <div className="navbar-item-copy">
            <strong>{item.nome || "Item sem nome"}</strong>

            <span>
              {item.rota || "Sem rota configurada"}
              {item.icone ? ` · Ícone: ${item.icone}` : ""}
              {item.url_externa ? " · Link externo" : ""}
            </span>

            <div
              className="navbar-item-role-badges"
              aria-label="Papéis autorizados"
            >
              {item.papeis_ids.length > 0 ? (
                item.papeis_ids.map((papelId) => {
                  const papel = papeisDisponiveis.find(
                    (p) => idPapel(p) === papelId,
                  );

                  return (
                    <span
                      className="navbar-role-badge"
                      key={papelId}
                      title={`Papel ID ${papelId}`}
                    >
                      {papel?.nome || `Papel #${papelId}`}
                    </span>
                  );
                })
              ) : (
                <span className="navbar-role-badge empty">
                  Sem papéis vinculados
                </span>
              )}
            </div>
          </div>
        </div>

        <span
          className={`navbar-status ${
            ativo(item.ativo) ? "active" : "inactive"
          }`}
        >
          <i />
          {ativo(item.ativo) ? "Ativo" : "Inativo"}
        </span>

        <button
          type="button"
          className="navbar-action-button info navbar-item-permissions"
          onClick={() => onPermissions(item)}
          title="Definir quais papéis podem visualizar este item"
        >
          <span>♙</span>
          <span>Papéis e permissões</span>
        </button>
      </div>

      {item.filhos.length > 0 && (
        <div className="navbar-item-children">
          {item.filhos.map((filho) => (
            <ItemLinha
              key={filho.id_menu_item}
              item={filho}
              nivel={nivel + 1}
              onPermissions={onPermissions}
              papeisDisponiveis={papeisDisponiveis}
            />
          ))}
        </div>
      )}
    </>
  );
}

/* =====================================================
   PÁGINA PRINCIPAL
===================================================== */

export default function NavbarPage() {
  const [grupos, setGrupos] = useState<ApiGrupo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [expandido, setExpandido] = useState<number[]>([]);

  const [menuDetalhes, setMenuDetalhes] = useState<ApiGrupo | null>(null);

  const [menuParaExcluir, setMenuParaExcluir] = useState<ApiGrupo | null>(null);

  const [excluindo, setExcluindo] = useState(false);

  const [papeis, setPapeis] = useState<ApiPapel[]>([]);

  const [itemPermissoes, setItemPermissoes] = useState<ApiItem | null>(null);

  const [papeisSelecionados, setPapeisSelecionados] = useState<number[]>([]);

  const [papeisOriginais, setPapeisOriginais] = useState<number[]>([]);

  const [carregandoPapeis, setCarregandoPapeis] = useState(false);

  const [salvandoPapeis, setSalvandoPapeis] = useState(false);

  /* =====================================================
     CARREGAR NAVBAR E PAPÉIS
  ===================================================== */

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const [resposta, respostaPapeis] = await Promise.all([
        conexao.get(ROTAS.NAVBAR.ESTRUTURA),

        conexao.get(ROTAS.PERMISSOES.PAPEIS.LISTAR).catch(() => null),
      ]);

      const dados = lerArray(resposta);

      setGrupos(dados);
      setPapeis(lerPapeis(respostaPapeis));

      setExpandido((atual) =>
        atual.length
          ? atual.filter((id) =>
              dados.some((grupo) => grupo.menu.id_menu === id),
            )
          : dados.map((grupo) => grupo.menu.id_menu),
      );
    } catch (error: any) {
      console.error("Erro ao carregar estrutura da Navbar:", error);

      setErro(
        error?.response?.data?.mensagem ||
          error?.message ||
          "Não foi possível carregar as configurações da Navbar.",
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  /* =====================================================
     FECHAR MODAIS COM ESC
  ===================================================== */

  useEffect(() => {
    if (!menuDetalhes && !menuParaExcluir) return;

    const fecharEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !excluindo) {
        setMenuDetalhes(null);
        setMenuParaExcluir(null);
      }
    };

    window.addEventListener("keydown", fecharEsc);

    return () => window.removeEventListener("keydown", fecharEsc);
  }, [menuDetalhes, menuParaExcluir, excluindo]);

  /* =====================================================
     PESQUISA E FILTROS
  ===================================================== */

  const gruposFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return grupos.filter((grupo) => {
      const menuAtivo = ativo(grupo.menu.ativo);

      if (filtroStatus === "ativos" && !menuAtivo) {
        return false;
      }

      if (filtroStatus === "inativos" && menuAtivo) {
        return false;
      }

      if (!termo) return true;

      const textoMenu = [
        grupo.menu.nome,
        grupo.menu.codigo,
        grupo.menu.localizacao,
      ]
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      const textoItens = grupo.itens
        .map(({ item }) => [item?.nome, item?.rota, item?.icone].join(" "))
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      return `${textoMenu} ${textoItens}`.includes(termo);
    });
  }, [grupos, busca, filtroStatus]);

  /* =====================================================
     CONTADORES
  ===================================================== */

  const totalMenus = grupos.length;

  const menusAtivos = grupos.filter((grupo) => ativo(grupo.menu.ativo)).length;

  const menusInativos = totalMenus - menusAtivos;

  const totalItens = grupos.reduce(
    (total, grupo) => total + grupo.itens.length,
    0,
  );

  /* =====================================================
     EXPANDIR E RECOLHER MENUS
  ===================================================== */

  function alternarGrupo(id: number) {
    setExpandido((atual) =>
      atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id],
    );
  }

  /* =====================================================
     EXCLUIR MENU
  ===================================================== */

  async function confirmarExclusao() {
    if (!menuParaExcluir) return;

    setExcluindo(true);
    setErro("");
    setMensagem("");

    try {
      await conexao.delete(
        ROTAS.NAVBAR.MENU.EXCLUIR(menuParaExcluir.menu.id_menu),
      );

      setMensagem(`O menu "${menuParaExcluir.menu.nome}" foi excluído.`);

      setMenuParaExcluir(null);
      setMenuDetalhes(null);

      await carregar();
    } catch (error: any) {
      const mensagemErro =
        error?.response?.data?.mensagem ||
        error?.response?.data?.erro ||
        "Não foi possível excluir o menu. Verifique se existem itens vinculados.";

      setErro(mensagemErro);
      setMenuParaExcluir(null);
    } finally {
      setExcluindo(false);
    }
  }

  /* =====================================================
     NORMALIZAR RESPOSTAS DE PAPÉIS
  ===================================================== */

  function normalizarLista(payload: any): any[] {
    let valor = payload?.data ?? payload;

    for (let i = 0; i < 4 && valor && !Array.isArray(valor); i++) {
      const proximo =
        valor.dados ?? valor.resultado ?? valor.papeis ?? valor.itens;

      if (proximo === undefined) break;

      valor = proximo;
    }

    return Array.isArray(valor) ? valor : [];
  }

  /* =====================================================
     ABRIR MODAL DE PERMISSÕES DO ITEM
  ===================================================== */

  async function abrirPermissoesItem(item: ApiItem) {
    setItemPermissoes(item);
    setCarregandoPapeis(true);
    setErro("");

    try {
      const [respostaPapeis, respostaAssociacoes] = await Promise.all([
        conexao.get(ROTAS.PERMISSOES.PAPEIS.LISTAR),

        conexao.get(ROTAS.NAVBAR.PAPEIS.LISTAR_POR_ITEM(item.id_menu_item)),
      ]);

      const listaPapeis = normalizarLista(respostaPapeis).filter(
        (papel: ApiPapel) => idPapel(papel) > 0,
      );

      const listaAssociacoes = normalizarLista(respostaAssociacoes);

      const selecionados = listaAssociacoes
        .map((registro: any) =>
          Number(
            registro?.id_papel ??
              registro?.papel_id ??
              registro?.id ??
              registro?.papel?.id_papel ??
              registro?.papel?.id ??
              0,
          ),
        )
        .filter((id: number) => id > 0);

      // Também considera os IDs que vieram
      // diretamente na estrutura da Navbar.
      const registroAtual = grupos
        .flatMap((grupo) => grupo.itens)
        .find((registro) => registro.item?.id_menu_item === item.id_menu_item);

      const idsEstrutura = (registroAtual?.papeis_ids ?? [])
        .map(Number)
        .filter((id) => id > 0);

      const ids = selecionados.length > 0 ? selecionados : idsEstrutura;

      setPapeis(listaPapeis);
      setPapeisSelecionados(ids);
      setPapeisOriginais(ids);
    } catch (error: any) {
      setErro(
        error?.response?.data?.mensagem ||
          error?.message ||
          "Não foi possível carregar os papéis e suas associações.",
      );

      setItemPermissoes(null);
    } finally {
      setCarregandoPapeis(false);
    }
  }

  /* =====================================================
     MARCAR E DESMARCAR PAPÉIS
  ===================================================== */

  function alternarPapel(papelId: number, marcado: boolean) {
    setPapeisSelecionados((atuais) =>
      marcado
        ? [...new Set([...atuais, papelId])]
        : atuais.filter((id) => id !== papelId),
    );
  }

  /* =====================================================
     SALVAR PERMISSÕES DO ITEM
  ===================================================== */

  async function salvarPermissoesItem() {
    if (!itemPermissoes) return;

    setSalvandoPapeis(true);
    setErro("");
    setMensagem("");

    try {
      const adicionar = papeisSelecionados.filter(
        (id) => !papeisOriginais.includes(id),
      );

      const remover = papeisOriginais.filter(
        (id) => !papeisSelecionados.includes(id),
      );

      await Promise.all([
        ...adicionar.map((papelId) =>
          conexao.post(
            ROTAS.NAVBAR.PAPEIS.ATRIBUIR_ITEM(
              papelId,
              itemPermissoes.id_menu_item,
            ),
            {},
          ),
        ),

        ...remover.map((papelId) =>
          conexao.delete(
            ROTAS.NAVBAR.PAPEIS.REMOVER_ITEM(
              papelId,
              itemPermissoes.id_menu_item,
            ),
          ),
        ),
      ]);

      setMensagem(
        `Permissões do item "${itemPermissoes.nome}" atualizadas com sucesso.`,
      );

      setItemPermissoes(null);

      await carregar();
    } catch (error: any) {
      setErro(
        error?.response?.data?.mensagem ||
          error?.response?.data?.erro ||
          "Não foi possível salvar as permissões deste item.",
      );
    } finally {
      setSalvandoPapeis(false);
    }
  }

  /* =====================================================
     RENDERIZAÇÃO
  ===================================================== */

  return (
    <main className="navbar-config-page">
      <div className="navbar-config-container">
        <div className="navbar-breadcrumb">
          <span>Painel</span>
          <b>›</b>
          <span>Conteúdo</span>
          <b>›</b>
          <strong>Navbar</strong>
        </div>

        {/* CABEÇALHO */}

        <header className="navbar-page-heading">
          <div className="navbar-heading-symbol">◎</div>

          <div className="navbar-heading-copy">
            <span className="navbar-eyebrow">GERENCIAMENTO DA LOJA</span>

            <h1>Configurações da Navbar</h1>

            <p>
              Gerencie menus, links, hierarquia e informações da navegação da
              loja.
            </p>
          </div>

          <button
            className="navbar-refresh-button"
            type="button"
            onClick={carregar}
            disabled={carregando}
          >
            <span className={carregando ? "is-spinning" : ""}>↻</span>

            {carregando ? "Atualizando..." : "Atualizar"}
          </button>
        </header>

        {/* MENSAGEM DE SUCESSO */}

        {mensagem && (
          <div className="navbar-alert navbar-alert-success">
            <span>✓</span>

            {mensagem}

            <button
              type="button"
              onClick={() => setMensagem("")}
              aria-label="Fechar aviso"
            >
              ×
            </button>
          </div>
        )}

        {/* MENSAGEM DE ERRO */}

        {erro && (
          <div className="navbar-alert navbar-alert-error">
            <span>!</span>

            {erro}

            <button
              type="button"
              onClick={() => setErro("")}
              aria-label="Fechar aviso"
            >
              ×
            </button>
          </div>
        )}

        {/* CONTADORES */}

        <section className="navbar-stats" aria-label="Resumo dos menus">
          <article className="navbar-stat-card">
            <span className="navbar-stat-icon">▤</span>

            <div>
              <small>Menus cadastrados</small>
              <strong>{totalMenus}</strong>
              <em>Estruturas registradas</em>
            </div>
          </article>

          <article className="navbar-stat-card">
            <span className="navbar-stat-icon">✓</span>

            <div>
              <small>Menus ativos</small>
              <strong>{menusAtivos}</strong>
              <em>Disponíveis na loja</em>
            </div>
          </article>

          <article className="navbar-stat-card">
            <span className="navbar-stat-icon">◉</span>

            <div>
              <small>Menus inativos</small>
              <strong>{menusInativos}</strong>
              <em>Ocultos da navegação</em>
            </div>
          </article>

          <article className="navbar-stat-card">
            <span className="navbar-stat-icon">☷</span>

            <div>
              <small>Itens de navegação</small>
              <strong>{totalItens}</strong>
              <em>Links e subitens</em>
            </div>
          </article>
        </section>

        {/* LISTAGEM DE MENUS */}

        <section className="navbar-list-card">
          <div className="navbar-list-toolbar">
            <div>
              <span className="navbar-section-kicker">
                ESTRUTURA DA NAVEGAÇÃO
              </span>

              <h2>Menus da loja</h2>

              <p>
                {gruposFiltrados.length}{" "}
                {gruposFiltrados.length === 1
                  ? "menu encontrado"
                  : "menus encontrados"}
              </p>
            </div>

            <div className="navbar-list-filters">
              <label className="navbar-search">
                <span>⌕</span>

                <input
                  type="search"
                  placeholder="Buscar menu ou item..."
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                />
              </label>

              <select
                value={filtroStatus}
                onChange={(event) => setFiltroStatus(event.target.value)}
                aria-label="Filtrar por status"
              >
                <option value="todos">Todos os status</option>

                <option value="ativos">Somente ativos</option>

                <option value="inativos">Somente inativos</option>
              </select>
            </div>
          </div>

          {/* CARREGAMENTO */}

          {carregando ? (
            <div className="navbar-feedback">
              <span className="navbar-loader" />
              Carregando menus e itens...
            </div>
          ) : gruposFiltrados.length === 0 ? (
            <div className="navbar-feedback">
              Nenhum menu corresponde à pesquisa ou ao filtro selecionado.
            </div>
          ) : (
            <div className="navbar-menu-list">
              {gruposFiltrados.map((grupo) => {
                const menu = grupo.menu;

                const arvore = montarArvore(grupo.itens);

                const aberto = expandido.includes(menu.id_menu);

                return (
                  <article className="navbar-menu-card" key={menu.id_menu}>
                    {/* CABEÇALHO DO MENU */}

                    <div className="navbar-menu-header">
                      <button
                        type="button"
                        className="navbar-menu-toggle"
                        onClick={() => alternarGrupo(menu.id_menu)}
                        aria-expanded={aberto}
                      >
                        <span className="navbar-menu-symbol">☰</span>

                        <span className="navbar-menu-title">
                          <strong>{menu.nome || "Menu sem nome"}</strong>

                          <small>
                            ID: {menu.id_menu} <i>·</i> Código:{" "}
                            {menu.codigo || "Não informado"} <i>·</i>{" "}
                            Localização: {formatarLocalizacao(menu.localizacao)}
                          </small>
                        </span>

                        <span
                          className={`navbar-status ${
                            ativo(menu.ativo) ? "active" : "inactive"
                          }`}
                        >
                          <i />

                          {ativo(menu.ativo) ? "Ativo" : "Inativo"}
                        </span>

                        <span
                          className={`navbar-chevron ${aberto ? "open" : ""}`}
                        >
                          ⌄
                        </span>
                      </button>

                      {/* AÇÕES DO MENU */}

                      <div className="navbar-menu-actions">
                        <button
                          type="button"
                          className="navbar-action-button info"
                          onClick={() => setMenuDetalhes(grupo)}
                        >
                          <span>ⓘ</span>
                          <span>Ver informações</span>
                        </button>

                        <button
                          type="button"
                          className="navbar-action-button danger"
                          onClick={() => setMenuParaExcluir(grupo)}
                        >
                          <span>⌫</span>
                          <span>Excluir</span>
                        </button>
                      </div>
                    </div>

                    {/* CONTEÚDO DO MENU */}

                    {aberto && (
                      <div className="navbar-menu-content">
                        <div className="navbar-items-heading">
                          <div>
                            <strong>Itens do menu</strong>

                            <small>Hierarquia e links cadastrados</small>
                          </div>

                          <span>
                            {grupo.itens.length}{" "}
                            {grupo.itens.length === 1 ? "item" : "itens"}
                          </span>
                        </div>

                        {arvore.length > 0 ? (
                          <div className="navbar-items-list">
                            {arvore.map((item) => (
                              <ItemLinha
                                key={item.id_menu_item}
                                item={item}
                                onPermissions={abrirPermissoesItem}
                                papeisDisponiveis={papeis}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="navbar-empty-items">
                            Este menu ainda não possui itens cadastrados.
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* RODAPÉ */}

        <footer className="navbar-page-footer">
          <span>UNIVERSO IMPÉRIO V3</span>

          <span>Dados sincronizados diretamente com a API</span>
        </footer>
      </div>

      {/* =================================================
          MODAL DE DETALHES DO MENU
      ================================================= */}

      {menuDetalhes && (
        <div
          className="navbar-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setMenuDetalhes(null);
            }
          }}
        >
          <section
            className="navbar-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="navbar-info-title"
          >
            <header className="navbar-modal-header">
              <div>
                <span className="navbar-modal-icon">ⓘ</span>

                <div>
                  <small>DETALHES DO REGISTRO</small>

                  <h2 id="navbar-info-title">Informações do menu</h2>
                </div>
              </div>

              <button
                type="button"
                className="navbar-modal-close"
                onClick={() => setMenuDetalhes(null)}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>

            <div className="navbar-modal-body">
              <div className="navbar-detail-title">
                <strong>{menuDetalhes.menu.nome}</strong>

                <span
                  className={`navbar-status ${
                    ativo(menuDetalhes.menu.ativo) ? "active" : "inactive"
                  }`}
                >
                  <i />

                  {ativo(menuDetalhes.menu.ativo) ? "Ativo" : "Inativo"}
                </span>
              </div>

              <div className="navbar-detail-grid">
                <div>
                  <small>ID do menu</small>
                  <strong>{menuDetalhes.menu.id_menu}</strong>
                </div>

                <div>
                  <small>Código</small>
                  <strong>{menuDetalhes.menu.codigo || "Não informado"}</strong>
                </div>

                <div>
                  <small>Localização</small>
                  <strong>
                    {formatarLocalizacao(menuDetalhes.menu.localizacao)}
                  </strong>
                </div>

                <div>
                  <small>Status ID</small>
                  <strong>{menuDetalhes.menu.status_id}</strong>
                </div>

                <div>
                  <small>Criado em</small>
                  <strong>{formatarData(menuDetalhes.menu.criado_em)}</strong>
                </div>

                <div>
                  <small>Atualizado em</small>
                  <strong>
                    {formatarData(menuDetalhes.menu.atualizado_em)}
                  </strong>
                </div>
              </div>

              <div className="navbar-detail-items-title">
                <strong>Itens vinculados</strong>

                <span>{menuDetalhes.itens.length} registros</span>
              </div>

              {menuDetalhes.itens.length ? (
                <div className="navbar-detail-items">
                  {menuDetalhes.itens.map(({ item, papeis_ids }) => (
                    <div className="navbar-detail-item" key={item.id_menu_item}>
                      <div>
                        <strong>{item.nome}</strong>

                        <small>
                          {item.rota || "Sem rota"} · Ordem {item.ordem}
                        </small>
                      </div>

                      <span>
                        {papeis_ids?.length
                          ? `${papeis_ids.length} papel(is)`
                          : "Sem papéis vinculados"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="navbar-detail-empty">
                  Nenhum item vinculado a este menu.
                </p>
              )}
            </div>

            <footer className="navbar-modal-footer">
              <button
                type="button"
                className="navbar-modal-secondary"
                onClick={() => setMenuDetalhes(null)}
              >
                Fechar
              </button>

              <button
                type="button"
                className="navbar-modal-danger"
                onClick={() => {
                  setMenuParaExcluir(menuDetalhes);
                  setMenuDetalhes(null);
                }}
              >
                Excluir menu
              </button>
            </footer>
          </section>
        </div>
      )}

      {/* =================================================
          MODAL DE CONFIRMAÇÃO DE EXCLUSÃO
      ================================================= */}

      {menuParaExcluir && (
        <div
          className="navbar-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !excluindo) {
              setMenuParaExcluir(null);
            }
          }}
        >
          <section
            className="navbar-modal navbar-confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="navbar-delete-title"
          >
            <div className="navbar-confirm-symbol">!</div>

            <h2 id="navbar-delete-title">Excluir este menu?</h2>

            <p>
              Você está prestes a excluir{" "}
              <strong>{menuParaExcluir.menu.nome}</strong> (ID{" "}
              {menuParaExcluir.menu.id_menu}). Essa ação não poderá ser
              desfeita.
            </p>

            {menuParaExcluir.itens.length > 0 && (
              <div className="navbar-delete-warning">
                Este menu possui {menuParaExcluir.itens.length} item(ns)
                vinculado(s). Se a API impedir a exclusão por causa desses
                vínculos, será necessário tratar os itens antes.
              </div>
            )}

            <div className="navbar-modal-footer centered">
              <button
                type="button"
                className="navbar-modal-secondary"
                onClick={() => setMenuParaExcluir(null)}
                disabled={excluindo}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="navbar-modal-danger"
                onClick={confirmarExclusao}
                disabled={excluindo}
              >
                {excluindo ? "Excluindo..." : "Sim, excluir menu"}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* =================================================
          MODAL DE PAPÉIS E PERMISSÕES
      ================================================= */}

      {itemPermissoes && (
        <div
          className="navbar-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !salvandoPapeis) {
              setItemPermissoes(null);
            }
          }}
        >
          <section
            className="navbar-modal navbar-permissions-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="navbar-permissions-title"
          >
            <header className="navbar-modal-header">
              <div>
                <span className="navbar-modal-icon">♙</span>

                <div>
                  <small>CONTROLE DE ACESSO</small>

                  <h2 id="navbar-permissions-title">Papéis e permissões</h2>
                </div>
              </div>

              <button
                type="button"
                className="navbar-modal-close"
                onClick={() => setItemPermissoes(null)}
                disabled={salvandoPapeis}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>

            <div className="navbar-modal-body">
              <div className="navbar-permission-item-summary">
                <strong>{itemPermissoes.nome}</strong>

                <small>
                  {itemPermissoes.rota || "Sem rota configurada"} · ID{" "}
                  {itemPermissoes.id_menu_item}
                </small>

                <p>
                  Selecione os papéis que poderão visualizar este item da
                  navegação.
                </p>
              </div>

              {carregandoPapeis ? (
                <div className="navbar-feedback">
                  <span className="navbar-loader" />
                  Carregando papéis...
                </div>
              ) : papeis.length === 0 ? (
                <div className="navbar-empty-items">
                  Nenhum papel foi encontrado. Cadastre os papéis antes de
                  configurar o acesso.
                </div>
              ) : (
                <div className="navbar-permissions-list">
                  {papeis.map((papel) => {
                    const papelId = idPapel(papel);

                    return (
                      <label className="navbar-permission-option" key={papelId}>
                        <input
                          type="checkbox"
                          checked={papeisSelecionados.includes(papelId)}
                          onChange={(event) =>
                            alternarPapel(papelId, event.target.checked)
                          }
                          disabled={salvandoPapeis}
                        />

                        <span className="navbar-permission-check" />

                        <span className="navbar-permission-copy">
                          <strong>{papel.nome || `Papel ${papelId}`}</strong>

                          <small>
                            {papel.codigo || `ID ${papelId}`}
                            {papel.sistema ? " · Papel do sistema" : ""}
                          </small>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="navbar-permissions-count">
                {papeisSelecionados.length} papel(is) selecionado(s)
              </div>
            </div>

            <footer className="navbar-modal-footer">
              <button
                type="button"
                className="navbar-modal-secondary"
                onClick={() => setItemPermissoes(null)}
                disabled={salvandoPapeis}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="navbar-modal-primary"
                onClick={salvarPermissoesItem}
                disabled={
                  carregandoPapeis || salvandoPapeis || papeis.length === 0
                }
              >
                {salvandoPapeis ? "Salvando..." : "Salvar permissões"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
