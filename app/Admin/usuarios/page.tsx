"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";

type Usuario = {
  id_usuario?: number;
  id?: number;
  nome?: string;
  email?: string;
  pin?: string | null;
  nivel_id?: number | string;
  status_id?: number | string;
  telefone?: string | null;
  cpf?: string | null;
  criado?: string;
  atualizado?: string;
};

type Nivel = {
  id_nivel?: number;
  nome?: string;
  codigo?: string;
  prioridade?: number;
  descricao?: string;
  criado?: string;
};

type StatusItem = {
  id_status?: number;
  nome?: string;
  codigo?: string;
  descricao?: string;
  criado?: string;
};

const api = axios.create({
  baseURL: "https://lightgrey-cattle-160990.hostingersite.com",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

function getUsuariosFromResponse(payload: any): Usuario[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.dados?.dados)) return payload.dados.dados;
  if (Array.isArray(payload?.data?.dados)) return payload.data.dados;
  return [];
}

function getNiveisFromResponse(payload: any): Nivel[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload?.dados?.dados)) return payload.dados.dados;
  return [];
}

function getStatusFromResponse(payload: any): StatusItem[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload?.dados?.dados)) return payload.dados.dados;
  return [];
}

function formatarData(data?: string) {
  if (!data) return "-";

  const d = new Date(data.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return data;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function formatarCpf(cpf?: string | null) {
  if (!cpf) return "-";
  const numeros = cpf.replace(/\D/g, "");
  if (numeros.length !== 11) return cpf;
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatarTelefone(telefone?: string | null) {
  if (!telefone) return "-";
  const numeros = telefone.replace(/\D/g, "");

  if (numeros.length === 11) {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  if (numeros.length === 10) {
    return numeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return telefone;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [statusList, setStatusList] = useState<StatusItem[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [copiadoId, setCopiadoId] = useState<number | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(6);

  const normalizarUsuarioId = useCallback((usuario: Usuario) => {
    return Number(usuario.id_usuario ?? usuario.id ?? 0);
  }, []);

  const buscarNivelPorId = useCallback(
    (nivelId?: number | string) => {
      const id = Number(nivelId ?? 0);
      return niveis.find((nivel) => Number(nivel.id_nivel ?? 0) === id) ?? null;
    },
    [niveis]
  );

  const buscarStatusPorId = useCallback(
    (statusId?: number | string) => {
      const id = Number(statusId ?? 0);
      return statusList.find((status) => Number(status.id_status ?? 0) === id) ?? null;
    },
    [statusList]
  );

  const obterNomeNivel = useCallback(
    (nivelId?: number | string) => buscarNivelPorId(nivelId)?.nome || "-",
    [buscarNivelPorId]
  );

  const obterCodigoNivel = useCallback(
    (nivelId?: number | string) => buscarNivelPorId(nivelId)?.codigo || "",
    [buscarNivelPorId]
  );

  const obterNomeStatus = useCallback(
    (statusId?: number | string) => buscarStatusPorId(statusId)?.nome || "-",
    [buscarStatusPorId]
  );

  const obterCodigoStatus = useCallback(
    (statusId?: number | string) => buscarStatusPorId(statusId)?.codigo || "",
    [buscarStatusPorId]
  );

  const ehProtegido = useCallback(
    (usuario: Usuario) => {
      const nivelId = Number(usuario.nivel_id ?? 0);
      const nomeNivel = obterNomeNivel(usuario.nivel_id).toLowerCase();
      const codigoNivel = obterCodigoNivel(usuario.nivel_id).toLowerCase();

      return (
        nivelId === 1 ||
        nomeNivel.includes("sistema") ||
        codigoNivel.includes("sistema")
      );
    },
    [obterCodigoNivel, obterNomeNivel]
  );

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const [resUsuarios, resNiveis, resStatus] = await Promise.all([
        api.get("/painel/usuarios"),
        api.get("/painel/niveis"),
        api.get("/painel/status"),
      ]);

      setUsuarios(getUsuariosFromResponse(resUsuarios.data));
      setNiveis(getNiveisFromResponse(resNiveis.data));
      setStatusList(getStatusFromResponse(resStatus.data));
    } catch (error: any) {
      console.error("Erro ao carregar usuários:", error);

      if (error?.response?.status === 401) {
        setErro("Sessão inválida. Faça login novamente.");
      } else if (error?.response?.status === 403) {
        setErro("Você não tem permissão para acessar esta página.");
      } else {
        setErro("Não foi possível carregar os usuários.");
      }

      setUsuarios([]);
      setNiveis([]);
      setStatusList([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return usuarios;

    return usuarios.filter((usuario) => {
      const id = String(normalizarUsuarioId(usuario));
      const nome = String(usuario.nome ?? "").toLowerCase();
      const email = String(usuario.email ?? "").toLowerCase();
      const telefone = String(usuario.telefone ?? "").toLowerCase();
      const cpf = String(usuario.cpf ?? "").toLowerCase();
      const pin = String(usuario.pin ?? "").toLowerCase();
      const nomeNivel = obterNomeNivel(usuario.nivel_id).toLowerCase();
      const nomeStatus = obterNomeStatus(usuario.status_id).toLowerCase();
      const codigoNivel = obterCodigoNivel(usuario.nivel_id).toLowerCase();
      const codigoStatus = obterCodigoStatus(usuario.status_id).toLowerCase();

      return (
        id.includes(termo) ||
        nome.includes(termo) ||
        email.includes(termo) ||
        telefone.includes(termo) ||
        cpf.includes(termo) ||
        pin.includes(termo) ||
        nomeNivel.includes(termo) ||
        nomeStatus.includes(termo) ||
        codigoNivel.includes(termo) ||
        codigoStatus.includes(termo)
      );
    });
  }, [
    busca,
    usuarios,
    normalizarUsuarioId,
    obterNomeNivel,
    obterNomeStatus,
    obterCodigoNivel,
    obterCodigoStatus,
  ]);

  const totalProtegidos = useMemo(
    () => usuarios.filter((usuario) => ehProtegido(usuario)).length,
    [usuarios, ehProtegido]
  );

  const totalAtivos = useMemo(
    () =>
      usuarios.filter(
        (usuario) => obterCodigoStatus(usuario.status_id).toUpperCase() === "ATIVO"
      ).length,
    [usuarios, obterCodigoStatus]
  );

  const totalInativos = useMemo(
    () =>
      usuarios.filter(
        (usuario) => obterCodigoStatus(usuario.status_id).toUpperCase() === "INATIVO"
      ).length,
    [usuarios, obterCodigoStatus]
  );

  const copiarPin = useCallback(async (pin: string | null | undefined, id: number) => {
    if (!pin) return;

    try {
      await navigator.clipboard.writeText(pin);
      setCopiadoId(id);
      setTimeout(() => setCopiadoId(null), 1500);
    } catch (error) {
      console.error("Erro ao copiar PIN:", error);
    }
  }, []);

  const excluirUsuario = useCallback(
    async (id: number) => {
      const confirmar = window.confirm("Tem certeza que deseja excluir este usuário?");
      if (!confirmar) return;

      try {
        setExcluindoId(id);
        await api.delete(`/painel/usuario/${id}`);

        setUsuarios((prev) =>
          prev.filter((usuario) => normalizarUsuarioId(usuario) !== id)
        );
      } catch (error: any) {
        console.error("Erro ao excluir usuário:", error);
        alert(
          error?.response?.data?.mensagem || "Não foi possível excluir o usuário."
        );
      } finally {
        setExcluindoId(null);
      }
    },
    [normalizarUsuarioId]
  );

  const getStatusClass = useCallback(
    (statusId?: number | string) => {
      const codigo = obterCodigoStatus(statusId).toUpperCase();

      if (codigo === "ATIVO") return "status-badge status-ativo";
      if (codigo === "INATIVO") return "status-badge status-inativo";
      if (codigo === "BLOQUEADO") return "status-badge status-bloqueado";

      return "status-badge status-padrao";
    },
    [obterCodigoStatus]
  );

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, itensPorPagina]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(usuariosFiltrados.length / itensPorPagina)
  );

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return usuariosFiltrados.slice(inicio, fim);
  }, [usuariosFiltrados, paginaAtual, itensPorPagina]);

  return (
    <div className="usuarios-page">
      <div className="usuarios-container">
        <section className="hero">
          <div className="hero-bg" />

          <div className="hero-conteudo">
            <div className="hero-topo">
              <span className="hero-tag">Painel Administrativo</span>
              <h1>Usuários do sistema</h1>
              <p>
                Gerencie usuários com uma visualização moderna em cards, paginação,
                busca rápida e ações diretas.
              </p>
            </div>

            <div className="hero-acoes">
              <button className="btn btn-secundario" onClick={carregarDados}>
                Atualizar lista
              </button>

              <Link href="/Admin/usuarios/cadastrar" className="btn btn-primario">
                Novo usuário
              </Link>
            </div>
          </div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <span>Total</span>
            <strong>{usuarios.length}</strong>
            <small>Usuários cadastrados</small>
          </div>

          <div className="stat-card">
            <span>Ativos</span>
            <strong>{totalAtivos}</strong>
            <small>Usuários ativos</small>
          </div>

          <div className="stat-card">
            <span>Inativos</span>
            <strong>{totalInativos}</strong>
            <small>Status inativo</small>
          </div>

          <div className="stat-card">
            <span>Protegidos</span>
            <strong>{totalProtegidos}</strong>
            <small>Nível sistema</small>
          </div>
        </section>

        <section className="toolbar">
          <div className="toolbar-esquerda">
            <div className="search-box">
              <input
                type="text"
                placeholder="Buscar por nome, email, PIN, CPF, nível, status..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>

          <div className="toolbar-direita">
            <div className="select-box">
              <label htmlFor="itensPorPagina">Por página</label>
              <select
                id="itensPorPagina"
                value={itensPorPagina}
                onChange={(e) => setItensPorPagina(Number(e.target.value))}
              >
                <option value={3}>3</option>
                <option value={6}>6</option>
                <option value={9}>9</option>
                <option value={12}>12</option>
              </select>
            </div>
          </div>
        </section>

        {carregando ? (
          <div className="estado-box">Carregando usuários...</div>
        ) : erro ? (
          <div className="estado-box estado-erro">{erro}</div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="estado-box">Nenhum usuário encontrado.</div>
        ) : (
          <>
            <section className="lista-topo">
              <div>
                <h2>Lista de usuários</h2>
                <p>
                  Exibindo {usuariosPaginados.length} de {usuariosFiltrados.length} resultado(s).
                </p>
              </div>

              <div className="contador-pagina">
                Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong>
              </div>
            </section>

            <section className="cards-grid">
              {usuariosPaginados.map((usuario) => {
                const id = normalizarUsuarioId(usuario);
                const nomeNivel = obterNomeNivel(usuario.nivel_id);
                const nomeStatus = obterNomeStatus(usuario.status_id);
                const protegido = ehProtegido(usuario);

                return (
                  <article className="usuario-card" key={id}>
                    <div className="card-topo">
                      <div className="usuario-head">
                        <div className="avatar">
                          {(usuario.nome?.charAt(0) || "U").toUpperCase()}
                        </div>

                        <div className="usuario-info">
                          <div className="usuario-nome-linha">
                            <h3>{usuario.nome || "Sem nome"}</h3>
                            {protegido && (
                              <span className="protect-badge">Protegido</span>
                            )}
                          </div>

                          <p>{usuario.email || "-"}</p>
                          <small>ID #{id}</small>
                        </div>
                      </div>

                      <span className={getStatusClass(usuario.status_id)}>
                        {nomeStatus}
                      </span>
                    </div>

                    <div className="card-badges">
                      <span className="nivel-badge">{nomeNivel}</span>
                    </div>

                    <div className="card-conteudo">
                      <div className="info-item">
                        <span className="label">PIN</span>
                        <div className="pin-linha">
                          <strong>{usuario.pin || "-"}</strong>
                          <button
                            type="button"
                            className="mini-btn"
                            onClick={() => copiarPin(usuario.pin, id)}
                            disabled={!usuario.pin}
                          >
                            {copiadoId === id ? "Copiado" : "Copiar"}
                          </button>
                        </div>
                      </div>

                      <div className="info-item">
                        <span className="label">Telefone</span>
                        <strong>{formatarTelefone(usuario.telefone)}</strong>
                      </div>

                      <div className="info-item">
                        <span className="label">CPF</span>
                        <strong>{formatarCpf(usuario.cpf)}</strong>
                      </div>

                      <div className="info-item">
                        <span className="label">Criado em</span>
                        <strong>{formatarData(usuario.criado)}</strong>
                      </div>
                    </div>

                    <div className="card-acoes">
                      <Link
                        href={`/Admin/usuarios/${id}`}
                        className="acao-btn acao-ver"
                      >
                        Ver
                      </Link>

                      <Link
                        href={`/Admin/usuarios/${id}/editar`}
                        className="acao-btn acao-editar"
                      >
                        Editar
                      </Link>

                      <a
                        href={`mailto:${usuario.email || ""}?subject=${encodeURIComponent(
                          "Contato do sistema"
                        )}`}
                        className={`acao-btn acao-email ${!usuario.email ? "desabilitado" : ""}`}
                        onClick={(e) => {
                          if (!usuario.email) e.preventDefault();
                        }}
                      >
                        Enviar email
                      </a>

                      <button
                        type="button"
                        className="acao-btn acao-excluir"
                        onClick={() => excluirUsuario(id)}
                        disabled={excluindoId === id || protegido}
                      >
                        {excluindoId === id ? "Excluindo..." : "Excluir"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="paginacao">
              <button
                type="button"
                className="page-btn"
                onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
                disabled={paginaAtual === 1}
              >
                ← Anterior
              </button>

              <div className="page-numeros">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                  <button
                    key={pagina}
                    type="button"
                    className={`page-number ${paginaAtual === pagina ? "ativo" : ""}`}
                    onClick={() => setPaginaAtual(pagina)}
                  >
                    {pagina}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="page-btn"
                onClick={() =>
                  setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))
                }
                disabled={paginaAtual === totalPaginas}
              >
                Próxima →
              </button>
            </section>
          </>
        )}
      </div>

      <style jsx>{`
        .usuarios-page {
          min-height: 100vh;
          padding: 24px;
          background:
            radial-gradient(circle at top, rgba(99, 102, 241, 0.08), transparent 28%),
            linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
        }

        .usuarios-container {
          max-width: 1440px;
          margin: 0 auto;
        }

        .hero {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 30px;
          padding: 30px;
          margin-bottom: 22px;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
        }

        .hero-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at top right, rgba(96, 165, 250, 0.25), transparent 30%),
            radial-gradient(circle at bottom left, rgba(129, 140, 248, 0.18), transparent 28%);
          pointer-events: none;
        }

        .hero-conteudo {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .hero-topo {
          width: 100%;
        }

        .hero-tag {
          display: inline-flex;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          color: #e2e8f0;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 12px;
          backdrop-filter: blur(8px);
        }

        .hero h1 {
          margin: 0 0 8px;
          font-size: 38px;
          color: #ffffff;
          font-weight: 900;
        }

        .hero p {
          margin: 0;
          color: #cbd5e1;
          font-size: 15px;
          line-height: 1.7;
          max-width: 780px;
        }

        .hero-acoes {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          width: 100%;
        }

        .btn {
          min-height: 48px;
          padding: 12px 18px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 800;
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s ease;
        }

        .btn:hover {
          transform: translateY(-2px);
        }

        .btn-primario {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 10px 24px rgba(255, 255, 255, 0.16);
        }

        .btn-secundario {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(8px);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 20px;
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
          backdrop-filter: blur(8px);
        }

        .stat-card span {
          display: block;
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .stat-card strong {
          display: block;
          font-size: 30px;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .stat-card small {
          color: #94a3b8;
          font-size: 13px;
        }

        .toolbar {
          display: flex;
          justify-content: space-between;
          align-items: stretch;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .toolbar-esquerda {
          flex: 1;
          min-width: 280px;
        }

        .toolbar-direita {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .search-box {
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid #dbe3ee;
          border-radius: 20px;
          padding: 14px 16px;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.04);
        }

        .search-box input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: #0f172a;
          font-size: 14px;
        }

        .search-box input::placeholder {
          color: #94a3b8;
        }

        .select-box {
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid #dbe3ee;
          border-radius: 18px;
          padding: 10px 14px;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.04);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .select-box label {
          font-size: 13px;
          font-weight: 800;
          color: #475569;
          white-space: nowrap;
        }

        .select-box select {
          border: none;
          outline: none;
          background: transparent;
          color: #0f172a;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .estado-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 24px;
          text-align: center;
          color: #334155;
          font-weight: 700;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
        }

        .estado-erro {
          background: #fff1f2;
          border-color: #fecdd3;
          color: #be123c;
        }

        .lista-topo {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .lista-topo h2 {
          margin: 0 0 4px;
          font-size: 24px;
          color: #0f172a;
          font-weight: 900;
        }

        .lista-topo p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .contador-pagina {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 10px 14px;
          color: #475569;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 18px;
        }

        .usuario-card {
          display: flex;
          flex-direction: column;
          gap: 18px;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid #e2e8f0;
          border-radius: 26px;
          padding: 20px;
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }

        .usuario-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 42px rgba(15, 23, 42, 0.1);
          border-color: #cbd5e1;
        }

        .card-topo {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          flex-wrap: wrap;
        }

        .usuario-head {
          display: flex;
          gap: 14px;
          align-items: center;
          flex: 1;
          min-width: 0;
        }

        .avatar {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
          background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
          border: 1px solid #bfdbfe;
          flex-shrink: 0;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.7);
        }

        .usuario-info {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .usuario-nome-linha {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .usuario-info h3 {
          margin: 0;
          font-size: 18px;
          color: #0f172a;
          font-weight: 900;
        }

        .usuario-info p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          word-break: break-word;
        }

        .usuario-info small {
          color: #94a3b8;
          font-size: 12px;
        }

        .protect-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 28px;
          padding: 5px 9px;
          border-radius: 999px;
          background: #0f172a;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
        }

        .card-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .nivel-badge,
        .status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid transparent;
          white-space: nowrap;
        }

        .nivel-badge {
          background: #eef2ff;
          color: #3730a3;
          border-color: #c7d2fe;
        }

        .status-ativo {
          background: #ecfdf5;
          color: #047857;
          border-color: #a7f3d0;
        }

        .status-inativo {
          background: #fff7ed;
          color: #c2410c;
          border-color: #fdba74;
        }

        .status-bloqueado {
          background: #fef2f2;
          color: #b91c1c;
          border-color: #fecaca;
        }

        .status-padrao {
          background: #f1f5f9;
          color: #334155;
          border-color: #cbd5e1;
        }

        .card-conteudo {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .info-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .label {
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .info-item strong {
          color: #0f172a;
          font-size: 14px;
          word-break: break-word;
        }

        .pin-linha {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .mini-btn {
          border: none;
          background: #0f172a;
          color: #ffffff;
          border-radius: 10px;
          padding: 7px 10px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .mini-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .mini-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .card-acoes {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .acao-btn {
          min-height: 42px;
          padding: 10px 12px;
          border-radius: 14px;
          text-decoration: none;
          font-size: 12px;
          font-weight: 900;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s ease;
          white-space: nowrap;
        }

        .acao-btn:hover:not(:disabled):not(.desabilitado) {
          transform: translateY(-1px);
        }

        .acao-ver {
          background: #f8fafc;
          color: #0f172a;
          border: 1px solid #dbe3ee;
        }

        .acao-editar {
          background: linear-gradient(135deg, #dcfce7 0%, #ecfdf5 100%);
          color: #166534;
          border: 1px solid #86efac;
        }

        .acao-email {
          background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
          color: #1d4ed8;
          border: 1px solid #93c5fd;
        }

        .acao-excluir {
          background: linear-gradient(135deg, #ffe4e6 0%, #fff1f2 100%);
          color: #be123c;
          border: 1px solid #fda4af;
        }

        .acao-btn:disabled,
        .desabilitado {
          opacity: 0.55;
          cursor: not-allowed;
          pointer-events: none;
        }

        .paginacao {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 22px;
        }

        .page-btn,
        .page-number {
          min-width: 44px;
          min-height: 44px;
          padding: 0 14px;
          border-radius: 14px;
          border: 1px solid #dbe3ee;
          background: #ffffff;
          color: #0f172a;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s ease;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
        }

        .page-btn:hover:not(:disabled),
        .page-number:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .page-number.ativo {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #ffffff;
          border-color: #0f172a;
        }

        .page-btn:disabled,
        .page-number:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-numeros {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }

        @media (max-width: 900px) {
          .card-conteudo {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .usuarios-page {
            padding: 16px;
          }

          .hero {
            padding: 22px;
          }

          .hero h1 {
            font-size: 30px;
          }

          .hero-acoes {
            flex-direction: column;
          }

          .hero-acoes .btn {
            width: 100%;
          }

          .toolbar {
            flex-direction: column;
          }

          .toolbar-direita {
            width: 100%;
          }

          .select-box {
            width: 100%;
            justify-content: space-between;
          }

          .cards-grid {
            grid-template-columns: 1fr;
          }

          .card-acoes {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 560px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .card-topo {
            flex-direction: column;
            align-items: stretch;
          }

          .usuario-head {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}