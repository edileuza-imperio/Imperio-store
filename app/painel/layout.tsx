"use client";

import { useState } from "react";
import Header from "@/components/Painel/Header";
import Sidebar from "@/components/Painel/Sidebar";

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <div className="layoutContainer">
        {/* SIDEBAR */}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* MAIN CONTENT AREA */}
        <div className="mainArea">
          {/* HEADER */}
          <Header
            title="Painel"
            subtitle="Gerencie produtos, categorias e configurações"
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
            userName="Rhaian"
          />

          {/* PAGE CONTENT */}
          <div className="contentArea">{children}</div>
        </div>
      </div>

      {/* ✅ OVERLAY MOBILE */}
      <button
        type="button"
        aria-label="Fechar menu"
        className={`mobileOverlay ${sidebarOpen ? "active" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      
    </>
  );
}
