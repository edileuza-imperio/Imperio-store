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

  // busca + paginação
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

  async function resetPin(user: Usuario) {
    if (user.nivel_id === 1) {
      toast.error("Usuário do sistema não pode alterar PIN");
      return;
    }

    const ok = confirm(`Resetar PIN do usuário "${user.nome}"?`);
    if (!ok) return;

    try {
      // ✅ se a rota existir no back:
      const res = await api.post(
        `/admin/usuarios/${user.id_usuario}/reset-pin`,
        {},
        { withCredentials: true }
      );

      const novoPin =
        res.data?.dados?.pin ??
        res.data?.pin ??
        res.data?.dados?.dados?.pin ??
        null;

      toast.success(novoPin ? `Novo PIN: ${novoPin}` : "PIN resetado com sucesso");

      // atualiza local (sem precisar recarregar tudo)
      if (novoPin) {
        setUsuarios((prev) =>
          prev.map((u) => (u.id_usuario === user.id_usuario ? { ...u, pin: String(novoPin) } : u))
        );
      } else {
        await carregar();
      }
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
    // numeros simples. Se quiser versão com "..." depois eu faço.
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  }, [totalPaginas]);

  return (
    <div className="uPage">
      <ToastContainer position="top-right" autoClose={2400} newestOnTop theme="light" />

      {/* HEADER GLASS */}
      <div className="uHeader">
        <div className="uHeaderLeft">
          <div className="uKicker">
            <span className="uDot" />
            Administração
          </div>

          <div className="uTitleRow">
            <h1 className="uTitle">Usuários</h1>
            {!loading && (
              <div className="uStats">
                <span className="uChip">
                  Total <b>{usuarios.length}</b>
                </span>
                <span className="uChip warn">
                  Sistema <b>{totalSistema}</b>
                </span>
              </div>
            )}
          </div>

          <p className="uSub">
            Controle de acessos e segurança. Busque, edite e gerencie PINs.
          </p>
        </div>

        <div className="uHeaderRight">
          <button className="uBtn ghost" onClick={carregar} disabled={loading}>
            <FaSyncAlt /> Atualizar
          </button>

          <Link href="/admin/usuarios/novo" className="uBtn primary">
            <FaUserPlus /> Novo Usuário
          </Link>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="uToolbar">
        <div className="uSearch">
          <FaSearch className="uSearchIcon" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, email ou PIN..."
          />
          {q && (
            <button className="uClear" onClick={() => setQ("")} aria-label="Limpar busca">
              ✕
            </button>
          )}
        </div>

        <div className="uRightTools">
          <div className="uSelect">
            <span>Por página</span>
            <select value={itensPorPagina} onChange={(e) => setItensPorPagina(Number(e.target.value))}>
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={16}>16</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>
        </div>
      </div>

      {/* PAGINAÇÃO (SÓ NÚMEROS) */}
      {!loading && filtrados.length > 0 && totalPaginas > 1 && (
        <div className="uPager">
          <div className="uPagerInfo">
            Página <b>{pagina}</b> de <b>{totalPaginas}</b> — exibindo{" "}
            <b>{paginados.length}</b> de <b>{filtrados.length}</b>
          </div>

          <div className="uPagerNums" aria-label="Paginação">
            {paginas.map((p) => (
              <button
                key={p}
                type="button"
                className={`uPageBtn ${p === pagina ? "active" : ""}`}
                onClick={() => setPagina(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CONTEÚDO */}
      {loading ? (
        <div className="uSkeleton">
          {Array.from({ length: 9 }).map((_, i) => (
            <div className="uSkRow" key={i} />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="uEmpty">
          <div className="uEmptyCard">
            <div className="uEmptyTitle">Nenhum usuário encontrado</div>
            <div className="uEmptySub">Tente outra busca ou crie um novo usuário.</div>
            <Link href="/admin/usuarios/novo" className="uBtn primary">
              <FaUserPlus /> Novo Usuário
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE */}
          <div className="uTable">
            <div className="uTHead">
              <div>Usuário</div>
              <div>PIN</div>
              <div>Nível</div>
              <div className="uTActionsHead">Ações</div>
            </div>

            {paginados.map((user) => {
              const isSistema = user.nivel_id === 1;
              const isDeleting = deletingId === user.id_usuario;

              return (
                <div className="uTRow" key={user.id_usuario}>
                  <div className="uUserCell">
                    <div className={`uAvatar ${isSistema ? "sys" : ""}`}>
                      {String(user.nome || "?").trim().slice(0, 1).toUpperCase()}
                    </div>
                    <div className="uUserText">
                      <div className="uName" title={user.nome}>{user.nome}</div>
                      <div className="uEmail" title={user.email}>{user.email}</div>
                    </div>
                  </div>

                  <div className="uPinCell">
                    <span className={`uPin ${user.pin ? "" : "muted"}`}>
                      {user.pin ?? "— — — —"}
                    </span>
                    <button
                      className="uIconBtn"
                      onClick={() => copiarTexto(user.pin ?? "", "PIN copiado!")}
                      disabled={!user.pin}
                      title={user.pin ? "Copiar PIN" : "Sem PIN"}
                      aria-label="Copiar PIN"
                    >
                      <FaCopy />
                    </button>
                  </div>

                  <div className="uLevelCell">
                    {isSistema ? (
                      <span className="uBadge danger">
                        <FaLock /> Sistema
                      </span>
                    ) : (
                      <span className="uBadge ok">Ativo</span>
                    )}
                  </div>

                  <div className="uActionsCell">
                    <button className="uSmall soft" onClick={() => mailtoUsuario(user)}>
                      <FaEnvelope /> Email
                    </button>

                    <button className="uSmall info" onClick={() => copiarTexto(user.email, "Email copiado!")}>
                      <FaCopy /> Copiar
                    </button>

                    {isSistema ? (
                      <button className="uSmall locked" disabled>
                        <FaLock /> Protegido
                      </button>
                    ) : (
                      <>
                        <Link href={`/admin/usuarios/${user.id_usuario}`} className="uSmall neutral">
                          <FaEdit /> Editar
                        </Link>

                        <button className="uSmall warn" onClick={() => resetPin(user)}>
                          <FaKey /> Reset
                        </button>

                        <button
                          className="uTrash"
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
              );
            })}
          </div>

          {/* MOBILE CARDS */}
          <div className="uCards">
            {paginados.map((user) => {
              const isSistema = user.nivel_id === 1;
              const isDeleting = deletingId === user.id_usuario;

              return (
                <div className="uCard" key={`m-${user.id_usuario}`}>
                  <div className="uCardTop">
                    <div className="uCardLeft">
                      <div className={`uAvatar ${isSistema ? "sys" : ""}`}>
                        {String(user.nome || "?").trim().slice(0, 1).toUpperCase()}
                      </div>
                      <div className="uUserText">
                        <div className="uName">{user.nome}</div>
                        <div className="uEmail">{user.email}</div>
                      </div>
                    </div>

                    {isSistema ? (
                      <span className="uBadge danger">
                        <FaLock /> Sistema
                      </span>
                    ) : (
                      <span className="uBadge ok">Ativo</span>
                    )}
                  </div>

                  <div className="uCardMid">
                    <div className="uLabel">PIN</div>
                    <div className="uPinRow">
                      <span className={`uPin ${user.pin ? "" : "muted"}`}>
                        {user.pin ?? "— — — —"}
                      </span>
                      <button
                        className="uIconBtn"
                        onClick={() => copiarTexto(user.pin ?? "", "PIN copiado!")}
                        disabled={!user.pin}
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </div>

                  <div className="uCardActions">
                    <button className="uSmall soft" onClick={() => mailtoUsuario(user)}>
                      <FaEnvelope /> Email
                    </button>

                    <button className="uSmall info" onClick={() => copiarTexto(user.email, "Email copiado!")}>
                      <FaCopy /> Copiar
                    </button>

                    {isSistema ? (
                      <button className="uSmall locked" disabled>
                        <FaLock /> Protegido
                      </button>
                    ) : (
                      <>
                        <Link href={`/admin/usuarios/${user.id_usuario}`} className="uSmall neutral">
                          <FaEdit /> Editar
                        </Link>

                        <button className="uSmall warn" onClick={() => resetPin(user)}>
                          <FaKey /> Reset
                        </button>

                        <button
                          className="uTrash"
                          onClick={() => excluirUsuario(user)}
                          disabled={isDeleting}
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
        </>
      )}

      <style jsx>{`
        :global(:root) {
          --u-ink: #0b1220;
          --u-muted: rgba(11, 18, 32, 0.62);
          --u-line: rgba(11, 18, 32, 0.10);

          --u-primary: #6d28d9;
          --u-primary2: #8b5cf6;

          --u-ok: #22c55e;
          --u-warn: #f59e0b;
          --u-danger: #ef4444;

          --u-card: rgba(255, 255, 255, 0.78);
          --u-shadow: 0 18px 60px rgba(11, 18, 32, 0.10);
          --u-shadow2: 0 30px 90px rgba(11, 18, 32, 0.14);
        }

        .uPage {
          padding: 18px 18px 28px;
          border-radius: 18px;
          min-height: 92vh;
          background:
            radial-gradient(1200px 520px at 12% -10%, rgba(109, 40, 217, 0.12), transparent 60%),
            radial-gradient(980px 520px at 90% -10%, rgba(245, 158, 11, 0.10), transparent 60%),
            linear-gradient(180deg, rgba(11, 18, 32, 0.03), transparent 50%);
        }

        .uHeader {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          padding: 16px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.68);
          border: 1px solid var(--u-line);
          box-shadow: var(--u-shadow);
          backdrop-filter: blur(14px);
          margin-bottom: 12px;
        }

        .uKicker {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 7px 11px;
          border-radius: 999px;
          background: rgba(11, 18, 32, 0.04);
          border: 1px solid rgba(11, 18, 32, 0.08);
          color: rgba(11, 18, 32, 0.70);
          font-size: 0.82rem;
          font-weight: 950;
          width: fit-content;
        }
        .uDot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--u-primary), var(--u-primary2));
          box-shadow: 0 0 0 5px rgba(139, 92, 246, 0.18);
        }

        .uTitleRow {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 10px;
        }

        .uTitle {
          margin: 0;
          font-size: 2rem;
          font-weight: 1000;
          letter-spacing: -0.03em;
          color: var(--u-ink);
        }

        .uStats {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .uChip {
          display: inline-flex;
          gap: 8px;
          align-items: center;
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid rgba(11, 18, 32, 0.10);
          background: rgba(255, 255, 255, 0.85);
          color: rgba(11, 18, 32, 0.82);
          font-weight: 900;
          font-size: 12px;
        }
        .uChip.warn {
          border-color: rgba(245, 158, 11, 0.20);
          background: rgba(245, 158, 11, 0.10);
          color: #92400e;
        }

        .uSub {
          margin: 8px 0 0;
          color: var(--u-muted);
          font-weight: 650;
        }

        .uHeaderRight {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .uBtn {
          height: 44px;
          padding: 0 14px;
          border-radius: 14px;
          font-weight: 950;
          border: 1px solid var(--u-line);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          text-decoration: none;
          background: #fff;
          color: var(--u-ink);
          box-shadow: 0 10px 26px rgba(11, 18, 32, 0.08);
        }
        .uBtn:hover {
          transform: translateY(-1px);
          box-shadow: var(--u-shadow);
        }
        .uBtn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .uBtn.primary {
          color: #fff;
          background: linear-gradient(135deg, var(--u-primary), var(--u-primary2));
          border-color: rgba(255, 255, 255, 0.22);
        }
        .uBtn.ghost {
          background: rgba(255, 255, 255, 0.74);
        }

        .uToolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .uSearch {
          flex: 1;
          min-width: 260px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid var(--u-line);
          background: rgba(255, 255, 255, 0.84);
          box-shadow: 0 10px 24px rgba(11, 18, 32, 0.06);
        }

        .uSearchIcon {
          color: rgba(11, 18, 32, 0.55);
        }

        .uSearch input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-weight: 750;
          color: var(--u-ink);
        }

        .uClear {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          border: 1px solid rgba(11, 18, 32, 0.10);
          background: rgba(255, 255, 255, 0.92);
          cursor: pointer;
          font-weight: 900;
          color: rgba(11, 18, 32, 0.75);
        }

        .uRightTools {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .uSelect {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.84);
          border: 1px solid var(--u-line);
          box-shadow: 0 10px 24px rgba(11, 18, 32, 0.06);
          color: rgba(11, 18, 32, 0.72);
          font-weight: 950;
          font-size: 12px;
        }

        .uSelect select {
          border: 1px solid rgba(11, 18, 32, 0.14);
          border-radius: 999px;
          padding: 6px 10px;
          outline: none;
          background: #fff;
          font-weight: 900;
          cursor: pointer;
          color: var(--u-ink);
        }

        .uPager {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin: 12px 0 14px;
          background: rgba(255, 255, 255, 0.80);
          border: 1px solid var(--u-line);
          border-radius: 14px;
          padding: 10px 12px;
          box-shadow: 0 10px 24px rgba(11, 18, 32, 0.06);
        }

        .uPagerInfo {
          color: rgba(11, 18, 32, 0.78);
          font-size: 13px;
          font-weight: 750;
        }

        .uPagerNums {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: flex-end;
        }

        .uPageBtn {
          min-width: 36px;
          height: 34px;
          padding: 0 10px;
          border-radius: 10px;
          border: 1px solid rgba(11, 18, 32, 0.12);
          background: #fff;
          font-weight: 950;
          color: rgba(11, 18, 32, 0.82);
          cursor: pointer;
          transition: 0.15s;
        }

        .uPageBtn:hover {
          transform: translateY(-1px);
          border-color: rgba(11, 18, 32, 0.18);
        }

        .uPageBtn.active {
          background: linear-gradient(135deg, var(--u-primary), var(--u-primary2));
          border-color: rgba(255, 255, 255, 0.22);
          color: #fff;
        }

        /* TABLE */
        .uTable {
          border-radius: 18px;
          background: var(--u-card);
          border: 1px solid var(--u-line);
          box-shadow: var(--u-shadow);
          overflow: hidden;
          backdrop-filter: blur(14px);
        }

        .uTHead {
          display: grid;
          grid-template-columns: 1.25fr 0.65fr 0.45fr 1.15fr;
          gap: 10px;
          padding: 14px 14px;
          background: rgba(11, 18, 32, 0.03);
          border-bottom: 1px solid var(--u-line);
          font-weight: 950;
          color: rgba(11, 18, 32, 0.72);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .uTActionsHead {
          text-align: right;
        }

        .uTRow {
          display: grid;
          grid-template-columns: 1.25fr 0.65fr 0.45fr 1.15fr;
          gap: 10px;
          padding: 14px 14px;
          border-bottom: 1px solid rgba(11, 18, 32, 0.08);
          align-items: center;
        }
        .uTRow:last-child {
          border-bottom: none;
        }

        .uUserCell {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .uAvatar {
          width: 46px;
          height: 46px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-weight: 1000;
          color: #4c1d95;
          background: rgba(139, 92, 246, 0.12);
          border: 1px solid rgba(139, 92, 246, 0.18);
          flex: 0 0 auto;
        }
        .uAvatar.sys {
          background: rgba(239, 68, 68, 0.10);
          border-color: rgba(239, 68, 68, 0.16);
          color: #991b1b;
        }

        .uUserText {
          min-width: 0;
          display: grid;
          gap: 2px;
        }

        .uName {
          font-weight: 1000;
          color: var(--u-ink);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .uEmail {
          color: var(--u-muted);
          font-size: 0.92rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .uPinCell {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(11, 18, 32, 0.04);
          border: 1px solid rgba(11, 18, 32, 0.08);
        }

        .uPin {
          font-weight: 1000;
          letter-spacing: 0.14em;
          font-variant-numeric: tabular-nums;
          color: rgba(11, 18, 32, 0.92);
        }

        .uPin.muted {
          color: rgba(11, 18, 32, 0.35);
          letter-spacing: 0.08em;
        }

        .uIconBtn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: 1px solid rgba(11, 18, 32, 0.10);
          background: rgba(255, 255, 255, 0.92);
          color: rgba(11, 18, 32, 0.75);
          cursor: pointer;
          display: grid;
          place-items: center;
        }
        .uIconBtn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .uLevelCell {
          display: flex;
          align-items: center;
        }

        .uBadge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 950;
          white-space: nowrap;
          border: 1px solid rgba(11, 18, 32, 0.10);
          background: rgba(255, 255, 255, 0.85);
          color: rgba(11, 18, 32, 0.85);
        }

        .uBadge.ok {
          background: rgba(34, 197, 94, 0.10);
          border-color: rgba(34, 197, 94, 0.18);
          color: #166534;
        }

        .uBadge.danger {
          background: rgba(239, 68, 68, 0.10);
          border-color: rgba(239, 68, 68, 0.18);
          color: #991b1b;
        }

        .uActionsCell {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
          align-items: center;
        }

        .uSmall {
          height: 40px;
          padding: 0 12px;
          border-radius: 12px;
          border: 1px solid rgba(11, 18, 32, 0.10);
          background: #fff;
          color: rgba(11, 18, 32, 0.88);
          font-weight: 950;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          text-decoration: none;
          transition: transform 0.15s ease, box-shadow 0.2s ease;
        }
        .uSmall:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(11, 18, 32, 0.08);
        }

        .uSmall.soft {
          background: rgba(139, 92, 246, 0.12);
          border-color: rgba(139, 92, 246, 0.20);
          color: #4c1d95;
        }

        .uSmall.info {
          background: rgba(14, 165, 233, 0.12);
          border-color: rgba(14, 165, 233, 0.20);
          color: #075985;
        }

        .uSmall.neutral {
          background: rgba(11, 18, 32, 0.06);
          border-color: rgba(11, 18, 32, 0.12);
          color: rgba(11, 18, 32, 0.88);
        }

        .uSmall.warn {
          background: rgba(245, 158, 11, 0.14);
          border-color: rgba(245, 158, 11, 0.22);
          color: #92400e;
        }

        .uSmall.locked {
          background: rgba(11, 18, 32, 0.06);
          border-color: rgba(11, 18, 32, 0.12);
          color: rgba(11, 18, 32, 0.55);
          cursor: not-allowed;
        }

        .uTrash {
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
        .uTrash:hover {
          transform: translateY(-1px);
        }
        .uTrash:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Empty / Skeleton */
        .uEmpty {
          display: grid;
          place-items: center;
          padding: 22px 0 0;
        }

        .uEmptyCard {
          width: min(640px, 100%);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid var(--u-line);
          box-shadow: var(--u-shadow);
          padding: 18px;
          display: grid;
          gap: 10px;
        }

        .uEmptyTitle {
          font-size: 1.05rem;
          font-weight: 1000;
          color: var(--u-ink);
        }

        .uEmptySub {
          color: var(--u-muted);
          line-height: 1.45;
        }

        .uSkeleton {
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid var(--u-line);
          box-shadow: var(--u-shadow);
          overflow: hidden;
        }

        .uSkRow {
          height: 56px;
          border-bottom: 1px solid rgba(11, 18, 32, 0.08);
          background: linear-gradient(
            90deg,
            rgba(11, 18, 32, 0.05),
            rgba(11, 18, 32, 0.10),
            rgba(11, 18, 32, 0.05)
          );
          background-size: 220% 100%;
          animation: uSh 1.05s linear infinite;
        }
        .uSkRow:last-child {
          border-bottom: none;
        }

        @keyframes uSh {
          0% { background-position: 0% 0%; }
          100% { background-position: -220% 0%; }
        }

        /* Mobile cards */
        .uCards {
          display: none;
          margin-top: 12px;
          gap: 12px;
        }

        .uCard {
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid var(--u-line);
          box-shadow: 0 14px 44px rgba(11, 18, 32, 0.10);
          padding: 14px;
          display: grid;
          gap: 12px;
        }

        .uCardTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .uCardLeft {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .uCardMid {
          padding: 12px;
          border-radius: 16px;
          background: rgba(11, 18, 32, 0.04);
          border: 1px solid rgba(11, 18, 32, 0.08);
        }

        .uLabel {
          font-size: 12px;
          font-weight: 950;
          color: rgba(11, 18, 32, 0.60);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .uPinRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .uCardActions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        @media (max-width: 980px) {
          .uTHead {
            display: none;
          }
          .uTable {
            display: none;
          }
          .uCards {
            display: grid;
          }
        }

        @media (max-width: 520px) {
          .uPage {
            padding: 14px 14px 24px;
          }
          .uHeaderRight {
            width: 100%;
          }
          .uBtn.primary {
            flex: 1;
          }
          .uSmall,
          .uTrash {
            width: 100%;
            justify-content: center;
          }
          .uTrash {
            height: 44px;
          }
        }
      `}</style>
    </div>
  );
}