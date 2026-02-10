'use client';

import Link from "next/link";
import AdminSidebarItem from "./AdminSidebarItem";


interface Props {
  open: boolean;
  toggle: () => void;
}

export default function AdminSidebar({ open, toggle }: Props) {
  return (
    <aside
      style={{
        width: open ? 260 : 80,
        transition: "0.3s",
        background: "#ffffff",
        borderRight: "1px solid rgba(212,175,55,0.25)",
      }}
    >
      {/* LOGO */}
      <div
        className="px-3 py-4 d-flex align-items-center justify-content-between"
        style={{ borderBottom: "1px solid rgba(212,175,55,0.25)" }}
      >
        <Link href="/admin/dashboard" className="text-decoration-none">
          <h2
            className="mb-0 fw-bold"
            style={{
              fontSize: 18,
              color: "#6b4c4f",
              whiteSpace: "nowrap",
            }}
          >
            {open ? "Império Admin" : "IA"}
          </h2>
        </Link>

        <button className="btn btn-sm" onClick={toggle}>
          <i className="bi bi-list fs-5" />
        </button>
      </div>

      {/* MENU */}
      <nav className="py-3">
        <AdminSidebarItem
          href="/admin/dashboard"
          icon="bi-speedometer2"
          label="Dashboard"
          open={open}
        />

        <AdminSidebarItem
          href="/admin/usuarios"
          icon="bi-people"
          label="Usuários"
          open={open}
        />

        <AdminSidebarItem
          href="/admin/produtos"
          icon="bi-box-seam"
          label="Produtos"
          open={open}
        />

        <AdminSidebarItem
          href="/admin/pedidos"
          icon="bi-cart-check"
          label="Pedidos"
          open={open}
        />

        <AdminSidebarItem
          href="/admin/configuracoes"
          icon="bi-gear"
          label="Configurações"
          open={open}
        />
      </nav>
    </aside>
  );
}
