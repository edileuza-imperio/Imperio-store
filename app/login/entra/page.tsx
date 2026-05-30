"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  FaArrowLeft,
  FaEnvelope,
  FaLock,
  FaShieldAlt,
  FaKey,
  FaBackspace,
} from "react-icons/fa";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import api from "@/Api/conectar";
import styles from "./EntrarPage.module.css";

type LoginResponse = {
  dados?: {
    mensagem?: string;
    etapa2?: boolean;
    usuario_id?: number;
    id_usuario?: number;
    acao?: string;
  };
  etapa2?: boolean;
};

export default function EntrarPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [pin, setPin] = useState("");
  const [usuarioIdPin, setUsuarioIdPin] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingPin, setLoadingPin] = useState(false);
  const [mostrarModalPin, setMostrarModalPin] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email || !senha) {
      toast.warning("Preencha todos os campos.");
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.post<LoginResponse>("/login", {
        email,
        senha,
      });

      const dados = data?.dados;

      const etapa2 =
        data?.etapa2 ||
        dados?.etapa2 ||
        dados?.acao === "pedir_pin";

      const usuarioId =
        dados?.usuario_id || dados?.id_usuario || null;

      if (etapa2) {
        setUsuarioIdPin(usuarioId);
        setMostrarModalPin(true);
        setPin("");
        toast.info("Digite o PIN enviado.");
        return;
      }

      toast.success("Login realizado!");
      router.push("/");
    } catch {
      toast.error("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  async function confirmarPin() {
    if (!usuarioIdPin || !pin) return;

    try {
      setLoadingPin(true);

      await api.post("/login2", {
        usuario_id: usuarioIdPin,
        pin,
      });

      toast.success("PIN validado!");
      setMostrarModalPin(false);
      setPin("");
      router.push("/");
    } catch {
      toast.error("PIN inválido");
    } finally {
      setLoadingPin(false);
    }
  }

  function addNumber(n: string) {
    if (pin.length >= 6) return;
    setPin((p) => p + n);
  }

  return (
    <main className={styles.page}>
      <div className={styles.overlay} />

      <section className={styles.container}>
        {/* LEFT */}
        <div className={styles.left}>
          <div className={styles.badge}>
            <FaShieldAlt />
            Acesso seguro
          </div>

          <h1>login</h1>

          <p>Entre para acessar sua conta com segurança.</p>

          <div className={styles.features}>
            <span>✔ Seguro</span>
            <span>✔ Rápido</span>
            <span>✔ Premium</span>
          </div>
        </div>

        {/* RIGHT */}
        <div className={styles.right}>
          <div className={styles.card}>
            <button
              className={styles.back}
              onClick={() => router.push("/login")}
            >
              <FaArrowLeft />
              voltar
            </button>

            <div className={styles.icon}>
              <FaShieldAlt />
            </div>

            <form onSubmit={handleLogin} className={styles.form}>
              <div className={styles.group}>
                <label>Email</label>
                <div className={styles.input}>
                  <FaEnvelope />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu email"
                  />
                </div>
              </div>

              <div className={styles.group}>
                <label>Senha</label>
                <div className={styles.input}>
                  <FaLock />
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua senha"
                  />
                </div>
              </div>

              <button className={styles.btn} disabled={loading}>
                {loading ? "entrando..." : "entrar"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* MODAL PIN */}
      {mostrarModalPin && (
        <div className={styles.modal}>
          <div className={styles.modalBox}>
            <div className={styles.modalIcon}>
              <FaKey />
            </div>

            <h2>PIN de segurança</h2>
            <p>Digite o código de 6 dígitos</p>

            <div className={styles.pin}>
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className={pin[i] ? styles.dotActive : styles.dot}>
                  {pin[i] ? "•" : ""}
                </span>
              ))}
            </div>

            <div className={styles.keys}>
              {[1,2,3,4,5,6,7,8,9].map((n) => (
                <button key={n} onClick={() => addNumber(String(n))}>
                  {n}
                </button>
              ))}

              <button onClick={() => setPin("")}>C</button>
              <button onClick={() => addNumber("0")}>0</button>
              <button onClick={() => setPin((p) => p.slice(0, -1))}>
                <FaBackspace />
              </button>
            </div>

            <button
              className={styles.confirmBtn}
              onClick={confirmarPin}
              disabled={loadingPin}
            >
              {loadingPin ? "validando..." : "confirmar"}
            </button>
          </div>
        </div>
      )}

      <ToastContainer />
    </main>
  );
}