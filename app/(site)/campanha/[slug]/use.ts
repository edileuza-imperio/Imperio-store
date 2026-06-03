import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";

export type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string | null;
  banner?: string | null;
  imagem?: string | null;
  desktop?: string | null;
  mobile?: string | null;
  foto?: string | null;
  inicio?: string | null;
  fim?: string | null;
};

export type Produto = {
  id_produto: number;
  nome: string;
  descricao?: string | null;
  imagem?: string | null;
  preco?: number;
  slug?: string;
};

export function extrairDados(payload: any) {
  return (
    payload?.dados?.dados ??
    payload?.dados ??
    payload ??
    null
  );
}

export function resolverImagem(
  src?: string | null
) {
  if (!src) return "";

  const valor = String(src).trim();

  if (!valor) return "";

  if (
    valor.startsWith("http://") ||
    valor.startsWith("https://") ||
    valor.startsWith("data:image") ||
    valor.startsWith("blob:")
  ) {
    return valor;
  }

  const baseURL =
    typeof api === "string"
      ? api
      : (api as any)?.defaults?.baseURL || "";

  if (!baseURL) return valor;

  return valor.startsWith("/")
    ? `${baseURL}${valor}`
    : `${baseURL}/${valor}`;
}

export function obterImagemCampanha(
  campanha?: Campanha | null
) {
  return resolverImagem(
    campanha?.banner ||
      campanha?.imagem ||
      campanha?.desktop ||
      campanha?.mobile ||
      campanha?.foto
  );
}

export function formatDateBR(
  value?: string | null
) {
  if (!value) return "";

  const data = new Date(value);

  if (Number.isNaN(data.getTime())) {
    return "";
  }

  return data.toLocaleDateString("pt-BR");
}

export function useCampanha(
  slug?: string
) {
  const [campanha, setCampanha] =
    useState<Campanha | null>(null);

  const [produtos, setProdutos] =
    useState<Produto[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    async function carregar() {
      try {
        setLoading(true);

        const campanhaResponse =
          await api.get(
            `/campanha/slug/${slug}`,
            {
              withCredentials: true,
            }
          );

        const campanhaDados =
          extrairDados(
            campanhaResponse.data
          );

        const campanhaNormalizada =
          campanhaDados
            ? {
                id_campanha:
                  campanhaDados.id_campanha,
                titulo:
                  campanhaDados.titulo,
                slug:
                  campanhaDados.slug,
                descricao:
                  campanhaDados.descricao ??
                  null,
                banner:
                  campanhaDados.banner ??
                  null,
                imagem:
                  campanhaDados.imagem ??
                  null,
                desktop:
                  campanhaDados.desktop ??
                  null,
                mobile:
                  campanhaDados.mobile ??
                  null,
                foto:
                  campanhaDados.foto ??
                  null,
                inicio:
                  campanhaDados.inicio ??
                  null,
                fim:
                  campanhaDados.fim ??
                  null,
              }
            : null;

        setCampanha(
          campanhaNormalizada
        );

        if (
          !campanhaNormalizada?.id_campanha
        ) {
          setProdutos([]);
          return;
        }

        const produtosResponse =
          await api.get(
            `/campanha/${campanhaNormalizada.id_campanha}/produtos`
          );

        const produtosDados =
          extrairDados(
            produtosResponse.data
          );

        const listaProdutos =
          Array.isArray(
            produtosDados
          )
            ? produtosDados.map(
                (item: any) => {
                  const produto =
                    item?.produto ||
                    {};

                  return {
                    id_produto:
                      produto.id_produto ??
                      item.produto_id,

                    nome:
                      produto.nome || "",

                    descricao:
                      produto.descricao ??
                      null,

                    imagem:
                      produto.imagem ??
                      null,

                    preco: Number(
                      String(
                        produto.preco ||
                          produto[
                            "preço"
                          ] ||
                          0
                      ).replace(",", ".")
                    ),

                    slug:
                      produto.slug ||
                      produto.lesma ||
                      "",
                  };
                }
              )
            : [];

        setProdutos(
          listaProdutos
        );
      } catch (error) {
        console.error(error);

        setCampanha(null);
        setProdutos([]);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [slug]);

  const bannerImg = useMemo(
    () =>
      obterImagemCampanha(
        campanha
      ),
    [campanha]
  );

  const inicio = formatDateBR(
    campanha?.inicio
  );

  const fim = formatDateBR(
    campanha?.fim
  );

  const periodo =
    inicio && fim
      ? `${inicio} até ${fim}`
      : inicio ||
        fim ||
        "Sem período definido";

  return {
    campanha,
    produtos,
    loading,
    bannerImg,
    periodo,
  };
}