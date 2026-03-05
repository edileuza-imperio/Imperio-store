"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import { FiBell, FiMenu, FiSearch, FiLogOut } from "react-icons/fi";

type HeaderProps = {
  title?: string;
  subtitle?: string;
  onToggleSidebar?: () => void;
  userName?: string; // fallback
};

async function buscarUsuarioAutenticado() {
  try {
    const res = await api.get("/me", { withCredentials: true });
    return res.data?.dados?.usuario ?? null;
  } catch {
    return null;
  }
}

export default function Header({
  title = "Painel Administrativo",
  subtitle,
  onToggleSidebar,
  userName = "Admin",
}: HeaderProps) {
  const now = useMemo(() => {
    const d = new Date();
    return d.toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" });
  }, []);

  const [usuario, setUsuario] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setChecking(true);
        const u = await buscarUsuarioAutenticado();
        setUsuario(u);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  const nome =
    usuario?.nome ||
    usuario?.name ||
    usuario?.email ||
    userName;

  const email = usuario?.email || "";

  const statusTxt = checking ? "Verificando" : usuario ? "Online" : "Offline";

  return (
    <header className="hdr">
      <div className="left">
        <button
          type="button"
          className="burger"
          onClick={onToggleSidebar}
          aria-label="Abrir/fechar menu"
          title="Menu"
        >
          <FiMenu size={18} />
        </button>

        <div className="titles">
          <h1 className="h1">{title}</h1>
          {subtitle ? <p className="sub">{subtitle}</p> : <p className="sub">{now}</p>}
        </div>
      </div>

      <div className="right">
        <div className="search">
          <FiSearch className="sicon" />
          <input placeholder="Buscar..." />
        </div>

        <button type="button" className="iconBtn" aria-label="Notificações" title="Notificações">
          <FiBell size={18} />
          <span className="badge" />
        </button>

        <div className={`pill ${usuario ? "ok" : "bad"}`}>
          <span className="dot" />
          <span className="txt">{statusTxt}</span>
        </div>

        <div className="user">
          <div className="avatar" aria-hidden>
            {(nome?.slice(0, 1) || "A").toUpperCase()}
          </div>
          <div className="uinfo">
            <div className="uname">{nome}</div>
            <div className="urole">{email ? email : "Administrador"}</div>
          </div>
        </div>

        <button
          type="button"
          className="logout"
          title="Sair"
          aria-label="Sair"
          onClick={() => {
            // se tiver rota de logout, coloca aqui:
            // api.post("/logout", {}, { withCredentials:true }).finally(...)
            setUsuario(null);
          }}
        >
          <FiLogOut size={17} />
        </button>
      </div>

      <style jsx>{`
        .hdr {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;

          padding: 14px 16px;

          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(17, 24, 39, 0.08);
        }

        .left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .burger {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          border: 1px solid rgba(17, 24, 39, 0.12);
          background: rgba(255, 255, 255, 0.9);
          display: grid;
          place-items: center;
          cursor: pointer;
          box-shadow: 0 14px 38px rgba(17, 24, 39, 0.08);
          transition: 0.16s;
        }
        .burger:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 50px rgba(17, 24, 39, 0.12);
        }

        .titles {
          min-width: 0;
        }

        .h1 {
          margin: 0;
          font-size: 16px;
          font-weight: 950;
          letter-spacing: -0.02em;
          color: #111827;
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 56vw;
        }

        .sub {
          margin: 5px 0 0;
          font-size: 12px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.55);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 56vw;
        }

        .right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* search */
        .search {
          display: none;
          align-items: center;
          gap: 10px;
          width: 260px;

          padding: 10px 12px;
          border-radius: 16px;

          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(17, 24, 39, 0.1);
          box-shadow: 0 12px 28px rgba(17, 24, 39, 0.06);
        }

        .sicon {
          color: rgba(17, 24, 39, 0.55);
        }

        .search input {
          border: none;
          outline: none;
          background: transparent;
          width: 100%;
          font-size: 13px;
          font-weight: 850;
          color: #111827;
        }

        .search input::placeholder {
          color: rgba(17, 24, 39, 0.45);
          font-weight: 850;
        }

        /* icon button */
        .iconBtn {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          border: 1px solid rgba(17, 24, 39, 0.1);
          background: rgba(255, 255, 255, 0.7);
          box-shadow: 0 12px 28px rgba(17, 24, 39, 0.06);

          display: grid;
          place-items: center;
          cursor: pointer;
          position: relative;
          transition: 0.16s;
        }
        .iconBtn:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 50px rgba(17, 24, 39, 0.12);
        }

        .badge {
          position: absolute;
          top: 11px;
          right: 12px;
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #a855f7;
          box-shadow: 0 0 0 6px rgba(168, 85, 247, 0.18);
        }

        /* status pill */
        .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid rgba(17, 24, 39, 0.1);
          background: rgba(255, 255, 255, 0.7);
          box-shadow: 0 12px 28px rgba(17, 24, 39, 0.06);
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #94a3b8;
          box-shadow: 0 0 0 6px rgba(148, 163, 184, 0.14);
        }

        .pill.ok .dot {
          background: #22c55e;
          box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.14);
        }

        .pill.bad .dot {
          background: #ef4444;
          box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.14);
        }

        .txt {
          font-size: 12px;
          font-weight: 950;
          color: rgba(17, 24, 39, 0.75);
        }

        /* user */
        .user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 18px;
          border: 1px solid rgba(17, 24, 39, 0.1);
          background: rgba(255, 255, 255, 0.7);
          box-shadow: 0 12px 28px rgba(17, 24, 39, 0.06);
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-weight: 950;
          color: #111827;

          background: linear-gradient(
            135deg,
            rgba(124, 58, 237, 0.18),
            rgba(14, 165, 233, 0.12)
          );
          border: 1px solid rgba(17, 24, 39, 0.1);
        }

        .uinfo {
          display: grid;
          line-height: 1.12;
          max-width: 180px;
        }

        .uname {
          font-size: 12px;
          font-weight: 950;
          color: rgba(17, 24, 39, 0.9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .urole {
          font-size: 11px;
          color: rgba(17, 24, 39, 0.55);
          font-weight: 850;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .logout {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          border: 1px solid rgba(17, 24, 39, 0.1);
          background: rgba(255, 255, 255, 0.7);
          box-shadow: 0 12px 28px rgba(17, 24, 39, 0.06);
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: 0.16s;
        }
        .logout:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 50px rgba(17, 24, 39, 0.12);
        }

        /* desktop */
        @media (min-width: 900px) {
          .burger {
            display: none;
          }
          .search {
            display: inline-flex;
          }
        }

        /* mobile */
        @media (max-width: 520px) {
          .pill {
            display: none;
          }
          .uinfo {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}