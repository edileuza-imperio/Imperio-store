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
  FaSearch,
} from "react-icons/fa";

interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  pin: string | null;
  nivel_id: number;
}

type ApiUsuariosResponse = any;

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ✅ busca + paginação
  const [q, setQ] = useState("");
  const [itensPorPagina, setItensPorPagina] = useState(12);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    setPagina(1);
  }, [q, itensPorPagina]);

  function extrairListaUsuarios(resData: ApiUsuariosResponse): Usuario[] {
    const d = resData?.dados ?? resData?.data ?? resData;

    if (Array.isArray(d?.usuarios)) return d.usuarios;
    if (Array.isArray(d)) return d;
    if (Array.isArray(resData?.dados)) return resData.dados;

    return [];
  }

  async function carregar() {
    try {
      setLoading(true);
      const res = await api.get("/admin/usuarios", { withCredentials: true });
      const lista = extrairListaUsuarios(res.data);

      // normaliza
      const norm: Usuario[] = (Array.isArray(lista) ? lista : []).map((u: any) => ({
        id_usuario: Number(u.id_usuario),
        nome: String(u.nome ?? ""),
        email: String(u.email ?? ""),
        pin: u.pin ?? null,
        nivel_id: Number(u.nivel_id ?? 2),
      }));

      setUsuarios(norm);
    } catch (e) {
      console.error(e);
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

    const ok = confirm(`Excluir o usuário "${user.nome}"?`);
    if (!ok) return;

    try {
      setDeletingId(user.id_usuario);

      await api.delete(`/admin/usuarios/${user.id_usuario}`, {
        withCredentials: true,
      });

      toast.success(`Usuário "${user.nome}" excluído!`);
      await carregar();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.mensagem || "Erro ao excluir usuário");
    } finally {
      setDeletingId(null);
    }
  }

  // opcional: rota no back (se você criar)
  async function resetPin(usuario: Usuario) {
    if (usuario.nivel_id === 1) {
      toast.error("Usuário do sistema não pode alterar PIN");
      return;
    }

    const ok = confirm(`Resetar PIN do usuário "${usuario.nome}"?`);
    if (!ok) return;

    try {
      // ✅ se você criar a rota:
      // await api.post(`/admin/usuarios/${usuario.id_usuario}/reset-pin`, {}, { withCredentials: true });

      toast.info("Reset de PIN (implemente a rota no back)");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.mensagem || "Erro ao resetar PIN");
    }
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

  const filtrados = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return usuarios;

    return usuarios.filter((u) => {
      const nome = (u.nome || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const pin = (u.pin || "").toLowerCase();
      return nome.includes(s) || email.includes(s) || pin.includes(s);
    });
  }, [usuarios, q]);

  const totalPaginas = useMemo(() => {
    const total = Math.ceil((filtrados.length || 0) / itensPorPagina);
    return Math.max(total, 1);
  }, [filtrados.length, itensPorPagina]);

  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas);
    if (pagina < 1) setPagina(1);
  }, [pagina, totalPaginas]);

  const paginados = useMemo(() => {
    const start = (pagina - 1) * itensPorPagina;
    const end = start + itensPorPagina;
    return filtrados.slice(start, end);
  }, [filtrados, pagina, itensPorPagina]);

  const paginas = useMemo(() => {
    // se você tiver muitas páginas e quiser "..." eu deixo bem elegante
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  }, [totalPaginas]);

  return (
    <div className="page">
      <ToastContainer position="top-right" autoClose={2400} newestOnTop theme="light" />

      {/* TOPBAR */}
      <div className="topbar">
        <div className="topLeft">
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

        <div className="topRight">
          <button className="btn ghost" onClick={carregar} disabled={loading}>
            <FaSyncAlt /> Atualizar
          </button>

          <Link href="/admin/usuarios/novo" className="btn primary">
            <FaUserPlus /> Novo Usuário
          </Link>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar">
        <div className="search">
          <FaSearch className="sIcon" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, email ou PIN..."
          />
        </div>

        <div className="perPage">
          <span>Por página</span>
          <select
            value={itensPorPagina}
            onChange={(e) => setItensPorPagina(Number(e.target.value))}
          >
            <option value={8}>8</option>
            <option value={12}>12</option>
            <option value={16}>16</option>
            <option value={24}>24</option>
            <option value={48}>48</option>
          </select>
        </div>
      </div>

      {/* PAGINAÇÃO (SEM PRÓX/ANT) */}
      {!loading && filtrados.length > 0 && totalPaginas > 1 && (
        <div className="pagerBar">
          <div className="pagerInfo">
            Página <b>{pagina}</b> de <b>{totalPaginas}</b> — Mostrando{" "}
            <b>{paginados.length}</b> de <b>{filtrados.length}</b>
          </div>

          <div className="pagerNumbers" aria-label="Paginação">
            {paginas.map((p) => (
              <button
                key={p}
                type="button"
                className={`pageBtn ${p === pagina ? "active" : ""}`}
                onClick={() => setPagina(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* BODY */}
      {loading ? (
        <div className="skeletonWrap">
          {Array.from({ length: 10 }).map((_, i) => (
            <div className="skRow" key={i} />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="empty">
          <div className="emptyCard">
            <div className="emptyTitle">Nenhum usuário encontrado</div>
            <div className="emptySub">Tente outra busca ou crie um novo usuário.</div>
            <Link href="/admin/usuarios/novo" className="btn primary">
              <FaUserPlus /> Novo Usuário
            </Link>
          </div>
        </div>
      ) : (
        <div className="tableCard">
          <div className="tableHead">
            <div className="th name">Usuário</div>
            <div className="th pin">PIN</div>
            <div className="th level">Nível</div>
            <div className="th actions">Ações</div>
          </div>

          {paginados.map((user) => {
            const isSistema = user.nivel_id === 1;
            const isDeleting = deletingId === user.id_usuario;

            return (
              <div className="row" key={user.id_usuario}>
                <div className="td name">
                  <div className="who">
                    <div className={`avatar ${isSistema ? "sys" : ""}`} aria-hidden>
                      {String(user.nome || "?").trim().slice(0, 1).toUpperCase()}
                    </div>

                    <div className="whoText">
                      <div className="nm" title={user.nome}>
                        {user.nome}
                      </div>
                      <div className="em" title={user.email}>
                        {user.email}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="td pin">
                  <div className="pinBox">
                    <span className={`pinValue ${user.pin ? "" : "muted"}`}>
                      {user.pin ?? "— — — —"}
                    </span>

                    <button
                      className="mini"
                      onClick={() => copiarTexto(user.pin ?? "", "PIN copiado!")}
                      disabled={!user.pin}
                      title={user.pin ? "Copiar PIN" : "Sem PIN"}
                      aria-label="Copiar PIN"
                    >
                      <FaCopy />
                    </button>
                  </div>
                </div>

                <div className="td level">
                  {isSistema ? (
                    <span className="pill danger">
                      <FaLock /> Sistema
                    </span>
                  ) : (
                    <span className="pill ok">Ativo</span>
                  )}
                </div>

                <div className="td actions">
                  <div className="actionsWrap">
                    <button className="act soft" onClick={() => mailtoUsuario(user)}>
                      <FaEnvelope /> Email
                    </button>

                    <button
                      className="act soft2"
                      onClick={() => copiarTexto(user.email, "Email copiado!")}
                    >
                      <FaCopy /> Copiar
                    </button>

                    {isSistema ? (
                      <button className="act locked" disabled>
                        <FaLock /> Protegido
                      </button>
                    ) : (
                      <>
                        <Link href={`/admin/usuarios/${user.id_usuario}`} className="act soft3">
                          <FaEdit /> Editar
                        </Link>

                        <button className="act warn" onClick={() => resetPin(user)}>
                          <FaKey /> Reset
                        </button>

                        <button
                          className="trash"
                          onClick={() => excluirUsuario(user)}
                          disabled={isDeleting}
                          title={isDeleting ? "Excluindo..." : "Excluir"}
                          aria-label="Excluir usuário"
                        >
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        :global(:root) {
          --ink: #0f172a;
          --muted: rgba(15, 23, 42, 0.62);
          --line: rgba(15, 23, 42, 0.10);

          --bg1: rgba(99, 102, 241, 0.10);
          --bg2: rgba(212, 175, 55, 0.10);

          --primary: #4f46e5;
          --primary2: #6366f1;

          --ok: #22c55e;
          --warn: #f59e0b;
          --danger: #ef4444;

          --card: rgba(255, 255, 255, 0.78);
          --shadow: 0 18px 60px rgba(15, 23, 42, 0.10);
          --shadow2: 0 30px 90px rgba(15, 23, 42, 0.14);
        }

        .page {
          padding: 18px 18px 28px;
          border-radius: 18px;
          background:
            radial-gradient(1200px 520px at 10% -10%, var(--bg1), transparent 60%),
            radial-gradient(980px 520px at 90% -10%, var(--bg2), transparent 60%),
            linear-gradient(180deg, rgba(15, 23, 42, 0.03), transparent 50%);
          min-height: 92vh;
        }

        .topbar {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        .kicker {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 7px 11px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.04);
          border: 1px solid rgba(15, 23, 42, 0.08);
          color: rgba(15, 23, 42, 0.72);
          font-size: 0.82rem;
          font-weight: 950;
          width: fit-content;
        }
        .kdot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--primary), var(--primary2));
          box-shadow: 0 0 0 5px rgba(99, 102, 241, 0.18);
        }

        .title {
          margin: 10px 0 6px;
          font-size: 2rem;
          font-weight: 1000;
          letter-spacing: -0.03em;
          color: var(--ink);
        }

        .sub {
          margin: 0;
          color: var(--muted);
        }
        .meta {
          margin-left: 8px;
          color: rgba(15, 23, 42, 0.52);
          font-weight: 850;
        }

        .topRight {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .btn {
          height: 44px;
          padding: 0 14px;
          border-radius: 14px;
          font-weight: 950;
          border: 1px solid var(--line);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          text-decoration: none;
          background: #fff;
          color: var(--ink);
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
        }
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow);
        }
        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .btn.primary {
          color: #fff;
          background: linear-gradient(135deg, var(--primary), var(--primary2));
          border-color: rgba(255, 255, 255, 0.22);
        }

        .btn.ghost {
          background: rgba(255, 255, 255, 0.74);
        }

        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .search {
          flex: 1;
          min-width: 260px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid var(--line);
          background: rgba(255, 255, 255, 0.84);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
        }
        .sIcon {
          color: rgba(15, 23, 42, 0.55);
        }
        .search input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-weight: 750;
          color: var(--ink);
        }

        .perPage {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.84);
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 10px 12px;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
          color: rgba(15, 23, 42, 0.72);
          font-weight: 950;
          font-size: 12px;
        }
        .perPage select {
          border: 1px solid rgba(15, 23, 42, 0.14);
          border-radius: 999px;
          padding: 6px 10px;
          outline: none;
          background: #fff;
          font-weight: 900;
          cursor: pointer;
          color: var(--ink);
        }

        .pagerBar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin: 12px 0 14px;

          background: rgba(255, 255, 255, 0.80);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 10px 12px;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
        }

        .pagerInfo {
          color: rgba(15, 23, 42, 0.78);
          font-size: 13px;
          font-weight: 750;
        }

        .pagerNumbers {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: flex-end;
        }

        .pageBtn {
          min-width: 36px;
          height: 34px;
          padding: 0 10px;
          border-radius: 10px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: #fff;
          font-weight: 950;
          color: rgba(15, 23, 42, 0.82);
          cursor: pointer;
          transition: 0.15s;
        }

        .pageBtn:hover {
          transform: translateY(-1px);
          border-color: rgba(15, 23, 42, 0.18);
        }

        .pageBtn.active {
          background: linear-gradient(135deg, var(--primary), var(--primary2));
          border-color: rgba(255, 255, 255, 0.22);
          color: #fff;
        }

        .tableCard {
          border-radius: 18px;
          background: var(--card);
          border: 1px solid var(--line);
          box-shadow: var(--shadow);
          overflow: hidden;
          backdrop-filter: blur(14px);
        }

        .tableHead {
          display: grid;
          grid-template-columns: 1.2fr 0.5fr 0.4fr 1fr;
          gap: 10px;
          padding: 14px 14px;
          background: rgba(15, 23, 42, 0.03);
          border-bottom: 1px solid var(--line);
          font-weight: 950;
          color: rgba(15, 23, 42, 0.72);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .row {
          display: grid;
          grid-template-columns: 1.2fr 0.5fr 0.4fr 1fr;
          gap: 10px;
          padding: 14px 14px;
          border-bottom: 1px solid rgba(15, 23, 42, 0.08);
        }
        .row:last-child {
          border-bottom: none;
        }

        .td {
          display: flex;
          align-items: center;
        }

        .who {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .avatar {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-weight: 1000;
          color: #3730a3;
          background: rgba(99, 102, 241, 0.10);
          border: 1px solid rgba(99, 102, 241, 0.16);
          flex: 0 0 auto;
        }
        .avatar.sys {
          background: rgba(239, 68, 68, 0.10);
          border-color: rgba(239, 68, 68, 0.16);
          color: #991b1b;
        }

        .whoText {
          min-width: 0;
          display: grid;
          gap: 2px;
        }

        .nm {
          font-weight: 1000;
          color: var(--ink);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .em {
          color: var(--muted);
          font-size: 0.92rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pinBox {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.04);
          border: 1px solid rgba(15, 23, 42, 0.08);
        }

        .pinValue {
          font-weight: 1000;
          letter-spacing: 0.14em;
          font-variant-numeric: tabular-nums;
          color: rgba(15, 23, 42, 0.92);
        }
        .pinValue.muted {
          color: rgba(15, 23, 42, 0.35);
          letter-spacing: 0.08em;
        }

        .mini {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: 1px solid rgba(15, 23, 42, 0.10);
          background: rgba(255, 255, 255, 0.92);
          color: rgba(15, 23, 42, 0.75);
          cursor: pointer;
          display: grid;
          place-items: center;
        }
        .mini:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 950;
          white-space: nowrap;
          border: 1px solid rgba(15, 23, 42, 0.10);
        }
        .pill.ok {
          background: rgba(34, 197, 94, 0.10);
          border-color: rgba(34, 197, 94, 0.18);
          color: #166534;
        }
        .pill.danger {
          background: rgba(239, 68, 68, 0.10);
          border-color: rgba(239, 68, 68, 0.18);
          color: #991b1b;
        }

        .actionsWrap {
          width: 100%;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
          align-items: center;
        }

        .act {
          height: 40px;
          padding: 0 12px;
          border-radius: 12px;
          border: 1px solid rgba(15, 23, 42, 0.10);
          background: #fff;
          color: rgba(15, 23, 42, 0.88);
          font-weight: 950;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          text-decoration: none;
          transition: transform 0.15s ease, box-shadow 0.2s ease;
        }
        .act:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
        }

        .act.soft {
          background: rgba(99, 102, 241, 0.10);
          border-color: rgba(99, 102, 241, 0.18);
          color: #3730a3;
        }
        .act.soft2 {
          background: rgba(14, 165, 233, 0.10);
          border-color: rgba(14, 165, 233, 0.18);
          color: #075985;
        }
        .act.soft3 {
          background: rgba(15, 23, 42, 0.06);
          border-color: rgba(15, 23, 42, 0.12);
          color: rgba(15, 23, 42, 0.88);
        }
        .act.warn {
          background: rgba(245, 158, 11, 0.12);
          border-color: rgba(245, 158, 11, 0.22);
          color: #92400e;
        }
        .act.locked {
          background: rgba(15, 23, 42, 0.06);
          border-color: rgba(15, 23, 42, 0.12);
          color: rgba(15, 23, 42, 0.55);
          cursor: not-allowed;
        }

        .trash {
          width: 42px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid rgba(239, 68, 68, 0.18);
          background: rgba(239, 68, 68, 0.10);
          color: #991b1b;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .trash:hover {
          transform: translateY(-1px);
        }
        .trash:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .empty {
          display: grid;
          place-items: center;
          padding: 22px 0 0;
        }

        .emptyCard {
          width: min(640px, 100%);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid var(--line);
          box-shadow: var(--shadow);
          padding: 18px;
          display: grid;
          gap: 10px;
        }

        .emptyTitle {
          font-size: 1.05rem;
          font-weight: 1000;
          color: var(--ink);
        }

        .emptySub {
          color: var(--muted);
          line-height: 1.45;
        }

        .skeletonWrap {
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid var(--line);
          box-shadow: var(--shadow);
          overflow: hidden;
        }

        .skRow {
          height: 56px;
          border-bottom: 1px solid rgba(15, 23, 42, 0.08);
          background: linear-gradient(
            90deg,
            rgba(15, 23, 42, 0.05),
            rgba(15, 23, 42, 0.10),
            rgba(15, 23, 42, 0.05)
          );
          background-size: 220% 100%;
          animation: sh 1.05s linear infinite;
        }
        .skRow:last-child {
          border-bottom: none;
        }

        @keyframes sh {
          0% { background-position: 0% 0%; }
          100% { background-position: -220% 0%; }
        }

        @media (max-width: 920px) {
          .tableHead {
            display: none;
          }
          .row {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .actionsWrap {
            justify-content: flex-start;
          }
          .pinBox {
            justify-content: space-between;
          }
        }

        @media (max-width: 520px) {
          .page {
            padding: 14px 14px 24px;
          }
          .topRight {
            width: 100%;
          }
          .btn.primary {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}