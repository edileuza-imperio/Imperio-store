"use client";

import Header from "@/components/Painel/Header";
import Sidebar from "@/components/Painel/Sidebar";
import { useState } from "react";

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

      {/* OVERLAY MOBILE */}
      {open && (
        <div
          className="overlay"
          onClick={() => setOpen(false)}
        />
      )}

      <style jsx>{`

.shell{
min-height:100vh;
display:grid;
grid-template-columns:260px 1fr;
background:#f6f7fb;
}

.main{
min-width:0;
display:flex;
flex-direction:column;
height:100vh;
overflow:hidden;
}

.content{
flex:1;
overflow:auto;
padding:24px;
}

/* overlay */

.overlay{
position:fixed;
inset:0;
background:rgba(0,0,0,.4);
z-index:40;
}

/* mobile */

@media(max-width:900px){

.shell{
grid-template-columns:1fr;
}

}

      `}</style>
    </>
  );
}