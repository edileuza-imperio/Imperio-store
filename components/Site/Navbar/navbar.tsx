"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import conexao from "@/Services/Conexao/Conexao";
import { useNavbar } from "@/Services/Hooks/useNavbar";
import ImagemService from "@/Services/Imagem/ImagemService";
import type { NavbarItem } from "@/Services/types/Navbar";
import ROTAS from "@/app/constants/rotas";
import { obterIcone } from "@/components/Icons/Icones";
import { useAuth } from "@/components/contexts/AuthContext";

interface NavbarProps {
  className?: string;
}

type AreaMenu = "desktop" | "sidebar" | "categoria" | "conta";

interface ListaDesejo {
  id_lista: number;
  cliente_id: number;
  nome: string;
  publica: boolean | number | string;
  status_id: number;
}

function extrairListasDesejo(payload: unknown): ListaDesejo[] {
  const raiz = payload as any;
  const candidatos = [
    raiz?.dados?.dados,
    raiz?.dados?.listas,
    raiz?.dados,
    raiz?.data?.dados,
    raiz?.data?.listas,
    raiz?.data,
    raiz?.resultado?.dados,
    raiz?.resultado?.listas,
    raiz?.resultado,
    raiz?.listas,
    raiz,
  ];
  const lista = candidatos.find(Array.isArray) ?? [];
  return lista
    .map((item: any) => ({
      id_lista: Number(item?.id_lista ?? item?.id ?? 0),
      cliente_id: Number(item?.cliente_id ?? 0),
      nome: String(item?.nome ?? "Minha lista"),
      publica: item?.publica ?? false,
      status_id: Number(item?.status_id ?? 0),
    }))
    .filter(
      (item: ListaDesejo) =>
        Number.isInteger(item.id_lista) && item.id_lista > 0,
    );
}

function valorBooleano(valor: boolean | number | string): boolean {
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "number") return valor === 1;

  const normalizado = String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return ["1", "true", "sim", "ativo", "yes"].includes(normalizado);
}

interface ProdutoSugestao {
  id_produto: number;
  nome: string;
  slug?: string | null;
  sku?: string | null;
  preco?: string | number | null;
  preco_promocional?: string | number | null;
  imagem_principal?:
    | string
    | {
        imagem_url?: string | null;
        url?: string | null;
        caminho?: string | null;
        arquivo?: string | null;
        nome_arquivo?: string | null;
      }
    | null;
  imagem_url?: string | null;
}

function extrairProdutosSugestao(payload: unknown): ProdutoSugestao[] {
  if (!payload || typeof payload !== "object") return [];

  const raiz = payload as Record<string, any>;
  const dados =
    raiz.dados ??
    raiz.data?.dados ??
    raiz.resultado?.dados ??
    raiz.resultado ??
    raiz.data ??
    raiz;
  const produtos = Array.isArray(dados?.produtos) ? dados.produtos : [];

  return produtos
    .map((item: any) => ({
      id_produto: Number(item?.id_produto ?? item?.id ?? 0),
      nome: String(item?.nome ?? item?.nome_produto ?? "Produto"),
      slug: item?.slug ? String(item.slug) : null,
      sku: item?.sku ? String(item.sku) : null,
      preco: item?.preco ?? null,
      preco_promocional: item?.preco_promocional ?? null,
      imagem_principal: item?.imagem_principal ?? null,
      imagem_url: item?.imagem_url ?? null,
    }))
    .filter(
      (produto: ProdutoSugestao) =>
        Number.isInteger(produto.id_produto) && produto.id_produto > 0,
    )
    .slice(0, 5);
}

function numeroPrecoPesquisa(
  valor: string | number | null | undefined,
): number {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  const texto = String(valor ?? "").trim();
  if (!texto) return 0;
  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : 0;
}

function formatarPrecoPesquisa(
  valor: string | number | null | undefined,
): string {
  return numeroPrecoPesquisa(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function imagemSugestaoProduto(produto: ProdutoSugestao): string | null {
  const principal = produto.imagem_principal;
  const caminho =
    (typeof principal === "string" ? principal : null) ??
    (principal && typeof principal === "object"
      ? (principal.imagem_url ??
        principal.url ??
        principal.caminho ??
        principal.arquivo ??
        principal.nome_arquivo)
      : null) ??
    produto.imagem_url ??
    null;

  if (!caminho?.trim()) return null;
  const valor = caminho.trim();
  if (/^(https?:|data:|blob:|\/\/)/i.test(valor)) return valor;

  try {
    return (
      ImagemService.produto(valor) || ImagemService.resolver(valor) || null
    );
  } catch {
    return valor.startsWith("/") ? valor : null;
  }
}

// Aceita tanto códigos em texto quanto objetos de papel retornados pelo contexto.
function normalizarPapel(papel: unknown): string {
  let valor: unknown = papel;

  if (typeof papel === "object" && papel !== null) {
    const registro = papel as Record<string, unknown>;
    valor =
      registro.codigo ??
      registro.papel_codigo ??
      registro.codigo_papel ??
      registro.nome ??
      "";
  }

  return String(valor ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_")
    .toUpperCase();
}

export default function Navbar({ className = "" }: NavbarProps) {
  const router = useRouter();

  const {
    tituloLoja,
    menus = [],
    categorias = [],
    acoes = [],
    carregando,
    erro,
  } = useNavbar();

  const {
    usuario,
    autenticado,
    carregando: carregandoUsuario,
    atualizarUsuario,
  } = useAuth();

  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [sugestoesProdutos, setSugestoesProdutos] = useState<ProdutoSugestao[]>(
    [],
  );
  const [pesquisaAberta, setPesquisaAberta] = useState(false);
  const [carregandoPesquisa, setCarregandoPesquisa] = useState(false);
  const [erroPesquisa, setErroPesquisa] = useState<string | null>(null);
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [contaAberta, setContaAberta] = useState(false);
  const [encerrandoSessao, setEncerrandoSessao] = useState(false);
  const [desejosAberto, setDesejosAberto] = useState(false);
  const [listasDesejo, setListasDesejo] = useState<ListaDesejo[]>([]);
  const [carregandoListasDesejo, setCarregandoListasDesejo] = useState(false);
  const [erroListasDesejo, setErroListasDesejo] = useState<string | null>(null);
  const [listasCarregadas, setListasCarregadas] = useState(false);
  const [dropdownsAbertos, setDropdownsAbertos] = useState<Set<string>>(
    () => new Set(),
  );

  const botaoMenuRef = useRef<HTMLButtonElement>(null);
  const botaoFecharRef = useRef<HTMLButtonElement>(null);
  const contaRef = useRef<HTMLDivElement>(null);
  const desejosRef = useRef<HTMLDivElement>(null);
  const pesquisaRef = useRef<HTMLDivElement>(null);

  const nomeLoja = tituloLoja?.trim() || "Universo Império";
  const nomeUsuario = usuario?.nome?.trim() || "Minha conta";

  // Sugestões automáticas: consulta a API após uma breve pausa na digitação.
  useEffect(() => {
    const termo = termoPesquisa.trim();

    if (termo.length < 2) {
      setSugestoesProdutos([]);
      setPesquisaAberta(false);
      setCarregandoPesquisa(false);
      setErroPesquisa(null);
      return;
    }

    let requisicaoAtiva = true;
    setPesquisaAberta(true);
    setCarregandoPesquisa(true);
    setErroPesquisa(null);

    const temporizador = window.setTimeout(async () => {
      try {
        const resposta = await conexao.get(ROTAS.PRODUTOS.PESQUISAR, {
          params: { termo },
        });

        if (!requisicaoAtiva) return;

        const produtos = extrairProdutosSugestao(resposta?.data);
        setSugestoesProdutos(produtos);
      } catch (erro) {
        if (!requisicaoAtiva) return;
        console.error("[NAVBAR] Erro ao buscar sugestões de produtos:", erro);
        setSugestoesProdutos([]);
        setErroPesquisa("Não foi possível carregar as sugestões.");
      } finally {
        if (requisicaoAtiva) setCarregandoPesquisa(false);
      }
    }, 320);

    return () => {
      requisicaoAtiva = false;
      window.clearTimeout(temporizador);
    };
  }, [termoPesquisa]);

  // Fecha as sugestões ao clicar fora ou pressionar Escape.
  useEffect(() => {
    const fecharCliqueFora = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        pesquisaRef.current &&
        !pesquisaRef.current.contains(event.target)
      ) {
        setPesquisaAberta(false);
      }
    };
    const fecharEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPesquisaAberta(false);
    };

    document.addEventListener("mousedown", fecharCliqueFora);
    document.addEventListener("keydown", fecharEscape);
    return () => {
      document.removeEventListener("mousedown", fecharCliqueFora);
      document.removeEventListener("keydown", fecharEscape);
    };
  }, []);

  const normalizar = useCallback((valor?: string | null) => {
    return (valor ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }, []);

  const itemEhSair = useCallback(
    (item: NavbarItem) => {
      const nome = normalizar(item.nome);
      const icone = normalizar(item.icone);
      const rota = normalizar(item.rota);

      return (
        ["sair", "logout", "log out"].includes(nome) ||
        ["log-out", "logout"].includes(icone) ||
        rota.includes("auth/logout")
      );
    },
    [normalizar],
  );

  const itemEhConta = useCallback(
    (item: NavbarItem) => {
      const nome = normalizar(item.nome);
      const icone = normalizar(item.icone);
      const rota = normalizar(item.rota);

      return (
        nome.includes("conta") ||
        nome.includes("perfil") ||
        nome.includes("usuario") ||
        nome.includes("login") ||
        ["user", "user-round", "user-circle"].includes(icone) ||
        rota.includes("minha-conta") ||
        rota.includes("login")
      );
    },
    [normalizar],
  );

  const itemEhPainel = useCallback(
    (item: NavbarItem) => {
      const nome = normalizar(item.nome);
      const rota = normalizar(item.rota);

      return (
        nome.includes("painel administrativo") ||
        nome === "painel" ||
        rota === "/painel" ||
        rota.startsWith("/painel/")
      );
    },
    [normalizar],
  );

  const podeAcessarPainel = useMemo(
    () =>
      autenticado &&
      usuario?.permissoes?.includes("painel.visualizar") === true,
    [autenticado, usuario?.permissoes],
  );

  // ===================================================
  // PAPÉIS DO USUÁRIO AUTENTICADO
  // ===================================================

  const papeisUsuario = useMemo(() => {
    const papeis = Array.isArray(usuario?.papeis) ? usuario.papeis : [];

    return new Set(papeis.map(normalizarPapel).filter(Boolean));
  }, [usuario?.papeis]);

  // ===================================================
  // VALIDAR ACESSO AO ITEM PELO PAPEL
  // ===================================================

  const itemPodeSerExibido = useCallback(
    (item: NavbarItem): boolean => {
      const papeisPermitidos = (item.papeis_codigos ?? [])
        .map(normalizarPapel)
        .filter(Boolean);

      const possuiVinculoPorId = (item.papeis_ids ?? []).length > 0;

      // Sem associação de papel, o item é público.
      if (papeisPermitidos.length === 0 && !possuiVinculoPorId) {
        return true;
      }

      // Se o item possui papel associado, o visitante não o visualiza.
      if (!autenticado) return false;

      // Se chegaram IDs sem códigos, não presumimos acesso público.
      if (papeisPermitidos.length === 0) return false;

      return papeisPermitidos.some((papel) => papeisUsuario.has(papel));
    },
    [autenticado, papeisUsuario],
  );

  // ===================================================
  // FILTRAR POR PAPEL E PERMISSÃO
  // ===================================================

  const filtrarPorPermissao = useCallback(
    (itens: NavbarItem[]): NavbarItem[] =>
      itens
        .filter(
          (item) =>
            itemPodeSerExibido(item) &&
            (!itemEhPainel(item) || podeAcessarPainel),
        )
        .map((item) => ({
          ...item,
          filhos: filtrarPorPermissao(item.filhos ?? []),
        })),
    [itemPodeSerExibido, itemEhPainel, podeAcessarPainel],
  );

  const menusVisiveis = useMemo(
    () => filtrarPorPermissao(menus),
    [menus, filtrarPorPermissao],
  );
  const categoriasVisiveis = useMemo(
    () => filtrarPorPermissao(categorias),
    [categorias, filtrarPorPermissao],
  );
  const acoesVisiveis = useMemo(
    () => filtrarPorPermissao(acoes),
    [acoes, filtrarPorPermissao],
  );

  const itemConta = useMemo(
    () => acoesVisiveis.find(itemEhConta) ?? null,
    [acoesVisiveis, itemEhConta],
  );

  const outrasAcoes = useMemo(
    () =>
      acoesVisiveis.filter((item) => !itemEhConta(item) && !itemEhSair(item)),
    [acoesVisiveis, itemEhConta, itemEhSair],
  );

  const fecharNavegacao = useCallback(() => {
    setSidebarAberta(false);
    setContaAberta(false);
    setDesejosAberto(false);
    setDropdownsAbertos(new Set());
  }, []);

  const alternarSidebar = useCallback(() => {
    setSidebarAberta((atual) => !atual);
    setContaAberta(false);
  }, []);

  const fecharSidebar = useCallback(() => {
    setSidebarAberta(false);
    setDropdownsAbertos(new Set());
  }, []);

  useEffect(() => {
    if (!sidebarAberta) return;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    botaoFecharRef.current?.focus();

    const tratarEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") fecharSidebar();
    };

    window.addEventListener("keydown", tratarEscape);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", tratarEscape);
      botaoMenuRef.current?.focus();
    };
  }, [sidebarAberta, fecharSidebar]);

  useEffect(() => {
    if (!contaAberta) return;

    const fecharCliqueFora = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        contaRef.current &&
        !contaRef.current.contains(event.target)
      ) {
        setContaAberta(false);
      }
    };

    const fecharEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setContaAberta(false);
    };

    document.addEventListener("mousedown", fecharCliqueFora);
    document.addEventListener("keydown", fecharEscape);
    return () => {
      document.removeEventListener("mousedown", fecharCliqueFora);
      document.removeEventListener("keydown", fecharEscape);
    };
  }, [contaAberta]);

  const alternarDropdown = useCallback((chave: string) => {
    setDropdownsAbertos((atuais) => {
      const novos = new Set(atuais);
      if (novos.has(chave)) novos.delete(chave);
      else novos.add(chave);
      return novos;
    });
  }, []);

  const itemEhDesejos = useCallback(
    (item: NavbarItem) => {
      const nome = normalizar(item.nome);
      const icone = normalizar(item.icone);
      const rota = normalizar(item.rota);
      return (
        nome.includes("desejo") ||
        nome.includes("favorito") ||
        icone === "heart" ||
        icone === "wishlist" ||
        rota.includes("desejo") ||
        rota.includes("favorito")
      );
    },
    [normalizar],
  );

  const usuarioEhAdministrador = useMemo(
    () => papeisUsuario.has("ADMINISTRADOR") || papeisUsuario.has("ADMIN"),
    [papeisUsuario],
  );

  const idUsuarioAutenticado = Number(usuario?.id_usuario ?? 0);

  useEffect(() => {
    setListasCarregadas(false);
    setListasDesejo([]);
    setErroListasDesejo(null);
  }, [autenticado, idUsuarioAutenticado]);

  const obterClienteId = useCallback((): number | null => {
    const dadosUsuario = usuario as
      | (Record<string, any> & {
          cliente?: Record<string, any> | null;
        })
      | null;
    const valor =
      dadosUsuario?.id_cliente ??
      dadosUsuario?.cliente_id ??
      dadosUsuario?.cliente?.id_cliente ??
      dadosUsuario?.cliente?.cliente_id;
    const id = Number(valor);
    return Number.isInteger(id) && id > 0 ? id : null;
  }, [usuario]);

  const carregarListasDesejo = useCallback(
    async (forcar = false) => {
      if (!autenticado) {
        setListasDesejo([]);
        setListasCarregadas(true);
        setErroListasDesejo(null);
        return;
      }
      if (listasCarregadas && !forcar) return;

      const clienteId = obterClienteId();
      if (!clienteId) {
        setListasDesejo([]);
        setListasCarregadas(true);
        setErroListasDesejo(
          "Não encontramos o cadastro de cliente vinculado à sua conta.",
        );
        return;
      }

      try {
        setCarregandoListasDesejo(true);
        setErroListasDesejo(null);
        const resposta = await conexao.get(
          ROTAS.LISTAS_DESEJOS.LISTAR_POR_CLIENTE(clienteId),
        );
        setListasDesejo(extrairListasDesejo(resposta?.data));
        setListasCarregadas(true);
      } catch (error: any) {
        console.error("[NAVBAR] Erro ao carregar listas de desejos:", error);
        setErroListasDesejo(
          error?.response?.data?.erro ??
            error?.response?.data?.mensagem ??
            "Não foi possível carregar suas listas de desejos.",
        );
        setListasCarregadas(false);
      } finally {
        setCarregandoListasDesejo(false);
      }
    },
    [autenticado, listasCarregadas, obterClienteId],
  );

  const alternarDesejos = useCallback(() => {
    setDesejosAberto((aberto) => {
      const novoEstado = !aberto;
      if (novoEstado) {
        void carregarListasDesejo();
        setContaAberta(false);
      }
      return novoEstado;
    });
  }, [carregarListasDesejo]);

  useEffect(() => {
    if (!desejosAberto) return;
    const fecharCliqueFora = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        desejosRef.current &&
        !desejosRef.current.contains(event.target)
      ) {
        setDesejosAberto(false);
      }
    };
    const fecharEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDesejosAberto(false);
    };
    document.addEventListener("mousedown", fecharCliqueFora);
    document.addEventListener("keydown", fecharEscape);
    return () => {
      document.removeEventListener("mousedown", fecharCliqueFora);
      document.removeEventListener("keydown", fecharEscape);
    };
  }, [desejosAberto]);

  function abrirListaDesejo(item: NavbarItem, lista: ListaDesejo) {
    const destino = item.rota?.trim() || "/desejos";
    const separador = destino.includes("?") ? "&" : "?";
    setDesejosAberto(false);
    fecharNavegacao();
    router.push(`${destino}${separador}lista=${lista.id_lista}`);
  }

  function pesquisar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const termo = termoPesquisa.trim();
    if (!termo) return;

    setPesquisaAberta(false);
    fecharNavegacao();
    router.push(ROTAS.PAGINAS.LOJA.RESULTADOS_PRODUTOS(termo));
  }

  function abrirProdutoSugestao(produto: ProdutoSugestao) {
    const slug = produto.slug?.trim();
    setPesquisaAberta(false);
    fecharNavegacao();

    // O frontend possui app/(Home)/produto/[slug]. Sem slug,
    // direcionamos ao catálogo em vez de tentar abrir /produto/ID.
    if (!slug) {
      const termo = termoPesquisa.trim() || produto.nome;
      router.push(ROTAS.PAGINAS.LOJA.RESULTADOS_PRODUTOS(termo));
      return;
    }

    router.push(ROTAS.PAGINAS.LOJA.PRODUTO_DETALHE(slug));
  }

  function icone(nome?: string | null, tamanho = 19): ReactNode {
    if (!nome) return null;
    const Icone = obterIcone(nome);
    return <Icone size={tamanho} aria-hidden="true" />;
  }

  function conteudoItem(item: NavbarItem, tamanhoIcone = 17) {
    return (
      <>
        {icone(item.icone, tamanhoIcone)}
        <span>{item.nome}</span>
      </>
    );
  }

  async function executarLogout() {
    if (encerrandoSessao) return;

    try {
      setEncerrandoSessao(true);
      setContaAberta(false);
      await conexao.post(ROTAS.AUTH.LOGOUT);
      await atualizarUsuario();
      fecharNavegacao();
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("[NAVBAR] Não foi possível encerrar a sessão:", error);
    } finally {
      setEncerrandoSessao(false);
    }
  }

  function executarAcao(item: NavbarItem) {
    if (itemEhSair(item)) {
      void executarLogout();
      return;
    }

    const destino = item.rota?.trim();
    if (!destino) return;

    fecharNavegacao();
    if (item.url_externa) {
      window.open(destino, "_blank", "noopener,noreferrer");
    } else {
      router.push(destino);
    }
  }

  function renderLink(item: NavbarItem, classe: string) {
    const destino = item.rota?.trim();

    if (itemEhSair(item)) {
      return (
        <button
          type="button"
          className={`${classe} navbar-imperio__logout-link`}
          onClick={() => executarAcao(item)}
          disabled={encerrandoSessao}
        >
          {conteudoItem(item)}
        </button>
      );
    }

    if (!destino) {
      return <span className={classe}>{conteudoItem(item)}</span>;
    }

    return (
      <Link
        href={destino}
        className={classe}
        target={item.url_externa ? "_blank" : undefined}
        rel={item.url_externa ? "noopener noreferrer" : undefined}
        onClick={fecharNavegacao}
      >
        {conteudoItem(item)}
      </Link>
    );
  }

  function renderSubmenus(
    itens: NavbarItem[],
    classeLink: string,
    area: AreaMenu,
    caminho = "",
  ): ReactNode {
    return itens.map((item) => {
      const chave = `${area}:${caminho}${item.id_menu_item}`;
      const filhos = item.filhos ?? [];
      const aberto = dropdownsAbertos.has(chave);
      const idLista = `navbar-${area}-sub-${caminho}${item.id_menu_item}`;

      return (
        <li key={chave} className="navbar-imperio__submenu-item">
          {filhos.length > 0 ? (
            <>
              <button
                type="button"
                className={`${classeLink} navbar-imperio__submenu-trigger ${aberto ? "is-open" : ""}`}
                aria-expanded={aberto}
                aria-controls={idLista}
                onClick={() => alternarDropdown(chave)}
              >
                <span className="navbar-imperio__item-content">
                  {conteudoItem(item)}
                </span>
                <span className="navbar-imperio__submenu-chevron">
                  {icone("chevron-right", 15)}
                </span>
              </button>
              <ul
                id={idLista}
                className={`navbar-imperio__submenu ${aberto ? "is-open" : ""}`}
                hidden={!aberto}
              >
                {renderSubmenus(
                  filhos,
                  classeLink,
                  area,
                  `${caminho}${item.id_menu_item}-`,
                )}
              </ul>
            </>
          ) : (
            renderLink(item, classeLink)
          )}
        </li>
      );
    });
  }

  function renderMenuPrincipal(item: NavbarItem, area: "desktop" | "sidebar") {
    const chave = `${area}:menu:${item.id_menu_item}`;
    const filhos = item.filhos ?? [];
    const aberto = dropdownsAbertos.has(chave);
    const idLista = `navbar-${area}-menu-${item.id_menu_item}`;

    return (
      <li
        key={chave}
        className={`navbar-imperio__nav-item ${filhos.length ? "has-children" : ""}`}
      >
        {itemEhDesejos(item) ? (
          renderAcao(item)
        ) : filhos.length > 0 ? (
          <>
            <button
              type="button"
              className={`navbar-imperio__nav-link ${aberto ? "is-open" : ""}`}
              aria-expanded={aberto}
              aria-controls={idLista}
              onClick={() => alternarDropdown(chave)}
            >
              {conteudoItem(item)}
              <span className="navbar-imperio__nav-chevron">
                {icone("chevron-down", 14)}
              </span>
            </button>
            <ul
              id={idLista}
              className={`navbar-imperio__dropdown ${aberto ? "is-open" : ""}`}
              hidden={!aberto}
            >
              {renderSubmenus(filhos, "navbar-imperio__dropdown-link", area)}
            </ul>
          </>
        ) : (
          renderLink(item, "navbar-imperio__nav-link")
        )}
      </li>
    );
  }

  function renderCategoria(item: NavbarItem) {
    const chave = `categoria:${item.id_menu_item}`;
    const filhos = item.filhos ?? [];
    const aberto = dropdownsAbertos.has(chave);
    const idLista = `navbar-categoria-${item.id_menu_item}`;

    return (
      <li key={chave} className="navbar-imperio__sidebar-item">
        {filhos.length > 0 ? (
          <>
            <button
              type="button"
              className={`navbar-imperio__sidebar-link ${aberto ? "is-open" : ""}`}
              aria-expanded={aberto}
              aria-controls={idLista}
              onClick={() => alternarDropdown(chave)}
            >
              {conteudoItem(item)}
              <span className="navbar-imperio__nav-chevron">
                {icone("chevron-down", 14)}
              </span>
            </button>
            <ul
              id={idLista}
              className="navbar-imperio__sidebar-sublist"
              hidden={!aberto}
            >
              {renderSubmenus(
                filhos,
                "navbar-imperio__sidebar-sublink",
                "categoria",
              )}
            </ul>
          </>
        ) : (
          renderLink(item, "navbar-imperio__sidebar-link")
        )}
      </li>
    );
  }

  function renderConta() {
    if (carregandoUsuario) return null;

    if (!autenticado || !usuario?.nome) {
      return (
        <Link
          href={itemConta?.rota?.trim() || "/login"}
          className="navbar-imperio__account navbar-imperio__account--guest"
          aria-label="Entrar na minha conta"
          onClick={fecharNavegacao}
        >
          <span className="navbar-imperio__account-icon">
            {icone("user-round", 20)}
          </span>
          <span className="navbar-imperio__account-copy">
            <small>Bem-vindo(a)</small>
            <strong>Minha conta</strong>
          </span>
        </Link>
      );
    }

    const sairRaiz = acoesVisiveis.filter(itemEhSair);
    const mapaItens = new Map<number, NavbarItem>();
    [...(itemConta?.filhos ?? []), ...sairRaiz].forEach((item) => {
      mapaItens.set(item.id_menu_item, item);
    });
    // Os itens já chegam filtrados pelos papéis do usuário.
    // Não restringimos as opções da conta à permissão do painel administrativo.
    const itensConta = [...mapaItens.values()];

    return (
      <div className="navbar-imperio__account-wrap" ref={contaRef}>
        <button
          type="button"
          className={`navbar-imperio__account ${contaAberta ? "is-open" : ""}`}
          aria-label={`Opções da conta de ${nomeUsuario}`}
          aria-expanded={contaAberta}
          aria-controls="navbar-account-menu"
          onClick={() => setContaAberta((atual) => !atual)}
        >
          <span className="navbar-imperio__account-icon">
            {icone(itemConta?.icone || "user-round", 20)}
          </span>
          <span className="navbar-imperio__account-copy">
            <small>Olá,</small>
            <strong>{nomeUsuario}</strong>
          </span>
          <span className="navbar-imperio__account-chevron">
            {icone("chevron-down", 14)}
          </span>
        </button>

        {contaAberta && (
          <div
            className="navbar-imperio__account-menu"
            id="navbar-account-menu"
          >
            <div className="navbar-imperio__account-menu-heading">
              <small>Conta conectada</small>
              <strong>{nomeUsuario}</strong>
            </div>
            {itensConta.length > 0 ? (
              <ul>
                {renderSubmenus(
                  itensConta,
                  "navbar-imperio__account-menu-link",
                  "conta",
                )}
              </ul>
            ) : (
              <p className="navbar-imperio__empty">Nenhuma opção disponível.</p>
            )}
            {encerrandoSessao && (
              <p className="navbar-imperio__loading">Encerrando sessão...</p>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderAcao(item: NavbarItem) {
    const destino = item.rota?.trim();
    if (!destino) return null;

    if (itemEhDesejos(item)) {
      return (
        <div
          key={item.id_menu_item}
          className="navbar-imperio__wishlist-wrap"
          ref={desejosRef}
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            flex: "0 0 auto",
            overflow: "visible",
          }}
        >
          <button
            type="button"
            className="navbar-imperio__action-link navbar-imperio__wishlist-trigger"
            aria-expanded={desejosAberto}
            aria-controls={`navbar-wishlist-${item.id_menu_item}`}
            onClick={alternarDesejos}
          >
            {icone(item.icone || "heart", 20)}
            <span>{item.nome}</span>
            {icone("chevron-down", 14)}
          </button>

          {desejosAberto && (
            <div
              id={`navbar-wishlist-${item.id_menu_item}`}
              className="navbar-imperio__wishlist-dropdown"
              role="menu"
              style={{
                // Fica fora do fluxo do header, sobrepondo o conteúdo abaixo.
                // Assim o dropdown não empurra nem quebra a linha da navbar.
                position: "fixed",
                zIndex: 10000,
                top: 82,
                right: 16,
                width: "min(360px, calc(100vw - 32px))",
                minWidth: 0,
                maxHeight: "min(70vh, 460px)",
                overflowY: "auto",
                padding: 18,
                border: "1px solid #eadde8",
                borderRadius: 16,
                background: "#fff",
                color: "#332b32",
                boxShadow: "0 18px 48px rgba(53, 30, 44, .22)",
                lineHeight: 1.45,
                boxSizing: "border-box",
              }}
            >
              <div
                className="navbar-imperio__wishlist-heading"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  padding: "4px 4px 14px",
                  marginBottom: 8,
                  borderBottom: "1px solid #f0e6ed",
                }}
              >
                <strong style={{ fontSize: 16, color: "#573746" }}>
                  Minhas listas de desejos
                </strong>
                <span style={{ fontSize: 12, color: "#8b7882" }}>
                  {usuarioEhAdministrador
                    ? `Conta administradora • Usuário #${idUsuarioAutenticado}`
                    : "Acesse suas listas salvas"}
                </span>
              </div>

              {!autenticado ? (
                <div className="navbar-imperio__wishlist-message">
                  <p>Entre na sua conta para visualizar suas listas.</p>
                  <Link
                    href="/login"
                    onClick={() => {
                      setDesejosAberto(false);
                      fecharNavegacao();
                    }}
                  >
                    Fazer login
                  </Link>
                </div>
              ) : carregandoListasDesejo ? (
                <p className="navbar-imperio__wishlist-message">
                  Carregando suas listas...
                </p>
              ) : erroListasDesejo ? (
                <div
                  className="navbar-imperio__wishlist-message is-error"
                  style={{
                    padding: "12px 4px 14px",
                    color: "#66535d",
                    fontSize: 13,
                    lineHeight: 1.55,
                  }}
                >
                  <p style={{ margin: "0 0 8px" }}>
                    {usuarioEhAdministrador
                      ? "Sua conta está autenticada como administradora, mas não possui um cliente vinculado. O ID de usuário não pode ser usado como ID de cliente."
                      : erroListasDesejo}
                  </p>
                  {usuarioEhAdministrador && (
                    <small
                      style={{
                        display: "block",
                        color: "#8b7882",
                        marginBottom: 10,
                      }}
                    >
                      Usuário autenticado: #{idUsuarioAutenticado}
                    </small>
                  )}
                  <button
                    type="button"
                    onClick={() => void carregarListasDesejo(true)}
                    style={{
                      border: 0,
                      borderRadius: 8,
                      padding: "8px 12px",
                      background: "#a95f78",
                      color: "#fff",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : listasDesejo.length > 0 ? (
                <ul
                  className="navbar-imperio__wishlist-list"
                  style={{
                    listStyle: "none",
                    margin: "8px 0 12px",
                    padding: 0,
                    maxHeight: 280,
                    overflowY: "auto",
                  }}
                >
                  {listasDesejo.map((lista) => (
                    <li key={lista.id_lista} style={{ marginBottom: 5 }}>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => abrirListaDesejo(item, lista)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "11px 10px",
                          border: "1px solid #f0e6ed",
                          borderRadius: 10,
                          background: "#fffafd",
                          color: "#573746",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <span
                          style={{
                            display: "grid",
                            placeItems: "center",
                            width: 34,
                            height: 34,
                            flex: "0 0 34px",
                            borderRadius: "50%",
                            background: "#f8eaf0",
                            color: "#a95f78",
                          }}
                        >
                          {icone("heart", 16)}
                        </span>
                        <span
                          style={{
                            minWidth: 0,
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                          }}
                        >
                          <strong style={{ fontSize: 13, fontWeight: 650 }}>
                            {lista.nome}
                          </strong>
                          <small style={{ fontSize: 11, color: "#8b7882" }}>
                            {valorBooleano(lista.publica)
                              ? "Lista pública"
                              : "Lista privada"}
                          </small>
                        </span>
                        {icone("chevron-right", 15)}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="navbar-imperio__wishlist-message">
                  <p>Você ainda não criou nenhuma lista.</p>
                  <Link
                    href={destino}
                    onClick={() => {
                      setDesejosAberto(false);
                      fecharNavegacao();
                    }}
                  >
                    Criar minha primeira lista
                  </Link>
                </div>
              )}

              <Link
                href={destino}
                className="navbar-imperio__wishlist-footer"
                onClick={() => {
                  setDesejosAberto(false);
                  fecharNavegacao();
                }}
                style={{
                  display: "block",
                  marginTop: 10,
                  padding: "12px 8px 2px",
                  borderTop: "1px solid #f0e6ed",
                  color: "#9b536f",
                  fontSize: 13,
                  fontWeight: 700,
                  textAlign: "center",
                  textDecoration: "none",
                }}
              >
                Ver todas as listas
              </Link>
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id_menu_item}
        href={destino}
        className="navbar-imperio__action-link"
        target={item.url_externa ? "_blank" : undefined}
        rel={item.url_externa ? "noopener noreferrer" : undefined}
        onClick={fecharNavegacao}
      >
        {icone(item.icone, 20)}
        <span>{item.nome}</span>
      </Link>
    );
  }

  return (
    <>
      <header className={`navbar-imperio ${className}`}>
        {/* PRIMEIRA FAIXA: MARCA, PESQUISA E AÇÕES */}
        <div className="navbar-imperio__topbar">
          <div className="navbar-imperio__container">
            <button
              ref={botaoMenuRef}
              type="button"
              className="navbar-imperio__menu-toggle"
              aria-label={sidebarAberta ? "Fechar menu" : "Abrir menu"}
              aria-expanded={sidebarAberta}
              aria-controls="navbar-sidebar-panel"
              onClick={alternarSidebar}
            >
              <span />
              <span />
              <span />
            </button>

            <Link
              href="/"
              className="navbar-imperio__brand"
              aria-label={`${nomeLoja} - página inicial`}
              onClick={fecharNavegacao}
            >
              <span className="navbar-imperio__brand-eyebrow">UNIVERSO</span>
              <strong>
                {nomeLoja.replace(/^Universo\s*/i, "").toUpperCase() ||
                  "IMPÉRIO"}
              </strong>
            </Link>

            <div className="navbar-imperio__search-area" ref={pesquisaRef}>
              <form
                className="navbar-imperio__search"
                role="search"
                onSubmit={pesquisar}
              >
                <input
                  type="search"
                  value={termoPesquisa}
                  onFocus={() => {
                    if (termoPesquisa.trim().length >= 2)
                      setPesquisaAberta(true);
                  }}
                  onChange={(event) => {
                    const valor = event.target.value;
                    setTermoPesquisa(valor);
                    setPesquisaAberta(valor.trim().length >= 2);
                  }}
                  placeholder="O que você está procurando?"
                  aria-label="Buscar produtos"
                  aria-autocomplete="list"
                  aria-expanded={pesquisaAberta}
                  aria-controls="navbar-search-suggestions"
                />
                <button type="submit" aria-label="Pesquisar">
                  {icone("search", 20)}
                </button>
              </form>

              {pesquisaAberta && termoPesquisa.trim().length >= 2 && (
                <div
                  className="navbar-imperio__search-dropdown"
                  id="navbar-search-suggestions"
                  role="listbox"
                  aria-label="Sugestões de produtos"
                >
                  <div className="navbar-imperio__search-dropdown-heading">
                    <span>
                      {carregandoPesquisa
                        ? "PROCURANDO PRODUTOS"
                        : "PRODUTOS ENCONTRADOS"}
                    </span>
                    {!carregandoPesquisa && sugestoesProdutos.length > 0 && (
                      <small>{sugestoesProdutos.length} sugestões</small>
                    )}
                  </div>

                  {carregandoPesquisa ? (
                    <div
                      className="navbar-imperio__search-feedback"
                      role="status"
                    >
                      <span className="navbar-imperio__search-spinner" />
                      Procurando produtos...
                    </div>
                  ) : erroPesquisa ? (
                    <div className="navbar-imperio__search-feedback is-error">
                      {erroPesquisa}
                    </div>
                  ) : sugestoesProdutos.length > 0 ? (
                    <ul className="navbar-imperio__search-list">
                      {sugestoesProdutos.map((produto) => {
                        const imagem = imagemSugestaoProduto(produto);
                        const precoNormal = numeroPrecoPesquisa(produto.preco);
                        const precoPromocional = numeroPrecoPesquisa(
                          produto.preco_promocional,
                        );
                        const temOferta =
                          precoPromocional > 0 &&
                          precoNormal > 0 &&
                          precoPromocional < precoNormal;

                        return (
                          <li key={produto.id_produto}>
                            <button
                              type="button"
                              className="navbar-imperio__search-result"
                              role="option"
                              aria-selected={false}
                              onClick={() => abrirProdutoSugestao(produto)}
                            >
                              <span className="navbar-imperio__search-result-image">
                                {imagem ? (
                                  // A URL pode vir do serviço de imagens local ou de um CDN.
                                  <img src={imagem} alt="" loading="lazy" />
                                ) : (
                                  <span className="navbar-imperio__search-result-placeholder">
                                    {icone("package", 22)}
                                  </span>
                                )}
                              </span>
                              <span className="navbar-imperio__search-result-copy">
                                <strong>{produto.nome}</strong>
                                {produto.sku && (
                                  <small>SKU: {produto.sku}</small>
                                )}
                                <span className="navbar-imperio__search-result-prices">
                                  <strong>
                                    {formatarPrecoPesquisa(
                                      temOferta
                                        ? precoPromocional
                                        : precoNormal,
                                    )}
                                  </strong>
                                  {temOferta && (
                                    <del>
                                      {formatarPrecoPesquisa(precoNormal)}
                                    </del>
                                  )}
                                </span>
                              </span>
                              <span className="navbar-imperio__search-result-arrow">
                                {icone("chevron-right", 17)}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="navbar-imperio__search-feedback">
                      Nenhum produto encontrado para “{termoPesquisa.trim()}”.
                    </div>
                  )}

                  <button
                    type="button"
                    className="navbar-imperio__search-all"
                    onClick={() => {
                      setPesquisaAberta(false);
                      router.push(
                        ROTAS.PAGINAS.LOJA.RESULTADOS_PRODUTOS(termoPesquisa),
                      );
                    }}
                  >
                    Ver todos os resultados
                    {icone("arrow-right", 16)}
                  </button>
                </div>
              )}
            </div>

            <div className="navbar-imperio__actions" aria-label="Ações da loja">
              {renderConta()}
              {!carregando && !erro && outrasAcoes.map(renderAcao)}
            </div>
          </div>
        </div>

        {/* SEGUNDA FAIXA: NAVEGAÇÃO PRINCIPAL */}
        {!carregando && !erro && menusVisiveis.length > 0 && (
          <div className="navbar-imperio__navigation">
            <nav
              className="navbar-imperio__desktop-nav"
              aria-label="Menu principal"
            >
              <ul>
                {menusVisiveis.map((item) =>
                  renderMenuPrincipal(item, "desktop"),
                )}
              </ul>
            </nav>
          </div>
        )}
      </header>

      <nav
        className={`navbar-imperio__sidebar ${sidebarAberta ? "is-open" : ""}`}
        aria-label="Navegação da loja"
        aria-hidden={!sidebarAberta}
      >
        <button
          type="button"
          className="navbar-imperio__sidebar-overlay"
          aria-label="Fechar menu"
          tabIndex={sidebarAberta ? 0 : -1}
          onClick={fecharSidebar}
        />

        <aside
          id="navbar-sidebar-panel"
          className="navbar-imperio__sidebar-panel"
          role={sidebarAberta ? "dialog" : undefined}
          aria-modal={sidebarAberta ? true : undefined}
          aria-label={`Menu ${nomeLoja}`}
        >
          <div className="navbar-imperio__sidebar-header">
            <div>
              <small>EXPLORE A LOJA</small>
              <strong>{nomeLoja}</strong>
              <span>Encontre o que combina com você</span>
            </div>
            <button
              ref={botaoFecharRef}
              type="button"
              className="navbar-imperio__sidebar-close"
              aria-label="Fechar menu"
              onClick={fecharSidebar}
            >
              <span />
              <span />
            </button>
          </div>

          <div className="navbar-imperio__sidebar-content">
            {carregando && (
              <p className="navbar-imperio__sidebar-message">
                Carregando navegação...
              </p>
            )}
            {erro && (
              <p className="navbar-imperio__sidebar-message is-error">
                Não foi possível carregar a navegação.
              </p>
            )}

            {!carregando && !erro && (
              <>
                {menusVisiveis.length > 0 && (
                  <section className="navbar-imperio__sidebar-section">
                    <h2>Navegação</h2>
                    <ul className="navbar-imperio__sidebar-list">
                      {menusVisiveis.map((item) =>
                        renderMenuPrincipal(item, "sidebar"),
                      )}
                    </ul>
                  </section>
                )}

                {categoriasVisiveis.length > 0 && (
                  <section className="navbar-imperio__sidebar-section">
                    <h2>Categorias</h2>
                    <ul className="navbar-imperio__sidebar-list">
                      {categoriasVisiveis.map(renderCategoria)}
                    </ul>
                  </section>
                )}

                {menusVisiveis.length === 0 &&
                  categoriasVisiveis.length === 0 && (
                    <p className="navbar-imperio__sidebar-message">
                      Nenhum item cadastrado.
                    </p>
                  )}
              </>
            )}
          </div>

          <footer className="navbar-imperio__sidebar-footer">{nomeLoja}</footer>
        </aside>
      </nav>
    </>
  );
}
