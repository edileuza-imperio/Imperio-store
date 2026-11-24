"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Icone } from "@/components/Icons/Icones";

import type { MenuDropdownConfig } from "../config/menu.config";

interface MenuDropdownProps {
  config: MenuDropdownConfig;
}

export default function MenuDropdown({ config }: MenuDropdownProps) {
  const pathname = usePathname();

  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const id = useId();
  const dropdownId = `${config.id}-${id}`;

  /* ------------------------------------------------------
       VERIFICAÇÃO DA ÁREA ATUAL
    ------------------------------------------------------ */

  function rotaAtiva(rota: string): boolean {
    return pathname === rota || pathname.startsWith(`${rota}/`);
  }

  const estaNaArea = config.grupos.some((grupo) =>
    grupo.itens.some((item) => rotaAtiva(item.rota)),
  );

  /* ------------------------------------------------------
       ESTADO DO MENU
    ------------------------------------------------------ */

  const [aberto, setAberto] = useState(estaNaArea);

  useEffect(() => {
    if (estaNaArea) {
      setAberto(true);
    }
  }, [estaNaArea]);

  /* ------------------------------------------------------
       FECHAR MENU
    ------------------------------------------------------ */

  function fecharMenu() {
    setAberto(false);
  }

  /* ------------------------------------------------------
       CLIQUE FORA
    ------------------------------------------------------ */

  useEffect(() => {
    function clicarFora(evento: PointerEvent) {
      if (
        menuRef.current &&
        evento.target instanceof Node &&
        !menuRef.current.contains(evento.target)
      ) {
        fecharMenu();
      }
    }

    document.addEventListener("pointerdown", clicarFora);

    return () => {
      document.removeEventListener("pointerdown", clicarFora);
    };
  }, []);

  /* ------------------------------------------------------
       TECLA ESCAPE
    ------------------------------------------------------ */

  useEffect(() => {
    function verificarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape" && aberto) {
        fecharMenu();
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", verificarTecla);

    return () => {
      document.removeEventListener("keydown", verificarTecla);
    };
  }, [aberto]);

  /* ------------------------------------------------------
       INTERFACE
    ------------------------------------------------------ */

  return (
    <div className="admin-dropdown" ref={menuRef}>
      {/* BOTÃO PRINCIPAL */}

      <button
        ref={triggerRef}
        type="button"
        className={`admin-dropdown-trigger ${
          estaNaArea ? "is-active" : ""
        } ${aberto ? "is-open" : ""}`}
        onClick={() => setAberto((estado) => !estado)}
        aria-expanded={aberto}
        aria-controls={dropdownId}
        aria-haspopup="true"
        aria-label={`Abrir menu de ${config.nome}`}
      >
        <span className="admin-dropdown-trigger-icon">
          <Icone nome={config.icone} tamanho={19} />
        </span>

        <span className="admin-dropdown-trigger-label">{config.nome}</span>

        <span className="admin-dropdown-chevron" aria-hidden="true">
          <Icone nome="chevron-down" tamanho={15} />
        </span>
      </button>

      {/* DROPDOWN */}

      {aberto && (
        <div
          id={dropdownId}
          className="admin-dropdown-panel"
          aria-label={config.ariaLabel}
        >
          {/* CABEÇALHO */}

          <div className="admin-dropdown-header">
            <div className="admin-dropdown-header-icon">
              <Icone nome={config.icone} tamanho={21} />
            </div>

            <div className="admin-dropdown-header-info">
              <strong>{config.titulo}</strong>
              <span>{config.descricao}</span>
            </div>

            <span className="admin-dropdown-badge">{config.badge}</span>
          </div>

          {/* GRUPOS */}

          <div className="admin-dropdown-content">
            {config.grupos.map((grupo) => (
              <section className="admin-dropdown-group" key={grupo.titulo}>
                <span className="admin-dropdown-group-title">
                  {grupo.titulo}
                </span>

                <div className="admin-dropdown-list">
                  {grupo.itens.map((item) => {
                    const ativo = rotaAtiva(item.rota);

                    return (
                      <Link
                        key={item.rota}
                        href={item.rota}
                        className={`admin-dropdown-item ${
                          ativo ? "is-active" : ""
                        }`}
                        onClick={fecharMenu}
                        aria-current={ativo ? "page" : undefined}
                      >
                        <span className="admin-dropdown-icon">
                          <Icone nome={item.icone} tamanho={18} />
                        </span>

                        <span className="admin-dropdown-copy">
                          <strong>{item.titulo}</strong>
                          <small>{item.descricao}</small>
                        </span>

                        {ativo ? (
                          <span className="admin-dropdown-indicator" />
                        ) : (
                          <span
                            className="admin-dropdown-arrow"
                            aria-hidden="true"
                          >
                            <Icone nome="arrow-up-right" tamanho={14} />
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* RODAPÉ */}

          <div className="admin-dropdown-footer">
            <span className="admin-dropdown-status" />

            <span className="admin-dropdown-footer-name">{config.rodape}</span>

            <span className="admin-dropdown-version">
              {config.identificador}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
