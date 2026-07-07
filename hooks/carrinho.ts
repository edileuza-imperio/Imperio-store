import api from "@/Api/conectar";


import { temValor } from "@/hooks/destaque/functions";

/**
 * Adiciona produto no carrinho (API)
 */

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