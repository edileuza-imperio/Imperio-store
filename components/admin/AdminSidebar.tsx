'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminSidebarItem from "./AdminSidebarItem";

interface Props {
  open: boolean;
  toggle: () => void;
}

export default function AdminSidebar({ open, toggle }: Props) {
  const pathname = usePathname();

  return (
    <>
      <aside className={`admSide ${open ? "isOpen" : "isClosed"}`}>
        {/* TOP / LOGO */}
        <div className="admSide__top">
          <Link href="/admin/dashboard" className="admSide__brand">
            <span className="admSide__logo">{open ? "Império Admin" : "IA"}</span>
            {open && <span className="admSide__tag">Painel</span>}
          </Link>

          <button className="admSide__toggle" onClick={toggle} type="button" title="Alternar menu">
            <i className="bi bi-list" />
          </button>
        </div>

        {/* MENU */}
        <nav className="admSide__nav">
          <AdminSidebarItem
            href="/admin/dashboard"
            icon="bi-speedometer2"
            label="Dashboard"
            open={open}
            active={pathname?.startsWith("/admin/dashboard")}
          />

          <AdminSidebarItem
            href="/admin/usuarios"
            icon="bi-people"
            label="Usuários"
            open={open}
            active={pathname?.startsWith("/admin/usuarios")}
          />

          <AdminSidebarItem
            href="/admin/produtos"
            icon="bi-box-seam"
            label="Produtos"
            open={open}
            active={pathname?.startsWith("/admin/produtos")}
          />

          <AdminSidebarItem
            href="/admin/categorias"
            icon="bi-tags"
            label="Categorias"
            open={open}
            active={pathname?.startsWith("/admin/categorias")}
          />

          <AdminSidebarItem
            href="/admin/pedidos"
            icon="bi-cart-check"
            label="Pedidos"
            open={open}
            active={pathname?.startsWith("/admin/pedidos")}
          />

          <div className="admSide__sep" />

          <AdminSidebarItem
            href="/admin/configuracoes"
            icon="bi-gear"
            label="Configurações"
            open={open}
            active={pathname?.startsWith("/admin/configuracoes")}
          />
        </nav>

        {/* FOOTER */}
        <div className="admSide__footer">
          {open ? (
            <div className="admSide__footBox">
              <b>Império</b>
              <span>Administração</span>
            </div>
          ) : (
            <div className="admSide__footDot" title="Império Admin" />
          )}
        </div>
      </aside>

      <style jsx global>{`
        .admSide{
          height: calc(100vh - 0px);
          background: #ffffff;
          border-right: 1px solid rgba(212,175,55,0.25);
          transition: width .22s ease;
          display:flex;
          flex-direction:column;
          position: sticky;
          top: 0;
          z-index: 40;
        }

        .admSide.isOpen{ width: 260px; }
        .admSide.isClosed{ width: 84px; }

        .admSide__top{
          padding: 16px 12px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 10px;
          border-bottom: 1px solid rgba(212,175,55,0.22);
        }

        .admSide__brand{
          text-decoration:none;
          display:flex;
          flex-direction:column;
          gap: 2px;
          min-width: 0;
        }

        .admSide__logo{
          font-weight: 900;
          color: #6b4c4f;
          font-size: 16px;
          letter-spacing: -.02em;
          white-space: nowrap;
        }

        .admSide__tag{
          font-size: 11px;
          font-weight: 800;
          color: rgba(107,76,79,.65);
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .admSide__toggle{
          width: 40px;
          height: 40px;
          border-radius: 14px;
          border: 1px solid rgba(0,0,0,.08);
          background: #fff;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
          box-shadow: 0 10px 22px rgba(17,24,39,.06);
        }
        .admSide__toggle i{ font-size: 20px; color:#6b4c4f; }

        .admSide__nav{
          padding: 10px 10px;
          display:flex;
          flex-direction:column;
          gap: 8px;
          overflow:auto;
        }

        .admSide__sep{
          height: 1px;
          background: rgba(0,0,0,.06);
          margin: 8px 6px;
        }

        .admSide__footer{
          margin-top:auto;
          padding: 12px 12px 16px;
          border-top: 1px solid rgba(0,0,0,.06);
        }

        .admSide__footBox{
          background: rgba(212,175,55,0.12);
          border: 1px solid rgba(212,175,55,0.22);
          padding: 10px 12px;
          border-radius: 16px;
          display:flex;
          flex-direction:column;
          gap: 2px;
        }
        .admSide__footBox b{ color:#6b4c4f; }
        .admSide__footBox span{ color: rgba(107,76,79,.70); font-weight: 800; font-size: 12px; }

        .admSide__footDot{
          width: 14px;
          height: 14px;
          border-radius: 999px;
          margin: 0 auto;
          background: #c97a7e;
        }

        /* Scroll bonito */
        .admSide__nav::-webkit-scrollbar{ width: 10px; }
        .admSide__nav::-webkit-scrollbar-thumb{
          background: rgba(0,0,0,.12);
          border-radius: 999px;
          border: 3px solid transparent;
          background-clip: content-box;
        }
      `}</style>
    </>
  );
}
