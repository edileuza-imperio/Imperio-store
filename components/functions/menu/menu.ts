import { PainelApi } from "@/services/api/api";

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

type MenuApiResponse = {
  dados?: {
    sidebar?: Array<{
      url?: string;
      label?: string;
      nome?: string;
      icon?: string;
      icone?: string;
      children?: Array<{
        url?: string;
        rota?: string;
        label?: string;
        nome?: string;
      }>;
    }>;
  };
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

function normalizarChildren(
  children?: Array<{
    url?: string;
    rota?: string;
    label?: string;
    nome?: string;
  }>
): SidebarChild[] {
  if (!Array.isArray(children)) return [];

  return children
    .map((child) => {
      const url = limparTexto(child.url) || limparTexto(child.rota);
      const label = limparTexto(child.label) || limparTexto(child.nome) || "Sem nome";

      if (!url) return null;

      return {
        url,
        label,
      };
    })
    .filter((child): child is SidebarChild => child !== null);
}

export function normalizarMenu(
  sidebar?: Array<{
    url?: string;
    label?: string;
    nome?: string;
    icon?: string;
    icone?: string;
    children?: Array<{
      url?: string;
      rota?: string;
      label?: string;
      nome?: string;
    }>;
  }>
): SidebarItem[] {
  if (!Array.isArray(sidebar)) return [];

  return sidebar.map((item) => ({
    url: limparTexto(item.url),
    label: limparTexto(item.label) || limparTexto(item.nome) || "Sem nome",
    icon: limparTexto(item.icon) || limparTexto(item.icone),
    children: normalizarChildren(item.children),
  }));
}

export async function buscarMenuPainel(): Promise<SidebarItem[]> {
  const response = await PainelApi.get<MenuApiResponse>("/dados");
  return normalizarMenu(response.data?.dados?.sidebar);
}