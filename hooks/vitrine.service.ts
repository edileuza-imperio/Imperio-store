import { useRef } from "react";

export function useCarouselRef() {
  return useRef<HTMLDivElement | null>(null);
}
export function useAutoplayRef() {
  const autoplayRef = useRef<number | null>(null);
  return autoplayRef;
}