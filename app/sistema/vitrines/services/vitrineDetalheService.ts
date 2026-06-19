import api from "@/Api/conectar";

const PAINEL = "/painel";

export type Vitrine = {
  id_vitrine: number;
  nome: string;
  slug: string;
  titulo?: string | null;
  subtitulo?: string | null;
  tipo?: string | null;
  status_id: number;
  nivel_id?: number;
  ordem?: number;
  criado_em?: string | null;
  atualizado_em?: string | null;
};

export type ProdutoResumo = {
  id_produto?: number;
  nome?: string;
  descricao?: string;
  preco?: number | string;
  imagem?: string | null;
  miniatura?: string | null;
  slug?: string;
  marca?: string;
};

export type VitrineItem = {
  id_vitrine_item: number;
  vitrine_id: number;
  produto_id?: number | null;
  campanha_id?: number | null;
  categoria_id?: number | null;
  titulo_personalizado?: string | null;
  subtitulo_personalizado?: string | null;
  imagem_personalizada?: string | null;
  status_id: number;
  nivel_id?: number;
  criado_em?: string | null;
  atualizado_em?: string | null;

  produto_nome?: string | null;
  produto_descricao?: string | null;
  produto_preco?: number | string | null;
  produto_imagem?: string | null;
  produto_slug?: string | null;

  campanha_nome?: string | null;
  campanha_titulo?: string | null;
  campanha_descricao?: string | null;
  campanha_slug?: string | null;

  categoria_nome?: string | null;
};

export function normalizarTexto(texto?: string | null) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export async function buscarVitrine(id: string | number): Promise<Vitrine | null> {
  const response = await api.get(`${PAINEL}/vitrine/${id}`);
  const data = response.data;

  return data?.dados?.vitrine ?? data?.vitrine ?? data?.dados ?? data ?? null;
}

export async function buscarItensVitrine(
  id: string | number
): Promise<VitrineItem[]> {
  const response = await api.get(`${PAINEL}/vitrine/${id}/itens`);
  const data = response.data;

  if (Array.isArray(data?.dados?.itens)) return data.dados.itens;
  if (Array.isArray(data?.itens)) return data.itens;
  if (Array.isArray(data?.dados)) return data.dados;
  if (Array.isArray(data)) return data;

  return [];
}

export async function buscarProdutoPorId(
  produtoId: number
): Promise<ProdutoResumo | null> {
  const response = await api.get(`${PAINEL}/produto/${produtoId}`);
  const data = response.data?.dados ?? response.data;

  return data?.produto ?? data ?? null;
}

export async function buscarItensVitrineComProdutos(
  id: string | number
): Promise<VitrineItem[]> {
  const itens = await buscarItensVitrine(id);

  return Promise.all(
    itens.map(async (item) => {
      if (!item.produto_id) return item;

      try {
        const produto = await buscarProdutoPorId(Number(item.produto_id));

        return {
          ...item,
          produto_nome: produto?.nome ?? item.produto_nome ?? null,
          produto_descricao:
            produto?.descricao ?? item.produto_descricao ?? null,
          produto_preco: produto?.preco ?? item.produto_preco ?? null,
          produto_imagem:
            produto?.miniatura ??
            produto?.imagem ??
            item.produto_imagem ??
            item.imagem_personalizada ??
            null,
          produto_slug: produto?.slug ?? item.produto_slug ?? null,
          subtitulo_personalizado:
            item.subtitulo_personalizado ||
            produto?.descricao ||
            item.produto_descricao ||
            null,
        };
      } catch (error) {
        console.error("Erro ao buscar produto da vitrine:", error);
        return item;
      }
    })
  );
}

export async function removerItemVitrine(itemId: number) {
  return api.delete(`${PAINEL}/vitrine/item/${itemId}`);
}

export function ehVitrineCampanha(vitrine?: Vitrine | null) {
  const tipo = normalizarTexto(vitrine?.tipo);

  return tipo === "campanha" || tipo.includes("campanha");
}

export function formatarData(data?: string | null) {
  if (!data) return "—";

  const dataConvertida = new Date(data.replace(" ", "T"));

  if (Number.isNaN(dataConvertida.getTime())) return data;

  return dataConvertida.toLocaleString("pt-BR");
}

export function formatarPreco(valor?: number | string | null) {
  if (valor === null || valor === undefined || valor === "") return null;

  const numero = Number(String(valor).replace(",", "."));

  if (Number.isNaN(numero)) return null;

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function statusTexto(statusId?: number) {
  return Number(statusId) === 1 ? "Ativo" : "Inativo";
}

export function nomeDoItem(item: VitrineItem) {
  return (
    item.titulo_personalizado ||
    item.produto_nome ||
    item.campanha_titulo ||
    item.campanha_nome ||
    item.categoria_nome ||
    "Item da vitrine"
  );
}

export function descricaoDoItem(item: VitrineItem, tipoSingular: string) {
  return (
    item.subtitulo_personalizado ||
    item.produto_descricao ||
    item.campanha_descricao ||
    `Sem descrição personalizada para este ${tipoSingular}.`
  );
}

export function tipoDoItem(item: VitrineItem) {
  if (item.produto_id) return "Produto";
  if (item.campanha_id) return "Campanha";
  if (item.categoria_id) return "Categoria";

  return "Item";
}