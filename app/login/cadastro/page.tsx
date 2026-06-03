"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  FaArrowLeft,
  FaShieldAlt,
  FaCheckCircle,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import api from "@/Api/conectar";
import styles from "./Cadastro.module.css";

type CadastroResponse = {
  mensagem?: string;
  dados?: {
    mensagem?: string;
  };
};

type FormCadastro = {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  senha: string;
  confirmarSenha: string;
};

const initialForm: FormCadastro = {
  nome: "",
  email: "",
  telefone: "",
  cpf: "",
  senha: "",
  confirmarSenha: "",
};

function apenasNumeros(value: string) {
  return value.replace(/\D/g, "");
}

function formatTelefone(value: string) {
  const n = apenasNumeros(value).slice(0, 11);

  if (n.length <= 2) return n;
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;

  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

function formatCpf(value: string) {
  const n = apenasNumeros(value).slice(0, 11);

  if (n.length <= 3) return n;
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`;
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;

  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
}

function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function extrairMensagemErro(error: unknown) {
  const err = error as any;

  return (
    err?.response?.data?.mensagem ||
    err?.response?.data?.erro ||
    err?.message ||
    "Erro ao criar conta. Tente novamente."
  );
}

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormCadastro>(initialForm);
  const [loading, setLoading] = useState(false);

  function setField(field: keyof FormCadastro, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validarFormulario() {
    const nome = form.nome.trim();
    const email = form.email.trim();
    const telefoneLimpo = apenasNumeros(form.telefone);
    const cpfLimpo = apenasNumeros(form.cpf);

    if (!nome || !email || !form.senha || !form.confirmarSenha) {
      toast.warning("Preencha nome, email, senha e confirmação de senha.");
      return false;
    }

    if (nome.length < 3) {
      toast.warning("Informe um nome válido.");
      return false;
    }

    if (!validarEmail(email)) {
      toast.warning("Informe um email válido.");
      return false;
    }

    if (telefoneLimpo && telefoneLimpo.length < 10) {
      toast.warning("Informe um telefone válido.");
      return false;
    }

    if (cpfLimpo && cpfLimpo.length !== 11) {
      toast.warning("Informe um CPF válido com 11 números.");
      return false;
    }

    if (form.senha.length < 6) {
      toast.warning("A senha deve ter no mínimo 6 caracteres.");
      return false;
    }

    if (form.senha !== form.confirmarSenha) {
      toast.error("As senhas não conferem.");
      return false;
    }

    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;
    if (!validarFormulario()) return;

    try {
      setLoading(true);

      const payload = {
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        senha: form.senha,
        telefone: apenasNumeros(form.telefone) || null,
        cpf: apenasNumeros(form.cpf) || null,
        nivel_id: 3,
        status_id: 1,
      };

      const { data } = await api.post<CadastroResponse>("/criarusuarios", payload, {
        withCredentials: true,
      });

      toast.success(data?.dados?.mensagem || data?.mensagem || "Conta criada com sucesso!");
      setForm(initialForm);

      window.setTimeout(() => {
        router.push("/login/entra");
      }, 900);
    } catch (error) {
      toast.error(extrairMensagemErro(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <main className={styles.page}>
        <div className={styles.overlay} aria-hidden="true" />

        <section className={styles.container} aria-label="Cadastro de usuário">
          <div className={styles.left}>
            <div className={styles.badge}>
              <FaShieldAlt aria-hidden="true" />
              Cadastro seguro
            </div>

            <h1>Crie sua conta</h1>

            <p>
              Cadastre-se para acompanhar seus pedidos, salvar seus dados e comprar com mais facilidade.
            </p>

            <div className={styles.features}>
              <span><FaCheckCircle aria-hidden="true" /> Rápido</span>
              <span><FaCheckCircle aria-hidden="true" /> Seguro</span>
              <span><FaCheckCircle aria-hidden="true" /> Acesso aos pedidos</span>
            </div>
          </div>

          <div className={styles.right}>
            <form className={styles.card} onSubmit={handleSubmit} noValidate>
              <button
                type="button"
                className={styles.back}
                onClick={() => router.push("/login")}
              >
                <FaArrowLeft aria-hidden="true" />
                voltar
              </button>

              <div className={styles.icon} aria-hidden="true">
                <FaShieldAlt />
              </div>

              <span className={styles.badgeSmall}>nova conta</span>
              <h2 className={styles.title}>cadastro</h2>

              <div className={styles.form}>
                <input
                  type="text"
                  name="nome"
                  placeholder="Nome completo"
                  autoComplete="name"
                  value={form.nome}
                  onChange={(e) => setField("nome", e.target.value)}
                  disabled={loading}
                  required
                />

                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  disabled={loading}
                  required
                />

                <input
                  type="tel"
                  name="telefone"
                  placeholder="Telefone"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.telefone}
                  onChange={(e) => setField("telefone", formatTelefone(e.target.value))}
                  disabled={loading}
                />

                <input
                  type="text"
                  name="cpf"
                  placeholder="CPF"
                  inputMode="numeric"
                  autoComplete="off"
                  value={form.cpf}
                  onChange={(e) => setField("cpf", formatCpf(e.target.value))}
                  disabled={loading}
                />

                <input
                  type="password"
                  name="senha"
                  placeholder="Senha"
                  autoComplete="new-password"
                  value={form.senha}
                  onChange={(e) => setField("senha", e.target.value)}
                  disabled={loading}
                  required
                />

                <input
                  type="password"
                  name="confirmarSenha"
                  placeholder="Confirmar senha"
                  autoComplete="new-password"
                  value={form.confirmarSenha}
                  onChange={(e) => setField("confirmarSenha", e.target.value)}
                  disabled={loading}
                  required
                />

                <button type="submit" className={styles.btn} disabled={loading}>
                  {loading ? "criando conta..." : "criar conta"}
                </button>

                <button
                  type="button"
                  className={styles.btnOutline}
                  onClick={() => router.push("/login/entra")}
                  disabled={loading}
                >
                  já tenho conta
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      <ToastContainer position="top-right" autoClose={2500} />
    </>
  );
}
