"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  FaArrowLeft,
  FaEnvelope,
  FaLock,
  FaShieldAlt,
  FaUser,
  FaPhoneAlt,
  FaIdCard,
  FaCheckCircle,
} from "react-icons/fa";

import { ToastContainer, toast } from "react-toastify";


import api from "@/Api/conectar";
import styles from "./Cadastro.module.css";

type CadastroResponse = {
  mensagem?: string;
  dados?: {
    mensagem?: string;
  };
};

export default function CadastroPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    senha: "",
    confirmarSenha: "",
  });

  const [loading, setLoading] = useState(false);

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function formatarTelefone(valor: string) {
    const n = valor.replace(/\D/g, "").slice(0, 11);

    if (n.length <= 2) return n;
    if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;

    return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  }

  function formatarCpf(valor: string) {
    const n = valor.replace(/\D/g, "").slice(0, 11);

    if (n.length <= 3) return n;
    if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`;
    if (n.length <= 9)
      return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;

    return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(
      9
    )}`;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!form.nome || !form.email || !form.senha) {
      toast.warning("Preencha os campos obrigatórios.");
      return;
    }

    if (form.senha.length < 6) {
      toast.warning("Senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (form.senha !== form.confirmarSenha) {
      toast.error("Senhas não conferem.");
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.post<CadastroResponse>("/criarusuarios", {
        nome: form.nome.trim(),
        email: form.email.trim(),
        senha: form.senha.trim(),
        telefone: form.telefone || null,
        cpf: form.cpf || null,
        nivel_id: 3,
        status_id: 1,
      });

      toast.success(
        data?.dados?.mensagem || data?.mensagem || "Conta criada!"
      );

      setTimeout(() => router.push("/login/entra"), 1000);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.mensagem || "Erro ao criar conta."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <main className={styles.page}>
        <div className={styles.overlay} />

        <section className={styles.container}>
          {/* LEFT */}
          <div className={styles.left}>
            <div className={styles.badge}>
              <FaShieldAlt />
              Cadastro seguro
            </div>

            <h1>Crie sua conta</h1>

            <p>
              Cadastre-se para acompanhar pedidos e ter uma experiência
              mais rápida.
            </p>

            <div className={styles.features}>
              <span>
                <FaCheckCircle /> Compra rápida
              </span>
              <span>
                <FaCheckCircle /> Seguro
              </span>
              <span>
                <FaCheckCircle /> Suporte
              </span>
            </div>
          </div>

          {/* RIGHT */}
          <div className={styles.right}>
            <form className={styles.card} onSubmit={handleSubmit}>
              <button
                type="button"
                className={styles.back}
                onClick={() => router.push("/login")}
              >
                <FaArrowLeft /> voltar
              </button>

              <div className={styles.icon}>
                <FaShieldAlt />
              </div>

              <h2>cadastro</h2>

              <div className={styles.form}>
                <input
                  placeholder="Nome"
                  value={form.nome}
                  onChange={(e) => setField("nome", e.target.value)}
                />

                <input
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                />

                <input
                  placeholder="Telefone"
                  value={form.telefone}
                  onChange={(e) =>
                    setField("telefone", formatarTelefone(e.target.value))
                  }
                />

                <input
                  placeholder="CPF"
                  value={form.cpf}
                  onChange={(e) =>
                    setField("cpf", formatarCpf(e.target.value))
                  }
                />

                <input
                  type="password"
                  placeholder="Senha"
                  value={form.senha}
                  onChange={(e) => setField("senha", e.target.value)}
                />

                <input
                  type="password"
                  placeholder="Confirmar senha"
                  value={form.confirmarSenha}
                  onChange={(e) =>
                    setField("confirmarSenha", e.target.value)
                  }
                />

                <button disabled={loading} className={styles.btn}>
                  {loading ? "criando..." : "criar conta"}
                </button>

                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => router.push("/login/entra")}
                >
                  já tenho conta
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      
    </>
  );
}