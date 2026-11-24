"use client";

import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import ROTAS from "@/app/constants/rotas";
import { useAuth } from "@/components/contexts/AuthContext";
import { Icone } from "@/components/Icons/Icones";
import conexao from "@/Services/Conexao/Conexao";

import type { MenuDropdownItem } from "../config/menu.config";
import {
  CONFIG_NOTIFICACOES,
  CONFIG_PERFIL,
  IDENTIDADE_PAINEL,
  MENU_ADMINISTRATIVO,
  MENU_DROPDOWNS,
} from "../config/menu.config";

/* =========================================================
   MENU INICIAR — MODELO DE NAVEGAÇÃO
   Os submenus vêm de MENU_DROPDOWNS do menu.config.ts.
========================================================= */

type GrupoMenuIniciar = {
  titulo: string;
  itens: MenuDropdownItem[];
};

type ModuloMenuIniciar = {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  rotaPrincipal: string;
  badge?: string;
  grupos: GrupoMenuIniciar[];
};

/** Usa a primeira página existente do módulo; sem itens, volta para o Painel. */
function obterRotaPrincipal(grupos: GrupoMenuIniciar[]): string {
  return (
    grupos.find((grupo) => grupo.itens.length > 0)?.itens[0]?.rota ??
    MENU_ADMINISTRATIVO.painel.rota
  );
}

const MODULOS_MENU_INICIAR: ModuloMenuIniciar[] = [
  {
    id: "painel",
    nome: "Painel",
    descricao: "Visão geral da operação e indicadores da loja",
    icone: "layout-dashboard",
    rotaPrincipal: MENU_ADMINISTRATIVO.painel.rota,
    badge: "INÍCIO",
    grupos: [
      {
        titulo: "ÁREA PRINCIPAL",
        itens: [
          {
            titulo: "Visão geral",
            descricao: "Acesse o resumo e os indicadores do Universo Império",
            rota: MENU_ADMINISTRATIVO.painel.rota,
            icone: "layout-dashboard",
          },
        ],
      },
    ],
  },
  {
    id: "produtos",
    nome: MENU_DROPDOWNS.produtos.nome,
    descricao: MENU_DROPDOWNS.produtos.descricao,
    icone: MENU_DROPDOWNS.produtos.icone,
    rotaPrincipal: obterRotaPrincipal(MENU_DROPDOWNS.produtos.grupos),
    badge: MENU_DROPDOWNS.produtos.badge,
    grupos: MENU_DROPDOWNS.produtos.grupos,
  },
  {
    id: "estoque",
    nome: MENU_DROPDOWNS.estoque.nome,
    descricao: MENU_DROPDOWNS.estoque.descricao,
    icone: MENU_DROPDOWNS.estoque.icone,
    rotaPrincipal: obterRotaPrincipal(MENU_DROPDOWNS.estoque.grupos),
    badge: MENU_DROPDOWNS.estoque.badge,
    grupos: MENU_DROPDOWNS.estoque.grupos,
  },
  {
    id: "pedidos",
    nome: MENU_DROPDOWNS.pedidos.nome,
    descricao: MENU_DROPDOWNS.pedidos.descricao,
    icone: MENU_DROPDOWNS.pedidos.icone,
    rotaPrincipal: obterRotaPrincipal(MENU_DROPDOWNS.pedidos.grupos),
    badge: MENU_DROPDOWNS.pedidos.badge,
    grupos: MENU_DROPDOWNS.pedidos.grupos,
  },
  {
    id: "cupons",
    nome: MENU_DROPDOWNS.cupons.nome,
    descricao: MENU_DROPDOWNS.cupons.descricao,
    icone: MENU_DROPDOWNS.cupons.icone,
    rotaPrincipal: obterRotaPrincipal(MENU_DROPDOWNS.cupons.grupos),
    badge: MENU_DROPDOWNS.cupons.badge,
    grupos: MENU_DROPDOWNS.cupons.grupos,
  },
  {
    id: "pessoas",
    nome: MENU_DROPDOWNS.pessoas.nome,
    descricao: MENU_DROPDOWNS.pessoas.descricao,
    icone: MENU_DROPDOWNS.pessoas.icone,
    rotaPrincipal: obterRotaPrincipal(MENU_DROPDOWNS.pessoas.grupos),
    badge: MENU_DROPDOWNS.pessoas.badge,
    grupos: MENU_DROPDOWNS.pessoas.grupos,
  },
  {
    id: "conteudo",
    nome: MENU_DROPDOWNS.conteudo.nome,
    descricao: MENU_DROPDOWNS.conteudo.descricao,
    icone: MENU_DROPDOWNS.conteudo.icone,
    rotaPrincipal: obterRotaPrincipal(MENU_DROPDOWNS.conteudo.grupos),
    badge: MENU_DROPDOWNS.conteudo.badge,
    grupos: MENU_DROPDOWNS.conteudo.grupos,
  },
  {
    id: "configuracoes",
    nome: "Configurações",
    descricao: "Preferências, comunicação e controle de acesso",
    icone: "settings",
    rotaPrincipal: MENU_ADMINISTRATIVO.configuracoes.rota,
    badge: "SISTEMA",
    grupos: [
      {
        titulo: "CONFIGURAÇÕES GERAIS",
        itens: [
          {
            titulo: "Visão geral",
            descricao: "Acesse as configurações administrativas",
            rota: MENU_ADMINISTRATIVO.configuracoes.rota,
            icone: "settings",
          },
        ],
      },
      {
        titulo: "COMUNICAÇÃO",
        itens: [
          {
            titulo: "Templates de e-mail",
            descricao: "Gerencie os modelos de mensagens da loja",
            rota: "/painel/configuracoes/email",
            icone: "mail",
          },
        ],
      },
      {
        titulo: "CONTROLE DE ACESSO",
        itens: [
          {
            titulo: "Gerenciar permissões",
            descricao: "Configure os recursos liberados para cada papel",
            rota: "/painel/configuracoes/permissoes",
            icone: "shield-check",
          },
        ],
      },
    ],
  },
];

type GrupoFiltrado = {
  titulo: string;
  itens: MenuDropdownItem[];
};

type ModuloFiltrado = ModuloMenuIniciar & {
  gruposFiltrados: GrupoFiltrado[];
  totalItens: number;
};

function normalizarBusca(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function rotaAtiva(pathname: string, rota: string): boolean {
  if (!rota || rota === "/") return pathname === rota;
  return pathname === rota || pathname.startsWith(`${rota}/`);
}

function encontrarModuloAtual(pathname: string): string {
  const encontrado = MODULOS_MENU_INICIAR.find((modulo) =>
    modulo.grupos.some((grupo) =>
      grupo.itens.some((item) => rotaAtiva(pathname, item.rota)),
    ),
  );

  return encontrado?.id ?? "painel";
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, carregando, atualizarUsuario } = useAuth();

  const [iniciarAberto, setIniciarAberto] = useState(false);
  const [perfilAberto, setPerfilAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [erroPerfil, setErroPerfil] = useState("");
  const [moduloSelecionado, setModuloSelecionado] = useState("painel");
  const [buscaAtalhos, setBuscaAtalhos] = useState("");
  const conteudoModuloRef = useRef<HTMLElement | null>(null);
  const perfilRef = useRef<HTMLDivElement | null>(null);

  const nomeUsuario = usuario?.nome?.trim() || CONFIG_PERFIL.nomePadrao;
  const emailUsuario = usuario?.email?.trim() || CONFIG_PERFIL.emailPadrao;
  const inicial = nomeUsuario.trim().charAt(0).toUpperCase() || "U";
  const papeisUsuario: unknown[] = Array.isArray(usuario?.papeis)
    ? usuario.papeis
    : [];
  const descricaoPerfil =
    papeisUsuario
      .map((papel) => {
        if (typeof papel === "string") return papel.trim();
        if (papel && typeof papel === "object") {
          const registro = papel as Record<string, unknown>;
          return String(registro.nome ?? registro.codigo ?? "").trim();
        }
        return "";
      })
      .filter(Boolean)
      .join(" · ") || "Acesso administrativo";

  const fecharPerfil = useCallback(() => {
    setPerfilAberto(false);
    setErroPerfil("");
  }, []);

  const fecharMenuIniciar = useCallback(() => {
    setIniciarAberto(false);
    setBuscaAtalhos("");
  }, []);

  const abrirMenuIniciar = useCallback(() => {
    fecharPerfil();
    setBuscaAtalhos("");
    setModuloSelecionado(encontrarModuloAtual(pathname));
    setIniciarAberto(true);
  }, [pathname, fecharPerfil]);

  function selecionarModulo(id: string) {
    setModuloSelecionado(id);
    requestAnimationFrame(() => {
      if (conteudoModuloRef.current) {
        conteudoModuloRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  async function executarLogout() {
    if (saindo) return;

    try {
      setSaindo(true);
      setErroPerfil("");
      await conexao.post(ROTAS.AUTH.LOGOUT);
      await atualizarUsuario();
      fecharPerfil();
      router.replace(ROTAS.HOME);
      router.refresh();
    } catch (error: any) {
      console.error("[ADMIN HEADER] Falha ao encerrar sessão:", error);
      setErroPerfil(
        error?.response?.data?.mensagem ||
          error?.response?.data?.erro ||
          "Não foi possível encerrar a sessão. Tente novamente.",
      );
    } finally {
      setSaindo(false);
    }
  }

  /* Busca os módulos e também as páginas internas dos dropdowns. */
  const modulosFiltrados = useMemo<ModuloFiltrado[]>(() => {
    const termo = normalizarBusca(buscaAtalhos);

    return MODULOS_MENU_INICIAR.map((modulo) => {
      const correspondeModulo =
        !termo ||
        normalizarBusca(
          `${modulo.nome} ${modulo.descricao} ${modulo.badge ?? ""}`,
        ).includes(termo);

      const gruposFiltrados = modulo.grupos
        .map((grupo) => ({
          titulo: grupo.titulo,
          itens: grupo.itens.filter((item) => {
            if (!termo || correspondeModulo) return true;

            return normalizarBusca(
              `${item.titulo} ${item.descricao} ${grupo.titulo} ${modulo.nome} ${item.rota}`,
            ).includes(termo);
          }),
        }))
        .filter((grupo) => grupo.itens.length > 0);

      const totalItens = gruposFiltrados.reduce(
        (total, grupo) => total + grupo.itens.length,
        0,
      );

      return {
        ...modulo,
        gruposFiltrados,
        totalItens,
      };
    }).filter((modulo) => !termo || modulo.totalItens > 0);
  }, [buscaAtalhos]);

  const moduloAtivo =
    modulosFiltrados.find((modulo) => modulo.id === moduloSelecionado) ??
    modulosFiltrados[0] ??
    null;

  useEffect(() => {
    fecharMenuIniciar();
    fecharPerfil();
  }, [pathname, fecharMenuIniciar, fecharPerfil]);

  useEffect(() => {
    if (!perfilAberto) return;

    const fecharAoClicarFora = (evento: MouseEvent) => {
      if (
        evento.target instanceof Node &&
        perfilRef.current &&
        !perfilRef.current.contains(evento.target)
      ) {
        fecharPerfil();
      }
    };

    document.addEventListener("pointerdown", fecharAoClicarFora);
    return () =>
      document.removeEventListener("pointerdown", fecharAoClicarFora);
  }, [perfilAberto, fecharPerfil]);

  useEffect(() => {
    function verificarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        fecharPerfil();
        fecharMenuIniciar();
      }
    }

    document.addEventListener("keydown", verificarTecla);
    return () => document.removeEventListener("keydown", verificarTecla);
  }, [fecharPerfil, fecharMenuIniciar]);

  return (
    <header className="admin-header">
      <div className="admin-header-brand">
        <Link
          href={IDENTIDADE_PAINEL.rotaInicial}
          className="admin-logo"
          aria-label={IDENTIDADE_PAINEL.descricao}
        >
          <span className="admin-logo-icon">
            <Icone nome={IDENTIDADE_PAINEL.icone} tamanho={29} />
          </span>
          <span className="admin-logo-text">
            <small>{IDENTIDADE_PAINEL.nome}</small>
            <strong>{IDENTIDADE_PAINEL.marca}</strong>
          </span>
        </Link>

        <button
          type="button"
          className={`admin-start-trigger ${iniciarAberto ? "is-open" : ""}`}
          onClick={iniciarAberto ? fecharMenuIniciar : abrirMenuIniciar}
          aria-label={
            iniciarAberto
              ? "Fechar menu de aplicativos"
              : "Abrir menu de aplicativos"
          }
          aria-haspopup="dialog"
          aria-expanded={iniciarAberto}
          aria-controls="admin-start-panel"
          title="Abrir aplicativos do painel"
        >
          <span className="admin-start-trigger__grid" aria-hidden="true">
            {Array.from({ length: 9 }, (_, indice) => (
              <i key={indice} />
            ))}
          </span>
        </button>
      </div>

      <div className="admin-header-actions">
        <button
          type="button"
          className="admin-notification"
          aria-label={CONFIG_NOTIFICACOES.ariaLabel}
          title={CONFIG_NOTIFICACOES.nome}
        >
          <Icone nome={CONFIG_NOTIFICACOES.icone} tamanho={20} />
          <span className="notification-indicator" />
        </button>

        <div className="admin-profile-wrap" ref={perfilRef}>
          <button
            type="button"
            className={`admin-profile-trigger ${perfilAberto ? "is-open" : ""}`}
            onClick={() => {
              setPerfilAberto((aberto) => !aberto);
              setIniciarAberto(false);
              setErroPerfil("");
            }}
            aria-label={`Abrir opções da conta de ${nomeUsuario}`}
            aria-haspopup="menu"
            aria-expanded={perfilAberto}
            aria-controls="admin-profile-dropdown"
            disabled={carregando}
          >
            <span className="admin-avatar" aria-hidden="true">
              {carregando ? "…" : inicial}
            </span>
            <span className="admin-profile-info">
              <strong>{carregando ? "Carregando..." : nomeUsuario}</strong>
              <small>{emailUsuario}</small>
            </span>
            <ChevronDown
              size={16}
              className="admin-profile-chevron"
              aria-hidden="true"
            />
          </button>

          {perfilAberto && (
            <div
              id="admin-profile-dropdown"
              className="admin-profile-dropdown"
              role="menu"
              aria-label="Opções da conta"
            >
              <div className="admin-profile-dropdown__identity">
                <span className="admin-profile-dropdown__avatar">
                  {inicial}
                </span>
                <span className="admin-profile-dropdown__identity-copy">
                  <strong>{nomeUsuario}</strong>
                  <small>{emailUsuario}</small>
                  <em>{descricaoPerfil}</em>
                </span>
              </div>

              <div className="admin-profile-dropdown__status">
                <span />
                {usuario
                  ? "Sessão administrativa ativa"
                  : "Sessão não identificada"}
              </div>

              <div className="admin-profile-dropdown__divider" />

              <Link
                href={MENU_ADMINISTRATIVO.painel.rota}
                className="admin-profile-dropdown__link"
                role="menuitem"
                onClick={fecharPerfil}
              >
                <LayoutDashboard size={17} />
                <span>
                  <strong>Visão geral</strong>
                  <small>Acompanhe a operação da loja</small>
                </span>
                <ChevronRight size={15} />
              </Link>

              <Link
                href={MENU_ADMINISTRATIVO.configuracoes.rota}
                className="admin-profile-dropdown__link"
                role="menuitem"
                onClick={fecharPerfil}
              >
                <Settings size={17} />
                <span>
                  <strong>Configurações</strong>
                  <small>Preferências do painel</small>
                </span>
                <ChevronRight size={15} />
              </Link>

              {erroPerfil && (
                <p className="admin-profile-dropdown__error" role="alert">
                  {erroPerfil}
                </p>
              )}

              <div className="admin-profile-dropdown__divider" />

              <button
                type="button"
                className="admin-profile-dropdown__logout"
                role="menuitem"
                onClick={() => void executarLogout()}
                disabled={saindo}
              >
                <LogOut size={17} />
                {saindo ? "Encerrando sessão..." : "Sair da conta"}
              </button>
            </div>
          )}
        </div>
      </div>

      {iniciarAberto && (
        <div
          className="admin-start-overlay"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) {
              fecharMenuIniciar();
            }
          }}
        >
          <section
            id="admin-start-panel"
            className="admin-start-panel admin-start-panel--expanded"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-start-title"
          >
            <header className="admin-start-panel__header">
              <div className="admin-start-panel__identity">
                <span className="admin-start-panel__brand-icon">
                  <Icone nome={IDENTIDADE_PAINEL.icone} tamanho={22} />
                </span>
                <div>
                  <span>UNIVERSO IMPÉRIO V3</span>
                  <h2 id="admin-start-title">Central de aplicativos</h2>
                </div>
              </div>
              <button
                type="button"
                className="admin-start-panel__close"
                onClick={fecharMenuIniciar}
                aria-label="Fechar menu de aplicativos"
              >
                <X size={19} />
              </button>
            </header>

            <div className="admin-start-search-wrap">
              <label className="admin-start-search">
                <Search size={18} aria-hidden="true" />
                <input
                  type="search"
                  value={buscaAtalhos}
                  onChange={(evento) => {
                    setBuscaAtalhos(evento.target.value);
                    const termo = normalizarBusca(evento.target.value);
                    if (termo) {
                      const primeira = MODULOS_MENU_INICIAR.find((modulo) =>
                        normalizarBusca(
                          `${modulo.nome} ${modulo.descricao} ${modulo.grupos
                            .flatMap((grupo) =>
                              grupo.itens.map(
                                (item) =>
                                  `${item.titulo} ${item.descricao} ${item.rota}`,
                              ),
                            )
                            .join(" ")}`,
                        ).includes(termo),
                      );
                      if (primeira) selecionarModulo(primeira.id);
                    }
                  }}
                  placeholder="Pesquise um módulo ou uma página..."
                  autoFocus
                />
                <kbd>ESC</kbd>
              </label>
            </div>

            <div className="admin-start-workspace">
              <aside className="admin-start-sidebar">
                <div className="admin-start-sidebar__heading">
                  <span>MÓDULOS</span>
                  <small>{modulosFiltrados.length}</small>
                </div>

                <div className="admin-start-module-list">
                  {modulosFiltrados.map((modulo) => {
                    const selecionado = moduloAtivo?.id === modulo.id;
                    const possuiRotaAtiva = modulo.grupos.some((grupo) =>
                      grupo.itens.some((item) =>
                        rotaAtiva(pathname, item.rota),
                      ),
                    );

                    return (
                      <button
                        type="button"
                        key={modulo.id}
                        className={`admin-start-module ${
                          selecionado ? "is-selected" : ""
                        } ${possuiRotaAtiva ? "has-current-route" : ""}`}
                        onClick={() => selecionarModulo(modulo.id)}
                        aria-pressed={selecionado}
                      >
                        <span
                          className={`admin-start-module__icon admin-start-module__icon--${modulo.id}`}
                        >
                          <Icone nome={modulo.icone} tamanho={20} />
                        </span>
                        <span className="admin-start-module__text">
                          <strong>{modulo.nome}</strong>
                          <small>
                            {modulo.totalItens}{" "}
                            {modulo.totalItens === 1 ? "página" : "páginas"}
                          </small>
                        </span>
                        <ChevronRight
                          size={16}
                          className="admin-start-module__chevron"
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="admin-start-sidebar__footer">
                  <span className="admin-start-status-dot" />
                  Painel administrativo
                </div>
              </aside>

              <section
                ref={conteudoModuloRef}
                className="admin-start-content"
                aria-live="polite"
              >
                {moduloAtivo ? (
                  <>
                    <div className="admin-start-content__hero">
                      <div
                        className={`admin-start-content__hero-icon admin-start-content__hero-icon--${moduloAtivo.id}`}
                      >
                        <Icone nome={moduloAtivo.icone} tamanho={25} />
                      </div>
                      <div className="admin-start-content__hero-copy">
                        <div className="admin-start-content__eyebrow">
                          {moduloAtivo.badge || "MÓDULO"}
                        </div>
                        <h3>{moduloAtivo.nome}</h3>
                        <p>{moduloAtivo.descricao}</p>
                      </div>
                      <Link
                        href={moduloAtivo.rotaPrincipal}
                        className="admin-start-open-module"
                        onClick={fecharMenuIniciar}
                      >
                        Abrir módulo
                        <ChevronRight size={15} />
                      </Link>
                    </div>

                    <div className="admin-start-content__groups">
                      {moduloAtivo.gruposFiltrados.map((grupo) => (
                        <section
                          className="admin-start-group"
                          key={`${moduloAtivo.id}-${grupo.titulo}`}
                        >
                          <div className="admin-start-group__heading">
                            <span>{grupo.titulo}</span>
                            <i />
                          </div>

                          <div className="admin-start-page-list">
                            {grupo.itens.map((item) => {
                              const ativo = rotaAtiva(pathname, item.rota);

                              return (
                                <Link
                                  key={`${item.rota}-${item.titulo}`}
                                  href={item.rota}
                                  className={`admin-start-page ${
                                    ativo ? "is-current" : ""
                                  }`}
                                  onClick={fecharMenuIniciar}
                                  aria-current={ativo ? "page" : undefined}
                                >
                                  <span className="admin-start-page__icon">
                                    <Icone nome={item.icone} tamanho={18} />
                                  </span>
                                  <span className="admin-start-page__copy">
                                    <strong>{item.titulo}</strong>
                                    <small>{item.descricao}</small>
                                  </span>
                                  {ativo ? (
                                    <span className="admin-start-page__current">
                                      Atual
                                    </span>
                                  ) : (
                                    <ChevronRight
                                      className="admin-start-page__arrow"
                                      size={16}
                                    />
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </div>

                    <div className="admin-start-content__tip">
                      <Icone nome="info" tamanho={16} />
                      <span>
                        Escolha uma página para acessá-la. O menu será fechado
                        automaticamente após a navegação.
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="admin-start-no-results">
                    <Search size={26} />
                    <strong>Nenhum módulo encontrado</strong>
                    <span>Altere a pesquisa para encontrar uma página.</span>
                  </div>
                )}
              </section>
            </div>

            <footer className="admin-start-panel__footer">
              <div className="admin-start-user">
                <span className="admin-start-user__avatar">
                  {carregando ? "…" : inicial}
                </span>
                <span>
                  <strong>{carregando ? "Carregando..." : nomeUsuario}</strong>
                  <small>{emailUsuario || "Painel administrativo"}</small>
                </span>
              </div>
              <span className="admin-start-footer-note">
                UNIVERSO IMPÉRIO · PAINEL ADMINISTRATIVO
              </span>
            </footer>
          </section>
        </div>
      )}
    </header>
  );
}
