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

type ApiUsuariosResponse =
  | {
      dados?: Usuario[]; // fallback caso algum endpoint antigo mande direto
      data?: any;
    }
  | any;

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    carregar();
  }, []);

  function extrairListaUsuarios(resData: ApiUsuariosResponse): Usuario[] {
    // tenta vários formatos, porque seu backend tem variações
    const d = resData?.dados ?? resData?.data ?? resData;

    // formato do seu UsuarioController@listar: dados: { total, usuarios: [] }
    if (Array.isArray(d?.usuarios)) return d.usuarios;

    // formatos alternativos
    if (Array.isArray(d)) return d;
    if (Array.isArray(resData?.dados)) return resData.dados;

    return [];
  }

  async function carregar() {
    try {
      setLoading(true);
      const res = await api.get("/admin/usuarios", { withCredentials: true });
      const lista = extrairListaUsuarios(res.data);
      setUsuarios(lista);
    } catch (e) {
      toast.error("Erro ao carregar usuários");
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }

  async function excluirUsuario(user: Usuario) {
    if (user.nivel_id === 1) {
      toast.error("Usuário do sistema não pode ser excluído.");
      return;
    }

    // confirmação simples do navegador (não cria overlay/tela preta)
    const ok = confirm(`Excluir o usuário "${user.nome}"?`);
    if (!ok) return;

    try {
      setDeletingId(user.id_usuario);

      await api.delete(`/admin/usuarios/${user.id_usuario}`, {
        withCredentials: true,
      });

      toast.success(`Usuário "${user.nome}" excluído!`);

      // ✅ garante que não “volte”
      await carregar();
    } catch (e: any) {
      toast.error(e?.response?.data?.mensagem || "Erro ao excluir usuário");
    } finally {
      setDeletingId(null);
    }
  }

  function resetPin(usuario: Usuario) {
    if (usuario.nivel_id === 1) {
      toast.error("Usuário do sistema não pode alterar PIN");
      return;
    }
    toast.info(`Reset de PIN solicitado para ${usuario.nome}`);
    // depois: chamar /admin/usuarios/{id}/reset-pin
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

      {/* HEADER */}
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

      {/* BODY */}
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
            const isDeleting = deletingId === user.id_usuario;

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
                    <span className="badge badgeSystem">
                      <FaLock /> Sistema
                    </span>
                  ) : (
                    <span className="badge badgeOk">Ativo</span>
                  )}
                </div>

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
                        className="trashMini"
                        onClick={() => excluirUsuario(user)}
                        disabled={isDeleting}
                        aria-label="Excluir usuário"
                        title={isDeleting ? "Excluindo..." : "Excluir"}
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
        .page {
          padding: 18px 18px 28px;
          background: linear-gradient(180deg, rgba(17, 24, 39, 0.03), transparent 45%);
          border-radius: 18px;
        }

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
          color: rgba(17, 24, 39, 0.5);
          font-weight: 700;
        }

        .headRight {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .btn {
          height: 44px;
          padding: 0 14px;
          border-radius: 14px;
          font-weight: 900;
          border: 1px solid rgba(17, 24, 39, 0.10);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.2s ease;
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
          box-shadow: 0 12px 30px rgba(17, 24, 39, 0.10);
        }
        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .btnPrimary {
          color: #fff;
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          border-color: rgba(255, 255, 255, 0.22);
          box-shadow: 0 10px 30px rgba(79, 70, 229, 0.22);
        }
        .btnGhost {
          background: rgba(255, 255, 255, 0.75);
          border-color: rgba(17, 24, 39, 0.10);
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

        .btnLocked {
          background: rgba(17, 24, 39, 0.06);
          border-color: rgba(17, 24, 39, 0.12);
          color: rgba(17, 24, 39, 0.55);
          cursor: not-allowed;
          grid-column: 1 / -1;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 18px;
        }

        .card {
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(17, 24, 39, 0.10);
          box-shadow: 0 10px 28px rgba(17, 24, 39, 0.06);
          padding: 16px;
          display: grid;
          gap: 12px;
          transition: transform 0.18s ease, box-shadow 0.2s ease;
          position: relative;
        }
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 44px rgba(17, 24, 39, 0.10);
        }

        .top {
          display: flex;
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
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 900;
          white-space: nowrap;
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

        .pinRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px;
          border-radius: 16px;
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
        }
        .iconBtn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          position: relative;
          padding-bottom: 6px;
        }

        .trashMini {
          position: absolute;
          left: 0;
          bottom: 0;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid rgba(239, 68, 68, 0.18);
          background: rgba(239, 68, 68, 0.10);
          color: #991b1b;
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: transform 0.15s ease;
        }
        .trashMini:hover {
          transform: translateY(-1px);
        }
        .trashMini:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

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
          .trashMini {
            position: static;
            width: 100%;
            height: 44px;
          }
        }
      `}</style>
    </div>
  );
}