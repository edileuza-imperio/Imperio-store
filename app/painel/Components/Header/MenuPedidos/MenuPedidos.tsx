"use client";

import { MENU_DROPDOWNS } from "../../config/menu.config";
import MenuDropdown from "../../Dropdrown/MenuDropdown";

export default function MenuPedidos() {
  return <MenuDropdown config={MENU_DROPDOWNS.pedidos} />;
}
