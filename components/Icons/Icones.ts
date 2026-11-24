import { createElement } from "react";
import type { IconType } from "react-icons";

import {
  // GERAL
  FiActivity,
  FiAirplay,
  FiAlertCircle,
  FiArchive,
  FiArrowDown,
  FiArrowLeft,
  FiArrowRight,
  FiArrowUp,
  FiAward,
  // GRÁFICOS
  FiBarChart,
  FiBell,
  FiBook,
  FiBookmark,
  // PRODUTOS E ESTOQUE
  FiBox,
  FiBriefcase,
  FiCalendar,
  FiCamera,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiCircle,
  FiClipboard,
  FiClock,
  FiCloud,
  FiCode,
  FiCoffee,
  FiCompass,
  FiCopy,
  FiCreditCard,
  FiDatabase,
  FiDownload,
  FiEdit,
  FiExternalLink,
  FiEye,
  FiEyeOff,
  // DOCUMENTOS
  FiFile,
  FiFileText,
  FiFilter,
  FiFlag,
  FiFolder,
  FiGift,
  FiGlobe,
  FiGrid,
  FiHardDrive,
  FiHash,
  FiHeadphones,
  FiHeart,
  FiHelpCircle,
  // NAVEGAÇÃO
  FiHome,
  FiImage,
  FiInbox,
  FiInfo,
  FiKey,
  FiLayers,
  FiLayout,
  FiLifeBuoy,
  FiList,
  FiLock,
  FiLogIn,
  FiLogOut,
  // COMUNICAÇÃO
  FiMail,
  // LOCALIZAÇÃO
  FiMap,
  FiMapPin,
  FiMenu,
  FiMessageCircle,
  FiMessageSquare,
  FiMinus,
  FiMonitor,
  FiMoon,
  FiMoreHorizontal,
  FiMoreVertical,
  FiPackage,
  FiPaperclip,
  FiPause,
  FiPercent,
  FiPhone,
  FiPieChart,
  FiPlay,
  FiPlus,
  FiPrinter,
  FiRefreshCw,
  FiRepeat,
  FiSave,
  FiSearch,
  FiSend,
  FiServer,
  // SISTEMA
  FiSettings,
  FiShare2,
  FiShield,
  FiShoppingBag,
  // LOJA E VENDAS
  FiShoppingCart,
  FiShuffle,
  FiSidebar,
  FiSliders,
  FiSmartphone,
  FiSmile,
  FiSpeaker,
  FiStar,
  FiSun,
  FiTag,
  FiTarget,
  FiTerminal,
  // OUTROS
  FiThumbsUp,
  FiToggleLeft,
  FiTool,
  FiTrash2,
  FiTrendingUp,
  FiTruck,
  FiTv,
  FiUmbrella,
  FiUnlock,
  FiUpload,
  // USUÁRIOS E ACESSO
  FiUser,
  FiUserCheck,
  FiUserPlus,
  FiUsers,
  // MÍDIA
  FiVideo,
  FiVolume2,
  FiWifi,
  FiX,
  FiXCircle,
  FiZap,
} from "react-icons/fi";

// =====================================================
// TIPAGEM
// =====================================================

export type IconeNome = string;

export interface IconeProps {
  nome?: string | null;
  tamanho?: number;
  className?: string;
}

// =====================================================
// NORMALIZAÇÃO DOS NOMES
// =====================================================

export function normalizarNomeIcone(nome: string | null | undefined): string {
  return (nome ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_]+/g, "-");
}

// =====================================================
// CATÁLOGO DE ÍCONES
// =====================================================

export const ICONES: Record<string, IconType> = {
  // ---------------------------------------------------
  // GERAL
  // ---------------------------------------------------

  activity: FiActivity,
  atividade: FiActivity,

  airplay: FiAirplay,

  alert: FiAlertCircle,
  alerta: FiAlertCircle,
  "alert-circle": FiAlertCircle,

  archive: FiArchive,
  arquivo: FiFile,

  award: FiAward,
  premio: FiAward,

  bookmark: FiBookmark,
  favorito: FiBookmark,

  briefcase: FiBriefcase,
  portfolio: FiBriefcase,

  calendar: FiCalendar,
  calendario: FiCalendar,

  camera: FiCamera,

  check: FiCheck,
  verificar: FiCheck,

  "check-circle": FiCheckCircle,
  sucesso: FiCheckCircle,

  circle: FiCircle,

  clock: FiClock,
  relogio: FiClock,

  cloud: FiCloud,

  code: FiCode,
  codigo: FiCode,
  "codigo-fonte": FiCode,

  coffee: FiCoffee,
  cafe: FiCoffee,

  compass: FiCompass,

  copy: FiCopy,
  copiar: FiCopy,

  gift: FiGift,
  presente: FiGift,

  globe: FiGlobe,
  mundo: FiGlobe,

  hash: FiHash,

  headphones: FiHeadphones,

  help: FiHelpCircle,
  ajuda: FiHelpCircle,
  "help-circle": FiHelpCircle,

  info: FiInfo,
  informacao: FiInfo,

  "life-buoy": FiLifeBuoy,
  suporte: FiLifeBuoy,

  smile: FiSmile,
  sorriso: FiSmile,

  star: FiStar,
  estrela: FiStar,

  sun: FiSun,
  sol: FiSun,

  moon: FiMoon,
  lua: FiMoon,

  target: FiTarget,
  alvo: FiTarget,

  tool: FiTool,
  ferramenta: FiTool,

  umbrella: FiUmbrella,

  zap: FiZap,
  raio: FiZap,

  // ---------------------------------------------------
  // MARCA E IDENTIDADE
  // ---------------------------------------------------

  crown: FiAward,
  coroa: FiAward,
  imperio: FiAward,
  logo: FiAward,

  // ---------------------------------------------------
  // NAVEGAÇÃO
  // ---------------------------------------------------

  home: FiHome,
  house: FiHome,
  inicio: FiHome,

  menu: FiMenu,

  grid: FiGrid,
  "grid-2x2": FiGrid,

  layout: FiLayout,

  "layout-dashboard": FiLayout,
  dashboard: FiLayout,
  painel: FiLayout,
  "admin-panel": FiLayout,

  sidebar: FiSidebar,

  search: FiSearch,
  busca: FiSearch,
  pesquisar: FiSearch,

  filter: FiFilter,
  filtro: FiFilter,

  sliders: FiSliders,

  "chevron-down": FiChevronDown,
  "chevron-up": FiChevronUp,
  "chevron-left": FiChevronLeft,
  "chevron-right": FiChevronRight,

  "arrow-down": FiArrowDown,
  "arrow-up": FiArrowUp,
  "arrow-left": FiArrowLeft,
  "arrow-right": FiArrowRight,

  "external-link": FiExternalLink,

  "more-horizontal": FiMoreHorizontal,
  "more-vertical": FiMoreVertical,

  // ---------------------------------------------------
  // PRODUTOS
  // ---------------------------------------------------

  box: FiBox,
  caixa: FiBox,

  package: FiPackage,
  produto: FiPackage,
  produtos: FiPackage,
  product: FiPackage,
  products: FiPackage,

  image: FiImage,
  imagem: FiImage,
  galeria: FiImage,

  tag: FiTag,
  tags: FiTag,
  categoria: FiTag,
  price: FiTag,
  preco: FiTag,

  percent: FiPercent,
  desconto: FiPercent,
  discount: FiPercent,

  barcode: FiHash,
  "codigo-barras": FiHash,
  sku: FiHash,

  layers: FiLayers,
  camadas: FiLayers,
  categorias: FiLayers,

  inventory: FiArchive,
  estoque: FiArchive,

  harddrive: FiHardDrive,
  "hard-drive": FiHardDrive,

  truck: FiTruck,
  entrega: FiTruck,
  delivery: FiTruck,
  shipping: FiTruck,

  // ---------------------------------------------------
  // LOJA E VENDAS
  // ---------------------------------------------------

  cart: FiShoppingCart,
  carrinho: FiShoppingCart,
  "shopping-cart": FiShoppingCart,

  heart: FiHeart,
  wishlist: FiHeart,
  desejos: FiHeart,
  favorite: FiHeart,
  favoritos: FiHeart,

  store: FiShoppingBag,
  loja: FiShoppingBag,
  bag: FiShoppingBag,
  "shopping-bag": FiShoppingBag,

  sales: FiTrendingUp,
  vendas: FiTrendingUp,
  trending: FiTrendingUp,
  "trending-up": FiTrendingUp,

  orders: FiClipboard,
  pedido: FiClipboard,
  pedidos: FiClipboard,
  order: FiClipboard,

  // ---------------------------------------------------
  // USUÁRIOS E ACESSO
  // ---------------------------------------------------

  user: FiUser,
  usuario: FiUser,
  "user-round": FiUser,
  "user-circle": FiUser,
  account: FiUser,
  conta: FiUser,
  perfil: FiUser,

  users: FiUsers,
  usuarios: FiUsers,
  clientes: FiUsers,
  customer: FiUser,
  customers: FiUsers,

  "user-check": FiUserCheck,
  "user-plus": FiUserPlus,

  login: FiLogIn,
  "log-in": FiLogIn,

  logout: FiLogOut,
  "log-out": FiLogOut,
  sair: FiLogOut,

  lock: FiLock,
  cadeado: FiLock,

  unlock: FiUnlock,

  key: FiKey,
  chave: FiKey,

  shield: FiShield,
  seguranca: FiShield,
  permissao: FiShield,
  permissoes: FiShield,

  // ---------------------------------------------------
  // FINANCEIRO E RELATÓRIOS
  // ---------------------------------------------------

  finance: FiBarChart,
  financeiro: FiBarChart,
  financial: FiBarChart,

  chart: FiBarChart,
  "bar-chart": FiBarChart,

  "pie-chart": FiPieChart,
  grafico: FiBarChart,

  relatorios: FiBarChart,
  report: FiBarChart,

  creditcard: FiCreditCard,
  "credit-card": FiCreditCard,
  payment: FiCreditCard,
  pagamento: FiCreditCard,
  pagamentos: FiCreditCard,

  // ---------------------------------------------------
  // COMUNICAÇÃO E MARKETING
  // ---------------------------------------------------

  mail: FiMail,
  email: FiMail,

  phone: FiPhone,
  telefone: FiPhone,

  message: FiMessageCircle,
  mensagem: FiMessageCircle,
  whatsapp: FiMessageCircle,
  "message-circle": FiMessageCircle,
  "message-square": FiMessageSquare,

  send: FiSend,
  enviar: FiSend,

  bell: FiBell,
  notification: FiBell,
  notifications: FiBell,
  notificacoes: FiBell,

  speaker: FiSpeaker,
  megaphone: FiSpeaker,
  marketing: FiSpeaker,
  campanha: FiSpeaker,
  campanhas: FiSpeaker,

  // ---------------------------------------------------
  // DOCUMENTOS
  // ---------------------------------------------------

  file: FiFile,
  documento: FiFileText,
  document: FiFileText,
  documents: FiFileText,
  documentos: FiFileText,
  "file-text": FiFileText,

  folder: FiFolder,
  pasta: FiFolder,

  clipboard: FiClipboard,

  list: FiList,
  lista: FiList,

  edit: FiEdit,
  editar: FiEdit,
  pencil: FiEdit,

  save: FiSave,
  salvar: FiSave,

  download: FiDownload,
  upload: FiUpload,

  printer: FiPrinter,
  impressora: FiPrinter,

  paperclip: FiPaperclip,

  book: FiBook,
  livro: FiBook,

  flag: FiFlag,

  // ---------------------------------------------------
  // SISTEMA E CONFIGURAÇÕES
  // ---------------------------------------------------

  settings: FiSettings,
  config: FiSettings,
  configuracao: FiSettings,
  configuracoes: FiSettings,
  configuration: FiSettings,

  database: FiDatabase,
  banco: FiDatabase,

  server: FiServer,
  servidor: FiServer,

  terminal: FiTerminal,

  monitor: FiMonitor,
  computador: FiMonitor,

  smartphone: FiSmartphone,
  celular: FiSmartphone,

  tv: FiTv,
  wifi: FiWifi,

  refresh: FiRefreshCw,
  atualizar: FiRefreshCw,
  "refresh-cw": FiRefreshCw,

  repeat: FiRepeat,

  toggle: FiToggleLeft,
  "toggle-left": FiToggleLeft,

  share: FiShare2,
  compartilhar: FiShare2,
  "share-2": FiShare2,

  trash: FiTrash2,
  delete: FiTrash2,
  excluir: FiTrash2,
  remover: FiTrash2,

  plus: FiPlus,
  adicionar: FiPlus,

  minus: FiMinus,

  close: FiX,
  fechar: FiX,
  x: FiX,

  "x-circle": FiXCircle,

  eye: FiEye,
  visualizar: FiEye,

  "eye-off": FiEyeOff,
  esconder: FiEyeOff,

  inbox: FiInbox,

  // ---------------------------------------------------
  // LOCALIZAÇÃO
  // ---------------------------------------------------

  map: FiMap,
  mapa: FiMap,

  "map-pin": FiMapPin,
  location: FiMapPin,
  localizacao: FiMapPin,
  pin: FiMapPin,

  // ---------------------------------------------------
  // MÍDIA
  // ---------------------------------------------------

  video: FiVideo,
  play: FiPlay,
  pause: FiPause,
  volume: FiVolume2,
  shuffle: FiShuffle,

  // ---------------------------------------------------
  // OUTROS
  // ---------------------------------------------------

  thumbs: FiThumbsUp,
  "thumbs-up": FiThumbsUp,
};

// =====================================================
// OBTER COMPONENTE DO ÍCONE
// =====================================================

export function obterIcone(nome: string | null | undefined): IconType {
  const chave = normalizarNomeIcone(nome);

  return ICONES[chave] ?? FiCircle;
}

// =====================================================
// COMPONENTE PRONTO PARA UTILIZAÇÃO
// =====================================================

export function Icone({ nome, tamanho = 20, className = "" }: IconeProps) {
  const ComponenteIcone = obterIcone(nome);

  return createElement(ComponenteIcone, {
    size: tamanho,
    className,
    "aria-hidden": true,
  });
}

// =====================================================
// EXPORTAÇÃO PADRÃO
// =====================================================

export default Icone;
