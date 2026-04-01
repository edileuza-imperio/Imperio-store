import api from "@/Api/conectar";
import { PedidoApi } from "./pedidos";
import { EnderecoDB } from "./Bibiotecas";

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

export function toNumber(v: any): number {
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(d?: string) {
  if (!d) return "-";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("pt-BR");
}

export function resolveStatus(
  p: Partial<PedidoApi>
): { label: string; tone: "ok" | "warn" | "info" | "brand" | "danger" } {
  const s = String(p.status_nome ?? p.status ?? p.status_codigo ?? "")
    .trim()
    .toLowerCase();

  const id = Number(p.statusid ?? p.status_id ?? 0);

  if (s.includes("cancel")) return { label: "Cancelado", tone: "danger" };
  if (s.includes("entreg")) return { label: "Entregue", tone: "brand" };
  if (s.includes("envi")) return { label: "Enviado", tone: "info" };
  if (s.includes("prepar")) return { label: "Preparando", tone: "info" };
  if (s.includes("aprov")) return { label: "Pagamento aprovado", tone: "ok" };
  if (s.includes("pend")) return { label: "Pagamento pendente", tone: "warn" };
  if (s.includes("criad")) return { label: "Pedido criado", tone: "brand" };

  if (id === 10) return { label: "Pedido criado", tone: "brand" };
  if (id === 11) return { label: "Pagamento pendente", tone: "warn" };
  if (id === 12) return { label: "Pagamento aprovado", tone: "ok" };
  if (id === 13) return { label: "Preparando", tone: "info" };
  if (id === 14) return { label: "Enviado", tone: "info" };
  if (id === 15) return { label: "Entregue", tone: "brand" };
  if (id === 16) return { label: "Cancelado", tone: "danger" };

  return { label: "Em andamento", tone: "brand" };
}

export function pickUserId(me: any): number | null {
  const root = me?.dados ?? me?.data ?? me;

  const id =
    root?.usuario?.id ??
    root?.id ??
    root?.usuario_id ??
    root?.dados?.usuario?.id ??
    root?.data?.usuario?.id;

  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function pickArrayPayload(res: any): any[] {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.dados)) return d.dados;
  if (Array.isArray(d?.pedidos)) return d.pedidos;
  if (Array.isArray(d?.dados?.pedidos)) return d.dados.pedidos;
  return [];
}

export function pickObjectPayload(res: any): any {
  const d = res?.data;
  if (!d || typeof d !== "object") return d;
  return d.dados ?? d.data ?? d.result ?? d;
}

export function montarEndereco(obj: any): string {
  if (!obj) return "";

  if (typeof obj === "string") return obj;

  const rua = obj.rua ?? "";
  const numero = obj.numero ?? "";
  const complemento = obj.complemento ? ` - ${obj.complemento}` : "";
  const bairro = obj.bairro ?? "";
  const cidade = obj.cidade ?? "";
  const estado = obj.estado ?? "";
  const cep = obj.cep ? ` - CEP: ${obj.cep}` : "";

  const linha1 = [rua, numero].filter(Boolean).join(", ");
  const linha2 = [bairro, cidade && estado ? `${cidade}/${estado}` : cidade || estado]
    .filter(Boolean)
    .join(" • ");

  return [linha1 + complemento, linha2 + cep].filter(Boolean).join(" | ");
}


export function num(v: any): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;

  const raw = String(v ?? "").trim();
  if (!raw) return 0;

  const cleaned = raw.replace(/[^\d,.-]/g, "");
  let normalized = cleaned;

  if (cleaned.includes(",") && cleaned.includes(".")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    normalized = cleaned.replace(",", ".");
  }

  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}



export function enderecoResumo(e: EnderecoDB) {
  const linha1 =
    `${e.rua ?? ""}, ${e.numero ?? ""}` +
    (e.complemento ? ` - ${e.complemento}` : "");

  const linha2 = `${e.bairro ?? ""} • ${e.cidade ?? ""}/${e.estado ?? ""}`;
  const linha3 = e.cep ? `CEP: ${e.cep}` : "";

  return {
    linha1: linha1.trim(),
    linha2: linha2.trim(),
    linha3,
  };
}