import {
  FiBox,
  FiChevronDown,
  FiChevronRight,
  FiLogOut,
  FiMenu,
  FiShoppingCart,
  FiUser,
  FiX,
} from "react-icons/fi";

type IconProps = {
  nome?: string | null;
  size?: number;
  className?: string;
};

type IconMapType = {
  keys: string[];
  component: any;
};

export class IconHelper {
  static normalizar(nome?: string | null) {
    return String(nome || "").trim().toLowerCase();
  }

  // 🔥 Mapa de ícones
  static iconMap: IconMapType[] = [
    {
      keys: ["carrito", "carrinho", "cart", "bi-cart", "shopping-cart"],
      component: FiShoppingCart,
    },
    {
      keys: ["user", "usuario", "login", "bi-person"],
      component: FiUser,
    },
    {
      keys: ["logout", "sair", "bi-box-arrow-right"],
      component: FiLogOut,
    },
    {
      keys: ["menu", "hamburger"],
      component: FiMenu,
    },
    {
      keys: ["close", "fechar", "x", "times"],
      component: FiX,
    },
    {
      keys: ["down", "baixo", "chevron-down"],
      component: FiChevronDown,
    },
    {
      keys: ["right", "direita", "chevron-right"],
      component: FiChevronRight,
    },
  ];

  static render({ nome, size = 18, className = "" }: IconProps) {
    const icon = this.normalizar(nome);

    if (!icon) return null;

    // 🔎 procura no mapa
    const found = this.iconMap.find((item) =>
      item.keys.some((key) => icon.includes(key))
    );

    const IconComponent = found?.component || FiBox;

    return <IconComponent size={size} className={className} />;
  }
}