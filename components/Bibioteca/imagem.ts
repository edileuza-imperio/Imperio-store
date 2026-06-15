const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL || "";

export function imagemFundo(src?: string | null) {
  if (!src) return "";

  const valor = String(src).trim();

  if (!valor) return "";

  if (
    valor.startsWith("http://") ||
    valor.startsWith("https://") ||
    valor.startsWith("blob:") ||
    valor.startsWith("data:image")
  ) {
    return valor;
  }

  const base = UPLOAD_URL.replace(/\/+$/, "");
  const caminho = valor.replace(/^\/+/, "");

  return `${base}/${caminho}`;
}