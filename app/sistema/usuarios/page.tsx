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
  Phone,
  BadgeCheck,
  CalendarDays,
  IdCard,
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

function formatarData(data?: string | null) {
  if (!data) return "Sem data";

  const normalizada = data.replace(" ", "T");
  const dt = new Date(normalizada);

  if (Number.isNaN(dt.getTime())) return data;

  return dt.toLocaleDateString("pt-BR");
}

function getIniciais(nome?: string) {
  const valor = nome?.trim();

  if (!valor) return "U";

  const partes = valor.split(" ").filter(Boolean);

  if (partes.length === 1) {
    return partes[0].charAt(0).toUpperCase();
  }

  return `${partes[0].charAt(0)}${partes[partes.length - 1].charAt(
    0
  )}`.toUpperCase();
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

      const response = await api.get("/painel/usuarios", {
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
        `/painel/usuario/${usuario.id_usuario}/email-teste`,
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

  const totalAtivos = usuarios.filter(
    (usuario) => Number(usuario.status_id) === 1
  ).length;

  const totalComEmail = usuarios.filter((usuario) => usuario.email).length;

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
        <article className={styles.cardResumo}>
          <User size={22} />

          <div>
            <span>Total de usuários</span>
            <strong>{usuarios.length}</strong>
          </div>
        </article>

        <article className={styles.cardResumo}>
          <Shield size={22} />

          <div>
            <span>Ativos</span>
            <strong>{totalAtivos}</strong>
          </div>
        </article>

        <article className={styles.cardResumo}>
          <Mail size={22} />

          <div>
            <span>Com e-mail</span>
            <strong>{totalComEmail}</strong>
          </div>
        </article>
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
          <div className={styles.cardsGrid}>
            {usuariosFiltrados.map((usuario) => {
              const ativo = Number(usuario.status_id) === 1;
              const enviando = enviandoId === usuario.id_usuario;

              return (
                <article key={usuario.id_usuario} className={styles.cardUsuario}>
                  <div className={styles.cardTopo}>
                    <div className={styles.avatar}>
                      {getIniciais(usuario.nome)}
                    </div>

                    <div className={styles.usuarioNome}>
                      <h2>{usuario.nome || "Sem nome"}</h2>
                      <span>ID #{usuario.id_usuario}</span>
                    </div>

                    <span
                      className={`${styles.status} ${
                        ativo ? styles.ativo : styles.inativo
                      }`}
                    >
                      {ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <div className={styles.infoLista}>
                    <div className={styles.infoItem}>
                      <Mail size={17} />
                      <div>
                        <span>E-mail</span>
                        <strong>{usuario.email || "Sem e-mail"}</strong>
                      </div>
                    </div>

                    <div className={styles.infoItem}>
                      <Phone size={17} />
                      <div>
                        <span>Telefone</span>
                        <strong>{usuario.telefone || "Sem telefone"}</strong>
                      </div>
                    </div>

                    <div className={styles.infoItem}>
                      <IdCard size={17} />
                      <div>
                        <span>CPF</span>
                        <strong>{usuario.cpf || "Não informado"}</strong>
                      </div>
                    </div>

                    <div className={styles.infoItem}>
                      <BadgeCheck size={17} />
                      <div>
                        <span>Nível</span>
                        <strong>Nível {usuario.nivel_id || "-"}</strong>
                      </div>
                    </div>

                    <div className={styles.infoItem}>
                      <CalendarDays size={17} />
                      <div>
                        <span>Criado em</span>
                        <strong>{formatarData(usuario.criado)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardRodape}>
                    <button
                      type="button"
                      className={styles.btnEmail}
                      onClick={() => enviarEmailTeste(usuario)}
                      disabled={enviando || !usuario.email}
                    >
                      <Mail size={16} />
                      {enviando ? "Enviando..." : "Enviar e-mail"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}