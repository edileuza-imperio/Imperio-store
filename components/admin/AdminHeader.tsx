'use client';

import Link from "next/link";

export default function AdminHeader() {
  return (
    <header
      className="d-flex align-items-center justify-content-between px-4 py-3"
      style={{
        background: "#ffffff",
        borderBottom: "1px solid rgba(212,175,55,0.25)",
      }}
    >
      <span className="fw-semibold" style={{ color: "#6b4c4f" }}>
        Painel Administrativo
      </span>

      <div className="d-flex align-items-center gap-3">
        <button className="btn btn-light position-relative">
          <i className="bi bi-bell fs-5" />
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
            style={{ background: "#c97a7e" }}
          >
            3
          </span>
        </button>

        <div className="dropdown">
          <button
            className="btn d-flex align-items-center gap-2"
            data-bs-toggle="dropdown"
          >
            <i className="bi bi-person-circle fs-5" />
            <span className="small fw-semibold">Admin</span>
          </button>

          <ul className="dropdown-menu dropdown-menu-end">
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
  );
}
