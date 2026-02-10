'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FaTrash,
  FaEdit,
  FaLock,
  FaUserPlus,
  FaKey
} from "react-icons/fa";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  pin: string | null;
  nivel_id: number;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const res = await api.get("/admin/usuarios");
    setUsuarios(res.data.dados || []);
  }

  async function excluirUsuario(id: number) {
    if (!confirm("Deseja realmente excluir este usuário?")) return;

    try {
      await api.delete(`/admin/usuarios/${id}`);
      setUsuarios(prev => prev.filter(u => u.id_usuario !== id));
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
    // aqui depois você liga na rota real
  }

  return (
    <div className="container-fluid">
      <ToastContainer />

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1>Usuários</h1>
          <p>Gerencie acessos, níveis e segurança</p>
        </div>

        <Link href="/admin/usuarios/novo" className="btn-primary">
          <FaUserPlus /> Novo Usuário
        </Link>
      </div>

      {/* GRID */}
      <div className="users-grid">
        {usuarios.map(user => (
          <div key={user.id_usuario} className="user-card">
            <div className="card-top">
              <strong>{user.nome}</strong>

              {user.nivel_id === 1 && (
                <span className="badge-system">
                  <FaLock /> Sistema
                </span>
              )}
            </div>

            <span className="email">{user.email}</span>

            {/* PIN */}
            <div className="pin-box">
              <span>PIN</span>
              <strong>{user.pin ?? "— — — —"}</strong>
            </div>

            {/* ACTIONS */}
            <div className="actions">
              {user.nivel_id !== 1 && (
                <>
                  <Link
                    href={`/admin/usuarios/${user.id_usuario}`}
                    className="btn edit"
                  >
                    <FaEdit /> Editar
                  </Link>

                  <button
                    className="btn pin"
                    onClick={() => resetPin(user)}
                  >
                    <FaKey /> Esqueci o PIN
                  </button>

                  <button
                    className="btn delete"
                    onClick={() => excluirUsuario(user.id_usuario)}
                  >
                    <FaTrash />
                  </button>
                </>
              )}

              {user.nivel_id === 1 && (
                <button className="btn locked" disabled>
                  <FaLock /> Protegido
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* STYLE */}
      <style jsx global>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .page-header h1 {
          margin: 0;
          font-weight: 800;
        }

        .page-header p {
          margin: 4px 0 0;
          color: #6b7280;
        }

        .btn-primary {
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          color: #fff;
          padding: 12px 18px;
          border-radius: 14px;
          font-weight: 700;
          display: flex;
          gap: 8px;
          align-items: center;
          text-decoration: none;
        }

        .users-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 22px;
        }

        .user-card {
          background: #fff;
          border-radius: 18px;
          padding: 20px;
          box-shadow: 0 12px 35px rgba(0,0,0,.08);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .badge-system {
          background: #fee2e2;
          color: #991b1b;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 800;
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .email {
          font-size: 0.9rem;
          color: #6b7280;
        }

        .pin-box {
          background: #f1f5f9;
          border-radius: 12px;
          padding: 12px;
          display: flex;
          justify-content: space-between;
          font-weight: 800;
          font-size: 0.8rem;
        }

        .actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: auto;
        }

        .btn {
          border-radius: 12px;
          border: none;
          padding: 8px 10px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn.edit {
          background: #eef2ff;
          color: #3730a3;
        }

        .btn.pin {
          background: #ecfeff;
          color: #155e75;
        }

        .btn.delete {
          background: #fee2e2;
          color: #991b1b;
        }

        .btn.locked {
          background: #e5e7eb;
          color: #6b7280;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
