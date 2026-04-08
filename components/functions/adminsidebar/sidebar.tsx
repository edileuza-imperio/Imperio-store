import { PainelApi } from "@/services/api/api";

export type CardAcao = {
  tipo: string;
  icone: string;
  url: string;
};

export type DashboardCard = {
  titulo: string;
  valor: number;
  icone?: string;
  acoes?: CardAcao[];
};

export type DashboardCardsResponse = {
  dados?: {
    dados?: {
      cards?: DashboardCard[];
    };
  };
  mensagem?: string;
};

export async function buscarCardsPainel(): Promise<DashboardCard[]> {
  const response = await PainelApi.get<DashboardCardsResponse>("/dados/cards");
  const data = response.data;

  return data?.dados?.dados?.cards || [];
}

export function renderIcon(icon?: string) {
  switch (icon) {
    case "settings":
      return "⚙";
    case "plus":
      return "+";
    case "eye":
      return "👁";
    case "box":
      return "📦";
    case "tag":
      return "🏷";
    case "users":
      return "👥";
    default:
      return "■";
  }
}