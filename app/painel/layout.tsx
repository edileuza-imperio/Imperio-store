"use client";

import { useState } from "react";
import Header from "@/components/Painel/Header";
import Sidebar from "@/components/Painel/Sidebar";

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="shell">
        {/* SIDEBAR */}
        <Sidebar open={open} onClose={() => setOpen(false)} />

        {/* MAIN */}
        <div className="main">
          <Header
            title="Painel"
            subtitle="Gerencie produtos, categorias e configurações"
            onToggleSidebar={() => setOpen((v) => !v)}
            userName="Rhaian"
          />

          <div className="content">{children}</div>
        </div>
      </div>

      {/* ✅ OVERLAY MOBILE (somente aqui) */}
      <button
        type="button"
        aria-label="Fechar menu"
        className={`overlay ${open ? "show" : ""}`}
        onClick={() => setOpen(false)}
      />

      <style jsx>{`
        .shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 320px 1fr; /* ✅ combina com seu Sidebar (320px) */
          background: #f6f7fb;
        }

        .main {
          min-width: 0;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        .content {
          flex: 1;
          overflow: auto;
          padding: 24px;
        }

        /* ✅ overlay (mobile) */
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.58);
          border: none;
          display: none;
          z-index: 2500; /* ✅ abaixo do sidebar mobile (3000) e acima do resto */
        }
        .overlay.show {
          display: block;
        }

        @media (max-width: 900px) {
          .shell {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}