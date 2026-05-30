import api from "@/Api/conectar";
import type { ItemResolvido } from "@/components/Bibioteca/Bibiotecas";
import { temValor } from "@/hooks/destaque/functions";

/**
 * Adiciona produto no carrinho (API)
 */
export async function adicionarNoCarrinhoBanco(item: ItemResolvido) {
  if (item.tipo_item !== "produto" || !item.produto_id) return;

  const precoBase = temValor(item.preco_original)
    ? Number(item.preco_original)
    : Number(item.preco_final || 0);

  const precoPromocional = temValor(item.preco_original)
    ? Number(item.preco_final || 0)
    : null;

  await api.post(
    "/carrinho/adicionar",
    {
      produto_id: Number(item.produto_id),
      quantidade: 1,
      preco: Number.isNaN(precoBase) ? 0 : precoBase,
      preco_promocional:
        precoPromocional !== null && !Number.isNaN(precoPromocional)
          ? precoPromocional
          : null,
    },
    { withCredentials: true }
  );
}

export function moverCarousel(
  carousel: HTMLDivElement | null,
  direcao: "prev" | "next"
) {
  if (!carousel) return;

  const card = carousel.querySelector<HTMLElement>(".destaque-card");
  const larguraCard = card?.offsetWidth || 280;
  const gap = 18;
  const distancia = larguraCard + gap;

  const { scrollLeft, scrollWidth, clientWidth } = carousel;
  const maxScroll = scrollWidth - clientWidth;

  if (direcao === "next") {
    if (scrollLeft >= maxScroll - 8) {
      carousel.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      carousel.scrollBy({ left: distancia, behavior: "smooth" });
    }
  } else {
    if (scrollLeft <= 8) {
      carousel.scrollTo({ left: maxScroll, behavior: "smooth" });
    } else {
      carousel.scrollBy({ left: -distancia, behavior: "smooth" });
    }
  }
}