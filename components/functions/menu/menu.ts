import { PainelApi } from "@/services/api/api";
import { AxiosRequestConfig, AxiosResponse } from "axios";

export type SidebarChild = {
  url: string;
  label: string;
};

export type SidebarItem = {
  url?: string;
  label: string;
  icon?: string;
  children?: SidebarChild[];
};

type MenuChildApi = {
  url?: string;
  rota?: string;
  path?: string;
  href?: string;
  slug?: string;
  label?: string;
  nome?: string;
  titulo?: string;
};

type MenuItemApi = {
  url?: string;
  rota?: string;
  path?: string;
  href?: string;
  slug?: string;
  label?: string;
  nome?: string;
  titulo?: string;
  icon?: string;
  icone?: string;
  children?: MenuChildApi[] | Record<string, MenuChildApi>;
  filhos?: MenuChildApi[] | Record<string, MenuChildApi>;
  itens?: MenuChildApi[] | Record<string, MenuChildApi>;
};

type MenuApiResponse = {
  status?: number;
  mensagem?: string;
  dados?: {
    status?: number;
    mensagem?: string;
    dados?: {
      sidebar?: MenuItemApi[] | Record<string, MenuItemApi>;
      menu?: MenuItemApi[] | Record<string, MenuItemApi>;
      menus?: MenuItemApi[] | Record<string, MenuItemApi>;
      itens?: MenuItemApi[] | Record<string, MenuItemApi>;
    };
    sidebar?: MenuItemApi[] | Record<string, MenuItemApi>;
    menu?: MenuItemApi[] | Record<string, MenuItemApi>;
    menus?: MenuItemApi[] | Record<string, MenuItemApi>;
    itens?: MenuItemApi[] | Record<string, MenuItemApi>;
  };
  data?: {
    sidebar?: MenuItemApi[] | Record<string, MenuItemApi>;
    menu?: MenuItemApi[] | Record<string, MenuItemApi>;
    menus?: MenuItemApi[] | Record<string, MenuItemApi>;
    itens?: MenuItemApi[] | Record<string, MenuItemApi>;
  };
  sidebar?: MenuItemApi[] | Record<string, MenuItemApi>;
  menu?: MenuItemApi[] | Record<string, MenuItemApi>;
  menus?: MenuItemApi[] | Record<string, MenuItemApi>;
  itens?: MenuItemApi[] | Record<string, MenuItemApi>;
};

function limparTexto(valor?: string | null): string | undefined {
  if (typeof valor !== "string") return undefined;

  const texto = valor.trim();

  if (!texto) return undefined;
  if (texto === "#") return undefined;
  if (texto.toLowerCase() === "null") return undefined;
  if (texto.toLowerCase() === "undefined") return undefined;

  return texto;
}

function normalizarRota(url?: string): string | undefined {
  const rota = limparTexto(url);
  if (!rota) return undefined;

  let rotaFinal = rota;

  if (!rotaFinal.startsWith("/")) {
    rotaFinal = `/${rotaFinal}`;
  }

  rotaFinal = rotaFinal.replace(/\/{2,}/g, "/");

  if (rotaFinal === "/painel") return "/Admin";

  if (rotaFinal.startsWith("/painel/")) {
    return rotaFinal.replace(/^\/painel/i, "/Admin");
  }

  if (rotaFinal === "/admin") return "/Admin";

  if (rotaFinal.startsWith("/admin/")) {
    return rotaFinal.replace(/^\/admin/i, "/Admin");
  }

  return rotaFinal;
}

function obterUrl(item?: {
  url?: string;
  rota?: string;
  path?: string;
  href?: string;
  slug?: string;
}): string | undefined {
  return normalizarRota(
    limparTexto(item?.url) ||
      limparTexto(item?.rota) ||
      limparTexto(item?.path) ||
      limparTexto(item?.href) ||
      limparTexto(item?.slug)
  );
}

function obterLabel(item?: {
  label?: string;
  nome?: string;
  titulo?: string;
}): string {
  return (
    limparTexto(item?.label) ||
    limparTexto(item?.nome) ||
    limparTexto(item?.titulo) ||
    "Sem nome"
  );
}

function transformarEmArray<T>(valor?: T[] | Record<string, T>): T[] {
  if (!valor) return [];

  if (Array.isArray(valor)) return valor;

  if (typeof valor === "object") return Object.values(valor);

  return [];
}

function normalizarChildren(
  children?: MenuChildApi[] | Record<string, MenuChildApi>
): SidebarChild[] {
  const lista = transformarEmArray(children);

  console.log("[menu.ts] children bruto:", children);
  console.log("[menu.ts] children em array:", lista);

  if (!Array.isArray(lista) || lista.length === 0) return [];

  const itens: SidebarChild[] = [];

  for (const child of lista) {
    const url = obterUrl(child);
    const label = obterLabel(child);

    console.log("[menu.ts] child analisado:", child);
    console.log("[menu.ts] child url:", url);
    console.log("[menu.ts] child label:", label);

    if (!url) continue;

    itens.push({
      url,
      label,
    });
  }

  console.log("[menu.ts] children normalizado:", itens);

  return itens;
}

export function normalizarMenu(
  sidebar?: MenuItemApi[] | Record<string, MenuItemApi>
): SidebarItem[] {
  const lista = transformarEmArray(sidebar);

  console.log("[menu.ts] sidebar bruto:", sidebar);
  console.log("[menu.ts] sidebar em array:", lista);

  if (!Array.isArray(lista) || lista.length === 0) return [];

  const itens: SidebarItem[] = [];

  for (const item of lista) {
    const childrenBrutos = item.children || item.filhos || item.itens;
    const children = normalizarChildren(childrenBrutos);
    const url = obterUrl(item);
    const label = obterLabel(item);
    const icon = limparTexto(item.icon) || limparTexto(item.icone);

    console.log("[menu.ts] item analisado:", item);
    console.log("[menu.ts] item url:", url);
    console.log("[menu.ts] item label:", label);
    console.log("[menu.ts] item icon:", icon);
    console.log("[menu.ts] item children:", children);

    if (!url && children.length === 0) {
      console.log("[menu.ts] item ignorado por não ter url e nem children:", item);
      continue;
    }

    itens.push({
      url,
      label,
      icon,
      children,
    });
  }

  console.log("[menu.ts] menu normalizado final:", itens);

  return itens;
}

function extrairSidebar(
  data?: MenuApiResponse
): MenuItemApi[] | Record<string, MenuItemApi> | undefined {
  if (!data) return [];

  const sidebarExtraido =
    data.dados?.dados?.sidebar ||
    data.dados?.dados?.menu ||
    data.dados?.dados?.menus ||
    data.dados?.dados?.itens ||
    data.dados?.sidebar ||
    data.data?.sidebar ||
    data.dados?.menu ||
    data.data?.menu ||
    data.dados?.menus ||
    data.data?.menus ||
    data.sidebar ||
    data.menu ||
    data.menus ||
    data.dados?.itens ||
    data.data?.itens ||
    data.itens ||
    [];

  console.log("[menu.ts] resposta completa da API:", data);
  console.log("[menu.ts] data.dados:", data?.dados);
  console.log("[menu.ts] data.dados?.dados:", data?.dados?.dados);
  console.log("[menu.ts] sidebar extraído:", sidebarExtraido);

  return sidebarExtraido;
}

export async function buscarMenuPainel(
  config?: AxiosRequestConfig
): Promise<SidebarItem[]> {
  try {
    const response: AxiosResponse<MenuApiResponse> = await PainelApi.get(
      "/dados",
      config
    );

    console.log("[menu.ts] response status:", response.status);
    console.log("[menu.ts] response completa:", response);
    console.log("[menu.ts] response.data:", response.data);

    const sidebarBruto = extrairSidebar(response.data);
    const menuNormalizado = normalizarMenu(sidebarBruto);

    console.log("[menu.ts] sidebar bruto final:", sidebarBruto);
    console.log("[menu.ts] menu normalizado retornado:", menuNormalizado);

    return menuNormalizado;
  } catch (error: any) {
    console.error("[menu.ts] erro ao buscar menu:", error);
    console.error("[menu.ts] error.response:", error?.response);
    console.error("[menu.ts] error.response.data:", error?.response?.data);
    throw error;
  }
}