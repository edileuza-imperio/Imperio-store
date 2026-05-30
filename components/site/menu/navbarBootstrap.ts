import api from "@/Api/conectar";

export type BootstrapNavbar = {
  menus?: any[];
  site?: any;
  categorias?: any[];
  usuario?: any;
  carrinho_total?: number;
};

export async function getNavbarBootstrap(): Promise<BootstrapNavbar> {
  const res = await api.get("/bootstrap/navbar");

  return res.data?.dados?.dados ?? res.data?.dados ?? {};
}