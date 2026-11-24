"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  FileJson,
  Download,
  Upload,
  Eye,
  EyeOff,
  FolderTree,
  Globe2,
  LayoutGrid,
  Link2,
  ListTree,
  LoaderCircle,
  Menu as MenuIcon,
  Monitor,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import api from "@/Services/Conexao/Conexao";
import ROTAS from "@/app/constants/rotas";

// ============================================================
// TIPOS
// ============================================================

type ApiRecord = Record<string, unknown>;

type MenuItem = {
  id: number;
  menu_id: number;
  nome: string;
  item_pai_id: number | null;
  rota: string | null;
  url_externa: boolean;
  icone: string | null;
  ordem: number;
  ativo: boolean;
  status_id: number | null;
  papeis_ids: number[];
  subitens: MenuItem[];
};

type NavbarMenu = {
  id: number;
  nome: string;
  codigo: string;
  localizacao: string;
  ativo: boolean;
  status_id: number | null;
  itens: MenuItem[];
};

type NavbarCounters = {
  menus: number | null;
  menusAtivos: number | null;
  itens: number | null;
  itensAtivos: number | null;
  itensInativos: number | null;
  associacoes: number | null;
};

type Papel = {
  id: number;
  nome: string;
  codigo: string;
  descricao: string;
  ativo: boolean;
};

type MenuForm = {
  nome: string;
  codigo: string;
  localizacao: string;
  ativo: boolean;
};

type ItemForm = {
  nome: string;
  itemPaiId: string;
  rota: string;
  urlExterna: boolean;
  icone: string;
  ordem: string;
  ativo: boolean;
};

type Notice = {
  type: "success" | "error" | "info";
  text: string;
};

type ImportItemDraft = {
  nome: string;
  rota: string | null;
  urlExterna: boolean;
  icone: string | null;
  ordem: number;
  ativo: boolean;
  statusId?: number | null;
  papeisIds: number[];
  subitens: ImportItemDraft[];
};

type ImportMenuDraft = {
  nome: string;
  codigo: string;
  localizacao: string;
  ativo: boolean;
  statusId?: number | null;
  itens: ImportItemDraft[];
};

type ImportAppendDraft = {
  menuCodigo: string;
  itemPaiNome: string;
  itemPaiRota?: string;
  itens: ImportItemDraft[];
};

type ImportBatch =
  | { mode: "createMenus"; menus: ImportMenuDraft[] }
  | { mode: "appendToExistingItem"; target: ImportAppendDraft };

type ImportReport = {
  menus: number;
  itens: number;
  associacoes: number;
  erros: string[];
};

type ImportProgress = {
  completed: number;
  total: number;
  label: string;
};

type ModalMode = "menu" | "item" | "permissions" | "import" | null;
type StatusFilter = "todos" | "ativos" | "inativos";
type TabKey = "estrutura" | "previa" | "detalhes";

const EMPTY_MENU: MenuForm = {
  nome: "",
  codigo: "",
  localizacao: "CABECALHO",
  ativo: true,
};

const EMPTY_ITEM: ItemForm = {
  nome: "",
  itemPaiId: "",
  rota: "",
  urlExterna: false,
  icone: "",
  ordem: "0",
  ativo: true,
};

const LOCATION_LABELS: Record<string, string> = {
  CABECALHO: "Cabeçalho",
  RODAPE: "Rodapé",
  LATERAL: "Lateral",
  MOBILE: "Mobile",
};

const LOCATION_OPTIONS = [
  { value: "CABECALHO", label: "Cabeçalho", description: "Navegação principal da loja", icon: Monitor },
  { value: "RODAPE", label: "Rodapé", description: "Links institucionais e de apoio", icon: LayoutGrid },
  { value: "LATERAL", label: "Lateral", description: "Menu lateral ou painel", icon: ListTree },
  { value: "MOBILE", label: "Mobile", description: "Navegação para dispositivos móveis", icon: Smartphone },
];

const IMPORT_JSON_TEMPLATE = JSON.stringify(
  {
    adicionarEm: {
      menuCodigo: "MENU_PRINCIPAL",
      nome: "Minha conta",
      itemPaiNome: "Minha conta",
      itemPaiRota: "/login",
    },
    itens: [
      {
        nome: "Meus dados",
        rota: "/minha-conta/perfil",
        urlExterna: false,
        icone: "user-round",
        ordem: 3,
        ativo: true,
        papeisIds: [],
        subitens: [],
      },
      {
        nome: "Meus endereços",
        rota: "/minha-conta/enderecos",
        urlExterna: false,
        icone: "map-pin",
        ordem: 4,
        ativo: true,
        papeisIds: [],
        subitens: [],
      },
      {
        nome: "Segurança e senha",
        rota: "/minha-conta/seguranca",
        urlExterna: false,
        icone: "shield-check",
        ordem: 5,
        ativo: true,
        papeisIds: [],
        subitens: [],
      },
      {
        nome: "Meus cupons",
        rota: "/minha-conta/cupons",
        urlExterna: false,
        icone: "ticket-percent",
        ordem: 6,
        ativo: true,
        papeisIds: [],
        subitens: [],
      },
      {
        nome: "Trocas e devoluções",
        rota: "/minha-conta/trocas",
        urlExterna: false,
        icone: "refresh-ccw",
        ordem: 7,
        ativo: true,
        papeisIds: [],
        subitens: [],
      },
      {
        nome: "Minhas avaliações",
        rota: "/minha-conta/avaliacoes",
        urlExterna: false,
        icone: "star",
        ordem: 9,
        ativo: true,
        papeisIds: [],
        subitens: [],
      },
    ],
  },
  null,
  2,
);

function normalizeImportItem(value: unknown, path: string): ImportItemDraft {
  if (!isRecord(value)) {
    throw new Error(`${path}: cada item precisa ser um objeto JSON.`);
  }

  const nome = readString(value.nome, value.titulo);
  if (!nome) throw new Error(`${path}: o campo "nome" é obrigatório.`);

  const rota = readString(value.rota, value.url) || null;
  const urlExterna = readBoolean(value.urlExterna ?? value.url_externa, false);

  if (rota) {
    const valid = urlExterna ? isValidExternalUrl(rota) : isValidInternalRoute(rota);
    if (!valid) {
      throw new Error(
        `${path}: ${urlExterna ? 'URL externa inválida; use http:// ou https://' : 'rota interna inválida; comece com /'}.`,
      );
    }
  }

  const childrenValue = value.subitens ?? value.itens ?? [];
  if (!Array.isArray(childrenValue)) {
    throw new Error(`${path}: "subitens" precisa ser uma lista.`);
  }

  const rolesValue = value.papeisIds ?? value.papeis_ids ?? [];
  if (!Array.isArray(rolesValue)) {
    throw new Error(`${path}: "papeisIds" precisa ser uma lista de IDs numéricos.`);
  }

  const roleIds = rolesValue.map((roleId) => readNumber(roleId));
  if (roleIds.some((roleId) => roleId === null || roleId <= 0)) {
    throw new Error(`${path}: todos os IDs em "papeisIds" precisam ser números positivos.`);
  }

  const statusId = readNumber(value.statusId, value.status_id);
  const ordem = readNumber(value.ordem) ?? 0;

  return {
    nome,
    rota,
    urlExterna,
    icone: readString(value.icone, value.icon) || null,
    ordem,
    ativo: readBoolean(value.ativo, true),
    ...(statusId !== null ? { statusId } : {}),
    papeisIds: Array.from(new Set(roleIds as number[])),
    subitens: childrenValue.map((child, index) =>
      normalizeImportItem(child, `${path}.subitens[${index}]`),
    ),
  };
}

function parseImportMenus(jsonText: string): ImportMenuDraft[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    const message = error instanceof Error ? error.message : "JSON inválido.";
    throw new Error(`Não foi possível ler o JSON: ${message}`);
  }

  let sourceMenus: unknown[];
  if (Array.isArray(parsed)) {
    sourceMenus = parsed;
  } else if (isRecord(parsed) && Array.isArray(parsed.menus)) {
    sourceMenus = parsed.menus;
  } else if (isRecord(parsed)) {
    // Também aceita um único menu diretamente na raiz do arquivo.
    sourceMenus = [parsed];
  } else {
    throw new Error('O JSON precisa conter um objeto com a propriedade "menus" ou um array de menus.');
  }

  if (sourceMenus.length === 0) {
    throw new Error("O arquivo JSON não contém nenhum menu para cadastrar.");
  }

  const allowedLocations = new Set(["CABECALHO", "RODAPE", "LATERAL", "MOBILE"]);
  const usedCodes = new Set<string>();

  return sourceMenus.map((rawMenu, index) => {
    const path = `menus[${index}]`;
    if (!isRecord(rawMenu)) throw new Error(`${path}: o menu precisa ser um objeto JSON.`);

    const nome = readString(rawMenu.nome, rawMenu.titulo);
    if (!nome) throw new Error(`${path}: o campo "nome" é obrigatório.`);

    const codigo = (
      readString(rawMenu.codigo) || createMenuCode(nome)
    ).toUpperCase().replace(/\s+/g, "_");

    if (!codigo) throw new Error(`${path}: não foi possível gerar um código para o menu.`);
    if (usedCodes.has(codigo)) throw new Error(`${path}: o código "${codigo}" está duplicado dentro do arquivo.`);
    usedCodes.add(codigo);

    const localizacao = (readString(rawMenu.localizacao) || "CABECALHO").toUpperCase();
    if (!allowedLocations.has(localizacao)) {
      throw new Error(`${path}: localização "${localizacao}" inválida. Use CABECALHO, RODAPE, LATERAL ou MOBILE.`);
    }

    const itemsValue = rawMenu.itens ?? rawMenu.items ?? [];
    if (!Array.isArray(itemsValue)) throw new Error(`${path}: "itens" precisa ser uma lista.`);

    const statusId = readNumber(rawMenu.statusId, rawMenu.status_id);

    return {
      nome,
      codigo,
      localizacao,
      ativo: readBoolean(rawMenu.ativo, true),
      ...(statusId !== null ? { statusId } : {}),
      itens: itemsValue.map((item, itemIndex) =>
        normalizeImportItem(item, `${path}.itens[${itemIndex}]`),
      ),
    };
  });
}


function parseImportBatch(jsonText: string): ImportBatch {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    const message = error instanceof Error ? error.message : "JSON inválido.";
    throw new Error(`Não foi possível ler o JSON: ${message}`);
  }

  if (isRecord(parsed) && isRecord(parsed.adicionarEm)) {
    if (!Array.isArray(parsed.itens)) {
      throw new Error(
        'Para adicionar itens a um menu existente, informe a lista "itens" na raiz do JSON, junto com "adicionarEm".',
      );
    }

    const target = parsed.adicionarEm;
    const menuCodigo = readString(target.menuCodigo, target.menu_codigo).toUpperCase();
    const itemPaiNome = readString(
      target.itemPaiNome,
      target.item_pai_nome,
      target.nome,
    );
    const itemPaiRota = readString(target.itemPaiRota, target.item_pai_rota);

    if (!menuCodigo) {
      throw new Error('Informe "adicionarEm.menuCodigo" com o código do menu existente.');
    }
    if (!itemPaiNome) {
      throw new Error('Informe "adicionarEm.itemPaiNome" com o nome do item pai existente.');
    }
    if (parsed.itens.length === 0) {
      throw new Error('A propriedade "itens" precisa conter pelo menos um item para adicionar.');
    }

    return {
      mode: "appendToExistingItem",
      target: {
        menuCodigo,
        itemPaiNome,
        ...(itemPaiRota ? { itemPaiRota } : {}),
        itens: parsed.itens.map((item, index) =>
          normalizeImportItem(item, `itens[${index}]`),
        ),
      },
    };
  }

  return {
    mode: "createMenus",
    menus: parseImportMenus(jsonText),
  };
}

function countImportItemOperations(items: ImportItemDraft[]): number {
  return items.reduce(
    (total, item) => total + 1 + item.papeisIds.length + countImportItemOperations(item.subitens),
    0,
  );
}

function countImportOperations(menus: ImportMenuDraft[]): number {
  const countItems = (items: ImportItemDraft[]): number =>
    items.reduce(
      (total, item) => total + 1 + item.papeisIds.length + countItems(item.subitens),
      0,
    );

  return menus.reduce((total, menu) => total + 1 + countItems(menu.itens), 0);
}

function extractCreatedId(response: unknown, kind: "menu" | "item"): number | null {
  const value = unwrapApiResponse(response);
  const keys = kind === "menu"
    ? ["id_menu", "menu_id", "menuId", "id", "insertId", "lastInsertId", "idInserido", "retorno"]
    : ["id_menu_item", "menu_item_id", "menuItemId", "id", "insertId", "lastInsertId", "idInserido", "retorno"];

  const visit = (current: unknown, depth = 0): number | null => {
    if (depth > 5 || current === null || current === undefined) return null;

    const direct = readNumber(current);
    if (direct !== null && direct > 0) return direct;

    if (!isRecord(current)) return null;

    for (const key of keys) {
      const found = readNumber(current[key]);
      if (found !== null && found > 0) return found;
    }

    for (const key of ["dados", "data", "resultado", "menu", "item", "registro", "retorno"]) {
      if (key in current) {
        const found = visit(current[key], depth + 1);
        if (found !== null) return found;
      }
    }

    return null;
  };

  return visit(value);
}

// ============================================================
// NORMALIZAÇÃO DA API
// A API retorna a estrutura no formato:
// [{ menu: MenuModel, itens: [{ item: MenuItemModel, papeis_ids: [] }] }]
// ============================================================

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function readBoolean(value: unknown, fallback = false): boolean {
  if (value === true || value === 1 || value === "1" || value === "true") return true;
  if (value === false || value === 0 || value === "0" || value === "false") return false;
  return fallback;
}

function readRoleIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((entry) => {
          if (isRecord(entry)) return readNumber(entry.papel_id, entry.id_papel, entry.id);
          return readNumber(entry);
        })
        .filter((id): id is number => id !== null && id > 0),
    ),
  ).sort((a, b) => a - b);
}

function unwrapApiResponse(response: unknown): unknown {
  let current: unknown = response;
  if (isRecord(current) && "data" in current) current = current.data;

  for (let step = 0; step < 6; step += 1) {
    if (!isRecord(current)) break;

    if ("dados" in current && current.dados !== undefined && current.dados !== null) {
      current = current.dados;
      continue;
    }
    if ("data" in current && current.data !== undefined && current.data !== null) {
      current = current.data;
      continue;
    }
    if ("resultado" in current && current.resultado !== undefined) {
      current = current.resultado;
      continue;
    }
    break;
  }

  return current;
}

function getErrorMessage(error: unknown): string {
  if (isRecord(error)) {
    const response = isRecord(error.response) ? error.response : null;
    const data = response && isRecord(response.data) ? response.data : null;

    if (data) {
      const message = readString(data.mensagem, data.message, data.erro);
      if (message) return message;
    }

    const message = readString(error.message);
    if (message) return message;
  }

  return "Não foi possível concluir a operação. Verifique a API e tente novamente.";
}

function flattenTree(items: MenuItem[] = []): MenuItem[] {
  return items.flatMap((item) => [item, ...flattenTree(item.subitens ?? [])]);
}

function normalizeItem(rawValue: unknown, menuId: number): MenuItem {
  const raw = isRecord(rawValue) ? rawValue : {};
  const source = isRecord(raw.item) ? raw.item : raw;
  const childrenRaw = Array.isArray(source.subitens)
    ? source.subitens
    : Array.isArray(source.children)
      ? source.children
      : [];

  const id =
    readNumber(source.id_menu_item, source.menu_item_id, source.id, source.idMenuItem) ?? 0;

  return {
    id,
    menu_id: readNumber(source.menu_id, source.menuId) ?? menuId,
    nome: readString(source.nome, source.titulo, source.label) || `Item ${id || ""}`.trim(),
    item_pai_id: readNumber(source.item_pai_id, source.itemPaiId),
    rota: readString(source.rota, source.url, source.href) || null,
    url_externa: readBoolean(source.url_externa ?? source.urlExterna),
    icone: readString(source.icone, source.icon) || null,
    ordem: readNumber(source.ordem, source.order) ?? 0,
    ativo: readBoolean(source.ativo, true),
    status_id: readNumber(source.status_id, source.statusId),
    papeis_ids: readRoleIds(raw.papeis_ids ?? raw.papeisIds ?? source.papeis_ids),
    subitens: childrenRaw.map((child) => normalizeItem(child, menuId)),
  };
}

function buildTree(items: MenuItem[]): MenuItem[] {
  const unique = new Map<number, MenuItem>();

  for (const item of items) {
    if (item.id <= 0) continue;
    unique.set(item.id, { ...item, subitens: [] });
  }

  const roots: MenuItem[] = [];

  for (const item of unique.values()) {
    const current = unique.get(item.id)!;
    const parent = item.item_pai_id ? unique.get(item.item_pai_id) : null;

    if (parent && parent.id !== current.id) {
      parent.subitens.push(current);
    } else {
      roots.push(current);
    }
  }

  const sort = (nodes: MenuItem[]) => {
    nodes.sort((a, b) => a.ordem - b.ordem || a.id - b.id);
    nodes.forEach((node) => sort(node.subitens));
  };

  sort(roots);
  return roots;
}

function normalizeMenu(rawValue: unknown): NavbarMenu {
  const raw = isRecord(rawValue) ? rawValue : {};
  const source = isRecord(raw.menu) ? raw.menu : raw;

  const id = readNumber(source.id_menu, source.menu_id, source.id, source.idMenu) ?? 0;
  const rawItems = Array.isArray(raw.itens)
    ? raw.itens
    : Array.isArray(source.itens)
      ? source.itens
      : Array.isArray(source.items)
        ? source.items
        : [];

  const mappedItems = rawItems.map((item) => normalizeItem(item, id));
  const flatItems = mappedItems.flatMap((item) => flattenTree([item]));
  const deduplicated = Array.from(new Map(flatItems.map((item) => [item.id, item])).values());

  return {
    id,
    nome: readString(source.nome, source.titulo) || `Menu ${id || ""}`.trim(),
    codigo: readString(source.codigo, source.code),
    localizacao: readString(source.localizacao, source.localizacao_menu) || "CABECALHO",
    ativo: readBoolean(source.ativo, true),
    status_id: readNumber(source.status_id, source.statusId),
    itens: buildTree(deduplicated),
  };
}

function extractMenuList(response: unknown): NavbarMenu[] {
  const value = unwrapApiResponse(response);
  let source: unknown[] = [];

  if (Array.isArray(value)) {
    source = value;
  } else if (isRecord(value)) {
    if (value.sucesso === false) {
      throw new Error(readString(value.mensagem, value.message) || "A API não conseguiu carregar a estrutura de menus.");
    }
    if (Array.isArray(value.estrutura)) source = value.estrutura;
    else if (Array.isArray(value.menus)) source = value.menus;
    else if (Array.isArray(value.resultados)) source = value.resultados;
  }

  return source.map(normalizeMenu).filter((menu) => menu.id > 0);
}

function extractRows(response: unknown, keys: string[]): unknown[] {
  const value = unwrapApiResponse(response);
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return [];

  if (value.sucesso === false) {
    throw new Error(
      readString(value.mensagem, value.message, value.erro) ||
        "A API retornou uma resposta inválida.",
    );
  }

  for (const key of keys) {
    if (Array.isArray(value[key])) return value[key] as unknown[];
  }

  return [];
}

function normalizePapel(value: unknown): Papel | null {
  if (!isRecord(value)) return null;
  const source = isRecord(value.papel) ? value.papel : value;
  const id = readNumber(
    source.id_papel,
    source.papel_id,
    source.id,
  );

  if (id === null || id <= 0) return null;

  return {
    id,
    nome: readString(source.nome, source.nome_papel, source.titulo) || `Papel #${id}`,
    codigo: readString(source.codigo, source.codigo_papel),
    descricao: readString(source.descricao, source.observacao),
    ativo: readBoolean(source.ativo, true),
  };
}

function extractPapeis(response: unknown): Papel[] {
  return extractRows(response, ["papeis", "roles", "dados", "resultados", "itens", "registros", "lista"])
    .map(normalizePapel)
    .filter((papel): papel is Papel => papel !== null);
}

function extractAssignedRoleIds(response: unknown): number[] {
  const rows = extractRows(response, [
    "papeis",
    "papeis_ids",
    "associacoes",
    "itens",
    "resultados",
    "registros",
    "lista",
  ]);

  const ids = rows.map((entry) => {
    if (typeof entry === "number" || typeof entry === "string") {
      return readNumber(entry);
    }

    if (!isRecord(entry)) return null;
    const nested = isRecord(entry.papel) ? entry.papel : entry;

    return readNumber(
      entry.papel_id,
      entry.id_papel,
      nested.id_papel,
      nested.papel_id,
      nested.id,
    );
  });

  return Array.from(
    new Set(ids.filter((id): id is number => id !== null && id > 0)),
  ).sort((a, b) => a - b);
}

function extractNavbarCounters(response: unknown): NavbarCounters {
  const value = unwrapApiResponse(response);
  const source = isRecord(value)
    ? (isRecord(value.contadores) ? value.contadores : value)
    : {};

  const readCounter = (...keys: string[]) =>
    readNumber(...keys.map((key) => source[key]));

  return {
    menus: readCounter("total_menus", "menus", "quantidade_menus", "qtd_menus", "totalMenus"),
    menusAtivos: readCounter("menus_ativos", "total_menus_ativos", "quantidade_menus_ativos", "menusAtivos"),
    itens: readCounter("total_itens", "itens", "total_itens_menu", "quantidade_itens", "totalItens"),
    itensAtivos: readCounter("itens_ativos", "total_itens_ativos", "quantidade_itens_ativos", "itensAtivos"),
    itensInativos: readCounter("itens_inativos", "total_itens_inativos", "quantidade_itens_inativos", "itensInativos"),
    associacoes: readCounter(
      "total_associacoes",
      "associacoes",
      "total_papeis_associados",
      "quantidade_associacoes",
      "totalAssociacoes",
    ),
  };
}

function createMenuCode(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isValidInternalRoute(route: string): boolean {
  return route.startsWith("/") && !route.startsWith("//");
}

function isValidExternalUrl(route: string): boolean {
  try {
    const parsed = new URL(route);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function filterTree(
  nodes: MenuItem[],
  term: string,
  status: StatusFilter,
): MenuItem[] {
  return nodes.reduce<MenuItem[]>((result, item) => {
    const children = filterTree(item.subitens, term, status);
    const matchesText =
      !term ||
      `${item.nome} ${item.rota ?? ""} ${item.icone ?? ""} ${item.id}`
        .toLocaleLowerCase("pt-BR")
        .includes(term);

    const matchesStatus =
      status === "todos" ||
      (status === "ativos" && item.ativo) ||
      (status === "inativos" && !item.ativo);

    if ((matchesText && matchesStatus) || children.length > 0) {
      result.push({ ...item, subitens: children });
    }

    return result;
  }, []);
}

// ============================================================
// COMPONENTE
// ============================================================

export default function MenusPage() {
  const [menus, setMenus] = useState<NavbarMenu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [serverCounters, setServerCounters] = useState<NavbarCounters>({
    menus: null,
    menusAtivos: null,
    itens: null,
    itensAtivos: null,
    itensInativos: null,
    associacoes: null,
  });

  const [availableRoles, setAvailableRoles] = useState<Papel[]>([]);
  const [assignedRoleIds, setAssignedRoleIds] = useState<number[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionActionId, setPermissionActionId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingKey, setWorkingKey] = useState<string | null>(null);

  const [menuSearch, setMenuSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [menuStatusFilter, setMenuStatusFilter] = useState<StatusFilter>("todos");
  const [itemStatusFilter, setItemStatusFilter] = useState<StatusFilter>("todos");

  const [notice, setNotice] = useState<Notice | null>(null);
  const [modal, setModal] = useState<ModalMode>(null);
  const [editingMenu, setEditingMenu] = useState<NavbarMenu | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [menuForm, setMenuForm] = useState<MenuForm>(EMPTY_MENU);
  const [menuCodeTouched, setMenuCodeTouched] = useState(false);
  const [itemForm, setItemForm] = useState<ItemForm>(EMPTY_ITEM);

  const [activeTab, setActiveTab] = useState<TabKey>("estrutura");
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  const [importJson, setImportJson] = useState(IMPORT_JSON_TEMPLATE);
  const [importFileName, setImportFileName] = useState("");
  const [importRunning, setImportRunning] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);

  const loadMenus = useCallback(async (keepSelection = true) => {
    setLoading(true);

    try {
      const [structureResult, countersResult] = await Promise.allSettled([
        api.get(ROTAS.NAVBAR.ESTRUTURA, {
          params: { somenteAtivos: false },
        }),
        api.get(ROTAS.NAVBAR.CONTADORES),
      ]);

      if (structureResult.status === "rejected") {
        throw structureResult.reason;
      }

      const nextMenus = extractMenuList(structureResult.value);
      setMenus(nextMenus);

      if (countersResult.status === "fulfilled") {
        setServerCounters(extractNavbarCounters(countersResult.value));
      }

      setSelectedMenuId((current) => {
        if (
          keepSelection &&
          current &&
          nextMenus.some((menu) => menu.id === current)
        ) {
          return current;
        }

        return nextMenus[0]?.id ?? null;
      });
    } catch (error) {
      setNotice({ type: "error", text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMenus(false);
  }, [loadMenus]);

  const selectedMenu = menus.find((menu) => menu.id === selectedMenuId) ?? null;
  const allItems = useMemo(
    () => flattenTree(selectedMenu?.itens ?? []),
    [selectedMenu],
  );

  const selectedItem = useMemo(
    () => allItems.find((item) => item.id === selectedItemId) ?? null,
    [allItems, selectedItemId],
  );

  const visibleMenus = useMemo(() => {
    const term = menuSearch.trim().toLocaleLowerCase("pt-BR");

    return menus.filter((menu) => {
      const matchesText =
        !term ||
        `${menu.nome} ${menu.codigo} ${menu.localizacao}`
          .toLocaleLowerCase("pt-BR")
          .includes(term);

      const matchesStatus =
        menuStatusFilter === "todos" ||
        (menuStatusFilter === "ativos" && menu.ativo) ||
        (menuStatusFilter === "inativos" && !menu.ativo);

      return matchesText && matchesStatus;
    });
  }, [menus, menuSearch, menuStatusFilter]);

  const visibleItems = useMemo(
    () =>
      filterTree(
        selectedMenu?.itens ?? [],
        itemSearch.trim().toLocaleLowerCase("pt-BR"),
        itemStatusFilter,
      ),
    [selectedMenu, itemSearch, itemStatusFilter],
  );

  const counts = useMemo(() => {
    const everyItem = menus.flatMap((menu) => flattenTree(menu.itens));
    return {
      menus: menus.length,
      menusAtivos: menus.filter((menu) => menu.ativo).length,
      itens: everyItem.length,
      itensAtivos: everyItem.filter((item) => item.ativo).length,
      itensInativos: everyItem.filter((item) => !item.ativo).length,
      associacoes: everyItem.reduce((sum, item) => sum + item.papeis_ids.length, 0),
    };
  }, [menus]);

  const displayCounts = {
    menus: serverCounters.menus ?? counts.menus,
    menusAtivos: serverCounters.menusAtivos ?? counts.menusAtivos,
    itens: serverCounters.itens ?? counts.itens,
    itensAtivos: serverCounters.itensAtivos ?? counts.itensAtivos,
    itensInativos: serverCounters.itensInativos ?? counts.itensInativos,
    associacoes: serverCounters.associacoes ?? counts.associacoes,
  };

  const rootItems = useMemo(
    () => (selectedMenu?.itens ?? []).length,
    [selectedMenu],
  );

  const activeLocation = LOCATION_LABELS[selectedMenu?.localizacao ?? ""] ?? selectedMenu?.localizacao ?? "Não definida";

  function showNotice(nextNotice: Notice) {
    setNotice(nextNotice);
  }

  function openNewMenu() {
    setEditingMenu(null);
    setMenuCodeTouched(false);
    setMenuForm(EMPTY_MENU);
    setModal("menu");
  }

  function openEditMenu(menu: NavbarMenu) {
    setEditingMenu(menu);
    setMenuCodeTouched(true);
    setMenuForm({
      nome: menu.nome,
      codigo: menu.codigo,
      localizacao: menu.localizacao,
      ativo: menu.ativo,
    });
    setModal("menu");
  }

  function openNewItem(parent?: MenuItem | null) {
    if (!selectedMenu) {
      showNotice({ type: "error", text: "Selecione um menu antes de adicionar itens." });
      return;
    }

    const nextOrder =
      Math.max(0, ...flattenTree(selectedMenu.itens).map((item) => item.ordem)) + 1;

    setEditingItem(null);
    setItemForm({
      ...EMPTY_ITEM,
      itemPaiId: parent ? String(parent.id) : "",
      ordem: String(nextOrder),
    });
    setModal("item");
  }

  function getDescendantIds(item: MenuItem): number[] {
    return flattenTree(item.subitens).map((child) => child.id);
  }

  function openEditItem(item: MenuItem) {
    setEditingItem(item);
    setItemForm({
      nome: item.nome,
      itemPaiId: item.item_pai_id == null ? "" : String(item.item_pai_id),
      rota: item.rota ?? "",
      urlExterna: item.url_externa,
      icone: item.icone ?? "",
      ordem: String(item.ordem),
      ativo: item.ativo,
    });
    setSelectedItemId(item.id);
    setModal("item");
  }

  async function loadPermissionData(menuItemId: number) {
    setPermissionsLoading(true);

    try {
      const [rolesResponse, associationsResponse] = await Promise.all([
        api.get(ROTAS.PERMISSOES.PAPEIS.LISTAR),
        api.get(ROTAS.NAVBAR.PAPEIS.LISTAR_POR_ITEM(menuItemId)),
      ]);

      setAvailableRoles(extractPapeis(rolesResponse));
      setAssignedRoleIds(extractAssignedRoleIds(associationsResponse));
    } catch (error) {
      setNotice({
        type: "error",
        text: `Não foi possível carregar os papéis e associações: ${getErrorMessage(error)}`,
      });
      setAvailableRoles([]);
      setAssignedRoleIds([]);
    } finally {
      setPermissionsLoading(false);
    }
  }

  function openPermissions(item: MenuItem) {
    setSelectedItemId(item.id);
    setAvailableRoles([]);
    setAssignedRoleIds([]);
    setModal("permissions");
    void loadPermissionData(item.id);
  }

  async function toggleRoleAssociation(role: Papel) {
    if (!selectedItem || permissionActionId !== null) return;

    const itemId = selectedItem.id;
    const isAssigned = assignedRoleIds.includes(role.id);
    setPermissionActionId(role.id);

    try {
      if (isAssigned) {
        await api.delete(
          ROTAS.NAVBAR.PAPEIS.REMOVER_ITEM(role.id, itemId),
        );
        setAssignedRoleIds((current) =>
          current.filter((id) => id !== role.id),
        );
        showNotice({
          type: "success",
          text: `Papel "${role.nome}" removido do item.`,
        });
      } else {
        await api.post(
          ROTAS.NAVBAR.PAPEIS.ATRIBUIR_ITEM(role.id, itemId),
          {},
        );
        setAssignedRoleIds((current) =>
          [...current, role.id].sort((a, b) => a - b),
        );
        showNotice({
          type: "success",
          text: `Papel "${role.nome}" associado ao item.`,
        });
      }

      await loadMenus(true);
    } catch (error) {
      showNotice({
        type: "error",
        text: getErrorMessage(error),
      });
    } finally {
      setPermissionActionId(null);
    }
  }

  function openImportModal() {
    setImportJson(IMPORT_JSON_TEMPLATE);
    setImportFileName("");
    setImportProgress(null);
    setImportReport(null);
    setModal("import");
  }

  async function handleImportFile(file: File | undefined) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) {
      showNotice({ type: "error", text: "Selecione um arquivo com extensão .json." });
      return;
    }

    try {
      const contents = await file.text();
      // Valida os dois formatos: criar menus novos ou adicionar itens a um pai existente.
      parseImportBatch(contents);
      setImportJson(contents);
      setImportFileName(file.name);
      setImportReport(null);
      showNotice({ type: "success", text: `Arquivo "${file.name}" carregado e validado. Revise antes de importar.` });
    } catch (error) {
      showNotice({ type: "error", text: getErrorMessage(error) });
    }
  }

  function downloadImportTemplate() {
    const blob = new Blob([IMPORT_JSON_TEMPLATE], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "modelo-menus-universo-imperio.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function importMenusFromJson() {
    if (importRunning) return;

    let batch: ImportBatch;
    try {
      batch = parseImportBatch(importJson);
    } catch (error) {
      showNotice({ type: "error", text: getErrorMessage(error) });
      return;
    }

    const totalOperations =
      batch.mode === "appendToExistingItem"
        ? countImportItemOperations(batch.target.itens)
        : countImportOperations(batch.menus);

    const report: ImportReport = {
      menus: 0,
      itens: 0,
      associacoes: 0,
      erros: [],
    };

    let completed = 0;
    const advance = (label: string) => {
      completed += 1;
      setImportProgress({ completed, total: totalOperations, label });
    };

    setImportRunning(true);
    setImportReport(null);
    setImportProgress({
      completed: 0,
      total: totalOperations,
      label: "Preparando importação...",
    });

    const skipItemOperations = (draft: ImportItemDraft, path: string) => {
      advance(`Ignorado por falha em item superior: ${path}`);
      for (const roleId of draft.papeisIds) {
        advance(`Associação ignorada: ${path} → papel #${roleId}`);
      }
      for (const child of draft.subitens) {
        skipItemOperations(child, `${path} > ${child.nome}`);
      }
    };

    const importItem = async (
      draft: ImportItemDraft,
      menuId: number,
      itemPaiId: number | null,
      path: string,
    ): Promise<void> => {
      let itemId: number | null = null;

      try {
        const payload = {
          menuId,
          nome: draft.nome,
          itemPaiId,
          rota: draft.rota,
          urlExterna: draft.urlExterna,
          icone: draft.icone,
          ordem: draft.ordem,
          ativo: draft.ativo,
          ...(draft.statusId !== undefined ? { statusId: draft.statusId } : {}),
        };

        const response = await api.post(ROTAS.NAVBAR.ITEM.CADASTRAR, payload);
        itemId = extractCreatedId(response, "item");

        if (itemId === null) {
          throw new Error(
            "A API não retornou o ID do item criado. Verifique a resposta do NavbarController@cadastrarItem.",
          );
        }

        report.itens += 1;
        advance(`Item cadastrado: ${path}`);
      } catch (error) {
        report.erros.push(`${path}: ${getErrorMessage(error)}`);
        advance(`Falha ao cadastrar: ${path}`);
        for (const child of draft.subitens) {
          skipItemOperations(child, `${path} > ${child.nome}`);
        }
        return;
      }

      for (const roleId of draft.papeisIds) {
        try {
          await api.post(
            ROTAS.NAVBAR.PAPEIS.ATRIBUIR_ITEM(roleId, itemId),
            {},
          );
          report.associacoes += 1;
          advance(`Permissão associada: ${path} → papel #${roleId}`);
        } catch (error) {
          report.erros.push(`${path} / papel #${roleId}: ${getErrorMessage(error)}`);
          advance(`Falha ao associar papel #${roleId}`);
        }
      }

      for (const child of draft.subitens) {
        await importItem(child, menuId, itemId, `${path} > ${child.nome}`);
      }
    };

    try {
      if (batch.mode === "appendToExistingItem") {
        // Busca a estrutura atual no banco e localiza o menu/pai pelo código, nome e rota.
        const structureResponse = await api.get(ROTAS.NAVBAR.ESTRUTURA, {
          params: { somenteAtivos: false },
        });
        const existingMenus = extractMenuList(structureResponse);
        const targetMenu = existingMenus.find(
          (menu) => menu.codigo.trim().toUpperCase() === batch.target.menuCodigo,
        );

        if (!targetMenu) {
          throw new Error(
            `Não encontrei o menu existente com código "${batch.target.menuCodigo}". Nenhum item foi cadastrado.`,
          );
        }

        const matchingParents = flattenTree(targetMenu.itens).filter(
          (item) => item.nome.trim().toLocaleLowerCase("pt-BR") ===
            batch.target.itemPaiNome.trim().toLocaleLowerCase("pt-BR"),
        );

        const targetParent = batch.target.itemPaiRota
          ? matchingParents.find(
              (item) => (item.rota ?? "").trim() === batch.target.itemPaiRota,
            )
          : matchingParents[0];

        if (!targetParent) {
          throw new Error(
            `Não encontrei o item pai "${batch.target.itemPaiNome}"${batch.target.itemPaiRota ? ` com rota "${batch.target.itemPaiRota}"` : ""} dentro do menu "${targetMenu.nome}". Nenhum item foi cadastrado.`,
          );
        }

        for (const draft of batch.target.itens) {
          await importItem(
            draft,
            targetMenu.id,
            targetParent.id,
            `${targetMenu.nome} > ${targetParent.nome} > ${draft.nome}`,
          );
        }
      } else {
        for (const draft of batch.menus) {
          const path = `Menu "${draft.nome}"`;
          let menuId: number | null = null;

          try {
            const payload = {
              nome: draft.nome,
              codigo: draft.codigo,
              localizacao: draft.localizacao,
              ativo: draft.ativo,
              ...(draft.statusId !== undefined ? { statusId: draft.statusId } : {}),
            };

            const response = await api.post(ROTAS.NAVBAR.MENU.CADASTRAR, payload);
            menuId = extractCreatedId(response, "menu");

            if (menuId === null) {
              throw new Error(
                "A API não retornou o ID do menu criado. Verifique a resposta do NavbarController@cadastrarMenu.",
              );
            }

            report.menus += 1;
            advance(`Menu cadastrado: ${draft.nome}`);
          } catch (error) {
            report.erros.push(`${path}: ${getErrorMessage(error)}`);
            advance(`Falha ao cadastrar: ${draft.nome}`);
            for (const item of draft.itens) {
              skipItemOperations(item, `${draft.nome} > ${item.nome}`);
            }
            continue;
          }

          for (const item of draft.itens) {
            await importItem(item, menuId, null, `${draft.nome} > ${item.nome}`);
          }
        }
      }

      setImportReport(report);
      await loadMenus(true);

      if (report.erros.length === 0) {
        showNotice({
          type: "success",
          text:
            batch.mode === "appendToExistingItem"
              ? `Importação concluída: ${report.itens} item(ns) adicionado(s) ao item "${batch.target.itemPaiNome}" e ${report.associacoes} associação(ões).`
              : `Importação concluída: ${report.menus} menu(s), ${report.itens} item(ns) e ${report.associacoes} associação(ões).`,
        });
      } else {
        showNotice({
          type: "info",
          text: `Importação finalizada com ${report.erros.length} ocorrência(s). Consulte o relatório antes de tentar novamente para evitar duplicidades.`,
        });
      }
    } catch (error) {
      showNotice({ type: "error", text: getErrorMessage(error) });
    } finally {
      setImportRunning(false);
    }
  }

  async function saveMenu(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nome = menuForm.nome.trim();
    const codigo = (menuForm.codigo.trim() || createMenuCode(nome))
      .toUpperCase()
      .replace(/\s+/g, "_");

    if (!nome || !codigo) {
      showNotice({ type: "error", text: "Informe o nome e o código do menu." });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        nome,
        codigo,
        localizacao: menuForm.localizacao,
        ativo: menuForm.ativo,
      };

      if (editingMenu) {
        await api.put(ROTAS.NAVBAR.MENU.ATUALIZAR(editingMenu.id), payload);
        showNotice({ type: "success", text: "Menu atualizado com sucesso." });
      } else {
        await api.post(ROTAS.NAVBAR.MENU.CADASTRAR, payload);
        showNotice({ type: "success", text: "Menu cadastrado com sucesso." });
      }

      setModal(null);
      await loadMenus(true);
    } catch (error) {
      showNotice({ type: "error", text: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedMenu) return;

    const nome = itemForm.nome.trim();
    const rota = itemForm.rota.trim();

    if (!nome) {
      showNotice({ type: "error", text: "Informe o nome do item." });
      return;
    }

    if (rota) {
      const valid = itemForm.urlExterna
        ? isValidExternalUrl(rota)
        : isValidInternalRoute(rota);

      if (!valid) {
        showNotice({
          type: "error",
          text: itemForm.urlExterna
            ? "Informe uma URL externa válida iniciada por http:// ou https://."
            : "Rotas internas devem começar com /, por exemplo /produtos.",
        });
        return;
      }
    }

    const parentId = itemForm.itemPaiId ? Number(itemForm.itemPaiId) : null;

    if (editingItem && parentId !== null) {
      const forbidden = new Set([
        editingItem.id,
        ...getDescendantIds(editingItem),
      ]);

      if (forbidden.has(parentId)) {
        showNotice({
          type: "error",
          text: "Este item não pode ser filho dele mesmo nem de um dos seus subitens.",
        });
        return;
      }
    }

    setSaving(true);

    try {
      // Os nomes seguem exatamente os argumentos camelCase do NavbarController PHP.
      const payload = {
        menuId: selectedMenu.id,
        nome,
        itemPaiId: parentId,
        rota: rota || null,
        urlExterna: itemForm.urlExterna,
        icone: itemForm.icone.trim() || null,
        ordem: Number(itemForm.ordem) || 0,
        ativo: itemForm.ativo,
      };

      if (editingItem) {
        await api.put(ROTAS.NAVBAR.ITEM.ATUALIZAR(editingItem.id), payload);
        showNotice({ type: "success", text: "Item atualizado com sucesso." });
      } else {
        await api.post(ROTAS.NAVBAR.ITEM.CADASTRAR, payload);
        showNotice({ type: "success", text: "Item adicionado à navegação." });
      }

      setModal(null);
      await loadMenus(true);
    } catch (error) {
      showNotice({ type: "error", text: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  async function runAction(key: string, action: () => Promise<void>) {
    if (workingKey) return;

    setWorkingKey(key);
    try {
      await action();
    } catch (error) {
      showNotice({ type: "error", text: getErrorMessage(error) });
    } finally {
      setWorkingKey(null);
    }
  }

  async function toggleMenu(menu: NavbarMenu) {
    await runAction(`menu-${menu.id}`, async () => {
      await api.put(ROTAS.NAVBAR.MENU.ALTERAR_STATUS(menu.id), {
        ativo: !menu.ativo,
      });
      showNotice({
        type: "success",
        text: `Menu ${menu.ativo ? "desativado" : "ativado"} com sucesso.`,
      });
      await loadMenus(true);
    });
  }

  async function toggleItem(item: MenuItem) {
    await runAction(`item-${item.id}`, async () => {
      await api.put(ROTAS.NAVBAR.ITEM.ALTERAR_STATUS(item.id), {
        ativo: !item.ativo,
      });
      showNotice({
        type: "success",
        text: `Item ${item.ativo ? "desativado" : "ativado"} com sucesso.`,
      });
      await loadMenus(true);
    });
  }

  async function deleteMenu(menu: NavbarMenu) {
    const confirmed = window.confirm(
      `Excluir o menu "${menu.nome}"?\n\nA API informa que a exclusão do menu remove também seus itens e associações vinculadas em cascata. Esta ação não pode ser desfeita.`,
    );

    if (!confirmed) return;

    await runAction(`delete-menu-${menu.id}`, async () => {
      await api.delete(ROTAS.NAVBAR.MENU.EXCLUIR(menu.id));
      showNotice({ type: "success", text: "Menu excluído com sucesso." });
      await loadMenus(false);
    });
  }

  async function deleteItem(item: MenuItem) {
    const hasChildren = item.subitens.length > 0;
    const message = hasChildren
      ? `Excluir "${item.nome}" e seus ${item.subitens.length} subitem(ns)?`
      : `Excluir o item "${item.nome}"?`;

    if (!window.confirm(`${message}\n\nEsta ação não pode ser desfeita.`)) return;

    await runAction(`delete-item-${item.id}`, async () => {
      await api.delete(ROTAS.NAVBAR.ITEM.EXCLUIR(item.id));
      showNotice({ type: "success", text: "Item removido da navegação." });
      if (selectedItemId === item.id) setSelectedItemId(null);
      await loadMenus(true);
    });
  }

  async function moveItem(item: MenuItem, direction: -1 | 1, siblings: MenuItem[]) {
    const index = siblings.findIndex((candidate) => candidate.id === item.id);
    const target = siblings[index + direction];

    if (!target) return;

    await runAction(`move-item-${item.id}`, async () => {
      // Usa uma ordem temporária para evitar colisão entre dois itens.
      const temporaryOrder =
        Math.max(0, ...siblings.map((sibling) => sibling.ordem)) + 1000;

      await api.put(ROTAS.NAVBAR.ITEM.ALTERAR_ORDEM(item.id), { ordem: temporaryOrder });
      await api.put(ROTAS.NAVBAR.ITEM.ALTERAR_ORDEM(target.id), { ordem: item.ordem });
      await api.put(ROTAS.NAVBAR.ITEM.ALTERAR_ORDEM(item.id), { ordem: target.ordem });

      showNotice({ type: "success", text: "Ordem dos itens atualizada." });
      await loadMenus(true);
    });
  }

  function toggleExpanded(id: number) {
    setExpandedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  function expandAll() {
    setExpandedIds(allItems.map((item) => item.id));
  }

  function collapseAll() {
    setExpandedIds([]);
  }


  const renderItem = (
    item: MenuItem,
    siblings: MenuItem[],
    depth = 0,
  ): ReactNode => {
    const hasChildren = item.subitens.length > 0;
    const isExpanded =
      expandedIds.includes(item.id) || Boolean(itemSearch.trim());

    return (
      <div className="nav-tree-node" key={item.id}>
        <div
          className={`nav-item-row ${selectedItemId === item.id ? "is-selected" : ""} ${!item.ativo ? "is-inactive" : ""}`}
          style={{ paddingLeft: `${12 + depth * 25}px` }}
        >
          <button
            type="button"
            className="nav-expand"
            onClick={() => toggleExpanded(item.id)}
            disabled={!hasChildren}
            aria-label={hasChildren ? "Expandir ou recolher subitens" : "Item sem subitens"}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />
            ) : (
              <span className="nav-expand-placeholder" />
            )}
          </button>

          <button
            type="button"
            className="nav-item-main"
            onClick={() => setSelectedItemId(item.id)}
          >
            <span className="nav-item-symbol">
              {item.url_externa ? <Globe2 size={16} /> : <Link2 size={16} />}
            </span>
            <span className="nav-item-copy">
              <strong>{item.nome}</strong>
              <small>{item.rota || "Sem rota vinculada"}</small>
            </span>
          </button>

          <div className="nav-item-meta">
            {item.papeis_ids.length > 0 && (
              <span className="nav-role-counter" title="Papéis associados">
                <ShieldCheck size={12} /> {item.papeis_ids.length}
              </span>
            )}
            <span className={`nav-status ${item.ativo ? "active" : "inactive"}`}>
              <i /> {item.ativo ? "Ativo" : "Inativo"}
            </span>
          </div>

          <div className="nav-item-actions">
            <button
              type="button"
              title="Mover para cima"
              onClick={() => void moveItem(item, -1, siblings)}
              disabled={siblings[0]?.id === item.id || workingKey !== null || Boolean(itemSearch.trim()) || itemStatusFilter !== "todos"}
            >
              <ArrowUp size={14} />
            </button>
            <button
              type="button"
              title="Mover para baixo"
              onClick={() => void moveItem(item, 1, siblings)}
              disabled={siblings[siblings.length - 1]?.id === item.id || workingKey !== null || Boolean(itemSearch.trim()) || itemStatusFilter !== "todos"}
            >
              <ArrowDown size={14} />
            </button>
            <button
              type="button"
              title="Adicionar subitem"
              onClick={() => openNewItem(item)}
              disabled={workingKey !== null}
            >
              <Plus size={14} />
            </button>
            <button
              type="button"
              title="Permissões do item"
              onClick={() => openPermissions(item)}
              disabled={workingKey !== null}
            >
              <ShieldCheck size={14} />
            </button>
            <button
              type="button"
              title="Editar item"
              onClick={() => openEditItem(item)}
              disabled={workingKey !== null}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              title={item.ativo ? "Desativar item" : "Ativar item"}
              onClick={() => void toggleItem(item)}
              disabled={workingKey !== null}
            >
              {item.ativo ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              type="button"
              title="Excluir item"
              className="danger"
              onClick={() => void deleteItem(item)}
              disabled={workingKey !== null}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="nav-tree-children">
            {item.subitens.map((child) =>
              renderItem(child, item.subitens, depth + 1),
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="navbar-admin">
      <style jsx global>{`
        .navbar-admin, .navbar-admin * { box-sizing: border-box; }
        .navbar-admin {
          --bg: #100d13;
          --panel: #19151e;
          --panel-soft: #211a27;
          --panel-hover: #292130;
          --line: #382d40;
          --line-soft: #2d2433;
          --text: #f3edf5;
          --muted: #a79aaa;
          --muted-2: #817586;
          --accent: #b87aa7;
          --accent-2: #d5a4c8;
          --accent-soft: #38263a;
          --green: #79d6a0;
          --red: #ef9aa5;
          width: 100%;
          min-height: 100vh;
          padding: clamp(18px, 2.8vw, 34px);
          color: var(--text);
          background:
            radial-gradient(ellipse at 8% 0%, rgba(174, 105, 161, .12), transparent 34%),
            radial-gradient(ellipse at 98% 8%, rgba(116, 76, 138, .10), transparent 30%),
            var(--bg);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .navbar-admin button, .navbar-admin input, .navbar-admin select { font: inherit; }
        .navbar-admin button { -webkit-tap-highlight-color: transparent; }
        .nav-admin-shell { width: 100%; max-width: 1680px; margin: 0 auto; }
        .nav-topline { display:flex; justify-content:space-between; align-items:flex-start; gap:22px; margin-bottom:24px; }
        .nav-breadcrumb { display:flex; align-items:center; gap:7px; color:var(--muted-2); font-size:11px; margin-bottom:16px; }
        .nav-breadcrumb strong { color:#d7c6d9; font-weight:600; }
        .nav-heading { display:flex; align-items:center; gap:14px; }
        .nav-heading-icon { display:grid; place-items:center; width:48px; height:48px; border-radius:14px; border:1px solid #5b405d; color:#e0b3d4; background:linear-gradient(145deg,#35253a,#211a29); box-shadow:0 10px 26px #0003; }
        .nav-heading h1 { margin:0; font-size:clamp(22px,2.2vw,29px); line-height:1.15; letter-spacing:-.8px; font-weight:750; }
        .nav-heading p { margin:7px 0 0; color:var(--muted); font-size:12px; }
        .nav-heading p span { color:#d4a7cb; }
        .nav-top-actions { display:flex; align-items:center; gap:9px; padding-top:26px; }
        .nav-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:38px; padding:0 14px; border-radius:9px; border:1px solid transparent; cursor:pointer; font-size:11px; font-weight:700; transition:background .18s,border-color .18s,transform .18s; white-space:nowrap; }
        .nav-btn:disabled { opacity:.5; cursor:not-allowed; }
        .nav-btn:active:not(:disabled) { transform:translateY(1px); }
        .nav-btn-primary { color:#fff; background:linear-gradient(115deg,#bd83b0,#98648f); border-color:#c18ab5; box-shadow:0 7px 19px #9e5e9030; }
        .nav-btn-primary:hover:not(:disabled) { background:linear-gradient(115deg,#cb91bd,#a6719d); }
        .nav-btn-secondary { color:#e0d5e3; background:#211b27; border-color:#49384d; }
        .nav-btn-secondary:hover:not(:disabled) { background:#2d2434; border-color:#654b67; }
        .nav-icon-btn { display:grid; place-items:center; width:35px; height:35px; flex:none; border-radius:8px; border:1px solid #49394e; background:#211b27; color:#cdbed1; cursor:pointer; transition:.18s; }
        .nav-icon-btn:hover:not(:disabled) { background:#33283a; color:#f2d9ed; border-color:#715477; }
        .nav-icon-btn:disabled { opacity:.45; cursor:not-allowed; }
        .nav-icon-btn.danger { color:#e99aa6; }
        .nav-flash { display:flex; align-items:center; gap:10px; padding:12px 14px; border-radius:10px; margin-bottom:16px; font-size:12px; }
        .nav-flash span { flex:1; }
        .nav-flash button { display:grid; place-items:center; width:25px; height:25px; border:0; background:transparent; color:inherit; cursor:pointer; }
        .nav-flash.success { color:#a6e5bd; background:#17281f; border:1px solid #315b42; }
        .nav-flash.error { color:#f1abb3; background:#2b1a20; border:1px solid #6a3945; }
        .nav-flash.info { color:#c8b4eb; background:#221c32; border:1px solid #4c3c69; }
        .nav-stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-bottom:17px; }
        .nav-stat { display:flex; align-items:center; gap:12px; min-height:86px; padding:15px 16px; border:1px solid var(--line); border-radius:13px; background:linear-gradient(145deg,#1d1723,#17131b); box-shadow:0 8px 25px #0002; }
        .nav-stat-icon { width:39px; height:39px; display:grid; place-items:center; border-radius:11px; background:#33253a; color:#d5a2ca; border:1px solid #4d3952; flex:none; }
        .nav-stat small { display:block; color:var(--muted); font-size:10px; margin-bottom:5px; }
        .nav-stat strong { display:block; color:#f6eff7; font-size:23px; line-height:1; font-weight:750; letter-spacing:-.7px; font-variant-numeric:tabular-nums; }
        .nav-stat em { display:block; color:#8e8193; font-size:9px; font-style:normal; margin-top:5px; }
        .nav-workspace { display:grid; grid-template-columns:278px minmax(0,1fr); gap:15px; align-items:stretch; }
        .nav-side, .nav-main-panel { min-width:0; border:1px solid var(--line); border-radius:14px; background:linear-gradient(155deg,#1b1620,#17131a); box-shadow:0 12px 34px #0002; }
        .nav-side { overflow:hidden; }
        .nav-side-head { padding:17px 16px 14px; border-bottom:1px solid var(--line-soft); display:flex; justify-content:space-between; align-items:center; gap:10px; }
        .nav-side-head h2 { margin:0; font-size:13px; letter-spacing:-.2px; }
        .nav-side-head p { margin:5px 0 0; color:var(--muted-2); font-size:10px; }
        .nav-side-tools { padding:12px; border-bottom:1px solid var(--line-soft); }
        .nav-search { display:flex; align-items:center; gap:8px; height:37px; padding:0 10px; border:1px solid #413447; border-radius:9px; background:#120f16; color:#9f91a4; }
        .nav-search:focus-within { border-color:#9c6c9a; box-shadow:0 0 0 3px #b87aa719; }
        .nav-search input { min-width:0; width:100%; border:0; outline:0; color:var(--text); background:transparent; font-size:11px; }
        .nav-search input::placeholder { color:#766a7c; }
        .nav-filter-line { display:flex; gap:5px; margin-top:9px; }
        .nav-filter-chip { flex:1; padding:7px 5px; border-radius:7px; border:1px solid transparent; color:#a89aaa; background:transparent; cursor:pointer; font-size:9px; font-weight:650; }
        .nav-filter-chip.active { color:#e7c5e0; background:#34263a; border-color:#5b4262; }
        .nav-menu-list { display:flex; flex-direction:column; gap:5px; padding:9px; max-height:560px; overflow:auto; }
        .nav-menu-choice { display:flex; align-items:center; gap:10px; width:100%; padding:10px; border:1px solid transparent; border-radius:10px; text-align:left; color:#e5dce7; background:transparent; cursor:pointer; transition:.16s; }
        .nav-menu-choice:hover { background:#241d2a; }
        .nav-menu-choice.selected { background:linear-gradient(110deg,#39283d,#2a2131); border-color:#654d69; box-shadow:inset 3px 0 #c28ab5; }
        .nav-menu-choice-icon { display:grid; place-items:center; width:35px; height:35px; flex:none; border-radius:10px; color:#d6a5ce; background:#302439; border:1px solid #503c58; }
        .nav-menu-choice-text { min-width:0; flex:1; }
        .nav-menu-choice-text strong { display:block; font-size:11px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .nav-menu-choice-text small { display:block; margin-top:4px; color:#95879b; font-size:9px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .nav-menu-status { width:7px; height:7px; flex:none; border-radius:50%; background:#777; }
        .nav-menu-status.active { background:#70d69c; box-shadow:0 0 0 3px #294431; }
        .nav-menu-status.inactive { background:#8e7786; box-shadow:0 0 0 3px #3a2a35; }
        .nav-side-empty { padding:32px 18px; display:flex; flex-direction:column; align-items:center; text-align:center; gap:8px; color:#9b8da0; }
        .nav-side-empty strong { color:#e6dce8; font-size:12px; }
        .nav-side-empty span { color:#928697; font-size:10px; line-height:1.55; }
        .nav-main-panel { padding:0 20px 18px; min-height:560px; }
        .nav-main-head { display:flex; justify-content:space-between; align-items:center; gap:14px; padding:17px 0 16px; border-bottom:1px solid var(--line-soft); }
        .nav-main-title { display:flex; align-items:center; gap:11px; min-width:0; }
        .nav-main-title-icon { display:grid; place-items:center; width:39px; height:39px; flex:none; border-radius:11px; color:#e0b5d9; background:#33253b; border:1px solid #56405d; }
        .nav-main-title h2 { margin:0; font-size:15px; letter-spacing:-.3px; }
        .nav-main-title p { margin:5px 0 0; color:#99899f; font-size:10px; }
        .nav-main-title code { color:#d7a7d0; font-size:10px; }
        .nav-pill { display:inline-flex; align-items:center; gap:6px; padding:5px 8px; border-radius:50px; font-size:9px; font-weight:750; white-space:nowrap; }
        .nav-pill.active { color:#95e2b1; background:#193325; border:1px solid #315d42; }
        .nav-pill.inactive { color:#d9a3ae; background:#32232d; border:1px solid #59404e; }
        .nav-main-head-actions { display:flex; align-items:center; gap:7px; }
        .nav-main-head-actions .nav-btn { min-height:34px; padding:0 11px; font-size:10px; }
        .nav-tabs { display:flex; gap:18px; border-bottom:1px solid var(--line-soft); }
        .nav-tabs button { position:relative; padding:13px 2px 12px; color:#998b9e; border:0; background:transparent; font-size:10px; font-weight:700; cursor:pointer; }
        .nav-tabs button.active { color:#e5bfe0; }
        .nav-tabs button.active:after { content:""; position:absolute; left:0; right:0; bottom:-1px; height:2px; border-radius:3px; background:#c48ab7; }
        .nav-tab-count { display:inline-grid; place-items:center; min-width:17px; height:17px; padding:0 4px; margin-left:5px; border-radius:20px; color:#d7b6d2; background:#39283c; font-size:8px; }
        .nav-toolbar { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:15px 0 13px; }
        .nav-toolbar-left { display:flex; align-items:center; gap:8px; min-width:0; flex:1; }
        .nav-toolbar .nav-search { max-width:340px; width:100%; }
        .nav-toolbar .nav-btn { min-height:36px; font-size:10px; }
        .nav-toolbar-actions { display:flex; align-items:center; gap:7px; }
        .nav-tree-head { display:grid; grid-template-columns:minmax(0,1fr) 130px 225px; gap:8px; padding:10px 12px; border:1px solid #3a2e40; border-radius:9px; background:#221b29; color:#9d8fa4; font-size:8px; font-weight:800; letter-spacing:.8px; }
        .nav-tree-head span:nth-child(2) { text-align:center; }
        .nav-tree-head span:nth-child(3) { text-align:right; }
        .nav-tree-list { padding-top:6px; }
        .nav-item-row { display:flex; align-items:center; gap:7px; min-height:56px; padding-top:5px; padding-bottom:5px; border-bottom:1px solid #2b2330; border-radius:7px; transition:background .14s; }
        .nav-item-row:hover { background:#211a27; }
        .nav-item-row.is-selected { background:#30243a; outline:1px solid #5b4263; }
        .nav-item-row.is-inactive .nav-item-copy strong { color:#ad9fad; }
        .nav-expand { display:grid; place-items:center; width:20px; height:26px; flex:none; color:#96879b; background:transparent; border:0; cursor:pointer; }
        .nav-expand:disabled { cursor:default; opacity:.35; }
        .nav-expand-placeholder { width:4px; }
        .nav-item-main { display:flex; align-items:center; gap:9px; min-width:0; flex:1; padding:0; border:0; text-align:left; color:inherit; background:transparent; cursor:pointer; }
        .nav-item-symbol { display:grid; place-items:center; width:30px; height:30px; flex:none; border:1px solid #4a3850; border-radius:9px; color:#d5a1ca; background:#2b2132; }
        .nav-item-copy { min-width:0; flex:1; }
        .nav-item-copy strong { display:block; color:#e9e0ea; font-size:11px; font-weight:700; }
        .nav-item-copy small { display:block; max-width:390px; margin-top:4px; color:#97899b; font-size:9px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .nav-item-meta { display:flex; align-items:center; justify-content:center; gap:8px; min-width:120px; }
        .nav-role-counter { display:inline-flex; align-items:center; gap:4px; color:#c5a6e2; font-size:9px; }
        .nav-status { display:inline-flex; align-items:center; gap:5px; font-size:9px; color:#a89aa9; }
        .nav-status i { width:6px; height:6px; border-radius:50%; background:#827585; }
        .nav-status.active i { background:#75d99c; box-shadow:0 0 0 3px #254431; }
        .nav-status.inactive i { background:#b77e8a; box-shadow:0 0 0 3px #442b37; }
        .nav-item-actions { display:flex; align-items:center; justify-content:flex-end; gap:2px; min-width:218px; }
        .nav-item-actions button { display:grid; place-items:center; width:27px; height:28px; border:1px solid transparent; border-radius:6px; color:#a99bad; background:transparent; cursor:pointer; }
        .nav-item-actions button:hover:not(:disabled) { color:#f0d5eb; background:#3a2b40; border-color:#594260; }
        .nav-item-actions button:disabled { opacity:.25; cursor:not-allowed; }
        .nav-item-actions button.danger:hover:not(:disabled) { color:#f3a4ad; background:#3a2029; border-color:#643b49; }
        .nav-tree-children { margin-left:24px; border-left:1px solid #4a3850; }
        .nav-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; min-height:240px; gap:8px; color:#a28fa6; }
        .nav-empty strong { color:#e8deeb; font-size:12px; }
        .nav-empty p { max-width:350px; margin:0; color:#928497; font-size:10px; line-height:1.6; }
        .nav-empty .nav-btn { margin-top:7px; }
        .nav-help-line { display:flex; align-items:center; gap:7px; margin-top:14px; color:#8d8093; font-size:9px; line-height:1.5; }
        .nav-detail-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; padding:20px 2px; }
        .nav-detail-box { padding:14px; border:1px solid #3c3042; border-radius:10px; background:#211a27; }
        .nav-detail-box small { display:block; color:#9c8da1; font-size:9px; margin-bottom:7px; }
        .nav-detail-box strong { display:block; color:#eee5ef; font-size:12px; overflow-wrap:anywhere; }
        .nav-detail-action { grid-column:1/-1; display:flex; justify-content:flex-end; }
        .nav-preview { margin-top:16px; padding:18px; border:1px solid #3b2f42; border-radius:12px; background:linear-gradient(145deg,#211a29,#17131c); }
        .nav-preview-top { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:15px; }
        .nav-preview-top strong { display:block; font-size:12px; }
        .nav-preview-top small { display:block; margin-top:4px; color:#98889e; font-size:9px; }
        .nav-preview-bar { display:flex; align-items:center; flex-wrap:wrap; gap:8px; padding:11px; border-radius:9px; border:1px solid #4b3a51; background:#100e15; }
        .nav-preview-brand { display:flex; align-items:center; gap:7px; margin-right:auto; color:#e7c8e3; font-size:11px; font-weight:800; letter-spacing:.6px; }
        .nav-preview-link { display:inline-flex; align-items:center; gap:5px; padding:7px 9px; border:1px solid #3f3346; border-radius:7px; color:#d6c9da; background:#211a28; font-size:9px; }
        .nav-preview-note { margin:12px 0 0; color:#8f8294; font-size:9px; line-height:1.5; }
        .nav-preview-tree { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:10px; margin-top:13px; }
        .nav-preview-card { padding:12px; border-radius:9px; border:1px solid #3c3042; background:#1a151f; }
        .nav-preview-card strong { display:block; color:#e8deeb; font-size:10px; margin-bottom:8px; }
        .nav-preview-card span { display:block; padding:5px 0; color:#a99bab; font-size:9px; border-top:1px solid #302635; }
        .nav-modal-backdrop { position:fixed; inset:0; z-index:1100; display:grid; place-items:center; padding:18px; background:#06040ad9; backdrop-filter:blur(8px); }
        .nav-modal { width:min(100%,560px); max-height:min(92vh,820px); overflow:auto; border:1px solid #604765; border-radius:15px; background:#1b1621; box-shadow:0 30px 100px #0009; }
        .nav-modal-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:20px 22px 16px; border-bottom:1px solid #3b2f42; }
        .nav-modal-eyebrow { display:block; color:#c18ab5; font-size:8px; letter-spacing:1.4px; font-weight:850; }
        .nav-modal-head h2 { margin:6px 0 0; color:#f3eaf4; font-size:18px; letter-spacing:-.4px; }
        .nav-modal-head p { margin:6px 0 0; color:#9c8da0; font-size:10px; }
        .nav-modal-body { display:flex; flex-direction:column; gap:13px; padding:19px 22px 21px; }
        .nav-form-field { display:flex; flex-direction:column; gap:7px; min-width:0; color:#d8cbdc; font-size:10px; font-weight:700; }
        .nav-form-field small { color:#8f8295; font-size:9px; font-weight:400; line-height:1.4; }
        .nav-form-field input, .nav-form-field select { width:100%; height:40px; padding:0 11px; border:1px solid #4a3a50; border-radius:8px; outline:0; color:#f1e9f2; background:#120f17; font-size:11px; }
        .nav-form-field input:focus, .nav-form-field select:focus { border-color:#b47bab; box-shadow:0 0 0 3px #b87aa71c; }
        .nav-form-field input::placeholder { color:#756a7a; }
        .nav-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:11px; }
        .nav-check-row { display:flex; align-items:center; gap:9px; color:#d7cbd9; font-size:10px; cursor:pointer; }
        .nav-check-row input { width:15px; height:15px; accent-color:#ba7ead; }
        .nav-location-options { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
        .nav-location-option { display:flex; align-items:center; gap:9px; padding:10px; border-radius:9px; border:1px solid #443648; background:#211a27; color:#d9cddd; text-align:left; cursor:pointer; }
        .nav-location-option.selected { border-color:#a873a2; background:#35263a; box-shadow:0 0 0 2px #b87aa71a; }
        .nav-location-option-icon { display:grid; place-items:center; width:31px; height:31px; flex:none; border-radius:8px; background:#34253c; color:#d4a0ca; }
        .nav-location-option strong { display:block; font-size:10px; }
        .nav-location-option small { display:block; margin-top:3px; color:#97899c; font-size:8px; }
        .nav-modal-footer { display:flex; justify-content:flex-end; gap:8px; padding-top:13px; margin-top:4px; border-top:1px solid #3a2d40; }
        .nav-import-toolbar { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:9px; }
        .nav-import-toolbar small { color:#9b8da0; font-size:9px; line-height:1.5; }
        .nav-import-upload { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:36px; padding:0 12px; border:1px solid #604968; border-radius:8px; color:#e5c6e0; background:#30243a; font-size:10px; font-weight:700; cursor:pointer; }
        .nav-import-upload:hover { background:#3b2b43; }
        .nav-import-upload input { display:none; }
        .nav-import-textarea { width:100%; min-height:300px; resize:vertical; padding:13px; border:1px solid #4a3a50; border-radius:9px; outline:0; color:#d8c8dc; background:#100d14; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace !important; font-size:10px !important; line-height:1.55; tab-size:2; }
        .nav-import-textarea:focus { border-color:#b47bab; box-shadow:0 0 0 3px #b87aa71c; }
        .nav-import-file { color:#c79ec0; font-size:9px; }
        .nav-import-progress { display:flex; flex-direction:column; gap:8px; padding:12px; border:1px solid #4a3850; border-radius:9px; background:#211a28; }
        .nav-import-progress-head { display:flex; justify-content:space-between; gap:10px; color:#e5d8e8; font-size:10px; }
        .nav-import-progress-track { width:100%; height:7px; overflow:hidden; border-radius:20px; background:#100d14; }
        .nav-import-progress-track span { display:block; height:100%; border-radius:20px; background:linear-gradient(90deg,#a66c9e,#d2a0c5); transition:width .2s ease; }
        .nav-import-report { display:flex; flex-direction:column; gap:8px; padding:12px; border:1px solid #3f6049; border-radius:9px; background:#18251d; }
        .nav-import-report strong { color:#b3e6c3; font-size:11px; }
        .nav-import-report p { margin:0; color:#b4c9b9; font-size:9px; line-height:1.55; }
        .nav-import-errors { display:flex; flex-direction:column; gap:5px; max-height:160px; overflow:auto; padding-left:17px; margin:0; color:#f0b2ba; font-size:9px; line-height:1.5; }
        .nav-permission-list { display:flex; flex-direction:column; gap:7px; }
        .nav-role-row { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 11px; border:1px solid #403248; border-radius:8px; background:#211a28; }
        .nav-role-row strong { color:#e9dfea; font-size:10px; }
        .nav-role-row small { display:block; margin-top:3px; color:#95879a; font-size:9px; }
        .nav-permission-add { display:grid; grid-template-columns:1fr auto; gap:8px; margin-top:13px; }
        .nav-permission-add input { min-width:0; height:38px; padding:0 10px; border:1px solid #4a3a50; border-radius:8px; color:#f1e9f2; background:#120f17; outline:0; font-size:11px; }
        .nav-spin { animation:nav-spin 1s linear infinite; }
        @keyframes nav-spin { to { transform:rotate(360deg); } }
        .nav-loading { display:flex; align-items:center; justify-content:center; gap:9px; min-height:180px; color:#a89aaa; font-size:11px; }
        .nav-footer-note { display:flex; align-items:flex-start; gap:8px; padding:12px; margin-top:16px; border:1px solid #3c3143; border-radius:9px; color:#a99bad; background:#211b27; font-size:9px; line-height:1.5; }
        .nav-footer-note svg { flex:none; color:#c492b9; margin-top:1px; }
        @media (max-width:1100px) {
          .nav-workspace { grid-template-columns:245px minmax(0,1fr); }
          .nav-tree-head { grid-template-columns:minmax(0,1fr) 105px 200px; }
          .nav-item-actions { min-width:190px; }
          .nav-item-actions button { width:24px; }
        }
        @media (max-width:850px) {
          .nav-topline { flex-direction:column; align-items:stretch; }
          .nav-top-actions { justify-content:flex-end; padding-top:0; }
          .nav-stats { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .nav-workspace { grid-template-columns:1fr; }
          .nav-menu-list { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); max-height:260px; }
          .nav-main-panel { min-height:480px; }
        }
        @media (max-width:620px) {
          .navbar-admin { padding:15px 11px 28px; }
          .nav-heading { align-items:flex-start; }
          .nav-heading-icon { width:42px; height:42px; }
          .nav-heading p { line-height:1.5; }
          .nav-top-actions { width:100%; }
          .nav-top-actions .nav-btn { flex:1; }
          .nav-stats { gap:8px; }
          .nav-stat { min-height:72px; padding:11px; gap:8px; }
          .nav-stat-icon { width:32px; height:32px; }
          .nav-stat strong { font-size:19px; }
          .nav-stat small { font-size:9px; }
          .nav-menu-list { grid-template-columns:1fr; }
          .nav-main-panel { padding:0 11px 14px; }
          .nav-main-head { align-items:flex-start; flex-direction:column; }
          .nav-main-head-actions { align-self:flex-end; }
          .nav-toolbar { align-items:stretch; flex-direction:column; }
          .nav-toolbar-left { width:100%; }
          .nav-toolbar .nav-search { max-width:none; }
          .nav-toolbar-actions { width:100%; }
          .nav-toolbar-actions .nav-btn { flex:1; }
          .nav-tree-head { grid-template-columns:minmax(0,1fr) 62px 85px; gap:4px; padding:9px 7px; font-size:7px; }
          .nav-item-row { flex-wrap:wrap; gap:5px; padding:8px 5px; }
          .nav-item-main { flex-basis:calc(100% - 35px); }
          .nav-item-meta { min-width:initial; margin-left:31px; margin-right:auto; }
          .nav-item-actions { min-width:initial; }
          .nav-item-actions button { width:25px; height:25px; }
          .nav-item-copy small { max-width:210px; }
          .nav-detail-grid { grid-template-columns:1fr; }
          .nav-detail-action { grid-column:auto; }
          .nav-form-grid, .nav-location-options { grid-template-columns:1fr; }
          .nav-modal-head, .nav-modal-body { padding-left:15px; padding-right:15px; }
          .nav-modal-footer { flex-wrap:wrap; }
          .nav-modal-footer .nav-btn { flex:1; }
        }
        @media (prefers-reduced-motion:reduce) {
          .navbar-admin *, .navbar-admin *:before, .navbar-admin *:after { animation-duration:.01ms !important; transition-duration:.01ms !important; scroll-behavior:auto !important; }
        }
      `}</style>

      <div className="nav-admin-shell">
        <header className="nav-topline">
          <div>
            <div className="nav-breadcrumb">
              Painel <ChevronRight size={12} /> Conteúdo <ChevronRight size={12} />
              <strong>Menus e navegação</strong>
            </div>

            <div className="nav-heading">
              <div className="nav-heading-icon"><MenuIcon size={23} /></div>
              <div>
                <h1>Menus e navegação</h1>
                <p>Gerencie os caminhos, links, submenus e acessos da loja <span>Universo Império</span>.</p>
              </div>
            </div>
          </div>

          <div className="nav-top-actions">
            <button
              type="button"
              className="nav-btn nav-btn-secondary"
              onClick={openImportModal}
            >
              <FileJson size={15} />
              Importar JSON
            </button>
            <button
              type="button"
              className="nav-btn nav-btn-secondary"
              onClick={() => void loadMenus(true)}
              disabled={loading}
            >
              {loading ? <LoaderCircle size={15} className="nav-spin" /> : <RefreshCw size={15} />}
              Atualizar dados
            </button>
            <button type="button" className="nav-btn nav-btn-primary" onClick={openNewMenu}>
              <Plus size={16} /> Criar menu
            </button>
          </div>
        </header>

        {notice && (
          <div className={`nav-flash ${notice.type}`} role="status">
            {notice.type === "success" ? <CheckCircle2 size={16} /> : notice.type === "error" ? <AlertCircle size={16} /> : <CircleHelp size={16} />}
            <span>{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Fechar aviso"><X size={15} /></button>
          </div>
        )}

        <section className="nav-stats" aria-label="Resumo dos menus">
          <article className="nav-stat">
            <span className="nav-stat-icon"><FolderTree size={18} /></span>
            <div><small>Menus cadastrados</small><strong>{displayCounts.menus}</strong><em>{displayCounts.menusAtivos} publicados/ativos</em></div>
          </article>
          <article className="nav-stat">
            <span className="nav-stat-icon"><Link2 size={18} /></span>
            <div><small>Itens e subitens</small><strong>{displayCounts.itens}</strong><em>{displayCounts.itensAtivos} ativos na estrutura</em></div>
          </article>
          <article className="nav-stat">
            <span className="nav-stat-icon"><EyeOff size={18} /></span>
            <div><small>Itens inativos</small><strong>{displayCounts.itensInativos}</strong><em>Ocultos na navegação pública</em></div>
          </article>
          <article className="nav-stat">
            <span className="nav-stat-icon"><ShieldCheck size={18} /></span>
            <div><small>Associações de acesso</small><strong>{displayCounts.associacoes}</strong><em>Vínculos entre itens e papéis</em></div>
          </article>
        </section>

        <section className="nav-workspace">
          <aside className="nav-side">
            <div className="nav-side-head">
              <div><h2>Seus menus</h2><p>{menus.length} estrutura(s) cadastrada(s)</p></div>
              <button type="button" className="nav-icon-btn" title="Novo menu" onClick={openNewMenu}><Plus size={17} /></button>
            </div>

            <div className="nav-side-tools">
              <div className="nav-search">
                <Search size={15} />
                <input
                  value={menuSearch}
                  onChange={(event) => setMenuSearch(event.target.value)}
                  placeholder="Buscar menu..."
                  aria-label="Buscar menus"
                />
              </div>
              <div className="nav-filter-line">
                {(["todos", "ativos", "inativos"] as StatusFilter[]).map((filter) => (
                  <button
                    type="button"
                    key={filter}
                    className={`nav-filter-chip ${menuStatusFilter === filter ? "active" : ""}`}
                    onClick={() => setMenuStatusFilter(filter)}
                  >
                    {filter === "todos" ? "Todos" : filter === "ativos" ? "Ativos" : "Inativos"}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="nav-loading"><LoaderCircle size={18} className="nav-spin" /> Carregando menus...</div>
            ) : visibleMenus.length === 0 ? (
              <div className="nav-side-empty">
                <FolderTree size={27} />
                <strong>{menus.length ? "Nenhum menu encontrado" : "Comece criando um menu"}</strong>
                <span>{menus.length ? "Altere a busca ou o filtro de situação." : "Crie a estrutura que organiza a navegação da sua loja."}</span>
                {!menus.length && <button type="button" className="nav-btn nav-btn-primary" onClick={openNewMenu}><Plus size={14} /> Criar primeiro menu</button>}
              </div>
            ) : (
              <div className="nav-menu-list">
                {visibleMenus.map((menu) => (
                  <button
                    type="button"
                    key={menu.id}
                    className={`nav-menu-choice ${selectedMenuId === menu.id ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedMenuId(menu.id);
                      setSelectedItemId(null);
                      setItemSearch("");
                      setActiveTab("estrutura");
                    }}
                  >
                    <span className="nav-menu-choice-icon"><MenuIcon size={16} /></span>
                    <span className="nav-menu-choice-text">
                      <strong>{menu.nome}</strong>
                      <small>{menu.codigo || "SEM_CÓDIGO"} · {LOCATION_LABELS[menu.localizacao] ?? menu.localizacao}</small>
                    </span>
                    <i className={`nav-menu-status ${menu.ativo ? "active" : "inactive"}`} />
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="nav-main-panel">
            {!selectedMenu ? (
              <div className="nav-empty">
                <FolderTree size={40} />
                <strong>{loading ? "Carregando estrutura..." : "Selecione um menu para começar"}</strong>
                <p>Escolha um menu à esquerda ou crie uma nova estrutura para configurar os links da loja.</p>
                {!loading && <button type="button" className="nav-btn nav-btn-primary" onClick={openNewMenu}><Plus size={15} /> Criar menu</button>}
              </div>
            ) : (
              <>
                <div className="nav-main-head">
                  <div className="nav-main-title">
                    <span className="nav-main-title-icon"><MenuIcon size={18} /></span>
                    <div>
                      <h2>{selectedMenu.nome}</h2>
                      <p><code>{selectedMenu.codigo || "SEM_CÓDIGO"}</code> · {activeLocation} · {allItems.length} item(ns)</p>
                    </div>
                    <span className={`nav-pill ${selectedMenu.ativo ? "active" : "inactive"}`}>
                      <i /> {selectedMenu.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <div className="nav-main-head-actions">
                    <button type="button" className="nav-btn nav-btn-secondary" onClick={() => openEditMenu(selectedMenu)}>
                      <Pencil size={14} /> Editar menu
                    </button>
                    <button
                      type="button"
                      className="nav-icon-btn"
                      title={selectedMenu.ativo ? "Desativar menu" : "Ativar menu"}
                      onClick={() => void toggleMenu(selectedMenu)}
                      disabled={workingKey !== null}
                    >
                      {selectedMenu.ativo ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button
                      type="button"
                      className="nav-icon-btn danger"
                      title="Excluir menu"
                      onClick={() => void deleteMenu(selectedMenu)}
                      disabled={workingKey !== null}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="nav-tabs">
                  <button type="button" className={activeTab === "estrutura" ? "active" : ""} onClick={() => setActiveTab("estrutura")}>
                    <ListTree size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />
                    Estrutura <span className="nav-tab-count">{allItems.length}</span>
                  </button>
                  <button type="button" className={activeTab === "previa" ? "active" : ""} onClick={() => setActiveTab("previa")}>
                    <Eye size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />
                    Prévia da navegação
                  </button>
                  <button type="button" className={activeTab === "detalhes" ? "active" : ""} onClick={() => setActiveTab("detalhes")}>
                    <Activity size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />
                    Detalhes
                  </button>
                </div>

                {activeTab === "estrutura" && (
                  <>
                    <div className="nav-toolbar">
                      <div className="nav-toolbar-left">
                        <div className="nav-search">
                          <Search size={15} />
                          <input
                            value={itemSearch}
                            onChange={(event) => setItemSearch(event.target.value)}
                            placeholder="Buscar nome, rota ou ID..."
                            aria-label="Buscar itens"
                          />
                        </div>
                        <select
                          className="nav-filter-chip active"
                          aria-label="Filtrar situação dos itens"
                          value={itemStatusFilter}
                          onChange={(event) => setItemStatusFilter(event.target.value as StatusFilter)}
                        >
                          <option value="todos">Todas situações</option>
                          <option value="ativos">Somente ativos</option>
                          <option value="inativos">Somente inativos</option>
                        </select>
                      </div>

                      <div className="nav-toolbar-actions">
                        <button type="button" className="nav-btn nav-btn-secondary" onClick={expandAll} title="Expandir submenus">
                          <ChevronDown size={14} /> Expandir
                        </button>
                        <button type="button" className="nav-btn nav-btn-secondary" onClick={collapseAll} title="Recolher submenus">
                          <ChevronRight size={14} /> Recolher
                        </button>
                        <button type="button" className="nav-btn nav-btn-primary" onClick={() => openNewItem()}>
                          <Plus size={15} /> Adicionar item
                        </button>
                      </div>
                    </div>

                    <div className="nav-tree-head"><span>ITEM / ROTA</span><span>STATUS</span><span>AÇÕES</span></div>

                    {loading ? (
                      <div className="nav-loading"><LoaderCircle size={18} className="nav-spin" /> Atualizando estrutura...</div>
                    ) : visibleItems.length > 0 ? (
                      <div className="nav-tree-list">{visibleItems.map((item) => renderItem(item, visibleItems))}</div>
                    ) : (
                      <div className="nav-empty">
                        <Link2 size={34} />
                        <strong>{itemSearch || itemStatusFilter !== "todos" ? "Nenhum item corresponde ao filtro" : "Este menu ainda não possui itens"}</strong>
                        <p>{itemSearch || itemStatusFilter !== "todos" ? "Limpe a pesquisa ou altere a situação para encontrar outros itens." : "Adicione links e submenus para montar a navegação da loja."}</p>
                        {!itemSearch && itemStatusFilter === "todos" && <button type="button" className="nav-btn nav-btn-primary" onClick={() => openNewItem()}><Plus size={14} /> Adicionar primeiro item</button>}
                      </div>
                    )}

                    <div className="nav-help-line">
                      <CircleHelp size={14} />
                      Selecione uma linha para destacá-la. Use o botão <Plus size={12} /> para criar subitens e o escudo para controlar os papéis que podem acessar cada link.
                    </div>
                  </>
                )}

                {activeTab === "previa" && (
                  <div className="nav-preview">
                    <div className="nav-preview-top">
                      <div><strong>Prévia de navegação</strong><small>Representação simplificada do menu configurado</small></div>
                      <span className="nav-pill active"><Eye size={11} /> Visualização</span>
                    </div>
                    <div className="nav-preview-bar">
                      <div className="nav-preview-brand"><Sparkles size={14} /> UNIVERSO IMPÉRIO</div>
                      {selectedMenu.itens.filter((item) => item.ativo).map((item) => (
                        <span className="nav-preview-link" key={item.id}>
                          {item.nome} {item.subitens.some((child) => child.ativo) && <ChevronDown size={11} />}
                        </span>
                      ))}
                      {selectedMenu.itens.every((item) => !item.ativo) && <small style={{ color: "#93869a", fontSize: 9 }}>Nenhum item principal ativo para exibir.</small>}
                    </div>
                    <p className="nav-preview-note">Esta prévia é ilustrativa. A aparência final depende do componente de navbar da loja e dos estilos públicos aplicados no site.</p>
                    <div className="nav-preview-tree">
                      {selectedMenu.itens.filter((item) => item.ativo).map((item) => (
                        <div className="nav-preview-card" key={item.id}>
                          <strong>{item.nome}</strong>
                          {item.subitens.filter((child) => child.ativo).length > 0
                            ? item.subitens.filter((child) => child.ativo).map((child) => <span key={child.id}>↳ {child.nome}</span>)
                            : <span>{item.rota || "Link sem rota"}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "detalhes" && (
                  <>
                    <div className="nav-detail-grid">
                      <div className="nav-detail-box"><small>Nome do menu</small><strong>{selectedMenu.nome}</strong></div>
                      <div className="nav-detail-box"><small>Código interno</small><strong>{selectedMenu.codigo || "Não definido"}</strong></div>
                      <div className="nav-detail-box"><small>Localização</small><strong>{activeLocation}</strong></div>
                      <div className="nav-detail-box"><small>Situação</small><strong>{selectedMenu.ativo ? "Ativo" : "Inativo"}</strong></div>
                      <div className="nav-detail-box"><small>Itens principais</small><strong>{rootItems}</strong></div>
                      <div className="nav-detail-box"><small>Total de itens e subitens</small><strong>{allItems.length}</strong></div>
                      <div className="nav-detail-action">
                        <button type="button" className="nav-btn nav-btn-secondary" onClick={() => openEditMenu(selectedMenu)}>
                          <Pencil size={14} /> Editar informações
                        </button>
                      </div>
                    </div>
                    <div className="nav-footer-note"><ShieldCheck size={15} /> As permissões de visualização são configuradas por item, através das associações com papéis. Um item sem associação será tratado conforme as regras de acesso existentes no backend.</div>
                  </>
                )}
              </>
            )}
          </section>
        </section>
      </div>

      {modal && (
        <div
          className="nav-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving && !workingKey) setModal(null);
          }}
        >
          <section className="nav-modal" role="dialog" aria-modal="true">
            <div className="nav-modal-head">
              <div>
                <span className="nav-modal-eyebrow">
                  {modal === "menu" ? "CONFIGURAÇÃO DO MENU" : modal === "item" ? "ESTRUTURA DE NAVEGAÇÃO" : "CONTROLE DE ACESSO"}
                </span>
                <h2>
                  {modal === "menu"
                    ? editingMenu ? "Editar menu" : "Criar menu"
                    : modal === "item"
                      ? editingItem ? "Editar item" : "Adicionar item"
                      : "Papéis autorizados"}
                </h2>
                <p>
                  {modal === "permissions" && selectedItem
                    ? `Defina quais papéis podem acessar "${selectedItem.nome}".`
                    : modal === "menu"
                      ? "Defina o nome, identificador e posição deste menu."
                      : modal === "import"
                        ? "Crie menus novos ou acrescente itens a um menu e item pai existentes."
                        : "Configure o destino, a hierarquia e a situação do link."}
                </p>
              </div>
              <button type="button" className="nav-icon-btn" onClick={() => !saving && !workingKey && setModal(null)} disabled={saving || workingKey !== null} aria-label="Fechar"><X size={17} /></button>
            </div>

            {modal === "import" && (
              <div className="nav-modal-body">
                <div className="nav-footer-note" style={{ marginTop: 0 }}>
                  <FileJson size={15} />
                  Você pode criar menus novos ou adicionar itens dentro de um item já existente. Para esta importação de Minha conta, o painel localiza MENU_PRINCIPAL e o item Minha conta pela API, sem criar outro menu.
                </div>

                <div className="nav-import-toolbar">
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <strong style={{ color: "#e8ddea", fontSize: 10 }}>Arquivo de importação</strong>
                    <small>Envie um .json ou cole o conteúdo no editor abaixo.</small>
                    {importFileName && <span className="nav-import-file">Arquivo carregado: {importFileName}</span>}
                  </div>

                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    <label className="nav-import-upload">
                      <Upload size={14} />
                      Selecionar JSON
                      <input
                        type="file"
                        accept=".json,application/json"
                        disabled={importRunning}
                        onChange={(event) => {
                          void handleImportFile(event.target.files?.[0]);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="nav-btn nav-btn-secondary"
                      onClick={downloadImportTemplate}
                      disabled={importRunning}
                    >
                      <Download size={14} /> Modelo JSON
                    </button>
                  </div>
                </div>

                <label className="nav-form-field">
                  Conteúdo JSON
                  <textarea
                    className="nav-import-textarea"
                    spellCheck={false}
                    value={importJson}
                    disabled={importRunning}
                    onChange={(event) => {
                      setImportJson(event.target.value);
                      setImportReport(null);
                      setImportFileName("");
                    }}
                    placeholder='Cole aqui um JSON de criação ou inclusão em um item existente...'
                  />
                  <small>
                    Para criar menus, use "menus": [...]. Para acrescentar itens a um item existente, use "adicionarEm" com "menuCodigo" e "itemPaiNome", além da lista "itens". Para filhos, use "subitens". Para papéis, informe IDs numéricos em "papeisIds".
                  </small>
                </label>

                {importProgress && (
                  <div className="nav-import-progress">
                    <div className="nav-import-progress-head">
                      <span>{importProgress.label}</span>
                      <strong>{importProgress.completed}/{importProgress.total}</strong>
                    </div>
                    <div className="nav-import-progress-track">
                      <span style={{ width: `${importProgress.total > 0 ? (importProgress.completed / importProgress.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                )}

                {importReport && (
                  <div className="nav-import-report">
                    <strong>Relatório da importação</strong>
                    <p>
                      Menus: {importReport.menus} · Itens e subitens: {importReport.itens} · Associações de papéis: {importReport.associacoes} · Ocorrências: {importReport.erros.length}
                    </p>
                    {importReport.erros.length > 0 && (
                      <ul className="nav-import-errors">
                        {importReport.erros.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}
                      </ul>
                    )}
                  </div>
                )}

                <div className="nav-footer-note" style={{ marginTop: 0 }}>
                  <CircleHelp size={15} />
                  A importação é de inclusão: não apaga nem substitui menus existentes. Se um código já existir, a API poderá rejeitar o cadastro. Em caso de falha parcial, confira o relatório antes de importar novamente para não duplicar registros.
                </div>

                <div className="nav-modal-footer">
                  <button
                    type="button"
                    className="nav-btn nav-btn-secondary"
                    onClick={() => setModal(null)}
                    disabled={importRunning}
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    className="nav-btn nav-btn-primary"
                    onClick={() => void importMenusFromJson()}
                    disabled={importRunning || !importJson.trim()}
                  >
                    {importRunning ? <LoaderCircle size={14} className="nav-spin" /> : <Upload size={14} />}
                    {importRunning ? "Importando..." : "Validar e cadastrar"}
                  </button>
                </div>
              </div>
            )}

            {modal === "menu" && (
              <form className="nav-modal-body" onSubmit={(event) => void saveMenu(event)}>
                <label className="nav-form-field">
                  Nome do menu
                  <input
                    required
                    maxLength={100}
                    value={menuForm.nome}
                    onChange={(event) => {
                      const nome = event.target.value;
                      setMenuForm((current) => ({
                        ...current,
                        nome,
                        codigo: menuCodeTouched ? current.codigo : createMenuCode(nome),
                      }));
                    }}
                    placeholder="Ex.: Navegação principal"
                  />
                  <small>Nome que identifica a área de navegação no painel.</small>
                </label>

                <label className="nav-form-field">
                  Código identificador
                  <input
                    required
                    maxLength={80}
                    value={menuForm.codigo}
                    onChange={(event) => {
                      setMenuCodeTouched(true);
                      setMenuForm({ ...menuForm, codigo: createMenuCode(event.target.value) });
                    }}
                    placeholder="MENU_PRINCIPAL"
                  />
                  <small>Identificador único utilizado pelo sistema para localizar o menu.</small>
                </label>

                <div className="nav-form-field">
                  Localização do menu
                  <div className="nav-location-options">
                    {LOCATION_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          type="button"
                          key={option.value}
                          className={`nav-location-option ${menuForm.localizacao === option.value ? "selected" : ""}`}
                          onClick={() => setMenuForm({ ...menuForm, localizacao: option.value })}
                        >
                          <span className="nav-location-option-icon"><Icon size={15} /></span>
                          <span><strong>{option.label}</strong><small>{option.description}</small></span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="nav-check-row">
                  <input type="checkbox" checked={menuForm.ativo} onChange={(event) => setMenuForm({ ...menuForm, ativo: event.target.checked })} />
                  Exibir este menu como ativo
                </label>

                <div className="nav-modal-footer">
                  <button type="button" className="nav-btn nav-btn-secondary" onClick={() => setModal(null)} disabled={saving}>Cancelar</button>
                  <button type="submit" className="nav-btn nav-btn-primary" disabled={saving}>
                    {saving ? <LoaderCircle size={14} className="nav-spin" /> : <Check size={14} />}
                    {editingMenu ? "Salvar alterações" : "Criar menu"}
                  </button>
                </div>
              </form>
            )}

            {modal === "item" && (
              <form className="nav-modal-body" onSubmit={(event) => void saveItem(event)}>
                <label className="nav-form-field">
                  Nome do item
                  <input
                    required
                    maxLength={120}
                    value={itemForm.nome}
                    onChange={(event) => setItemForm({ ...itemForm, nome: event.target.value })}
                    placeholder="Ex.: Produtos, Sobre nós, Contato..."
                  />
                </label>

                <label className="nav-form-field">
                  Item pai
                  <select
                    value={itemForm.itemPaiId}
                    onChange={(event) => setItemForm({ ...itemForm, itemPaiId: event.target.value })}
                  >
                    <option value="">Nenhum — item principal</option>
                    {allItems
                      .filter((item) => {
                        if (!editingItem) return true;
                        return item.id !== editingItem.id && !getDescendantIds(editingItem).includes(item.id);
                      })
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nome}
                        </option>
                      ))}
                  </select>
                  <small>Escolha um item pai para criar um submenu.</small>
                </label>

                <label className="nav-form-field">
                  Rota ou endereço
                  <input
                    value={itemForm.rota}
                    onChange={(event) => setItemForm({ ...itemForm, rota: event.target.value })}
                    placeholder={itemForm.urlExterna ? "https://exemplo.com" : "/produtos"}
                  />
                  <small>{itemForm.urlExterna ? "Use endereço completo com https://." : "Use uma rota interna iniciada por /."}</small>
                </label>

                <div className="nav-form-grid">
                  <label className="nav-form-field">
                    Nome do ícone
                    <input
                      value={itemForm.icone}
                      onChange={(event) => setItemForm({ ...itemForm, icone: event.target.value })}
                      placeholder="Ex.: house, shopping-bag"
                    />
                  </label>
                  <label className="nav-form-field">
                    Ordem de exibição
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={itemForm.ordem}
                      onChange={(event) => setItemForm({ ...itemForm, ordem: event.target.value })}
                    />
                  </label>
                </div>

                <label className="nav-check-row">
                  <input
                    type="checkbox"
                    checked={itemForm.urlExterna}
                    onChange={(event) => setItemForm({ ...itemForm, urlExterna: event.target.checked })}
                  />
                  Este link direciona para um site externo
                  <ExternalLink size={13} />
                </label>

                <label className="nav-check-row">
                  <input type="checkbox" checked={itemForm.ativo} onChange={(event) => setItemForm({ ...itemForm, ativo: event.target.checked })} />
                  Item ativo e visível na navegação
                </label>

                <div className="nav-modal-footer">
                  <button type="button" className="nav-btn nav-btn-secondary" onClick={() => setModal(null)} disabled={saving}>Cancelar</button>
                  <button type="submit" className="nav-btn nav-btn-primary" disabled={saving}>
                    {saving ? <LoaderCircle size={14} className="nav-spin" /> : <Check size={14} />}
                    {editingItem ? "Salvar alterações" : "Adicionar item"}
                  </button>
                </div>
              </form>
            )}

            {modal === "permissions" && selectedItem && (
              <div className="nav-modal-body">
                <div className="nav-detail-box">
                  <small>Item selecionado</small>
                  <strong>{selectedItem.nome}</strong>
                  <small style={{ marginTop: 7 }}>
                    {selectedItem.rota || "Sem rota definida"}
                  </small>
                </div>

                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      marginBottom: 9,
                    }}
                  >
                    <strong style={{ fontSize: 11 }}>
                      Papéis cadastrados no banco
                    </strong>
                    <span className="nav-pill active">
                      {assignedRoleIds.length} associado(s)
                    </span>
                  </div>

                  {permissionsLoading ? (
                    <div className="nav-loading">
                      <LoaderCircle size={17} className="nav-spin" />
                      Consultando papéis e associações na API...
                    </div>
                  ) : availableRoles.length > 0 ? (
                    <div className="nav-permission-list">
                      {availableRoles.map((role) => {
                        const checked = assignedRoleIds.includes(role.id);
                        const busy = permissionActionId === role.id;

                        return (
                          <label className="nav-role-row" key={role.id}>
                            <div>
                              <strong>{role.nome}</strong>
                              <small>
                                {role.codigo || `ID ${role.id}`}
                                {role.descricao ? ` · ${role.descricao}` : ""}
                                {!role.ativo ? " · Inativo" : ""}
                              </small>
                            </div>

                            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                              {busy && (
                                <LoaderCircle size={14} className="nav-spin" />
                              )}
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={!role.ativo || permissionActionId !== null}
                                onChange={() => void toggleRoleAssociation(role)}
                                aria-label={`${checked ? "Remover" : "Associar"} papel ${role.nome}`}
                              />
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="nav-footer-note">
                      <CircleHelp size={14} />
                      A API não retornou papéis cadastrados. Verifique a rota de listagem de papéis e a autenticação do painel.
                    </div>
                  )}
                </div>

                <div className="nav-footer-note">
                  <ShieldCheck size={15} />
                  As associações são consultadas e atualizadas no backend pelas rotas de papéis da Navbar. As alterações são persistidas no banco pela API PHP.
                </div>

                <div className="nav-modal-footer">
                  <button
                    type="button"
                    className="nav-btn nav-btn-secondary"
                    onClick={() => setModal(null)}
                    disabled={permissionActionId !== null}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}