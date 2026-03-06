import api from "@/Api/conectar";

export function getImagemUrl(caminho?: string) {
  if (!caminho) return "";
  const base = api.defaults.baseURL || "";
  const clean = String(caminho).replace(/^\/+/, "");
  return `${base}/${clean}`;
}

export function formatMoney(value: any) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function isImagePath(src?: string) {
  if (!src) return false;
  const s = src.toLowerCase().trim();
  if (s.startsWith("upload/") || s.startsWith("/upload/")) return true;
  return /\.(png|jpe?g|webp|gif|svg)$/.test(s);
}

export function truncate(s: string, max = 85) {
  const t = (s ?? "").trim();
  if (!t) return "";
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trim() + "…";
}