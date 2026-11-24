"use client";

import conexao from "@/Services/Conexao/Conexao";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Papel = {
  id: number;
  nome: string;
  codigo: string;
};

type Permissao = {
  id: number;
  modulo: string;
  nome: string;
  codigo: string;
};

type ItemMenu = {
  titulo: string;
  descricao: string;
  rota: string;
  icone: string;
  codigos: string[];
};

type GrupoMenu = {
  titulo: string;
  descricao: string;
  itens: ItemMenu[];
};

const ROTAS = {
  TUDO: "/painel/permissoes/tudo",
  DO_PAPEL: (id: number) => `/painel/papeis/${id}/permissoes`,
  ATRIBUIR: (papelId: number, permissaoId: number) =>
    `/painel/papeis/${papelId}/permissoes/${permissaoId}`,
  REMOVER: (papelId: number, permissaoId: number) =>
    `/painel/papeis/${papelId}/permissoes/${permissaoId}`,
};

// Cada item aponta para códigos de permissão que podem existir no catálogo.
// O sistema só permite alterar itens cujas permissões estejam cadastradas.
const GRUPOS_MENU: GrupoMenu[] = [
  {
    titulo: "VISÃO GERAL",
    descricao: "Acesso inicial ao painel administrativo.",
    itens: [
      {
        titulo: "Painel",
        descricao: "Indicadores e visão geral da operação.",
        rota: "/painel",
        icone: "layout-dashboard",
        codigos: ["painel.visualizar"],
      },
    ],
  },
  {
    titulo: "OPERAÇÃO DA LOJA",
    descricao: "Catálogo, pedidos e relacionamento com clientes.",
    itens: [
      {
        titulo: "Produtos",
        descricao:
          "Catálogo, cadastro, imagens, categorias, marcas e atributos.",
        rota: "/painel/produtos",
        icone: "package",
        codigos: ["produtos.visualizar"],
      },
      {
        titulo: "Pedidos",
        descricao: "Consulta e gerenciamento dos pedidos.",
        rota: "/painel/pedidos",
        icone: "shopping-cart",
        codigos: ["pedidos.visualizar"],
      },
      {
        titulo: "Cupons",
        descricao: "Cupons cadastrados, criação e utilizações.",
        rota: "/painel/cupons",
        icone: "ticket",
        codigos: ["cupons.listar"],
      },
      {
        titulo: "Clientes",
        descricao: "Cadastro e consulta de clientes.",
        rota: "/painel/clientes",
        icone: "user-round",
        codigos: ["clientes.listar"],
      },
    ],
  },
  {
    titulo: "CONTEÚDO E APARÊNCIA",
    descricao: "Ferramentas de conteúdo e personalização da loja.",
    itens: [
      {
        titulo: "Conteúdo",
        descricao: "Navbar, banners, campanhas, vitrines, seções e footer.",
        rota: "/painel/conteudo",
        icone: "layout-template",
        codigos: ["conteudo.visualizar"],
      },
    ],
  },
  {
    titulo: "ADMINISTRAÇÃO",
    descricao: "Contas, segurança e configurações administrativas.",
    itens: [
      {
        titulo: "Usuários e administradores",
        descricao: "Gerenciamento das contas que acessam o painel.",
        rota: "/painel/usuarios",
        icone: "users",
        codigos: ["usuarios.listar"],
      },
      {
        titulo: "Permissões",
        descricao: "Papéis, permissões e níveis de acesso.",
        rota: "/painel/configuracoes/permissoes",
        icone: "shield-check",
        codigos: ["administradores.permissoes.gerenciar"],
      },
      {
        titulo: "Configurações",
        descricao: "Configurações gerais do painel.",
        rota: "/painel/configuracoes",
        icone: "settings",
        codigos: ["configuracoes.visualizar"],
      },
    ],
  },
];

function obj(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function colecao(value: unknown, chave: "papeis" | "permissoes"): unknown[] {
  // A API pode devolver a lista diretamente ou dentro de dados/resultado.
  if (Array.isArray(value)) return value;

  const root = obj(value);
  if (!root) return [];

  const candidatos: unknown[] = [
    root[chave],
    root.dados,
    root.resultado,
    obj(root.dados)?.[chave],
    obj(root.resultado)?.[chave],
    obj(obj(root.dados)?.dados)?.[chave],
    obj(obj(root.resultado)?.dados)?.[chave],
  ];

  for (const candidato of candidatos) {
    if (Array.isArray(candidato)) return candidato;
  }

  return [];
}

function normalizarPapel(value: unknown): Papel | null {
  const item = obj(value);
  if (!item) return null;
  const id = Number(item.id_papel ?? item.id);
  const nome = String(item.nome ?? "").trim();
  const codigo = String(item.codigo ?? item.codigo_papel ?? "").trim();
  return Number.isInteger(id) && id > 0 && nome && codigo
    ? { id, nome, codigo }
    : null;
}

function normalizarPermissao(value: unknown): Permissao | null {
  const item = obj(value);
  if (!item) return null;
  const id = Number(item.id_permissao ?? item.id);
  const nome = String(item.nome ?? "").trim();
  const codigo = String(item.codigo ?? "").trim();
  const modulo = String(item.modulo ?? "outros").trim();
  return Number.isInteger(id) && id > 0 && nome && codigo
    ? { id, nome, codigo, modulo }
    : null;
}

function erroTexto(error: unknown): string {
  const e = obj(error);
  const response = obj(e?.response);
  const data = obj(response?.data);
  return String(
    data?.mensagem ??
      data?.erro ??
      e?.message ??
      "Não foi possível concluir a operação.",
  );
}

export default function GerenciarMenusPage() {
  const [papeis, setPapeis] = useState<Papel[]>([]);
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [permissoesAtivas, setPermissoesAtivas] = useState<number[]>([]);
  const [papelId, setPapelId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [carregandoPapel, setCarregandoPapel] = useState(false);
  const [alterando, setAlterando] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const papelAtual = papeis.find((p) => p.id === papelId) ?? null;
  const papelProtegido = papelAtual?.codigo.toUpperCase() === "ADMIN_PRINCIPAL";

  const carregarBase = useCallback(async (): Promise<Papel[]> => {
    setCarregando(true);
    setErro("");
    try {
      const response = await conexao.get(ROTAS.TUDO);
      const papeisNovos = colecao(response.data, "papeis")
        .map(normalizarPapel)
        .filter((p): p is Papel => p !== null);
      const permissoesNovas = colecao(response.data, "permissoes")
        .map(normalizarPermissao)
        .filter((p): p is Permissao => p !== null);
      setPapeis(papeisNovos);
      setPermissoes(permissoesNovas);
      setPapelId((atual) =>
        atual && papeisNovos.some((p) => p.id === atual)
          ? atual
          : (papeisNovos[0]?.id ?? null),
      );
      return papeisNovos;
    } catch (error) {
      setErro(erroTexto(error));
      setPapeis([]);
      setPermissoes([]);
      return [];
    } finally {
      setCarregando(false);
    }
  }, []);

  const carregarDoPapel = useCallback(async (id: number) => {
    setCarregandoPapel(true);
    setErro("");
    try {
      const response = await conexao.get(ROTAS.DO_PAPEL(id));
      const lista = colecao(response.data, "permissoes");
      const ativas = lista
        .map(normalizarPermissao)
        .filter((p): p is Permissao => p !== null);
      setPermissoesAtivas(ativas.map((p) => p.id));
    } catch (error) {
      setPermissoesAtivas([]);
      setErro(erroTexto(error));
    } finally {
      setCarregandoPapel(false);
    }
  }, []);

  useEffect(() => {
    void carregarBase();
  }, [carregarBase]);
  useEffect(() => {
    if (papelId !== null) void carregarDoPapel(papelId);
    else setPermissoesAtivas([]);
  }, [papelId, carregarDoPapel]);

  const itensVisiveis = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return GRUPOS_MENU.map((grupo) => ({
      ...grupo,
      itens: grupo.itens.filter(
        (item) =>
          !termo ||
          `${item.titulo} ${item.descricao} ${item.rota}`
            .toLocaleLowerCase("pt-BR")
            .includes(termo),
      ),
    })).filter((grupo) => grupo.itens.length > 0);
  }, [busca]);

  function permissoesDoItem(item: ItemMenu): Permissao[] {
    return item.codigos
      .map((codigo) => permissoes.find((p) => p.codigo === codigo))
      .filter((p): p is Permissao => Boolean(p));
  }

  function itemLiberado(item: ItemMenu): boolean {
    const relacionadas = permissoesDoItem(item);
    return (
      relacionadas.length > 0 &&
      relacionadas.some((p) => permissoesAtivas.includes(p.id))
    );
  }

  async function alternarItem(item: ItemMenu) {
    if (!papelAtual || papelProtegido || alterando !== null || carregandoPapel)
      return;
    const relacionadas = permissoesDoItem(item);
    if (relacionadas.length === 0) {
      setErro(
        `Não há permissão cadastrada no banco para "${item.titulo}". Cadastre primeiro os códigos: ${item.codigos.join(", ")}.`,
      );
      return;
    }

    const deveAtivar = !itemLiberado(item);
    const pendentes = relacionadas.filter((p) =>
      deveAtivar
        ? !permissoesAtivas.includes(p.id)
        : permissoesAtivas.includes(p.id),
    );
    if (pendentes.length === 0) return;

    setAlterando(relacionadas[0].id);
    setErro("");
    setSucesso("");
    const atual = [...permissoesAtivas];
    try {
      for (const permissao of pendentes) {
        if (deveAtivar) {
          await conexao.post(ROTAS.ATRIBUIR(papelAtual.id, permissao.id));
        } else {
          await conexao.delete(ROTAS.REMOVER(papelAtual.id, permissao.id));
        }
      }
      setPermissoesAtivas((lista) =>
        deveAtivar
          ? Array.from(new Set([...lista, ...pendentes.map((p) => p.id)]))
          : lista.filter((id) => !pendentes.some((p) => p.id === id)),
      );
      setSucesso(
        `Acesso ao menu "${item.titulo}" ${deveAtivar ? "liberado" : "removido"} para ${papelAtual.nome}.`,
      );
    } catch (error) {
      setPermissoesAtivas(atual);
      setErro(erroTexto(error));
      await carregarDoPapel(papelAtual.id);
    } finally {
      setAlterando(null);
    }
  }

  const totalMenus = GRUPOS_MENU.reduce(
    (total, grupo) => total + grupo.itens.length,
    0,
  );
  const menusConfigurados = GRUPOS_MENU.flatMap((grupo) => grupo.itens).filter(
    (item) => permissoesDoItem(item).length > 0,
  ).length;

  return (
    <main className="menus-page">
      <header className="menus-header">
        <div>
          <div className="menus-breadcrumb">
            <span /> PAINEL ADMINISTRATIVO <b>/</b> CONFIGURAÇÕES <b>/</b> MENUS
          </div>
          <h1>Gerenciar menus</h1>
          <p>
            Defina quais áreas do painel cada papel poderá visualizar. A
            visibilidade é vinculada a permissões específicas de leitura; as
            permissões de edição e gerenciamento continuam separadas.
          </p>
        </div>
        <button
          className="menus-refresh"
          type="button"
          onClick={async () => {
            const listaAtualizada = await carregarBase();
            const idSelecionado =
              listaAtualizada.find((p) => p.id === papelId)?.id ??
              listaAtualizada[0]?.id ??
              null;

            if (idSelecionado !== null) {
              await carregarDoPapel(idSelecionado);
            } else {
              setPermissoesAtivas([]);
            }
          }}
          disabled={carregando || carregandoPapel}
        >
          ↻ Atualizar
        </button>
      </header>

      <section className="menus-summary">
        <article>
          <span>Papéis cadastrados</span>
          <strong>{carregando ? "—" : papeis.length}</strong>
          <small>Perfis disponíveis</small>
        </article>
        <article>
          <span>Menus mapeados</span>
          <strong>
            {menusConfigurados}/{totalMenus}
          </strong>
          <small>Menus com permissões encontradas</small>
        </article>
        <article>
          <span>Perfil selecionado</span>
          <strong className="summary-name">
            {papelAtual?.nome ?? (carregando ? "Carregando..." : "Nenhum")}
          </strong>
          <small>{papelAtual?.codigo ?? "Selecione um papel"}</small>
        </article>
      </section>

      {(erro || sucesso) && (
        <div
          className={`menus-alert ${erro ? "is-error" : "is-success"}`}
          role="status"
        >
          <span>{erro || sucesso}</span>
          <button
            type="button"
            onClick={() => {
              setErro("");
              setSucesso("");
            }}
            aria-label="Fechar mensagem"
          >
            ×
          </button>
        </div>
      )}

      <section className="menus-toolbar">
        <label className="menus-select-wrap">
          <span>Perfil de acesso</span>
          <select
            value={papelId ?? ""}
            onChange={(e) =>
              setPapelId(e.target.value ? Number(e.target.value) : null)
            }
            disabled={carregando || papeis.length === 0}
          >
            <option value="">Selecione um papel</option>
            {papeis.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} — {p.codigo}
              </option>
            ))}
          </select>
        </label>
        <label className="menus-search">
          <span>Buscar menu</span>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Ex.: clientes, pedidos, conteúdo..."
          />
        </label>
      </section>

      {papelProtegido && (
        <div className="menus-protected">
          <strong>Perfil protegido</strong>
          <p>
            O papel ADMIN_PRINCIPAL está em modo de somente leitura para evitar
            que a conta principal perca o próprio acesso.
          </p>
        </div>
      )}

      <div className="menus-layout">
        <aside className="menus-sidebar">
          <div className="sidebar-icon">♧</div>
          <span className="sidebar-eyebrow">CONTROLE DE NAVEGAÇÃO</span>
          <h2>Visibilidade por papel</h2>
          <p>
            Selecione um perfil e libere somente as áreas necessárias para cada
            função.
          </p>
          <div className="sidebar-note">
            <strong>Importante</strong>
            <span>
              Esta tela altera somente permissões de visualização. Permissões de
              edição e gerenciamento permanecem separadas. O backend também
              precisa proteger cada rota e operação.
            </span>
          </div>
          <Link
            href="/painel/configuracoes/permissoes"
            className="sidebar-link"
          >
            Abrir gerenciamento de permissões <span>→</span>
          </Link>
        </aside>

        <section className="menus-content" aria-label="Menus disponíveis">
          {carregando || carregandoPapel ? (
            <div className="menus-empty">Carregando configurações...</div>
          ) : !papelAtual ? (
            <div className="menus-empty">Nenhum papel encontrado.</div>
          ) : itensVisiveis.length === 0 ? (
            <div className="menus-empty">Nenhum menu corresponde à busca.</div>
          ) : (
            itensVisiveis.map((grupo) => (
              <section className="menu-group" key={grupo.titulo}>
                <div className="menu-group-heading">
                  <div>
                    <span>{grupo.titulo}</span>
                    <p>{grupo.descricao}</p>
                  </div>
                </div>
                <div className="menu-cards">
                  {grupo.itens.map((item) => {
                    const relacionadas = permissoesDoItem(item);
                    const configuravel = relacionadas.length > 0;
                    const ativo = itemLiberado(item);
                    const ocupado =
                      alterando !== null &&
                      relacionadas.some((p) => p.id === alterando);
                    return (
                      <article
                        className={`menu-card ${ativo ? "is-enabled" : ""}`}
                        key={item.rota}
                      >
                        <div className="menu-card-icon" aria-hidden="true">
                          {item.icone === "shopping-cart"
                            ? "🛒"
                            : item.icone === "package"
                              ? "▣"
                              : item.icone === "ticket"
                                ? "◇"
                                : item.icone === "user-round"
                                  ? "♙"
                                  : item.icone === "users"
                                    ? "♧"
                                    : item.icone === "settings"
                                      ? "⚙"
                                      : item.icone === "shield-check"
                                        ? "♢"
                                        : "▦"}
                        </div>
                        <div className="menu-card-copy">
                          <h3>{item.titulo}</h3>
                          <p>{item.descricao}</p>
                          <small>
                            {configuravel
                              ? relacionadas.map((p) => p.codigo).join(" · ")
                              : `Cadastre no catálogo: ${item.codigos.join(" / ")}`}
                          </small>
                        </div>
                        <div className="menu-card-action">
                          <span className={ativo ? "status-on" : "status-off"}>
                            {configuravel
                              ? ativo
                                ? "Visível"
                                : "Oculto"
                              : "Não mapeado"}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={ativo}
                            aria-label={`${ativo ? "Ocultar" : "Exibir"} ${item.titulo}`}
                            disabled={
                              !configuravel ||
                              papelProtegido ||
                              ocupado ||
                              carregandoPapel
                            }
                            onClick={() => void alternarItem(item)}
                            className={`menu-switch ${ativo ? "is-on" : ""}`}
                          >
                            <span />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </section>
      </div>

      <style jsx>{`
        .menus-page {
          width: 100%;
          min-height: 100%;
          padding: 30px clamp(16px, 4vw, 46px) 48px;
          color: #f5edf2;
          box-sizing: border-box;
        }
        .menus-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 27px;
        }
        .menus-breadcrumb {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-wrap: wrap;
          margin-bottom: 14px;
          color: #d78caf;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 1.15px;
        }
        .menus-breadcrumb span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #e58db8;
          box-shadow: 0 0 12px #e58db866;
        }
        .menus-breadcrumb b {
          color: #766572;
        }
        .menus-header h1 {
          margin: 0 0 8px;
          font-size: clamp(26px, 3vw, 35px);
          letter-spacing: -1px;
          color: #fff7fb;
        }
        .menus-header p {
          max-width: 690px;
          margin: 0;
          color: #b9aab5;
          font-size: 13px;
          line-height: 1.7;
        }
        .menus-refresh {
          height: 38px;
          padding: 0 14px;
          border: 1px solid #604157;
          border-radius: 8px;
          background: #30212e;
          color: #f3c1d8;
          font-weight: 650;
          cursor: pointer;
        }
        .menus-refresh:disabled {
          opacity: 0.5;
          cursor: wait;
        }
        .menus-summary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 13px;
          margin-bottom: 18px;
        }
        .menus-summary article {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 16px 18px;
          background: linear-gradient(145deg, #291e29d9, #1d171fd9);
          border: 1px solid #443143;
          border-radius: 11px;
        }
        .menus-summary span {
          color: #bcaab8;
          font-size: 11px;
        }
        .menus-summary strong {
          font-size: 25px;
          color: #fff4fa;
        }
        .menus-summary small {
          color: #8f7d8b;
          font-size: 10px;
        }
        .menus-summary .summary-name {
          font-size: 17px;
          overflow-wrap: anywhere;
        }
        .menus-alert {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 15px;
          margin-bottom: 16px;
          border: 1px solid;
          border-radius: 9px;
          font-size: 12px;
          line-height: 1.6;
        }
        .menus-alert button {
          align-self: flex-start;
          border: 0;
          background: none;
          color: inherit;
          font-size: 20px;
          cursor: pointer;
        }
        .menus-alert.is-error {
          background: #381d28;
          border-color: #87445e;
          color: #ffc0d1;
        }
        .menus-alert.is-success {
          background: #193328;
          border-color: #386b50;
          color: #b6f0cb;
        }
        .menus-toolbar {
          display: grid;
          grid-template-columns: minmax(220px, 1fr) minmax(240px, 1.4fr);
          gap: 13px;
          padding: 15px;
          margin-bottom: 17px;
          background: #211a23;
          border: 1px solid #443143;
          border-radius: 11px;
        }
        .menus-toolbar label {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .menus-toolbar label > span {
          color: #c8b5c3;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .menus-toolbar select,
        .menus-toolbar input {
          width: 100%;
          height: 40px;
          padding: 0 12px;
          border: 1px solid #4c3949;
          border-radius: 7px;
          background: #17131a;
          color: #f8edf4;
          outline: none;
          font: inherit;
          font-size: 12px;
        }
        .menus-toolbar select:focus,
        .menus-toolbar input:focus {
          border-color: #c47b9f;
          box-shadow: 0 0 0 3px #c47b9f20;
        }
        .menus-protected {
          padding: 13px 16px;
          margin-bottom: 16px;
          border: 1px solid #765b36;
          border-radius: 9px;
          background: #302719;
          color: #f5d9a5;
        }
        .menus-protected strong {
          font-size: 12px;
        }
        .menus-protected p {
          margin: 4px 0 0;
          font-size: 11px;
          line-height: 1.6;
          color: #d8c49f;
        }
        .menus-layout {
          display: grid;
          grid-template-columns: minmax(220px, 270px) minmax(0, 1fr);
          gap: 17px;
          align-items: start;
        }
        .menus-sidebar {
          position: sticky;
          top: 18px;
          padding: 20px;
          background: linear-gradient(150deg, #2b202b, #1d171f);
          border: 1px solid #493447;
          border-radius: 12px;
        }
        .sidebar-icon {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          margin-bottom: 16px;
          border-radius: 10px;
          background: #bd679522;
          border: 1px solid #bd67954d;
          color: #e6a5c4;
          font-size: 22px;
        }
        .sidebar-eyebrow {
          color: #d78caf;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.1px;
        }
        .menus-sidebar h2 {
          margin: 7px 0;
          color: #fff4fa;
          font-size: 18px;
        }
        .menus-sidebar > p {
          margin: 0;
          color: #b8a8b5;
          font-size: 11px;
          line-height: 1.7;
        }
        .sidebar-note {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 19px;
          padding: 12px;
          background: #17131a;
          border: 1px solid #3c2d3b;
          border-radius: 8px;
        }
        .sidebar-note strong {
          color: #e5a3c1;
          font-size: 10px;
        }
        .sidebar-note span {
          color: #aa99a7;
          font-size: 10px;
          line-height: 1.65;
        }
        .sidebar-link {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-top: 16px;
          color: #e4a2c1;
          text-decoration: none;
          font-size: 10px;
          font-weight: 700;
        }
        .sidebar-link:hover {
          text-decoration: underline;
        }
        .menus-content {
          min-width: 0;
        }
        .menu-group {
          margin-bottom: 18px;
        }
        .menu-group-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .menu-group-heading span {
          color: #d78caf;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.1px;
        }
        .menu-group-heading p {
          margin: 4px 0 0;
          color: #9f8d9c;
          font-size: 10px;
        }
        .menu-cards {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .menu-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          min-width: 0;
          padding: 15px;
          background: #211a23;
          border: 1px solid #423142;
          border-radius: 10px;
          transition:
            border-color 0.15s,
            background 0.15s;
        }
        .menu-card.is-enabled {
          border-color: #79516b;
          background: linear-gradient(145deg, #2a202a, #211a23);
        }
        .menu-card-icon {
          display: grid;
          place-items: center;
          flex: 0 0 37px;
          height: 37px;
          border: 1px solid #76506a66;
          border-radius: 9px;
          background: #bd67951b;
          color: #e5a1c0;
          font-size: 19px;
        }
        .menu-card-copy {
          flex: 1;
          min-width: 0;
        }
        .menu-card-copy h3 {
          margin: 1px 0 5px;
          color: #fff3f9;
          font-size: 13px;
        }
        .menu-card-copy p {
          margin: 0 0 8px;
          color: #ad9cab;
          font-size: 10px;
          line-height: 1.55;
        }
        .menu-card-copy small {
          display: block;
          color: #816e7d;
          font-size: 9px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }
        .menu-card-action {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 9px;
          flex: 0 0 auto;
        }
        .menu-card-action > span {
          font-size: 9px;
          font-weight: 750;
        }
        .status-on {
          color: #8bd4a7;
        }
        .status-off {
          color: #b29daa;
        }
        .menu-switch {
          position: relative;
          width: 38px;
          height: 22px;
          padding: 0;
          border: 1px solid #62505f;
          border-radius: 20px;
          background: #403441;
          cursor: pointer;
          transition:
            background 0.15s,
            border-color 0.15s;
        }
        .menu-switch span {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #c7b7c4;
          transition: transform 0.15s;
        }
        .menu-switch.is-on {
          background: #9d527b;
          border-color: #d18bb0;
        }
        .menu-switch.is-on span {
          transform: translateX(16px);
          background: white;
        }
        .menu-switch:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .menus-empty {
          padding: 35px 18px;
          text-align: center;
          color: #ad9cab;
          background: #211a23;
          border: 1px dashed #574354;
          border-radius: 10px;
          font-size: 12px;
        }
        @media (max-width: 950px) {
          .menus-layout {
            grid-template-columns: 1fr;
          }
          .menus-sidebar {
            position: static;
          }
          .menu-cards {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 620px) {
          .menus-page {
            padding: 22px 14px 34px;
          }
          .menus-header {
            flex-direction: column;
          }
          .menus-summary {
            grid-template-columns: 1fr;
          }
          .menus-toolbar {
            grid-template-columns: 1fr;
          }
          .menu-card {
            padding: 12px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .menu-card,
          .menu-switch,
          .menu-switch span {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}
