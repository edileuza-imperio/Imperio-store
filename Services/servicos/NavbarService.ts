import conexao from "@/Services/Conexao/Conexao";
import ROTAS from "@/app/constants/rotas";

import type {
  ApiNavbarGrupo,
  ApiResponse,
  NavbarData,
  NavbarItem,
  ValorBooleano,
} from "../types/Navbar";

// =====================================================
// AUXILIARES
// =====================================================

function normalizar(valor: string | null | undefined): string {
  return (valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_]+/g, "-");
}

function converterBooleano(valor: ValorBooleano | undefined): boolean {
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "number") return valor === 1;

  if (typeof valor === "string") {
    return ["1", "true", "sim", "ativo", "yes"].includes(normalizar(valor));
  }

  return false;
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

// =====================================================
// EXTRAIR GRUPOS DA RESPOSTA DA API
// =====================================================

function extrairGrupos(payload: unknown): ApiNavbarGrupo[] {
  if (Array.isArray(payload)) {
    return payload as ApiNavbarGrupo[];
  }

  if (!ehObjeto(payload)) {
    throw new Error("A API retornou uma resposta inválida para a navegação.");
  }

  const dados = ehObjeto(payload.dados) ? payload.dados : null;
  const data = ehObjeto(payload.data) ? payload.data : null;
  const dadosData = dados && ehObjeto(dados.dados) ? dados.dados : null;
  const dataDados = data && ehObjeto(data.dados) ? data.dados : null;

  const candidatos: unknown[] = [
    dados?.navbar,
    dadosData?.navbar,
    dados?.dados,
    dataDados?.navbar,
    data?.navbar,
    data?.dados,
    payload.navbar,
    payload.dados,
  ];

  const grupos = candidatos.find(Array.isArray);

  if (!grupos) {
    throw new Error("A API não retornou a lista de grupos em dados.navbar.");
  }

  return grupos as ApiNavbarGrupo[];
}

// =====================================================
// IDENTIFICAÇÃO DOS MENUS
// =====================================================

function menuEhIdentidade(menu: ApiNavbarGrupo["menu"]): boolean {
  const codigo = normalizar(menu.codigo);
  return codigo === "navbar-loja" || codigo === "identidade-loja";
}

function menuEhCabecalho(menu: ApiNavbarGrupo["menu"]): boolean {
  return ["cabecalho", "header", "topo"].includes(normalizar(menu.localizacao));
}

function menuEhCategorias(menu: ApiNavbarGrupo["menu"]): boolean {
  const identificadores = [menu.localizacao, menu.codigo, menu.nome].map(
    normalizar,
  );
  return identificadores.some((valor) => valor.includes("categoria"));
}

// =====================================================
// IDENTIFICAÇÃO DAS AÇÕES DA NAVBAR
// =====================================================

export type TipoAcao = "conta" | "desejos" | "carrinho" | "sair";

export function identificarAcao(item: NavbarItem): TipoAcao | null {
  const icone = normalizar(item.icone);
  const nome = normalizar(item.nome);
  const rota = normalizar(item.rota);

  if (
    ["sair", "logout", "log-out"].includes(nome) ||
    ["log-out", "logout"].includes(icone) ||
    rota.includes("auth-logout")
  ) {
    return "sair";
  }

  if (
    ["user", "user-round", "user-circle", "login", "log-in"].includes(icone) ||
    nome.includes("conta") ||
    nome.includes("login") ||
    rota.includes("login") ||
    rota.includes("minha-conta")
  ) {
    return "conta";
  }

  if (
    ["heart", "wishlist"].includes(icone) ||
    nome.includes("favorito") ||
    nome.includes("desejo") ||
    rota.includes("favorito") ||
    rota.includes("desejo")
  ) {
    return "desejos";
  }

  if (
    ["cart", "shopping-cart", "shopping-bag"].includes(icone) ||
    nome.includes("carrinho") ||
    rota.includes("carrinho")
  ) {
    return "carrinho";
  }

  return null;
}

// =====================================================
// CONVERTER ITENS DA API
// =====================================================

function obterItensAtivos(grupos: ApiNavbarGrupo[]): NavbarItem[] {
  return grupos
    .flatMap((grupo) => grupo.itens ?? [])
    .map((registro): NavbarItem | null => {
      const item = registro?.item;

      if (!item || !converterBooleano(item.ativo)) {
        return null;
      }

      const papeisIds = Array.isArray(registro.papeis_ids)
        ? registro.papeis_ids
            .map(Number)
            .filter((id) => Number.isInteger(id) && id > 0)
        : [];

      const papeisCodigos = Array.isArray(registro.papeis_codigos)
        ? [
            ...new Set(
              registro.papeis_codigos
                .filter(
                  (codigo): codigo is string => typeof codigo === "string",
                )
                .map((codigo) => codigo.trim().toUpperCase())
                .filter(Boolean),
            ),
          ]
        : [];

      return {
        ...item,
        ativo: converterBooleano(item.ativo),
        url_externa: converterBooleano(item.url_externa),
        papeis_ids: papeisIds,
        papeis_codigos: papeisCodigos,
        filhos: [],
      };
    })
    .filter((item): item is NavbarItem => item !== null);
}

// =====================================================
// MONTAR ÁRVORE DE MENUS
// =====================================================

function montarArvore(itens: NavbarItem[]): NavbarItem[] {
  const mapa = new Map<number, NavbarItem>();

  itens.forEach((item) => {
    mapa.set(item.id_menu_item, { ...item, filhos: [] });
  });

  const principais: NavbarItem[] = [];

  mapa.forEach((item) => {
    const idPai = item.item_pai_id;

    if (idPai === null || idPai === undefined) {
      principais.push(item);
      return;
    }

    const pai = mapa.get(Number(idPai));

    if (pai) {
      pai.filhos.push(item);
    } else {
      console.warn(
        `[NAVBAR] Pai ${idPai} não encontrado para ${item.nome}; item mantido na raiz.`,
      );
      principais.push(item);
    }
  });

  function ordenar(lista: NavbarItem[]): void {
    lista.sort((a, b) => Number(a.ordem) - Number(b.ordem));
    lista.forEach((item) => ordenar(item.filhos));
  }

  ordenar(principais);
  return principais;
}

// =====================================================
// ORGANIZAR CABEÇALHO
// =====================================================

function organizarCabecalho(arvore: NavbarItem[]): {
  menus: NavbarItem[];
  acoes: NavbarItem[];
} {
  const menus: NavbarItem[] = [];
  const acoes: NavbarItem[] = [];

  const itemConta = arvore.find((item) => identificarAcao(item) === "conta");
  const itensSair = arvore.filter((item) => identificarAcao(item) === "sair");

  // Recoloca a opção Sair dentro de Minha conta, sem duplicá-la.
  if (itemConta) {
    itensSair.forEach((itemSair) => {
      const jaExiste = itemConta.filhos.some(
        (filho) => identificarAcao(filho) === "sair",
      );

      if (!jaExiste) {
        itemConta.filhos.push({
          ...itemSair,
          item_pai_id: itemConta.id_menu_item,
        });
      }
    });

    itemConta.filhos.sort((a, b) => Number(a.ordem) - Number(b.ordem));
  }

  arvore.forEach((item) => {
    const acao = identificarAcao(item);

    // Sair é exibido dentro do menu da conta.
    if (acao === "sair") return;

    if (acao) {
      acoes.push(item);
    } else {
      menus.push(item);
    }
  });

  acoes.sort((a, b) => Number(a.ordem) - Number(b.ordem));
  menus.sort((a, b) => Number(a.ordem) - Number(b.ordem));

  return { menus, acoes };
}

// =====================================================
// SERVIÇO PRINCIPAL
// =====================================================

export async function buscarNavbar(): Promise<NavbarData> {
  console.group("[NAVBAR] Consultando estrutura da API...");

  try {
    console.log("[NAVBAR] Rota:", ROTAS.NAVBAR.ESTRUTURA);

    const response = await conexao.get<ApiResponse | ApiNavbarGrupo[]>(
      ROTAS.NAVBAR.ESTRUTURA,
    );

    const grupos = extrairGrupos(response.data);
    console.log("[NAVBAR] Grupos recebidos:", grupos);

    const gruposAtivos = grupos.filter(
      (grupo) => Boolean(grupo?.menu) && converterBooleano(grupo.menu.ativo),
    );

    // -------------------------------------------------
    // IDENTIDADE DA LOJA
    // -------------------------------------------------

    const grupoIdentidade = gruposAtivos.find((grupo) =>
      menuEhIdentidade(grupo.menu),
    );

    const tituloLoja =
      grupoIdentidade?.menu?.nome?.trim() || "Universo Império";

    // -------------------------------------------------
    // CABEÇALHO
    // -------------------------------------------------

    const gruposCabecalho = gruposAtivos.filter(
      (grupo) =>
        menuEhCabecalho(grupo.menu) &&
        !menuEhIdentidade(grupo.menu) &&
        !menuEhCategorias(grupo.menu),
    );

    const arvoreCabecalho = montarArvore(obterItensAtivos(gruposCabecalho));

    // -------------------------------------------------
    // CATEGORIAS
    // -------------------------------------------------

    const gruposCategorias = gruposAtivos.filter((grupo) =>
      menuEhCategorias(grupo.menu),
    );

    const arvoreCategorias = montarArvore(obterItensAtivos(gruposCategorias));

    // -------------------------------------------------
    // ORGANIZAR AÇÕES E LINKS
    // -------------------------------------------------

    const { menus, acoes } = organizarCabecalho(arvoreCabecalho);
    const itemConta = acoes.find((item) => identificarAcao(item) === "conta");

    console.log("[NAVBAR] Opções da conta:", itemConta?.filhos ?? []);

    const resultado: NavbarData = {
      tituloLoja,
      menus,
      categorias: arvoreCategorias,
      acoes,
    };

    console.log("[NAVBAR] Estrutura organizada:", resultado);
    console.table({
      tituloLoja,
      quantidadeMenus: menus.length,
      quantidadeCategorias: arvoreCategorias.length,
      quantidadeAcoes: acoes.length,
      quantidadeOpcoesConta: itemConta?.filhos.length ?? 0,
    });

    return resultado;
  } catch (erro) {
    console.error("[NAVBAR] Erro ao buscar navegação:", erro);
    throw erro;
  } finally {
    console.groupEnd();
  }
}
