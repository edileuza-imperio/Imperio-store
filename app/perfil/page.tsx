'use client';

import Navbar from "@/components/site/menu/navbar";
import FooterPrincipal from "@/components/site/Rodape/Footer";
import useAutenticado from "@/hooks/Usuario/useAutenticado";
import { useRouter } from "next/navigation";
import {
  Mail,
  Pencil,
  ShoppingBag,
  MapPin,
  User,
  LogOut,
  ChevronRight,
  BadgePercent,
  ShieldCheck,
} from "lucide-react";

export default function PerfilPage() {
  const { usuario, loading } = useAutenticado();
  const router = useRouter();

  // ✅ Ecommerce: sem “Carregando…”
  if (loading) {
    return (
      <>
        <Navbar />
        <FooterPrincipal />
      </>
    );
  }

  if (!usuario) {
    router.push("/login");
    return null;
  }

  const iniciais =
    usuario.nome
      ?.split(" ")
      .map((n: string) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const primeiroNome = usuario.nome?.split(" ")?.[0] || "Cliente";

  return (
    <>
      <Navbar />

      <style jsx>{`
        :global(:root) {
          --cream: #fff6ee;
          --cream2: #fff1e6;
          --paper: #ffffff;

          --rose: #b76e79;
          --rose2: #9f3d5f;
          --gold: #d4af37;

          --ink: #1f2937;
          --muted: rgba(31, 41, 55, 0.66);
          --muted2: rgba(31, 41, 55, 0.54);
          --line: rgba(31, 41, 55, 0.10);

          --radius: 26px;
          --shadow: 0 22px 60px rgba(31, 41, 55, 0.14);
          --shadowHover: 0 32px 90px rgba(31, 41, 55, 0.18);
        }

        .page {
          min-height: calc(100vh - 160px);
          background:
            radial-gradient(1100px 420px at 14% -10%, rgba(183,110,121,.16), transparent 60%),
            radial-gradient(980px 420px at 86% -10%, rgba(212,175,55,.14), transparent 60%),
            linear-gradient(180deg, var(--cream), var(--cream2));
          padding: clamp(22px, 3.2vw, 44px) 0 clamp(44px, 4vw, 74px);
        }

        .container {
          width: min(1120px, 92vw);
          margin: 0 auto;
        }

        /* =========================
           PROFILE CARD (TOP)
        ========================= */
        .profileCard {
          position: relative;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          overflow: hidden;
        }

        .cover {
          height: 96px;
          background:
            radial-gradient(520px 160px at 20% 20%, rgba(212,175,55,.35), transparent 60%),
            radial-gradient(520px 160px at 80% 10%, rgba(183,110,121,.30), transparent 60%),
            linear-gradient(135deg, rgba(183,110,121,.20), rgba(212,175,55,.14));
          border-bottom: 1px solid rgba(31,41,55,.08);
        }

        .inner {
          padding: 22px 22px 22px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 18px;
          align-items: center;
          margin-top: -34px;
        }

        .avatar {
          width: 88px;
          height: 88px;
          border-radius: 26px;
          display: grid;
          place-items: center;
          font-size: 28px;
          font-weight: 950;
          color: #fff;
          background: linear-gradient(135deg, var(--rose), var(--gold));
          box-shadow: 0 18px 44px rgba(183, 110, 121, 0.28);
          border: 4px solid rgba(255,255,255,.92);
        }

        .info {
          min-width: 0;
        }

        .hello {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 6px;
        }

        .helloDot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--gold), var(--rose));
          box-shadow: 0 0 0 6px rgba(212,175,55,.10);
        }

        .name {
          margin: 0;
          font-size: clamp(20px, 2.2vw, 28px);
          font-weight: 950;
          color: var(--ink);
          letter-spacing: -0.03em;
          line-height: 1.1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mail {
          margin: 8px 0 0;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--muted);
          font-size: 14px;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn {
          border: 1px solid var(--line);
          background: rgba(255,255,255,.92);
          border-radius: 999px;
          padding: 12px 14px;
          font-weight: 950;
          font-size: 13px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: transform .16s ease, box-shadow .16s ease, background .16s ease, border-color .16s ease, color .16s ease;
          white-space: nowrap;
        }

        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 40px rgba(31,41,55,.14);
          border-color: rgba(183,110,121,.22);
        }

        .btnPrimary {
          background: linear-gradient(135deg, rgba(183,110,121,.16), rgba(212,175,55,.12));
          border-color: rgba(183,110,121,.18);
        }

        .btnPrimary:hover {
          background: linear-gradient(135deg, var(--rose), var(--gold));
          color: #fff;
          border-color: transparent;
          box-shadow: 0 22px 54px rgba(183,110,121,.22);
        }

        .btnDanger:hover {
          background: rgba(183, 40, 60, 0.10);
          border-color: rgba(183, 40, 60, 0.18);
          color: #b7283c;
        }

        /* =========================
           QUICK SUMMARY
        ========================= */
        .quickRow {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .quick {
          background: rgba(255,255,255,.86);
          border: 1px solid var(--line);
          border-radius: 22px;
          padding: 14px 16px;
          box-shadow: 0 14px 34px rgba(31,41,55,.10);
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
        }

        .quick:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 46px rgba(31,41,55,.14);
          border-color: rgba(183,110,121,.18);
        }

        .qIcon {
          width: 46px;
          height: 46px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: linear-gradient(
            135deg,
            rgba(183,110,121,.14),
            rgba(212,175,55,.10),
            rgba(31,41,55,.02)
          );
          border: 1px solid rgba(183,110,121,.16);
          color: rgba(31,41,55,.86);
          flex: 0 0 auto;
        }

        .qText {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .qTitle {
          font-weight: 950;
          color: var(--ink);
          font-size: 13px;
          letter-spacing: -0.01em;
        }

        .qSub {
          color: var(--muted2);
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* =========================
           MAIN ACTION GRID
        ========================= */
        .grid {
          margin-top: 22px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .card {
          position: relative;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 20px;
          box-shadow: var(--shadow);
          cursor: pointer;
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease;
          overflow: hidden;
          min-height: 158px;
        }

        .card::before {
          content: "";
          position: absolute;
          right: -60px;
          bottom: -60px;
          width: 200px;
          height: 200px;
          border-radius: 999px;
          background: radial-gradient(
            circle at 30% 30%,
            rgba(212,175,55,.20),
            rgba(183,110,121,.16),
            transparent 62%
          );
          pointer-events: none;
        }

        .card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadowHover);
          border-color: rgba(183,110,121,.22);
          background: rgba(255,255,255,.96);
        }

        .cardTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .iconBox {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: rgba(183,110,121,.14);
          color: var(--rose2);
          border: 1px solid rgba(183,110,121,.16);
          box-shadow: 0 16px 40px rgba(183,110,121,.10);
        }

        .go {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          border: 1px solid var(--line);
          background: rgba(255,255,255,.86);
          color: rgba(31,41,55,.75);
          transition: transform .16s ease, color .16s ease, border-color .16s ease;
        }

        .card:hover .go {
          transform: translateX(2px);
          color: rgba(183,110,121,.95);
          border-color: rgba(183,110,121,.18);
        }

        .card h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 950;
          color: var(--ink);
          letter-spacing: -0.02em;
        }

        .card p {
          margin: 8px 0 0;
          font-size: 13px;
          color: var(--muted);
          line-height: 1.5;
          max-width: 46ch;
        }

        /* =========================
           RESPONSIVE (melhorado)
        ========================= */
        @media (max-width: 980px) {
          .inner {
            grid-template-columns: auto 1fr;
            grid-template-rows: auto auto;
            gap: 14px;
          }

          .actions {
            grid-column: 1 / -1;
            justify-content: flex-start;
          }

          .quickRow {
            grid-template-columns: 1fr;
          }

          .grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .avatar {
            width: 78px;
            height: 78px;
            border-radius: 22px;
            font-size: 24px;
          }

          .mail {
            white-space: normal;
            overflow: visible;
            text-overflow: clip;
            word-break: break-word;
          }

          .btn {
            width: 100%;
            justify-content: center;
          }

          .actions {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .btn,
          .card,
          .quick,
          .go {
            transition: none;
          }
        }
      `}</style>

      <main className="page">
        <div className="container">
          {/* PERFIL */}
          <section className="profileCard">
            <div className="cover" />

            <div className="inner">
              <div className="avatar">{iniciais}</div>

              <div className="info">
                <div className="hello">
                  <span className="helloDot" />
                  Olá, {primeiroNome}! Sua conta está segura
                  <ShieldCheck size={15} style={{ marginLeft: 6, opacity: 0.8 }} />
                </div>

                <h1 className="name">{usuario.nome}</h1>

                <div className="mail" title={usuario.email}>
                  <Mail size={16} />
                  {usuario.email}
                </div>
              </div>

              <div className="actions">
                <button className="btn btnPrimary" onClick={() => router.push("/perfil/editar")}>
                  <Pencil size={16} />
                  Editar perfil
                </button>

                <button
                  className="btn btnDanger"
                  onClick={() => router.push("/login")} // troque pelo logout real
                  title="Sair"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            </div>
          </section>

          {/* RESUMO RÁPIDO */}
          <section className="quickRow" aria-label="Resumo rápido">
            <div className="quick" onClick={() => router.push("/pedidos")} role="button" tabIndex={0}>
              <div className="qIcon">
                <ShoppingBag size={18} />
              </div>
              <div className="qText">
                <div className="qTitle">Meus pedidos</div>
                <div className="qSub">Acompanhe entregas e histórico</div>
              </div>
            </div>

            <div className="quick" onClick={() => router.push("/cupons")} role="button" tabIndex={0}>
              <div className="qIcon">
                <BadgePercent size={18} />
              </div>
              <div className="qText">
                <div className="qTitle">Cupons</div>
                <div className="qSub">Veja descontos disponíveis</div>
              </div>
            </div>

            <div className="quick" onClick={() => router.push("/enderecos")} role="button" tabIndex={0}>
              <div className="qIcon">
                <MapPin size={18} />
              </div>
              <div className="qText">
                <div className="qTitle">Endereços</div>
                <div className="qSub">Gerencie entregas com facilidade</div>
              </div>
            </div>
          </section>

          {/* AÇÕES PRINCIPAIS */}
          <section className="grid" aria-label="Ações da conta">
            <div className="card" onClick={() => router.push("/pedidos")} role="button" tabIndex={0}>
              <div className="cardTop">
                <div className="iconBox">
                  <ShoppingBag />
                </div>
                <div className="go" aria-hidden="true">
                  <ChevronRight />
                </div>
              </div>
              <h3>Meus pedidos</h3>
              <p>Veja detalhes do pedido, status e rastreio de entrega.</p>
            </div>

            <div className="card" onClick={() => router.push("/enderecos")} role="button" tabIndex={0}>
              <div className="cardTop">
                <div className="iconBox">
                  <MapPin />
                </div>
                <div className="go" aria-hidden="true">
                  <ChevronRight />
                </div>
              </div>
              <h3>Endereços</h3>
              <p>Adicione, edite e escolha o endereço padrão para suas compras.</p>
            </div>

            <div className="card" onClick={() => router.push("/perfil/editar")} role="button" tabIndex={0}>
              <div className="cardTop">
                <div className="iconBox">
                  <User />
                </div>
                <div className="go" aria-hidden="true">
                  <ChevronRight />
                </div>
              </div>
              <h3>Dados pessoais</h3>
              <p>Atualize nome, e-mail e informações da sua conta com segurança.</p>
            </div>
          </section>
        </div>
      </main>

      <FooterPrincipal />
    </>
  );
}
