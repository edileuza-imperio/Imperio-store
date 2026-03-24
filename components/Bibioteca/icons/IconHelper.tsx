"use client";

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

export class IconHelper {
  static normalizar(nome?: string | null) {
    return String(nome || "").trim().toLowerCase();
  }

  static render({ nome, size = 18, className = "" }: IconProps) {
    const icon = this.normalizar(nome);

    if (
      icon === "carrito" ||
      icon === "carrinho" ||
      icon === "cart" ||
      icon.includes("bi-cart") ||
      icon.includes("shopping-cart")
    ) {
      return <FiShoppingCart size={size} className={className} />;
    }

    if (
      icon === "user" ||
      icon === "usuario" ||
      icon === "login" ||
      icon.includes("bi-person")
    ) {
      return <FiUser size={size} className={className} />;
    }

    if (
      icon === "logout" ||
      icon === "sair" ||
      icon.includes("bi-box-arrow-right")
    ) {
      return <FiLogOut size={size} className={className} />;
    }

    if (icon === "menu" || icon.includes("hamburger")) {
      return <FiMenu size={size} className={className} />;
    }

    if (
      icon === "close" ||
      icon === "fechar" ||
      icon === "x" ||
      icon === "times"
    ) {
      return <FiX size={size} className={className} />;
    }

    if (
      icon === "down" ||
      icon === "baixo" ||
      icon.includes("chevron-down")
    ) {
      return <FiChevronDown size={size} className={className} />;
    }

    if (
      icon === "right" ||
      icon === "direita" ||
      icon.includes("chevron-right")
    ) {
      return <FiChevronRight size={size} className={className} />;
    }

    if (!icon) {
      return null;
    }

    return <FiBox size={size} className={className} />;
  }
}