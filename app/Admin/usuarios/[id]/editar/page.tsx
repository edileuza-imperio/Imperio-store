"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

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
};

type StatusItem = {
  id_status?: number;
  nome?: string;
  codigo?: string;
  descricao?: string;
};

type FormDataType = {
  nome: string;
  email: string;
  pin: string;
  telefone: string;
  cpf: string;
  nivel_id: string;
  status_id: string;
};

const api = axios.create({
  baseURL: "https://lightgrey-cattle-160990.hostingersite.com",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

function getObjetoFromResponse<T>(payload: any): T | null {
  if (!payload) return null;
  if (payload?.dados && !Array.isArray(payload.dados)) return payload.dados as T;
  if (payload?.data && !Array.isArray(payload.data)) return payload.data as T;
  return payload as T;
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

export default function EditarUsuarioPage({ params }: PageProps) {
  const { id } = use(params);

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [statusList, setStatusList] = useState<StatusItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [form, setForm] = useState<FormDataType>({
    nome: "",
    email: "",
    pin: "",
    telefone: "",
    cpf: "",
    nivel_id: "",
    status_id: "",
  });

  const buscarNivelPorId = useCallback(
    (nivelId?: number | string) => {
      const nivelNumero = Number(nivelId ?? 0);
      return niveis.find((nivel) => Number(nivel.id_nivel ?? 0) === nivelNumero) ?? null;
    },
    [niveis]
  );

  const nomeNivelAtual = useMemo(() => {
    if (!usuario) return "-";
    return buscarNivelPorId(usuario.nivel_id)?.nome || "-";
  }, [usuario, buscarNivelPorId]);

  const protegido = useMemo(() => {
    if (!usuario) return false;

    const nivelId = Number(usuario.nivel_id ?? 0);
    const nivelNome = nomeNivelAtual.toLowerCase();
    const nivelCodigo = (buscarNivelPorId(usuario.nivel_id)?.codigo || "").toLowerCase();

    return (
      nivelId === 1 ||
      nivelNome.includes("sistema") ||
      nivelCodigo.includes("sistema")
    );
  }, [usuario, nomeNivelAtual, buscarNivelPorId]);

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");
      setSucesso("");

      const [resUsuario, resNiveis, resStatus] = await Promise.all([
        api.get(`/painel/usuario/${id}`),
        api.get("/painel/niveis"),
        api.get("/painel/status"),
      ]);

      const usuarioData = getObjetoFromResponse<Usuario>(resUsuario.data);
      const niveisData = getNiveisFromResponse(resNiveis.data);
      const statusData = getStatusFromResponse(resStatus.data);

      setUsuario(usuarioData);
      setNiveis(niveisData);
      setStatusList(statusData);

      setForm({
        nome: usuarioData?.nome || "",
        email: usuarioData?.email || "",
        pin: usuarioData?.pin || "",
        telefone: usuarioData?.telefone || "",
        cpf: usuarioData?.cpf || "",
        nivel_id: String(usuarioData?.nivel_id ?? ""),
        status_id: String(usuarioData?.status_id ?? ""),
      });
    } catch (error: any) {
      console.error("Erro ao carregar usuário:", error);

      if (error?.response?.status === 404) {
        setErro("Usuário não encontrado.");
      } else if (error?.response?.status === 401) {
        setErro("Sessão inválida. Faça login novamente.");
      } else if (error?.response?.status === 403) {
        setErro("Você não tem permissão para editar este usuário.");
      } else {
        setErro("Não foi possível carregar os dados do usuário.");
      }

      setUsuario(null);
      setNiveis([]);
      setStatusList([]);
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const atualizarCampo = useCallback(
    (campo: keyof FormDataType, valor: string) => {
      setForm((prev) => ({
        ...prev,
        [campo]: valor,
      }));
    },
    []
  );

  const gerarPin = useCallback(() => {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    atualizarCampo("pin", pin);
  }, [atualizarCampo]);

  const salvar = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      try {
        setSalvando(true);
        setErro("");
        setSucesso("");

        if (!form.nome.trim()) {
          setErro("O nome é obrigatório.");
          return;
        }

        if (!form.email.trim()) {
          setErro("O email é obrigatório.");
          return;
        }

        if (!form.nivel_id) {
          setErro("Selecione um nível.");
          return;
        }

        if (!form.status_id) {
          setErro("Selecione um status.");
          return;
        }

        await api.put(`/painel/usuario/${id}`, {
          nome: form.nome.trim(),
          email: form.email.trim(),
          pin: form.pin.trim() || null,
          telefone: form.telefone.trim() || null,
          cpf: form.cpf.trim() || null,
          nivel_id: Number(form.nivel_id),
          status_id: Number(form.status_id),
        });

        setSucesso("Usuário atualizado com sucesso.");
        await carregarDados();
      } catch (error: any) {
        console.error("Erro ao salvar usuário:", error);
        setErro(
          error?.response?.data?.mensagem ||
            "Não foi possível atualizar o usuário."
        );
      } finally {
        setSalvando(false);
      }
    },
    [form, id, carregarDados]
  );

  return (
    <div className="editar-usuario-page">
      <div className="editar-usuario-container">
        <section className="hero">
          <div className="hero-top">
            <Link href={`/Admin/usuarios/${id}`} className="voltar-link">
              ← Voltar para detalhes
            </Link>

            <span className="hero-tag">Editar usuário</span>
          </div>

          <h1>Editar usuário</h1>
          <p>Atualize os dados do usuário com segurança e organização.</p>
        </section>

        {carregando ? (
          <div className="estado-box">Carregando dados do usuário...</div>
        ) : erro && !usuario ? (
          <div className="estado-box estado-erro">{erro}</div>
        ) : !usuario ? (
          <div className="estado-box">Usuário não encontrado.</div>
        ) : (
          <form className="form-card" onSubmit={salvar}>
            <div className="perfil-topo">
              <div className="avatar">
                {(usuario.nome?.charAt(0) || "U").toUpperCase()}
              </div>

              <div className="perfil-info">
                <div className="titulo-linha">
                  <h2>{usuario.nome || "Sem nome"}</h2>
                  {protegido && <span className="badge-protected">Protegido</span>}
                </div>

                <p>{usuario.email || "-"}</p>
              </div>
            </div>

            {erro && <div className="alerta alerta-erro">{erro}</div>}
            {sucesso && <div className="alerta alerta-sucesso">{sucesso}</div>}

            <div className="form-grid">
              <div className="campo">
                <label htmlFor="nome">Nome</label>
                <input
                  id="nome"
                  type="text"
                  value={form.nome}
                  onChange={(e) => atualizarCampo("nome", e.target.value)}
                  placeholder="Digite o nome"
                />
              </div>

              <div className="campo">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => atualizarCampo("email", e.target.value)}
                  placeholder="Digite o email"
                />
              </div>

              <div className="campo campo-pin">
                <label htmlFor="pin">PIN</label>
                <div className="pin-box">
                  <input
                    id="pin"
                    type="text"
                    value={form.pin}
                    onChange={(e) => atualizarCampo("pin", e.target.value)}
                    placeholder="Digite o PIN"
                    maxLength={6}
                  />

                  <button
                    type="button"
                    className="mini-btn"
                    onClick={gerarPin}
                  >
                    Gerar PIN
                  </button>
                </div>
              </div>

              <div className="campo">
                <label htmlFor="telefone">Telefone</label>
                <input
                  id="telefone"
                  type="text"
                  value={form.telefone}
                  onChange={(e) => atualizarCampo("telefone", e.target.value)}
                  placeholder="Digite o telefone"
                />
              </div>

              <div className="campo">
                <label htmlFor="cpf">CPF</label>
                <input
                  id="cpf"
                  type="text"
                  value={form.cpf}
                  onChange={(e) => atualizarCampo("cpf", e.target.value)}
                  placeholder="Digite o CPF"
                />
              </div>

              <div className="campo">
                <label htmlFor="nivel_id">Nível</label>
                <select
                  id="nivel_id"
                  value={form.nivel_id}
                  onChange={(e) => atualizarCampo("nivel_id", e.target.value)}
                >
                  <option value="">Selecione</option>
                  {niveis.map((nivel) => (
                    <option
                      key={nivel.id_nivel}
                      value={String(nivel.id_nivel ?? "")}
                    >
                      {nivel.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo">
                <label htmlFor="status_id">Status</label>
                <select
                  id="status_id"
                  value={form.status_id}
                  onChange={(e) => atualizarCampo("status_id", e.target.value)}
                >
                  <option value="">Selecione</option>
                  {statusList.map((status) => (
                    <option
                      key={status.id_status}
                      value={String(status.id_status ?? "")}
                    >
                      {status.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="acoes-form">
              <Link href={`/Admin/usuarios/${id}`} className="btn btn-light">
                Cancelar
              </Link>

              <button type="submit" className="btn btn-dark" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .editar-usuario-page {
          min-height: 100vh;
          padding: 24px;
          background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
        }

        .editar-usuario-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .hero {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 14px 36px rgba(15, 23, 42, 0.06);
          margin-bottom: 20px;
        }

        .hero-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        .voltar-link {
          text-decoration: none;
          color: #334155;
          font-weight: 800;
          font-size: 14px;
        }

        .hero-tag {
          display: inline-flex;
          padding: 7px 12px;
          border-radius: 999px;
          background: #eef2ff;
          color: #3730a3;
          font-size: 12px;
          font-weight: 800;
        }

        .hero h1 {
          margin: 0 0 8px;
          font-size: 36px;
          color: #0f172a;
          font-weight: 900;
        }

        .hero p {
          margin: 0;
          color: #64748b;
          font-size: 15px;
        }

        .estado-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 24px;
          text-align: center;
          color: #334155;
          font-weight: 700;
        }

        .estado-erro {
          background: #fff1f2;
          border-color: #fecdd3;
          color: #be123c;
        }

        .form-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
        }

        .perfil-topo {
          display: flex;
          gap: 16px;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .avatar {
          width: 74px;
          height: 74px;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 900;
          color: #0f172a;
          background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
          border: 1px solid #bfdbfe;
        }

        .perfil-info {
          flex: 1;
          min-width: 240px;
        }

        .titulo-linha {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 6px;
        }

        .titulo-linha h2 {
          margin: 0;
          font-size: 26px;
          color: #0f172a;
          font-weight: 900;
        }

        .perfil-info p {
          margin: 0;
          color: #64748b;
          font-size: 15px;
          word-break: break-word;
        }

        .badge-protected {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          padding: 6px 12px;
          border-radius: 999px;
          background: #0f172a;
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
        }

        .alerta {
          border-radius: 16px;
          padding: 14px 16px;
          margin-bottom: 16px;
          font-size: 14px;
          font-weight: 700;
        }

        .alerta-erro {
          background: #fff1f2;
          color: #be123c;
          border: 1px solid #fecdd3;
        }

        .alerta-sucesso {
          background: #ecfdf5;
          color: #166534;
          border: 1px solid #a7f3d0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .campo {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .campo label {
          color: #334155;
          font-size: 13px;
          font-weight: 800;
        }

        .campo input,
        .campo select {
          width: 100%;
          min-height: 52px;
          border: 1px solid #dbe3ee;
          border-radius: 16px;
          padding: 0 14px;
          background: #ffffff;
          color: #0f172a;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .campo input:focus,
        .campo select:focus {
          border-color: #93c5fd;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
        }

        .campo-pin {
          grid-column: span 2;
        }

        .pin-box {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
        }

        .mini-btn {
          min-height: 52px;
          border: none;
          background: #0f172a;
          color: #ffffff;
          border-radius: 16px;
          padding: 0 16px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s ease;
          white-space: nowrap;
        }

        .mini-btn:hover {
          transform: translateY(-1px);
        }

        .acoes-form {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 22px;
          flex-wrap: wrap;
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

        .btn-dark {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #ffffff;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
        }

        .btn-light {
          background: #ffffff;
          color: #0f172a;
          border: 1px solid #dbe3ee;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .editar-usuario-page {
            padding: 16px;
          }

          .hero h1 {
            font-size: 28px;
          }

          .titulo-linha h2 {
            font-size: 22px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .campo-pin {
            grid-column: span 1;
          }

          .pin-box {
            grid-template-columns: 1fr;
          }

          .acoes-form {
            flex-direction: column;
          }

          .acoes-form .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}