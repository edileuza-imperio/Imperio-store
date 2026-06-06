
import { imagemFundo } from "@/components/Bibioteca/imagem";
import { EntidadeGenerica, ItemResolvido, VitrineItem } from "@/components/Vitrine/Destaques/useVitrine";

export function normalizarDados<T = any>(payload: any): T | null {
  return payload?.dados?.dados ?? payload?.dados ?? payload ?? null;
}

export function normalizarLista<T = any>(payload: any): T[] {
  const dados = payload?.dados?.dados ?? payload?.dados ?? payload ?? [];
  return Array.isArray(dados) ? dados : [];
}

export function obterMelhorImagem(
  item?: VitrineItem | null,
  entidade?: EntidadeGenerica | null
) {
  return imagemFundo(
    item?.imagem_personalizada ||
      entidade?.imagem ||
      entidade?.miniatura ||
      entidade?.banner ||
      entidade?.foto ||
      entidade?.desktop ||
      entidade?.mobile ||
      ""
  );
}

export function formatarPreco(valor?: number | string | null) {
  if (valor === null || valor === undefined || valor === "") return null;

  const numero = Number(valor);
  if (Number.isNaN(numero)) return null;

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function calcularEconomia(
  precoOriginal?: number | string | null,
  precoFinal?: number | string | null
) {
  const original = Number(precoOriginal);
  const final = Number(precoFinal);

  if (
    precoOriginal === null ||
    precoOriginal === undefined ||
    precoFinal === null ||
    precoFinal === undefined ||
    Number.isNaN(original) ||
    Number.isNaN(final) ||
    original <= 0 ||
    final <= 0 ||
    final >= original
  ) {
    return null;
  }

  const percentual = Math.round(((original - final) / original) * 100);
  return `${percentual}% OFF`;
}
export function descobrirTipoItem(
  item: VitrineItem,
  tipoVitrine?: string
): ItemResolvido["tipo_item"] {
  if (item.produto_id) return "produto";
  if (item.campanha_id) return "campanha";
  if (item.categoria_id) return "categoria";

  const tipo = String(tipoVitrine || "").toLowerCase();
  if (tipo === "banner") return "banner";

  return "custom";
}
export function temValor(valor: unknown) {
  return valor !== null && valor !== undefined && String(valor).trim() !== "";
}