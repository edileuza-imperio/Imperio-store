'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
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
  const [form, setForm] = useState<UsuarioForm>({
    nome: "",
    email: "",
    senha: "",
    nivel_id: 2,
    statusid: 1,
  });

  useEffect(() => {
    carregarStatus();
    carregarNiveis();
  }, []);

  async function carregarStatus() {
    try {
      const res = await api.get("/admin/status");
      setStatusList(res.data.dados || []);
    } catch (e) {
      toast.error("Erro ao carregar status");
    }
  }

  async function carregarNiveis() {
    try {
      const res = await api.get("/admin/usuarios/niveis");
      setNivelList(res.data.dados || []);
    } catch (e) {
      toast.error("Erro ao carregar níveis");
    }
  }

  async function salvarUsuario() {
    try {
      await api.post("/admin/usuarios", form);
      toast.success("Usuário criado com sucesso!");
      router.push("/admin/usuarios");
    } catch (e: any) {
      toast.error(e.response?.data?.mensagem || "Erro ao criar usuário");
    }
  }

  return (
    <div className="container">
      <ToastContainer />

      <div className="card">
        <h2>Novo Usuário</h2>
        <p>Adicione um usuário e configure seu nível e status.</p>

        <div className="form-group">
          <label>Nome</label>
          <div className="input-icon">
            <FaUser />
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Nome completo"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Email</label>
          <div className="input-icon">
            <FaEnvelope />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="exemplo@dominio.com"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Senha</label>
          <div className="input-icon">
            <FaLock />
            <input
              type="password"
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="form-group inline">
          <div>
            <label>Nível</label>
            <select
              value={form.nivel_id}
              onChange={(e) => setForm({ ...form, nivel_id: Number(e.target.value) })}
            >
              {nivelList.map(n => (
                <option key={n.id_nivel} value={n.id_nivel}>{n.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Status</label>
            <select
              value={form.statusid}
              onChange={(e) => setForm({ ...form, statusid: Number(e.target.value) })}
            >
              {statusList.map(s => (
                <option key={s.id_status} value={s.id_status}>{s.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={salvarUsuario} className="btn-save">Salvar Usuário</button>
      </div>

      <style jsx global>{`
        body {
          font-family: 'Inter', sans-serif;
          background: #f3f4f6;
        }

        .container {
          max-width: 600px;
          margin: 50px auto;
          padding: 0 16px;
        }

        .card {
          background: #ffffff;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 12px 28px rgba(0,0,0,0.08);
        }

        h2 {
          margin-bottom: 4px;
          font-weight: 800;
          color: #111827;
        }

        p {
          margin-bottom: 28px;
          color: #6b7280;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          margin-bottom: 20px;
        }

        .form-group.inline {
          display: flex;
          gap: 16px;
        }

        label {
          font-weight: 600;
          margin-bottom: 6px;
          color: #374151;
        }

        .input-icon {
          position: relative;
        }

        .input-icon input {
          padding: 12px 12px 12px 40px;
          border-radius: 12px;
          border: 1px solid #d1d5db;
          width: 100%;
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .input-icon svg {
          position: absolute;
          top: 50%;
          left: 12px;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        input:focus, select:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
        }

        select {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid #d1d5db;
          font-size: 0.95rem;
        }

        .btn-save {
          width: 100%;
          padding: 14px 0;
          background: linear-gradient(135deg,#4f46e5,#6366f1);
          color: #fff;
          font-weight: 700;
          font-size: 1rem;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-save:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        }
      `}</style>
    </div>
  );
}
