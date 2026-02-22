"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  FaTrash,
  FaEdit,
  FaLock,
  FaUserPlus,
  FaKey,
  FaEnvelope,
  FaCopy,
  FaSyncAlt,
} from "react-icons/fa";

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

  // modal de exclusão
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  function abrirExcluir(user: Usuario) {
    if (user.nivel_id === 1) {
      toast.error("Usuário do sistema não pode ser excluído.");
      return;
    }
    setDeleteTarget(user);
    setDeleteOpen(true);
  }

  async function confirmarExcluir() {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await api.delete(`/admin/usuarios/${deleteTarget.id_usuario}`);
      setUsuarios((prev) => prev.filter((u) => u.id_usuario !== deleteTarget.id_usuario));
      toast.success("Usuário excluído");
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.mensagem || "Ação não permitida");
    } finally {
      setDeleting(false);
    }
  }

  function resetPin(usuario: Usuario) {
    if (usuario.nivel_id === 1) {
      toast.error("Usuário do sistema não pode alterar PIN");
      return;
    }
    toast.info(`Reset de PIN solicitado para ${usuario.nome}`);
    // depois: chamar rota real /admin/usuarios/{id}/reset-pin
  }

  async function copiarTexto(texto: string, okMsg: string) {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success(okMsg);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  function mailtoUsuario(user: Usuario) {
    const assunto = encodeURIComponent("Acesso ao Painel - Usuário");
    const corpo = encodeURIComponent(
      `Olá ${user.nome},\n\nSegue seu acesso:\nEmail: ${user.email}\nPIN: ${
        user.pin ?? "(sem PIN)"
      }\n\nQualquer dúvida, estou à disposição.\n`
    );
    window.location.href = `mailto:${user.email}?subject=${assunto}&body=${corpo}`;
  }

  const totalSistema = useMemo(
    () => usuarios.filter((u) => u.nivel_id === 1).length,
    [usuarios]
  );

  return (
    <div className="page">
      <ToastContainer position="top-right" autoClose={2400} newestOnTop theme="light" />

      {/* Header */}
      <div className="head">
        <div className="headLeft">
          <div className="kicker">
            <span className="kdot" />
            Painel Administrativo
          </div>

          <h1 className="title">Usuários</h1>
          <p className="sub">
            Gerencie acessos, níveis e segurança
            {usuarios.length > 0 && (
              <span className="meta">
                • {usuarios.length} total • {totalSistema} sistema
              </span>
            )}
          </p>
        </div>

        <div className="headRight">
          <button className="btn btnGhost" onClick={carregar} disabled={loading}>
            <FaSyncAlt /> Atualizar
          </button>

          <Link href="/admin/usuarios/novo" className="btn btnPrimary">
            <FaUserPlus /> Novo Usuário
          </Link>
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="card sk" key={i}>
              <div className="skTop">
                <div className="skAvatar" />
                <div className="skLines">
                  <div className="skLine w70" />
                  <div className="skLine w90" />
                </div>
                <div className="skPill" />
              </div>
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
            <Link href="/admin/usuarios/novo" className="btn btnPrimary">
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
                {/* topo */}
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
                    <span className="badge badgeSystem">
                      <FaLock /> Sistema
                    </span>
                  ) : (
                    <span className="badge badgeOk">Ativo</span>
                  )}
                </div>

                {/* PIN */}
                <div className="pinRow">
                  <div className="pinLeft">
                    <div className="pinLabel">PIN</div>
                    <div className="pinValue">{user.pin ?? "— — — —"}</div>
                  </div>

                  <button
                    className="iconBtn"
                    onClick={() => copiarTexto(user.pin ?? "", "PIN copiado!")}
                    disabled={!user.pin}
                    title={user.pin ? "Copiar PIN" : "Sem PIN"}
                    aria-label="Copiar PIN"
                  >
                    <FaCopy />
                  </button>
                </div>

                {/* Ações */}
                <div className="actions">
                  <button className="btn btnSoft" onClick={() => mailtoUsuario(user)}>
                    <FaEnvelope /> Enviar email
                  </button>

                  <button
                    className="btn btnSoftInfo"
                    onClick={() => copiarTexto(user.email, "Email copiado!")}
                  >
                    <FaCopy /> Copiar email
                  </button>

                  {isSistema ? (
                    <button className="btn btnLocked" disabled>
                      <FaLock /> Protegido
                    </button>
                  ) : (
                    <>
                      <Link href={`/admin/usuarios/${user.id_usuario}`} className="btn btnSoft2">
                        <FaEdit /> Editar
                      </Link>

                      <button className="btn btnSoftWarn" onClick={() => resetPin(user)}>
                        <FaKey /> Reset PIN
                      </button>

                      <button
                        className="btn btnDanger"
                        onClick={() => abrirExcluir(user)}
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

      {/* Modal excluir */}
      {deleteOpen && (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modalTitle">Excluir usuário</div>
            <div className="modalText">
              Tem certeza que deseja excluir{" "}
              <strong>{deleteTarget?.nome}</strong>?
              <div className="modalHint">Essa ação não pode ser desfeita.</div>
            </div>

            <div className="modalActions">
              <button
                className="btn btnGhost"
                onClick={() => {
                  if (deleting) return;
                  setDeleteOpen(false);
                  setDeleteTarget(null);
                }}
              >
                Cancelar
              </button>

              <button className="btn btnDangerSolid" onClick={confirmarExcluir} disabled={deleting}>
                {deleting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .page {
          padding: 18px 18px 28px;
        }

        /* Head */
        .head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(17, 24, 39, 0.04);
          border: 1px solid rgba(17, 24, 39, 0.08);
          color: rgba(17, 24, 39, 0.7);
          font-size: 0.82rem;
          font-weight: 800;
          width: fit-content;
        }

        .kdot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #4f46e5;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.16);
        }

        .title {
          margin: 10px 0 6px;
          font-size: 1.9rem;
          font-weight: 950;
          letter-spacing: -0.02em;
          color: #111827;
        }

        .sub {
          margin: 0;
          color: rgba(17, 24, 39, 0.62);
        }

        .meta {
          margin-left: 8px;
          color: rgba(17, 24, 39, 0.50);
          font-weight: 700;
        }

        .headRight {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        /* Buttons */
        .btn {
          height: 44px;
          padding: 0 14px;
          border-radius: 14px;
          font-weight: 900;
          border: 1px solid rgba(17, 24, 39, 0.12);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          text-decoration: none;
          background: #fff;
          color: #111827;
        }

        .btn:hover {
          transform: translateY(-1px);
        }
        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .btnPrimary {
          color: #fff;
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          box-shadow: 0 10px 30px rgba(79, 70, 229, 0.22);
          border-color: rgba(255, 255, 255, 0.22);
        }

        .btnGhost {
          background: rgba(17, 24, 39, 0.04);
          border-color: rgba(17, 24, 39, 0.10);
          color: rgba(17, 24, 39, 0.86);
        }

        .btnSoft {
          background: rgba(79, 70, 229, 0.08);
          border-color: rgba(79, 70, 229, 0.14);
          color: #3730a3;
        }

        .btnSoft2 {
          background: rgba(17, 24, 39, 0.05);
          border-color: rgba(17, 24, 39, 0.10);
          color: rgba(17, 24, 39, 0.86);
        }

        .btnSoftInfo {
          background: rgba(14, 165, 233, 0.10);
          border-color: rgba(14, 165, 233, 0.18);
          color: #075985;
        }

        .btnSoftWarn {
          background: rgba(245, 158, 11, 0.12);
          border-color: rgba(245, 158, 11, 0.22);
          color: #92400e;
        }

        .btnDanger {
          width: 44px;
          padding: 0;
          background: rgba(239, 68, 68, 0.10);
          border-color: rgba(239, 68, 68, 0.18);
          color: #991b1b;
        }

        .btnLocked {
          background: rgba(17, 24, 39, 0.06);
          border-color: rgba(17, 24, 39, 0.12);
          color: rgba(17, 24, 39, 0.55);
          cursor: not-allowed;
          grid-column: 1 / -1;
        }

        .btnDangerSolid {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border-color: rgba(255, 255, 255, 0.22);
          color: #fff;
          box-shadow: 0 10px 30px rgba(239, 68, 68, 0.18);
        }

        /* Grid */
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 18px;
          align-items: stretch;
        }

        /* Cards */
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

        .badge {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 900;
          white-space: nowrap;
          flex: 0 0 auto;
        }

        .badgeSystem {
          background: rgba(239, 68, 68, 0.10);
          border: 1px solid rgba(239, 68, 68, 0.18);
          color: #991b1b;
        }

        .badgeOk {
          background: rgba(34, 197, 94, 0.10);
          border: 1px solid rgba(34, 197, 94, 0.18);
          color: #166534;
        }

        /* PIN */
        .pinRow {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px;
          border-radius: 14px;
          background: rgba(17, 24, 39, 0.04);
          border: 1px solid rgba(17, 24, 39, 0.08);
        }

        .pinLeft {
          display: grid;
          gap: 2px;
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
          letter-spacing: 0.12em;
          font-variant-numeric: tabular-nums;
        }

        .iconBtn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid rgba(17, 24, 39, 0.10);
          background: rgba(255, 255, 255, 0.9);
          color: rgba(17, 24, 39, 0.75);
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: transform 0.15s ease, box-shadow 0.2s ease;
        }
        .iconBtn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(17, 24, 39, 0.10);
        }
        .iconBtn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Actions */
        .actions {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          align-items: center;
          margin-top: 2px;
        }

        /* em cards normais a linha de baixo vira 3 colunas */
        .actions > :nth-child(3),
        .actions > :nth-child(4),
        .actions > :nth-child(5) {
          grid-column: auto;
        }

        /* Quando tem 5 itens, deixa 3 na linha de baixo */
        .actions {
          grid-auto-flow: row;
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
        .sk .skTop,
        .sk .skLine,
        .sk .skAvatar,
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

        .skTop {
          display: grid;
          grid-template-columns: 42px 1fr 72px;
          gap: 10px;
          align-items: center;
        }

        .skAvatar {
          width: 42px;
          height: 42px;
          border-radius: 14px;
        }

        .skLines {
          display: grid;
          gap: 8px;
        }

        .skLine {
          height: 12px;
        }

        .w70 {
          width: 70%;
        }
        .w90 {
          width: 90%;
        }

        .skPill {
          height: 22px;
          border-radius: 999px;
        }

        .skBox {
          height: 54px;
          border-radius: 14px;
        }

        .skBtns {
          height: 44px;
        }

        @keyframes sh {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: -220% 0%;
          }
        }

        /* Modal */
        .modalOverlay {
          position: fixed;
          inset: 0;
          background: rgba(17, 24, 39, 0.42);
          display: grid;
          place-items: center;
          padding: 16px;
          z-index: 9999;
        }

        .modal {
          width: min(520px, 100%);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(17, 24, 39, 0.12);
          box-shadow: 0 20px 80px rgba(17, 24, 39, 0.22);
          padding: 16px;
        }

        .modalTitle {
          font-size: 1.05rem;
          font-weight: 950;
          color: #111827;
          margin-bottom: 8px;
        }

        .modalText {
          color: rgba(17, 24, 39, 0.70);
          line-height: 1.45;
        }

        .modalHint {
          margin-top: 8px;
          font-size: 0.9rem;
          color: rgba(17, 24, 39, 0.55);
        }

        .modalActions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 14px;
          flex-wrap: wrap;
        }

        /* Responsive */
        @media (max-width: 520px) {
          .page {
            padding: 14px 14px 24px;
          }
          .headRight {
            width: 100%;
          }
          .btnPrimary {
            flex: 1;
          }
          .grid {
            grid-template-columns: 1fr;
          }
          .actions {
            grid-template-columns: 1fr;
          }
          .btnDanger {
            width: 100%;
            padding: 0 14px;
          }
        }
      `}</style>
    </div>
  );
}