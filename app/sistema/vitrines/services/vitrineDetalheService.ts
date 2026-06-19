import api from "@/Api/conectar";

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
  categoria_nome?: string | null;
};

export function normalizarTexto(texto?: string | null) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function extrairDados(response: any) {
  return response?.data?.dados ?? response?.data ?? null;
}

export async function buscarVitrine(id: string | number): Promise<Vitrine | null> {
  const response = await api.get(`/vitrine/${id}`);

  const data = response.data;

  return (
    data?.dados?.vitrine ??
    data?.vitrine ??
    data?.dados ??
    data ??
    null
  );
}

export async function buscarItensVitrine(
  id: string | number
): Promise<VitrineItem[]> {
  const response = await api.get(`/vitrine/${id}/itens`);

  const data = response.data;

  const lista = Array.isArray(data?.dados?.itens)
    ? data.dados.itens
    : Array.isArray(data?.itens)
      ? data.itens
      : Array.isArray(data?.dados)
        ? data.dados
        : Array.isArray(data)
          ? data
          : [];

  return lista;
}

export async function buscarProdutoPorId(
  produtoId: number
): Promise<ProdutoResumo | null> {
  const response = await api.get(`/produto/${produtoId}`);

  const data = response.data?.dados ?? response.data;

  return data?.produto ?? data ?? null;
}

export async function buscarItensVitrineComProdutos(
  id: string | number
): Promise<VitrineItem[]> {
  const itens = await buscarItensVitrine(id);

  const itensComProdutos = await Promise.all(
    itens.map(async (item) => {
      if (!item.produto_id) {
        return item;
      }

      try {
        const produto = await buscarProdutoPorId(Number(item.produto_id));

        return {
          ...item,
          produto_nome: produto?.nome ?? item.produto_nome ?? null,
          produto_descricao: produto?.descricao ?? null,
          produto_preco: produto?.preco ?? null,
          produto_imagem:
            produto?.miniatura ??
            produto?.imagem ??
            item.imagem_personalizada ??
            null,
          produto_slug: produto?.slug ?? null,
          subtitulo_personalizado:
            item.subtitulo_personalizado || produto?.descricao || null,
        };
      } catch {
        return item;
      }
    })
  );

  return itensComProdutos;
}

export async function removerItemVitrine(itemId: number) {
  return api.delete(`/vitrine/item/${itemId}`);
}

export function ehVitrineCampanha(vitrine?: Vitrine | null) {
  const texto = `
    ${normalizarTexto(vitrine?.tipo)}
    ${normalizarTexto(vitrine?.nome)}
    ${normalizarTexto(vitrine?.slug)}
    ${normalizarTexto(vitrine?.titulo)}
  `;

  return texto.includes("campanha");
}

export function formatarData(data?: string | null) {
  if (!data) return "—";

  const dataConvertida = new Date(data.replace(" ", "T"));

  if (Number.isNaN(dataConvertida.getTime())) {
    return data;
  }

  return dataConvertida.toLocaleString("pt-BR");
}

export function formatarPreco(valor?: number | string | null) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  const numero = Number(String(valor).replace(",", "."));

  if (Number.isNaN(numero)) {
    return null;
  }

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
    item.campanha_nome ||
    item.categoria_nome ||
    "Item da vitrine"
  );
}

export function descricaoDoItem(item: VitrineItem, tipoSingular: string) {
  return (
    item.subtitulo_personalizado ||
    item.produto_descricao ||
    `Sem descrição personalizada para este ${tipoSingular}.`
  );
}

export function tipoDoItem(item: VitrineItem) {
  if (item.produto_id) return "Produto";
  if (item.campanha_id) return "Campanha";
  if (item.categoria_id) return "Categoria";
  return "Item";
}