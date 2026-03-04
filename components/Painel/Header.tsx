"use client";

import { useMemo } from "react";

type HeaderProps = {
  title?: string;
  subtitle?: string;
  onToggleSidebar?: () => void;
  userName?: string;
};

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

  return (
    <header className="hdr">
      <div className="left">
        <button
          type="button"
          className="burger"
          onClick={onToggleSidebar}
          aria-label="Abrir/fechar menu"
        >
          <span />
          <span />
          <span />
        </button>

        <div className="titles">
          <h1 className="h1">{title}</h1>
          {subtitle ? <p className="sub">{subtitle}</p> : <p className="sub">{now}</p>}
        </div>
      </div>

      <div className="right">
        <div className="pill">
          <span className="dot" />
          <span className="txt">Online</span>
        </div>

        <div className="user">
          <div className="avatar" aria-hidden>
            {userName?.slice(0, 1)?.toUpperCase() ?? "A"}
          </div>
          <div className="uinfo">
            <div className="uname">{userName}</div>
            <div className="urole">Administrador</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hdr {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(17, 24, 39, 0.08);
          background: rgba(255, 255, 255, 0.78);
          backdrop-filter: blur(14px);
        }

        .left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .burger {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          border: 1px solid rgba(17, 24, 39, 0.12);
          background: rgba(255, 255, 255, 0.8);
          display: grid;
          place-items: center;
          cursor: pointer;
          box-shadow: 0 14px 38px rgba(17, 24, 39, 0.08);
        }
        .burger span {
          display: block;
          width: 18px;
          height: 2px;
          background: rgba(17, 24, 39, 0.82);
          border-radius: 99px;
        }
        .burger span:nth-child(2) {
          width: 14px;
          opacity: 0.9;
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
          margin: 4px 0 0;
          font-size: 12px;
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

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid rgba(17, 24, 39, 0.10);
          background: rgba(255, 255, 255, 0.7);
          box-shadow: 0 12px 28px rgba(17, 24, 39, 0.06);
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.14);
        }
        .txt {
          font-size: 12px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.78);
        }

        .user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 16px;
          border: 1px solid rgba(17, 24, 39, 0.10);
          background: rgba(255, 255, 255, 0.7);
          box-shadow: 0 12px 28px rgba(17, 24, 39, 0.06);
        }
        .avatar {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          font-weight: 950;
          color: #111827;
          background: linear-gradient(135deg, rgba(217, 70, 239, 0.2), rgba(183, 110, 121, 0.18));
          border: 1px solid rgba(17, 24, 39, 0.10);
        }
        .uinfo {
          display: grid;
          line-height: 1.1;
        }
        .uname {
          font-size: 12px;
          font-weight: 950;
          color: rgba(17, 24, 39, 0.9);
        }
        .urole {
          font-size: 11px;
          color: rgba(17, 24, 39, 0.55);
          font-weight: 800;
        }

        @media (min-width: 900px) {
          .burger {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}