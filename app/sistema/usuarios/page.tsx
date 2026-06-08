"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Mail,
  RefreshCw,
  Search,
  User,
  Shield,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import api from "@/Api/conectar";
import styles from "./Usuarios.module.css";

type Usuario = {
  id_usuario: number;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  nivel_id?: number;
  status_id?: number;
  criado?: string;
};

type Toast = {
  tipo: "sucesso" | "erro";
  texto: string;
};

function normalizarUsuarios(data: any): Usuario[] {
  if (Array.isArray(data?.dados?.usuarios)) return data.dados.usuarios;
  if (Array.isArray(data?.dados)) return data.dados;
  if (Array.isArray(data)) return data;

  return [];
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [enviandoId, setEnviandoId] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  function mostrarToast(texto: string, tipo: Toast["tipo"]) {
    setToast({ texto, tipo });

    window.setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  async function carregarUsuarios() {
    try {
      setLoading(true);

      const response = await api.get("/usuarios", {
        withCredentials: true,
      });

      setUsuarios(normalizarUsuarios(response.data));
    } catch {
      setUsuarios([]);
      mostrarToast("Não foi possível carregar os usuários.", "erro");
    } finally {
      setLoading(false);
    }
  }

  async function enviarEmailTeste(usuario: Usuario) {
    try {
      setEnviandoId(usuario.id_usuario);

      const response = await api.post(
        `/usuario/${usuario.id_usuario}/email-teste`,
        {},
        {
          withCredentials: true,
        }
      );

      mostrarToast(
        response.data?.mensagem || `E-mail enviado para ${usuario.email}.`,
        "sucesso"
      );
    } catch (error: any) {
      mostrarToast(
        error?.response?.data?.mensagem ||
          error?.response?.data?.erro ||
          "Erro ao enviar e-mail de teste.",
        "erro"
      );
    } finally {
      setEnviandoId(null);
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return usuarios;

    return usuarios.filter((usuario) => {
      return (
        usuario.nome?.toLowerCase().includes(termo) ||
        usuario.email?.toLowerCase().includes(termo) ||
        usuario.telefone?.toLowerCase().includes(termo) ||
        usuario.cpf?.toLowerCase().includes(termo)
      );
    });
  }, [usuarios, busca]);

  return (
    <div className={styles.page}>
      {toast && (
        <div
          className={`${styles.toast} ${
            toast.tipo === "sucesso" ? styles.toastSucesso : styles.toastErro
          }`}
        >
          {toast.tipo === "sucesso" ? (
            <CheckCircle2 size={20} />
          ) : (
            <XCircle size={20} />
          )}

          <span>{toast.texto}</span>
        </div>
      )}

      <section className={styles.header}>
        <div>
          <span className={styles.tag}>Sistema</span>
          <h1>Usuários</h1>
          <p>Liste usuários cadastrados e teste o envio de e-mail.</p>
        </div>

        <button
          type="button"
          className={styles.btnAtualizar}
          onClick={carregarUsuarios}
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? styles.girando : ""} />
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </section>

      <section className={styles.resumo}>
        <div className={styles.cardResumo}>
          <User size={22} />
          <div>
            <span>Total de usuários</span>
            <strong>{usuarios.length}</strong>
          </div>
        </div>

        <div className={styles.cardResumo}>
          <Shield size={22} />
          <div>
            <span>Ativos</span>
            <strong>
              {usuarios.filter((usuario) => Number(usuario.status_id) === 1).length}
            </strong>
          </div>
        </div>

        <div className={styles.cardResumo}>
          <Mail size={22} />
          <div>
            <span>Com e-mail</span>
            <strong>{usuarios.filter((usuario) => usuario.email).length}</strong>
          </div>
        </div>
      </section>

      <section className={styles.filtro}>
        <Search size={18} />

        <input
          type="text"
          placeholder="Buscar por nome, e-mail, telefone ou CPF..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </section>

      <section className={styles.content}>
        {loading ? (
          <div className={styles.estado}>Carregando usuários...</div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className={styles.estado}>Nenhum usuário encontrado.</div>
        ) : (
          <div className={styles.tabelaWrap}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>E-mail</th>
                  <th>Nível</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>

              <tbody>
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id_usuario}>
                    <td>
                      <div className={styles.usuarioInfo}>
                        <div className={styles.avatar}>
                          {usuario.nome?.charAt(0)?.toUpperCase() || "U"}
                        </div>

                        <div>
                          <strong>{usuario.nome || "Sem nome"}</strong>
                          <span>{usuario.telefone || "Sem telefone"}</span>
                        </div>
                      </div>
                    </td>

                    <td>{usuario.email || "Sem e-mail"}</td>

                    <td>
                      <span className={styles.badgeNivel}>
                        Nível {usuario.nivel_id || "-"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`${styles.status} ${
                          Number(usuario.status_id) === 1
                            ? styles.ativo
                            : styles.inativo
                        }`}
                      >
                        {Number(usuario.status_id) === 1 ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className={styles.btnEmail}
                        onClick={() => enviarEmailTeste(usuario)}
                        disabled={
                          enviandoId === usuario.id_usuario || !usuario.email
                        }
                      >
                        <Mail size={16} />
                        {enviandoId === usuario.id_usuario
                          ? "Enviando..."
                          : "Enviar e-mail"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}