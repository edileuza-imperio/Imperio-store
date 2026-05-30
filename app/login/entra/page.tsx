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

type ApiPayload = {
  mensagem?: string;
  etapa2?: boolean;
  usuario_id?: number;
  id_usuario?: number;
  acao?: string;
};

type LoginResponse = {
  dados?: ApiPayload;
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
        data?.etapa2 || dados?.etapa2 || dados?.acao === "pedir_pin";

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
    } catch (err: any) {
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
      router.push("/");
    } catch {
      toast.error("PIN inválido");
    } finally {
      setLoadingPin(false);
    }
  }

  function addNumber(n: string) {
    if (pin.length >= 6) return;
    setPin((prev) => prev + n);
  }

  return (
    <main className={styles.page}>
      <div className={styles.overlay} />

      <section className={styles.container}>
        {/* LEFT */}
        <div className={styles.left}>
          <div className={styles.badge}>
            <FaShieldAlt /> Acesso seguro
          </div>

          <h1>Login</h1>

          <p>Entre para acessar sua conta</p>

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
              <FaArrowLeft /> Voltar
            </button>

            <div className={styles.icon}>
              <FaShieldAlt />
            </div>

            <form onSubmit={handleLogin} className={styles.form}>
              <div>
                <label>Email</label>
                <div className={styles.input}>
                  <FaEnvelope />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label>Senha</label>
                <div className={styles.input}>
                  <FaLock />
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </div>
              </div>

              <button className={styles.btn} disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* MODAL PIN */}
      {mostrarModalPin && (
        <div className={styles.modal}>
          <div className={styles.modalBox}>
            <FaKey size={30} />

            <div className={styles.pin}>
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <span key={i}>
                    {pin[i] ? "•" : ""}
                  </span>
                ))}
            </div>

            <div className={styles.keys}>
              {[1,2,3,4,5,6,7,8,9].map((n) => (
                <button
                  key={n}
                  onClick={() => addNumber(String(n))}
                >
                  {n}
                </button>
              ))}

              <button onClick={() => setPin("")}>C</button>
              <button onClick={() => addNumber("0")}>0</button>
              <button onClick={() => setPin((p) => p.slice(0, -1))}>
                <FaBackspace />
              </button>
            </div>

            <button onClick={confirmarPin}>
              {loadingPin ? "..." : "Confirmar"}
            </button>
          </div>
        </div>
      )}

      <ToastContainer />
    </main>
  );
}