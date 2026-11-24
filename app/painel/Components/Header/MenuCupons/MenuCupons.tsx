"use client";

import { MENU_DROPDOWNS } from "../../config/menu.config";
import MenuDropdown from "../../Dropdrown/MenuDropdown";

export default function MenuCupons() {
  return <MenuDropdown config={MENU_DROPDOWNS.cupons} />;
}
