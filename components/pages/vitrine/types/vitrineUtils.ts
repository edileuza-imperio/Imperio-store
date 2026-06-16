import { Nivel, Status } from "./vitrineTypes";

export function gerarSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function getNivelId(nivel: Nivel) {
  return Number(
    nivel.id_nivel ??
    nivel.idNivel ??
    nivel.id ??
    0
  );
}

export function getStatusId(status: Status) {
  return Number(
    status.id_status ??
    status.idStatus ??
    status.id ??
    0
  );
}

export function getStatusLabel(status: Status) {
  const nome = status.nome || "Status";

  const codigo = status.codigo
    ? ` - ${status.codigo}`
    : "";

  return `${nome}${codigo}`;
}