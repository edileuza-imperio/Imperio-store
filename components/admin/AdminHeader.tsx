'use client';

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface Props {
  open: boolean;
  toggle: () => void;
}

export default function AdminHeader({ open, toggle }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [q, setQ] = useState("");

  const pageTitle = useMemo(() => {
    if (!pathname) return "Painel";
    const map: Record<string, string> = {
      "/admin/dashboard": "Dashboard",
      "/admin/usuarios": "Usuários",
      "/admin/produtos": "Produtos",
      "/admin/pedidos": "Pedidos",
      "/admin/categorias": "Categorias",
      "/admin/configuracoes": "Configurações",
    };
    // tenta achar por prefixo
    const key = Object.keys(map).find(k => pathname.startsWith(k));
    return key ? map[key] : "Painel Administrativo";
  }, [pathname]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    // ajuste para sua rota real de busca
    router.push(`/admin/produtos?busca=${encodeURIComponent(term)}`);
  };

  return (
    <>
      <header className="admHeader">
        <div className="admHeader__left">
          <button
            type="button"
            className="admHeader__iconBtn"
            onClick={toggle}
            aria-label={open ? "Recolher menu" : "Abrir menu"}
            title={open ? "Recolher menu" : "Abrir menu"}
          >
            <i className="bi bi-list" />
          </button>

          <div className="admHeader__titles">
            <div className="admHeader__kicker">Império</div>
            <div className="admHeader__title">{pageTitle}</div>
          </div>
        </div>

        <form className="admHeader__search" onSubmit={onSearch}>
          <i className="bi bi-search admHeader__searchIcon" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="admHeader__searchInput"
            placeholder="Buscar (ex: produto, usuário, pedido)…"
          />
          <button className="admHeader__searchBtn" type="submit">
            Buscar
          </button>
        </form>

        <div className="admHeader__right">
          <Link className="admHeader__pillLink" href="/" title="Abrir loja">
            <i className="bi bi-shop" />
            <span className="admHideSm">Loja</span>
          </Link>

          <button className="admHeader__pillLink" type="button" title="Atalhos">
            <i className="bi bi-lightning-charge" />
            <span className="admHideSm">Atalhos</span>
          </button>

          {/* Notificações */}
          <div className="dropdown">
            <button
              className="admHeader__notifBtn"
              data-bs-toggle="dropdown"
              type="button"
              aria-expanded="false"
              title="Notificações"
            >
              <i className="bi bi-bell" />
              <span className="admHeader__badge">3</span>
            </button>

            <ul className="dropdown-menu dropdown-menu-end admDrop">
              <li className="admDrop__title">Notificações</li>
              <li><hr className="dropdown-divider" /></li>

              <li>
                <button className="dropdown-item admDrop__item" type="button">
                  <b>Novo pedido</b>
                  <span>Pedido #1024 recebido</span>
                </button>
              </li>
              <li>
                <button className="dropdown-item admDrop__item" type="button">
                  <b>Estoque baixo</b>
                  <span>Produto “X” com 2 unidades</span>
                </button>
              </li>
              <li>
                <button className="dropdown-item admDrop__item" type="button">
                  <b>Usuário novo</b>
                  <span>Cadastro concluído</span>
                </button>
              </li>

              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item" type="button">
                  Marcar tudo como lido
                </button>
              </li>
            </ul>
          </div>

          {/* Perfil */}
          <div className="dropdown">
            <button
              className="admHeader__profileBtn"
              data-bs-toggle="dropdown"
              type="button"
              aria-expanded="false"
            >
              <span className="admHeader__avatar">A</span>
              <div className="admHeader__profileText">
                <b>Admin</b>
                <span className="admHideSm">Administrador</span>
              </div>
              <i className="bi bi-chevron-down admHideSm" />
            </button>

            <ul className="dropdown-menu dropdown-menu-end admDrop">
              <li className="admDrop__title">Conta</li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <Link className="dropdown-item" href="/admin/configuracoes">
                  Configurações
                </Link>
              </li>
              <li>
                <Link className="dropdown-item" href="/">
                  Voltar para loja
                </Link>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <Link className="dropdown-item text-danger" href="/sair">
                  Sair
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </header>

      {/* CSS GLOBAL do Header */}
      <style jsx global>{`
        .admHeader{
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255,255,255,.92);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(212,175,55,0.22);
          padding: 12px 16px;
          display:flex;
          align-items:center;
          gap: 12px;
        }

        .admHeader__left{
          display:flex;
          align-items:center;
          gap: 10px;
          min-width: 240px;
        }

        .admHeader__iconBtn{
          width: 42px;
          height: 42px;
          border-radius: 14px;
          border: 1px solid rgba(0,0,0,.08);
          background: #fff;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
          transition: transform .12s ease, background .12s ease, box-shadow .12s ease;
          box-shadow: 0 10px 22px rgba(17,24,39,.06);
        }
        .admHeader__iconBtn i{ font-size: 20px; color: #6b4c4f; }
        .admHeader__iconBtn:hover{ background:#fafafa; }
        .admHeader__iconBtn:active{ transform: translateY(1px); }

        .admHeader__titles{ line-height: 1.1; }
        .admHeader__kicker{
          font-size: 11px;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: rgba(107,76,79,.65);
          font-weight: 800;
        }
        .admHeader__title{
          font-size: 14px;
          font-weight: 900;
          color: #2c2f33;
        }

        .admHeader__search{
          flex: 1;
          display:flex;
          align-items:center;
          gap: 10px;
          background: #fff;
          border: 1px solid rgba(0,0,0,.08);
          border-radius: 16px;
          padding: 10px 12px;
          box-shadow: 0 10px 22px rgba(17,24,39,.06);
          min-width: 260px;
        }
        .admHeader__searchIcon{ color: rgba(107,76,79,.7); font-size: 16px; }
        .admHeader__searchInput{
          width: 100%;
          border: none;
          outline: none;
          font-weight: 800;
          color: #111827;
          background: transparent;
        }
        .admHeader__searchInput::placeholder{ color: #9ca3af; font-weight: 700; }
        .admHeader__searchBtn{
          border: 1px solid rgba(212,175,55,0.28);
          background: rgba(212,175,55,0.16);
          color: #6b4c4f;
          font-weight: 900;
          border-radius: 999px;
          padding: 8px 12px;
          cursor:pointer;
          transition: background .12s ease, transform .12s ease;
          white-space: nowrap;
        }
        .admHeader__searchBtn:hover{ background: rgba(212,175,55,0.22); }
        .admHeader__searchBtn:active{ transform: translateY(1px); }

        .admHeader__right{
          display:flex;
          align-items:center;
          gap: 10px;
          justify-content:flex-end;
        }

        .admHeader__pillLink{
          text-decoration:none;
          border: 1px solid rgba(0,0,0,.08);
          background:#fff;
          height: 42px;
          padding: 0 12px;
          border-radius: 999px;
          display:flex;
          align-items:center;
          gap: 8px;
          font-weight: 900;
          color: #6b4c4f;
          box-shadow: 0 10px 22px rgba(17,24,39,.06);
          transition: transform .12s ease, background .12s ease;
          cursor:pointer;
        }
        .admHeader__pillLink i{ font-size: 16px; }
        .admHeader__pillLink:hover{ background:#fafafa; }
        .admHeader__pillLink:active{ transform: translateY(1px); }

        .admHeader__notifBtn{
          position: relative;
          width: 42px;
          height: 42px;
          border-radius: 14px;
          border: 1px solid rgba(0,0,0,.08);
          background:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
          box-shadow: 0 10px 22px rgba(17,24,39,.06);
        }
        .admHeader__notifBtn i{ font-size: 18px; color:#6b4c4f; }
        .admHeader__badge{
          position:absolute;
          top: -6px;
          right: -6px;
          min-width: 20px;
          height: 20px;
          border-radius: 999px;
          display:flex;
          align-items:center;
          justify-content:center;
          padding: 0 6px;
          font-size: 12px;
          font-weight: 900;
          color: #fff;
          background: #c97a7e;
          border: 2px solid #fff;
        }

        .admHeader__profileBtn{
          border: 1px solid rgba(0,0,0,.08);
          background:#fff;
          height: 42px;
          border-radius: 16px;
          padding: 0 10px;
          display:flex;
          align-items:center;
          gap: 10px;
          cursor:pointer;
          box-shadow: 0 10px 22px rgba(17,24,39,.06);
        }
        .admHeader__avatar{
          width: 30px;
          height: 30px;
          border-radius: 12px;
          display:flex;
          align-items:center;
          justify-content:center;
          background: rgba(212,175,55,0.18);
          color:#6b4c4f;
          font-weight: 900;
          border: 1px solid rgba(212,175,55,0.28);
        }
        .admHeader__profileText{
          display:flex;
          flex-direction:column;
          line-height: 1.05;
          text-align:left;
        }
        .admHeader__profileText b{ font-size: 13px; color:#111827; }
        .admHeader__profileText span{ font-size: 11px; color:#6b7280; font-weight: 800; }

        .admDrop{
          border-radius: 16px;
          border: 1px solid rgba(0,0,0,.08);
          box-shadow: 0 20px 44px rgba(17,24,39,.14);
          overflow: hidden;
          min-width: 280px;
        }
        .admDrop__title{
          padding: 10px 12px;
          font-weight: 900;
          color: #111827;
        }
        .admDrop__item{
          display:flex;
          flex-direction:column;
          gap: 2px;
          padding: 10px 12px;
        }
        .admDrop__item b{ font-size: 13px; }
        .admDrop__item span{ font-size: 12px; color:#6b7280; font-weight: 700; }

        .admHideSm{ display: inline; }
        @media (max-width: 860px){
          .admHeader__titles{ display:none; }
          .admHideSm{ display:none; }
          .admHeader__searchBtn{ display:none; }
          .admHeader__search{ padding: 10px 10px; }
        }
      `}</style>
    </>
  );
}
