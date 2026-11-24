"use client";

import { useAuth } from "@/components/contexts/AuthContext";
import Link from "next/link";

// A permissão é configurada no .env.local usando NEXT_PUBLIC_
// porque esta página é executada no navegador.
const PERMISSAO_GERENCIAR_SEGURANCA = "administradores.permissoes.gerenciar";
const PERMISSAO_GERENCIAR_MENUS = "menus.gerenciar";
const PERMISSAO_GERENCIAR_EMAIL = "configuracoes.email.gerenciar";
const PERMISSAO_GERENCIAR_NOTIFICACOES = "configuracoes.notificacoes.gerenciar";

function IconeMenus() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 9v11M8 14h13" />
    </svg>
  );
}

function IconeEmail() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function IconeNotificacoes() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function IconeSeguranca() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export default function ConfiguracoesPage() {
  const { usuario, carregando } = useAuth();

  const permissoes = Array.isArray(usuario?.permissoes)
    ? usuario.permissoes
    : [];

  const podeGerenciarPermissoes = permissoes.includes(
    PERMISSAO_GERENCIAR_SEGURANCA,
  );

  // Enquanto a permissão específica não estiver cadastrada no backend,
  // quem já gerencia permissões também poderá acessar a configuração de menus.
  const podeGerenciarMenus =
    permissoes.includes(PERMISSAO_GERENCIAR_MENUS) || podeGerenciarPermissoes;

  const podeGerenciarEmail =
    permissoes.includes(PERMISSAO_GERENCIAR_EMAIL) || podeGerenciarPermissoes;

  const podeGerenciarNotificacoes =
    permissoes.includes(PERMISSAO_GERENCIAR_NOTIFICACOES) ||
    podeGerenciarPermissoes;

  if (carregando) {
    return (
      <main className="configuracoes-loading" aria-live="polite">
        <span className="configuracoes-spinner" />
        <span>Verificando suas permissões...</span>

        <style jsx>{`
          .configuracoes-loading {
            min-height: 240px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            color: #c9b9c5;
            background: transparent;
            font-size: 13px;
          }

          .configuracoes-spinner {
            width: 18px;
            height: 18px;
            border: 2px solid rgba(226, 139, 183, 0.2);
            border-top-color: #e28bb7;
            border-radius: 50%;
            animation: girar 0.8s linear infinite;
          }

          @keyframes girar {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="configuracoes">
      <header className="configuracoes-header">
        <div className="configuracoes-heading">
          <div className="configuracoes-breadcrumb">
            <span className="breadcrumb-dot" />
            <span>PAINEL ADMINISTRATIVO</span>
            <span className="breadcrumb-separator">/</span>
            <span>CONFIGURAÇÕES</span>
          </div>

          <h1>Configurações</h1>

          <p>
            Gerencie as configurações e os recursos administrativos do Universo
            Império.
          </p>
        </div>
      </header>

      <section className="configuracoes-section">
        <div className="configuracoes-section-heading">
          <div>
            <span className="configuracoes-eyebrow">SISTEMA</span>
            <h2>Gerenciamento</h2>
            <p>
              Controle os recursos administrativos disponíveis para sua conta.
            </p>
          </div>
        </div>

        <div className="configuracoes-grid">
          {podeGerenciarPermissoes ? (
            <article className="configuracoes-card">
              <div className="configuracoes-card-icon">
                <IconeSeguranca />
              </div>

              <div className="configuracoes-card-content">
                <span className="configuracoes-card-category">SEGURANÇA</span>
                <h3>Gerenciar permissões</h3>
                <p>
                  Gerencie os acessos dos administradores, conceda permissões e
                  defina quais funcionalidades cada perfil poderá utilizar.
                </p>

                <Link
                  href="/painel/configuracoes/permissoes"
                  className="configuracoes-card-button"
                >
                  Gerenciar acessos
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ) : (
            <div className="configuracoes-restrito" role="status">
              <div className="configuracoes-restrito-icon" aria-hidden="true">
                <svg
                  width="23"
                  height="23"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
              </div>

              <div>
                <span className="configuracoes-card-category">
                  ACESSO PROTEGIDO
                </span>
                <h3>Acesso restrito</h3>
                <p>
                  Seu perfil não possui autorização para gerenciar as permissões
                  dos administradores. Se precisar desse acesso, solicite ao
                  administrador principal.
                </p>
              </div>
            </div>
          )}

          {podeGerenciarMenus && (
            <article className="configuracoes-card">
              <div className="configuracoes-card-icon">
                <IconeMenus />
              </div>

              <div className="configuracoes-card-content">
                <span className="configuracoes-card-category">NAVEGAÇÃO</span>
                <h3>Gerenciar menus</h3>
                <p>
                  Defina quais menus e submenus do painel cada papel poderá
                  visualizar, organizando o acesso de administradores, suporte e
                  gestores da loja.
                </p>

                <Link
                  href="/painel/configuracoes/menus"
                  className="configuracoes-card-button"
                >
                  Configurar menus
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          )}

          {podeGerenciarEmail && (
            <article className="configuracoes-card">
              <div className="configuracoes-card-icon">
                <IconeEmail />
              </div>

              <div className="configuracoes-card-content">
                <span className="configuracoes-card-category">COMUNICAÇÃO</span>
                <h3>Configurar e-mails</h3>
                <p>
                  Organize as configurações de envio de e-mails da loja, como
                  remetente, dados do serviço de envio e mensagens utilizadas
                  nas comunicações com clientes.
                </p>

                <Link
                  href="/painel/configuracoes/email"
                  className="configuracoes-card-button"
                >
                  Configurar e-mails
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          )}

          {podeGerenciarNotificacoes && (
            <article className="configuracoes-card">
              <div className="configuracoes-card-icon">
                <IconeNotificacoes />
              </div>

              <div className="configuracoes-card-content">
                <span className="configuracoes-card-category">AUTOMAÇÕES</span>
                <h3>Notificações da loja</h3>
                <p>
                  Defina quais avisos e comunicados devem ser enviados em
                  situações importantes, como novos pedidos, alterações de
                  status e atualizações para os clientes.
                </p>

                <Link
                  href="/painel/configuracoes/notificacoes"
                  className="configuracoes-card-button"
                >
                  Gerenciar notificações
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          )}
        </div>
      </section>

      <style jsx>{`
        .configuracoes {
          width: 100%;
          min-height: 100%;
          padding: 30px clamp(18px, 4vw, 48px) 48px;
          color: #f5edf2;
          background: transparent;
          box-sizing: border-box;
        }

        .configuracoes-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 34px;
        }

        .configuracoes-breadcrumb {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
          margin-bottom: 15px;
          color: #d78caf;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 1.25px;
        }

        .breadcrumb-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #e58db8;
          box-shadow: 0 0 12px rgba(229, 141, 184, 0.55);
        }

        .breadcrumb-separator {
          color: #766572;
        }

        .configuracoes-header h1 {
          margin: 0 0 9px;
          color: #fff7fb;
          font-size: clamp(27px, 3vw, 36px);
          font-weight: 750;
          letter-spacing: -1.2px;
        }

        .configuracoes-header p {
          max-width: 650px;
          margin: 0;
          color: #b9aab5;
          font-size: 13px;
          line-height: 1.7;
        }

        .configuracoes-section {
          width: 100%;
        }

        .configuracoes-section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 17px;
        }

        .configuracoes-eyebrow {
          color: #d78caf;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 1.2px;
        }

        .configuracoes-section-heading h2 {
          margin: 6px 0 5px;
          color: #f8eff5;
          font-size: 18px;
          font-weight: 700;
        }

        .configuracoes-section-heading p {
          margin: 0;
          color: #a998a5;
          font-size: 12px;
          line-height: 1.6;
        }

        .configuracoes-grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fill,
            minmax(min(100%, 330px), 390px)
          );
          gap: 18px;
        }

        .configuracoes-card {
          display: flex;
          align-items: flex-start;
          gap: 17px;
          min-width: 0;
          padding: 23px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(
            145deg,
            rgba(39, 27, 39, 0.82),
            rgba(25, 19, 26, 0.72)
          );
          border: 1px solid #493344;
          border-radius: 14px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
          transition:
            border-color 180ms ease,
            background 180ms ease,
            transform 180ms ease;
        }

        .configuracoes-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 23px;
          width: 42px;
          height: 2px;
          border-radius: 0 0 3px 3px;
          background: #d78caf;
          opacity: 0.9;
        }

        .configuracoes-card:hover {
          background: linear-gradient(
            145deg,
            rgba(47, 31, 45, 0.92),
            rgba(29, 21, 30, 0.82)
          );
          border-color: #98617f;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.2);
          transform: translateY(-3px);
        }

        .configuracoes-card-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 48px;
          width: 48px;
          height: 48px;
          color: #e7a0c2;
          background: rgba(190, 103, 151, 0.13);
          border: 1px solid rgba(213, 133, 175, 0.28);
          border-radius: 11px;
        }

        .configuracoes-card-content {
          flex: 1;
          min-width: 0;
        }

        .configuracoes-card-category {
          display: block;
          margin-bottom: 8px;
          color: #d78caf;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 1.2px;
        }

        .configuracoes-card-content h3,
        .configuracoes-restrito h3 {
          margin: 0 0 9px;
          color: #fff5fa;
          font-size: 16px;
          font-weight: 700;
        }

        .configuracoes-card-content p,
        .configuracoes-restrito p {
          margin: 0 0 19px;
          color: #bdaeba;
          font-size: 12px;
          line-height: 1.8;
        }

        .configuracoes-card-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 13px;
          min-height: 38px;
          padding: 0 14px;
          color: #fff8fc;
          background: linear-gradient(135deg, #bd6795, #91476f);
          border: 1px solid rgba(235, 165, 199, 0.28);
          border-radius: 7px;
          font-size: 11px;
          font-weight: 700;
          text-decoration: none;
          transition:
            filter 180ms ease,
            transform 180ms ease;
        }

        .configuracoes-card-button:hover {
          filter: brightness(1.12);
          transform: translateY(-1px);
        }

        .configuracoes-card-button:active {
          transform: translateY(0);
        }

        .configuracoes-card-button:focus-visible {
          outline: 2px solid #f0a9cb;
          outline-offset: 3px;
        }

        .configuracoes-restrito {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          max-width: 520px;
          padding: 21px;
          background: rgba(31, 23, 31, 0.62);
          border: 1px solid #493344;
          border-radius: 12px;
        }

        .configuracoes-restrito-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 43px;
          width: 43px;
          height: 43px;
          color: #e2a0bd;
          background: rgba(190, 103, 151, 0.12);
          border: 1px solid rgba(213, 133, 175, 0.22);
          border-radius: 10px;
        }

        .configuracoes-restrito h3 {
          margin-bottom: 7px;
        }

        .configuracoes-restrito p {
          margin-bottom: 0;
        }

        @media (max-width: 600px) {
          .configuracoes {
            padding: 22px 16px 35px;
          }

          .configuracoes-header {
            margin-bottom: 27px;
          }

          .configuracoes-grid {
            grid-template-columns: 1fr;
          }

          .configuracoes-card {
            padding: 18px;
            gap: 13px;
          }

          .configuracoes-restrito {
            padding: 17px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .configuracoes-card,
          .configuracoes-card-button {
            transition: none;
          }

          .configuracoes-card:hover,
          .configuracoes-card-button:hover {
            transform: none;
          }
        }
      `}</style>
    </main>
  );
}
