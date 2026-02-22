"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaTrash, FaEdit, FaLock, FaUserPlus, FaKey } from "react-icons/fa";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  pin: string | null;
  nivel_id: number;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      setLoading(true);
      const res = await api.get("/admin/usuarios");
      setUsuarios(res.data.dados || []);
    } catch {
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }

  async function excluirUsuario(id: number) {
    if (!confirm("Deseja realmente excluir este usuário?")) return;

    try {
      await api.delete(`/admin/usuarios/${id}`);
      setUsuarios((prev) => prev.filter((u) => u.id_usuario !== id));
      toast.success("Usuário excluído");
    } catch (e: any) {
      toast.error(e.response?.data?.mensagem || "Ação não permitida");
    }
  }

  function resetPin(usuario: Usuario) {
    if (usuario.nivel_id === 1) {
      toast.error("Usuário do sistema não pode alterar PIN");
      return;
    }

    toast.info(`Reset de PIN solicitado para ${usuario.nome}`);
    // depois: chamar rota real
  }

  return (
    <div className="page">
      <ToastContainer position="top-right" autoClose={2400} newestOnTop theme="light" />

      {/* HEADER */}
      <div className="head">
        <div className="headLeft">
          <h1 className="title">Usuários</h1>
          <p className="sub">Gerencie acessos, níveis e segurança</p>
        </div>

        <Link href="/admin/usuarios/novo" className="btnPrimary">
          <FaUserPlus /> Novo Usuário
        </Link>
      </div>

      {/* BODY */}
      {loading ? (
        <div className="grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="card sk" key={i}>
              <div className="row">
                <div className="skLine w60" />
                <div className="skPill w25" />
              </div>
              <div className="skLine w80" />
              <div className="skBox" />
              <div className="skBtns" />
            </div>
          ))}
        </div>
      ) : usuarios.length === 0 ? (
        <div className="empty">
          <div className="emptyCard">
            <div className="emptyTitle">Nenhum usuário encontrado</div>
            <div className="emptySub">
              Crie o primeiro usuário para começar a gerenciar acessos.
            </div>
            <Link href="/admin/usuarios/novo" className="btnPrimary">
              <FaUserPlus /> Novo Usuário
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid">
          {usuarios.map((user) => {
            const isSistema = user.nivel_id === 1;

            return (
              <div key={user.id_usuario} className="card">
                <div className="top">
                  <div className="who">
                    <div className="avatar" aria-hidden>
                      {String(user.nome || "?").trim().slice(0, 1).toUpperCase()}
                    </div>
                    <div className="whoText">
                      <div className="name" title={user.nome}>
                        {user.nome}
                      </div>
                      <div className="email" title={user.email}>
                        {user.email}
                      </div>
                    </div>
                  </div>

                  {isSistema ? (
                    <span className="badgeSystem">
                      <FaLock /> Sistema
                    </span>
                  ) : (
                    <span className="badgeOk">Ativo</span>
                  )}
                </div>

                <div className="pinRow">
                  <div className="pinLabel">PIN</div>
                  <div className="pinValue">{user.pin ?? "— — — —"}</div>
                </div>

                <div className="actions">
                  {isSistema ? (
                    <button className="btn btnLocked" disabled>
                      <FaLock /> Protegido
                    </button>
                  ) : (
                    <>
                      <Link href={`/admin/usuarios/${user.id_usuario}`} className="btn btnSoft">
                        <FaEdit /> Editar
                      </Link>

                      <button className="btn btnSoftInfo" onClick={() => resetPin(user)}>
                        <FaKey /> Reset PIN
                      </button>

                      <button
                        className="btn btnDanger"
                        onClick={() => excluirUsuario(user.id_usuario)}
                        aria-label="Excluir usuário"
                        title="Excluir"
                      >
                        <FaTrash />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        /* Página: sem mexer no body do painel */
        .page {
          padding: 18px 18px 28px;
        }

        /* Header */
        .head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .title {
          margin: 0;
          font-size: 1.9rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #111827;
        }

        .sub {
          margin: 6px 0 0;
          color: rgba(17, 24, 39, 0.62);
        }

        .btnPrimary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          height: 44px;
          padding: 0 16px;
          border-radius: 14px;
          color: #fff;
          text-decoration: none;
          font-weight: 900;
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          box-shadow: 0 10px 30px rgba(79, 70, 229, 0.22);
          border: 1px solid rgba(255, 255, 255, 0.22);
          transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;
          white-space: nowrap;
        }
        .btnPrimary:hover {
          transform: translateY(-1px);
          filter: brightness(1.02);
          box-shadow: 0 14px 36px rgba(79, 70, 229, 0.28);
        }

        /* Grid */
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
          gap: 18px;
          align-items: stretch;
        }

        /* Card base */
        .card {
          position: relative;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(17, 24, 39, 0.10);
          box-shadow: 0 10px 28px rgba(17, 24, 39, 0.06);
          padding: 16px;
          display: grid;
          gap: 12px;
          overflow: hidden;
          transition: transform 0.18s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .card::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(
            700px 220px at 15% 0%,
            rgba(99, 102, 241, 0.08),
            transparent 55%
          );
          opacity: 0.9;
        }

        .card:hover {
          transform: translateY(-3px);
          border-color: rgba(99, 102, 241, 0.22);
          box-shadow: 0 18px 50px rgba(17, 24, 39, 0.10);
        }

        /* Top */
        .top {
          position: relative;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .who {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .avatar {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-weight: 1000;
          color: #3730a3;
          background: rgba(79, 70, 229, 0.10);
          border: 1px solid rgba(79, 70, 229, 0.14);
          flex: 0 0 auto;
        }

        .whoText {
          min-width: 0;
          display: grid;
          gap: 2px;
        }

        .name {
          font-weight: 950;
          color: #111827;
          letter-spacing: -0.01em;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .email {
          color: rgba(17, 24, 39, 0.62);
          font-size: 0.9rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .badgeSystem {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(239, 68, 68, 0.10);
          border: 1px solid rgba(239, 68, 68, 0.18);
          color: #991b1b;
          font-size: 0.75rem;
          font-weight: 900;
          white-space: nowrap;
          flex: 0 0 auto;
        }

        .badgeOk {
          display: inline-flex;
          align-items: center;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(34, 197, 94, 0.10);
          border: 1px solid rgba(34, 197, 94, 0.18);
          color: #166534;
          font-size: 0.75rem;
          font-weight: 900;
          white-space: nowrap;
          flex: 0 0 auto;
        }

        /* PIN row */
        .pinRow {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px 12px;
          border-radius: 14px;
          background: rgba(17, 24, 39, 0.04);
          border: 1px solid rgba(17, 24, 39, 0.08);
        }

        .pinLabel {
          font-size: 0.78rem;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.62);
          letter-spacing: 0.06em;
        }

        .pinValue {
          font-weight: 950;
          color: #111827;
          letter-spacing: 0.08em;
          font-variant-numeric: tabular-nums;
        }

        /* Actions */
        .actions {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 10px;
          align-items: center;
          margin-top: 2px;
        }

        .btn {
          height: 40px;
          border-radius: 12px;
          border: 1px solid rgba(17, 24, 39, 0.10);
          font-weight: 900;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 12px;
          transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;
          text-decoration: none;
          user-select: none;
          background: #fff;
          color: #111827;
          white-space: nowrap;
        }

        .btn:hover {
          transform: translateY(-1px);
        }

        .btnSoft {
          background: rgba(79, 70, 229, 0.08);
          border-color: rgba(79, 70, 229, 0.14);
          color: #3730a3;
        }

        .btnSoftInfo {
          background: rgba(14, 165, 233, 0.10);
          border-color: rgba(14, 165, 233, 0.18);
          color: #075985;
        }

        .btnDanger {
          width: 44px;
          padding: 0;
          background: rgba(239, 68, 68, 0.10);
          border-color: rgba(239, 68, 68, 0.18);
          color: #991b1b;
        }

        .btnLocked {
          grid-column: 1 / -1;
          background: rgba(17, 24, 39, 0.06);
          border-color: rgba(17, 24, 39, 0.10);
          color: rgba(17, 24, 39, 0.55);
          cursor: not-allowed;
        }

        /* Empty */
        .empty {
          display: grid;
          place-items: center;
          padding: 24px 0 0;
        }

        .emptyCard {
          width: min(560px, 100%);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(17, 24, 39, 0.10);
          box-shadow: 0 12px 36px rgba(17, 24, 39, 0.08);
          padding: 18px;
          display: grid;
          gap: 10px;
        }

        .emptyTitle {
          font-size: 1.05rem;
          font-weight: 950;
          color: #111827;
        }

        .emptySub {
          color: rgba(17, 24, 39, 0.62);
          line-height: 1.45;
        }

        /* Skeleton */
        .sk .skLine,
        .sk .skPill,
        .sk .skBox,
        .sk .skBtns {
          border-radius: 12px;
          background: linear-gradient(
            90deg,
            rgba(17, 24, 39, 0.06),
            rgba(17, 24, 39, 0.10),
            rgba(17, 24, 39, 0.06)
          );
          background-size: 220% 100%;
          animation: sh 1.05s linear infinite;
        }
        .sk .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .skLine {
          height: 14px;
        }
        .skPill {
          height: 22px;
          border-radius: 999px;
        }
        .skBox {
          height: 46px;
          border-radius: 14px;
        }
        .skBtns {
          height: 40px;
        }
        .w60 {
          width: 60%;
        }
        .w25 {
          width: 25%;
        }
        .w80 {
          width: 80%;
        }
        @keyframes sh {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: -220% 0%;
          }
        }

        /* Responsive */
        @media (max-width: 520px) {
          .page {
            padding: 14px 14px 24px;
          }
          .btnPrimary {
            width: 100%;
            justify-content: center;
          }
          .actions {
            grid-template-columns: 1fr;
          }
          .btnDanger {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}