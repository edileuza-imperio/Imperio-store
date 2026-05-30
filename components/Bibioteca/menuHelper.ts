import { Menu } from "../site/menu/menu";


function normalize(name?: string | null) {
  return name?.toLowerCase()?.trim() || "";
}

export function findMenu(menus: Menu[], name: string) {
  return (
    menus.find((m) => normalize(m.nome) === normalize(name)) || null
  );
}

export function findMenuIncludes(menus: Menu[], keyword: string) {
  return (
    menus.find((m) => normalize(m.nome).includes(keyword.toLowerCase())) ||
    null
  );
}