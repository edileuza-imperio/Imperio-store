"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaUser, FaEnvelope, FaLock, FaUserShield } from "react-icons/fa";

interface Status {
  id_status: number;
  nome: string;
}

interface Nivel {
  id_nivel: number;
  nome: string;
}

interface UsuarioForm {
  nome: string;
  email: string;
  senha: string;
  nivel_id: number;
  statusid: number;
}

export default function NovoUsuario() {
  const router = useRouter();

  const [statusList, setStatusList] = useState<Status[]>([]);
  const [nivelList, setNivelList] = useState<Nivel[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<UsuarioForm>({
    nome: "",
    email: "",
    senha: "",
    nivel_id: 2,
    statusid: 1,
  });

  const podeSalvar = useMemo(() => {
    return (
      form.nome.trim().length >= 3 &&
      form.email.trim().includes("@") &&
      form.senha.trim().length >= 6 &&
      Number(form.nivel_id) > 0 &&
      Number(form.statusid) > 0
    );
  }, [form]);

  useEffect(() => {
    carregarStatus();
    carregarNiveis();
  }, []);

  async function carregarStatus() {
    try {
      const res = await api.get("/admin/status");
      setStatusList(res.data.dados || []);
    } catch {
      toast.error("Erro ao carregar status");
    }
  }

  async function carregarNiveis() {
    try {
      const res = await api.get("/admin/usuarios/niveis");
      setNivelList(res.data.dados || []);
    } catch {
      toast.error("Erro ao carregar níveis");
    }
  }

  async function salvarUsuario() {
    if (!podeSalvar) {
      toast.info("Preencha nome, email e senha (mín. 6).");
      return;
    }

    try {
      setSaving(true);
      await api.post("/admin/usuarios", form);
      toast.success("Usuário criado com sucesso!");
      router.push("/admin/usuarios");
    } catch (e: any) {
      toast.error(e?.response?.data?.mensagem || "Erro ao criar usuário");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <ToastContainer position="top-right" autoClose={2400} newestOnTop theme="light" />

      {/* Header da página (combina com painel) */}
      <div className="pageHead">
        <div className="titleBox">
          <div className="kicker">
            <span className="dot" />
            Administração
          </div>
          <h1 className="title">Novo Usuário</h1>
          <p className="subtitle">Adicione um usuário e configure seu nível e status.</p>
        </div>

        <div className="actions">
          <button type="button" className="btn btnGhost" onClick={() => router.back()}>
            Voltar
          </button>
          <button
            type="button"
            className="btn btnPrimary"
            onClick={salvarUsuario}
            disabled={!podeSalvar || saving}
          >
            {saving ? "Salvando..." : "Salvar usuário"}
          </button>
        </div>
      </div>

      {/* Card */}
      <div className="card">
        <div className="cardHead">
          <div className="cardIcon" aria-hidden>
            <FaUserShield />
          </div>
          <div>
            <h2 className="cardTitle">Dados do usuário</h2>
            <p className="cardSub">Preencha as informações abaixo.</p>
          </div>
        </div>

        <div className="grid">
          <div className="field">
            <label className="label">Nome</label>
            <div className="control">
              <span className="icon" aria-hidden>
                <FaUser />
              </span>
              <input
                className="input"
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Nome completo"
                autoComplete="name"
              />
            </div>
            <span className="hint">Ex.: João da Silva</span>
          </div>

          <div className="field">
            <label className="label">Email</label>
            <div className="control">
              <span className="icon" aria-hidden>
                <FaEnvelope />
              </span>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="exemplo@dominio.com"
                autoComplete="email"
              />
            </div>
            <span className="hint">Será usado para login e notificações.</span>
          </div>

          <div className="field">
            <label className="label">Senha</label>
            <div className="control">
              <span className="icon" aria-hidden>
                <FaLock />
              </span>
              <input
                className="input"
                type="password"
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
            </div>
            <span className="hint">Dica: use letras e números.</span>
          </div>

          <div className="row2">
            <div className="field">
              <label className="label">Nível</label>
              <div className="control">
                <span className="icon" aria-hidden>
                  <FaUserShield />
                </span>
                <select
                  className="select"
                  value={form.nivel_id}
                  onChange={(e) => setForm({ ...form, nivel_id: Number(e.target.value) })}
                >
                  {nivelList.map((n) => (
                    <option key={n.id_nivel} value={n.id_nivel}>
                      {n.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label className="label">Status</label>
              <div className="control">
                <span className="icon" aria-hidden>
                  <span className="statusIcon" />
                </span>
                <select
                  className="select"
                  value={form.statusid}
                  onChange={(e) => setForm({ ...form, statusid: Number(e.target.value) })}
                >
                  {statusList.map((s) => (
                    <option key={s.id_status} value={s.id_status}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer no mobile (quando botões do topo ficam longe) */}
        <div className="cardFooter">
          <button type="button" className="btn btnGhost" onClick={() => router.back()}>
            Voltar
          </button>
          <button
            type="button"
            className="btn btnPrimary"
            onClick={salvarUsuario}
            disabled={!podeSalvar || saving}
          >
            {saving ? "Salvando..." : "Salvar usuário"}
          </button>
        </div>
      </div>

      <style jsx>{`
        /* Página (não mexe no body do painel) */
        .page {
          width: min(980px, 100%);
          margin: 0 auto;
          padding: 22px 16px 28px;
        }

        /* Header */
        .pageHead {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 14px;
        }

        .titleBox {
          min-width: 0;
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
          font-weight: 700;
          width: fit-content;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.16);
        }

        .title {
          margin: 10px 0 6px;
          font-size: 1.55rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #111827;
        }

        .subtitle {
          margin: 0;
          color: rgba(17, 24, 39, 0.64);
          line-height: 1.45;
          max-width: 72ch;
        }

        .actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        /* Card */
        .card {
          border-radius: 18px;
          background: #fff;
          border: 1px solid rgba(17, 24, 39, 0.10);
          box-shadow: 0 10px 30px rgba(17, 24, 39, 0.06);
          padding: 18px;
        }

        .cardHead {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 14px;
          margin-bottom: 14px;
          border-bottom: 1px solid rgba(17, 24, 39, 0.08);
        }

        .cardIcon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: rgba(37, 99, 235, 0.08);
          border: 1px solid rgba(37, 99, 235, 0.12);
          color: #2563eb;
          font-size: 18px;
          flex: 0 0 auto;
        }

        .cardTitle {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 900;
          color: #111827;
          letter-spacing: -0.01em;
        }

        .cardSub {
          margin: 2px 0 0;
          color: rgba(17, 24, 39, 0.62);
          font-size: 0.92rem;
        }

        /* Form grid */
        .grid {
          display: grid;
          gap: 14px;
        }

        .row2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .field {
          display: grid;
          gap: 6px;
        }

        .label {
          font-size: 0.9rem;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.78);
        }

        .hint {
          font-size: 0.8rem;
          color: rgba(17, 24, 39, 0.52);
        }

        /* Controls */
        .control {
          position: relative;
        }

        .icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(17, 24, 39, 0.42);
          pointer-events: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
        }

        .statusIcon {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18);
        }

        .input,
        .select {
          width: 100%;
          height: 46px;
          border-radius: 12px;
          border: 1px solid rgba(17, 24, 39, 0.14);
          background: rgba(255, 255, 255, 1);
          padding: 0 12px 0 40px;
          font-size: 0.95rem;
          color: #111827;
          outline: none;
          transition: box-shadow 0.15s ease, border-color 0.15s ease,
            transform 0.15s ease;
        }

        .select {
          appearance: none;
        }

        .input:focus,
        .select:focus {
          border-color: rgba(37, 99, 235, 0.45);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.14);
        }

        .input::placeholder {
          color: rgba(17, 24, 39, 0.35);
        }

        /* Buttons */
        .btn {
          height: 44px;
          padding: 0 14px;
          border-radius: 12px;
          font-weight: 900;
          border: 1px solid rgba(17, 24, 39, 0.12);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.2s ease,
            filter 0.2s ease;
          white-space: nowrap;
        }

        .btn:hover {
          transform: translateY(-1px);
        }

        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .btnGhost {
          background: rgba(17, 24, 39, 0.04);
          color: rgba(17, 24, 39, 0.86);
        }

        .btnPrimary {
          color: #fff;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border-color: rgba(255, 255, 255, 0.22);
          box-shadow: 0 12px 28px rgba(37, 99, 235, 0.18);
        }

        .btnPrimary:hover {
          filter: brightness(1.02);
          box-shadow: 0 16px 38px rgba(37, 99, 235, 0.22);
        }

        /* Footer (mobile) */
        .cardFooter {
          display: none;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid rgba(17, 24, 39, 0.08);
          gap: 10px;
          grid-template-columns: 1fr 1fr;
        }

        @media (max-width: 820px) {
          .pageHead {
            align-items: flex-start;
          }
          .actions {
            display: none; /* no mobile usamos footer */
          }
          .cardFooter {
            display: grid;
          }
          .row2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}