"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import { FiBell, FiMenu, FiSearch, FiLogOut, FiChevronDown } from "react-icons/fi";

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
    return d.toLocaleString("pt-BR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, []);

  const [usuario, setUsuario] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [searchFocus, setSearchFocus] = useState(false);

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

  const nome = usuario?.nome || usuario?.name || usuario?.email || userName;
  const email = usuario?.email || "";
  const statusTxt = checking ? "Verificando" : usuario ? "Online" : "Offline";

  return (
    <header className="header">
      <div className="headerLeft">
        <button
          type="button"
          className="menuBtn"
          onClick={onToggleSidebar}
          aria-label="Abrir/fechar menu"
          title="Menu"
        >
          <FiMenu size={20} />
        </button>

        <div className="titleSection">
          <h1 className="pageTitle">{title}</h1>
          <p className="pageSubtitle">{subtitle ? subtitle : now}</p>
        </div>
      </div>

      <div className="headerRight">
        <div className={`searchBox ${searchFocus ? "focused" : ""}`}>
          <FiSearch className="searchIcon" />
          <input
            type="text"
            placeholder="Buscar..."
            className="searchInput"
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setSearchFocus(false)}
          />
        </div>

        <button
          type="button"
          className="notificationBtn"
          aria-label="Notificações"
          title="Notificações"
        >
          <FiBell size={20} />
          <span className="notificationBadge" />
        </button>

        <div className={`statusIndicator ${usuario ? "online" : "offline"}`}>
          <span className="statusDot" />
          <span className="statusText">{statusTxt}</span>
        </div>

        <div className="userProfile">
          <div className="userAvatar">
            {(nome?.slice(0, 1) || "A").toUpperCase()}
          </div>
          <div className="userDetails">
            <div className="userName">{nome}</div>
            <div className="userRole">{email ? email : "Administrador"}</div>
          </div>
        </div>

        <button
          type="button"
          className="logoutBtn"
          title="Sair"
          aria-label="Sair"
          onClick={() => {
            setUsuario(null);
          }}
        >
          <FiLogOut size={18} />
        </button>
      </div>

    </header>
  );
}
