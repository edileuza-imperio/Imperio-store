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
  children?: MenuChildApi[];
  filhos?: MenuChildApi[];
  itens?: MenuChildApi[];
};

type MenuApiResponse = {
  dados?: {
    sidebar?: MenuItemApi[];
    menu?: MenuItemApi[];
    menus?: MenuItemApi[];
    itens?: MenuItemApi[];
  };
  data?: {
    sidebar?: MenuItemApi[];
    menu?: MenuItemApi[];
    menus?: MenuItemApi[];
    itens?: MenuItemApi[];
  };
  sidebar?: MenuItemApi[];
  menu?: MenuItemApi[];
  menus?: MenuItemApi[];
  itens?: MenuItemApi[];
  mensagem?: string;
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

function normalizarChildren(children?: MenuChildApi[]): SidebarChild[] {
  if (!Array.isArray(children)) return [];

  const itens: SidebarChild[] = [];

  for (const child of children) {
    const url = obterUrl(child);
    const label = obterLabel(child);

    if (!url) continue;

    itens.push({
      url,
      label,
    });
  }

  return itens;
}

export function normalizarMenu(sidebar?: MenuItemApi[]): SidebarItem[] {
  if (!Array.isArray(sidebar)) return [];

  const itens: SidebarItem[] = [];

  for (const item of sidebar) {
    const childrenBrutos = item.children || item.filhos || item.itens || [];
    const children = normalizarChildren(childrenBrutos);
    const url = obterUrl(item);
    const label = obterLabel(item);
    const icon = limparTexto(item.icon) || limparTexto(item.icone);

    // mantém grupos com filhos mesmo sem url
    if (!url && children.length === 0) {
      continue;
    }

    itens.push({
      url,
      label,
      icon,
      children,
    });
  }

  return itens;
}

function extrairSidebar(data?: MenuApiResponse): MenuItemApi[] {
  if (!data) return [];

  return (
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
    []
  );
}

export async function buscarMenuPainel(
  config?: AxiosRequestConfig
): Promise<SidebarItem[]> {
  const response: AxiosResponse<MenuApiResponse> = await PainelApi.get(
    "/dados",
    config
  );

  const sidebar = extrairSidebar(response.data);

  return normalizarMenu(sidebar);
}