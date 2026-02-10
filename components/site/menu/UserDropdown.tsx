'use client';

import Link from "next/link";
import { useState } from "react";

interface Props {
  nome: string;
}

export default function UserDropdown({ nome }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "center",
          color: "#444",
        }}
      >
        <i className="bi bi-person-circle fs-3" style={{ color: "#c97a7e" }} />
        <span className="d-block fs-6 fw-medium mt-1">{nome}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            right: 0,
            background: "#fffaf0",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0,0,0,.15)",
            minWidth: "180px",
            overflow: "hidden",
            zIndex: 999,
          }}
        >
          <Link className="dropdown-item px-3 py-2 d-block" href="/perfil">
            Meu perfil
          </Link>

          <Link className="dropdown-item px-3 py-2 d-block" href="/pedidos">
            Meus pedidos
          </Link>

          <hr className="m-0" />

          <Link
            className="dropdown-item px-3 py-2 d-block text-danger"
            href="/logout"
          >
            Sair
          </Link>
        </div>
      )}
    </div>
  );
}
