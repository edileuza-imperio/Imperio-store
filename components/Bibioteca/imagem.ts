import api from "@/Api/conectar";

const BASE_URL = api.defaults.baseURL || "";

export function imagemFundo(src?: string | null) {
  if (!src) return "";

  const valor = String(src).trim();

  if (!valor) return "";

  // já é url absoluta
  if (
    valor.startsWith("http://") ||
    valor.startsWith("https://") ||
    valor.startsWith("blob:") ||
    valor.startsWith("data:image")
  ) {
    return valor;
  }

  // garante sem duplicar barras
  const caminho = valor.replace(/^\/+/, "");

  return `${BASE_URL}/${caminho}`;
}