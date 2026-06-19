import api from "@/Api/conectar";

export type TipoItem = "produto" | "campanha";

export type Campanha = {
  id_campanha?: number;
  idCampanha?: number;
  id?: number;
  titulo?: string;
  nome?: string;
  slug?: string;
  descricao?: string | null;
  banner?: string | null;
  status_id?: number;
  statusid?: number;
};

export type Produto = {
  id_produto?: number;
  idProduto?: number;
  id?: number;
  nome?: string;
  titulo?: string;
  slug?: string;
  descricao?: string | null;
  imagem?: string | null;
  status_id?: number;
  statusid?: number;
};

function normalizarLista(data: any, chave: string) {
  if (Array.isArray(data?.dados?.[chave])) {
    return data.dados[chave];
  }

  if (Array.isArray(data?.[chave])) {
    return data[chave];
  }

  if (Array.isArray(data?.dados)) {
    return data.dados;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}

export async function buscarCampanhas(): Promise<Campanha[]> {
  const response = await api.get("/painel/campanhas");

  return normalizarLista(
    response.data,
    "campanhas"
  );
}

export async function buscarProdutos(): Promise<Produto[]> {
  const response = await api.get("/painel/produtos");

  return normalizarLista(
    response.data,
    "produtos"
  );
}

export async function adicionarItemNaVitrine(params: {
  vitrineId: string | number;
  itemId: number;
  tipo: TipoItem;
}) {
  const {
    vitrineId,
    itemId,
    tipo,
  } = params;

  return api.post(
    `/painel/vitrine/${vitrineId}/item`,
    {
      produto_id:
        tipo === "produto"
          ? itemId
          : null,

      campanha_id:
        tipo === "campanha"
          ? itemId
          : null,

      categoria_id: null,
      status_id: 1,
      nivel_id: 1,
    }
  );
}

export async function adicionarItensNaVitrine(params: {
  vitrineId: string | number;
  selecionadas: number[];
  tipo: TipoItem;
}) {
  const {
    vitrineId,
    selecionadas,
    tipo,
  } = params;

  await Promise.all(
    selecionadas.map((itemId) =>
      adicionarItemNaVitrine({
        vitrineId,
        itemId,
        tipo,
      })
    )
  );
}

export function getCampanhaId(
  campanha: Campanha
) {
  return Number(
    campanha.id_campanha ??
      campanha.idCampanha ??
      campanha.id ??
      0
  );
}

export function getProdutoId(
  produto: Produto
) {
  return Number(
    produto.id_produto ??
      produto.idProduto ??
      produto.id ??
      0
  );
}

export function getCampanhaTitulo(
  campanha: Campanha
) {
  return (
    campanha.titulo ||
    campanha.nome ||
    "Campanha sem título"
  );
}

export function getProdutoTitulo(
  produto: Produto
) {
  return (
    produto.nome ||
    produto.titulo ||
    "Produto sem nome"
  );
}

export function getStatusId(
  item: Campanha | Produto
) {
  return Number(
    item.status_id ??
      item.statusid ??
      1
  );
}

export function filtrarCampanhas(
  campanhas: Campanha[],
  busca: string
) {
  const termo = busca
    .trim()
    .toLowerCase();

  if (!termo) {
    return campanhas;
  }

  return campanhas.filter(
    (campanha) => {
      const texto = `
        ${campanha.titulo || ""}
        ${campanha.nome || ""}
        ${campanha.slug || ""}
        ${campanha.descricao || ""}
      `.toLowerCase();

      return texto.includes(
        termo
      );
    }
  );
}

export function filtrarProdutos(
  produtos: Produto[],
  busca: string
) {
  const termo = busca
    .trim()
    .toLowerCase();

  if (!termo) {
    return produtos;
  }

  return produtos.filter(
    (produto) => {
      const texto = `
        ${produto.nome || ""}
        ${produto.titulo || ""}
        ${produto.slug || ""}
        ${produto.descricao || ""}
      `.toLowerCase();

      return texto.includes(
        termo
      );
    }
  );
}