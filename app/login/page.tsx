"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FiArrowRight,
  FiLock,
  FiUserPlus,
  FiShield,
  FiCheckCircle,
  FiRefreshCcw,
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import api from "@/Api/conectar";
import styles from "./Login.module.css";
import { imagemFundo } from "@/components/Bibioteca/imagem";

type ConfigLogin = {
  id: number;
  titulo: string;
  logo: string;
  fundo: string;
  mensagem_personalizada: string;
};

function normalizarDados<T = any>(payload: any): T | null {
  return payload?.dados?.dados ?? payload?.dados ?? payload ?? null;
}

export default function Login() {
  const [config, setConfig] = useState<ConfigLogin | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  const router = useRouter();

  async function carregarConfig() {
    try {
      setLoading(true);
      setErro(false);

      const response = await api.get("/config-login");
      const dados = normalizarDados<ConfigLogin>(response?.data);

      setConfig(dados);
    } catch (error) {
      console.error("Erro config-login:", error);
      setConfig(null);
      setErro(true);
      toast.error("Não foi possível carregar a página de login.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setLoading(true);
        setErro(false);

        const response = await api.get("/config-login");
        const dados = normalizarDados<ConfigLogin>(response?.data);

        if (!ativo) return;

        setConfig(dados);
      } catch (error) {
        console.error("Erro config-login:", error);

        if (ativo) {
          setConfig(null);
          setErro(true);
          toast.error("Não foi possível carregar a página de login.");
        }
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, []);

  if (loading) {
    return (
      <main className={styles.loadingPage}>
        <div className={styles.loadingCard} aria-label="Carregando página">
          <div className={`${styles.skeletonLogo} ${styles.shimmer}`} />
          <div className={`${styles.skeletonTitle} ${styles.shimmer}`} />
          <div className={`${styles.skeletonText} ${styles.shimmer}`} />
          <div className={`${styles.skeletonTextSmall} ${styles.shimmer}`} />
          <div className={`${styles.skeletonButton} ${styles.shimmer}`} />
          <div
            className={`${styles.skeletonButton} ${styles.secondary} ${styles.shimmer}`}
          />
        </div>
      </main>
    );
  }

  if (erro || !config) {
    return (
      <>
        <main className={styles.errorPage}>
          <div className={styles.errorCard}>
            <div className={styles.errorIcon}>
              <FiRefreshCcw />
            </div>

            <h2>Erro ao carregar</h2>

            <p>Não foi possível carregar a página. Tente novamente.</p>

            <button type="button" onClick={carregarConfig}>
              Tentar novamente
            </button>
          </div>
        </main>

        <ToastContainer position="top-right" autoClose={2500} />
      </>
    );
  }

  const fundo = imagemFundo(config.fundo);
  const logo = imagemFundo(config.logo);

  return (
    <>
      <main
        className={styles.loginPage}
        style={
          fundo
            ? {
                backgroundImage: `linear-gradient(
                  135deg,
                  rgba(75, 43, 52, 0.82),
                  rgba(109, 76, 82, 0.78)
                ), url(${fundo})`,
              }
            : undefined
        }
      >
        <div className={styles.overlay} aria-hidden="true" />

        <section className={styles.container} aria-label="Acesso do cliente">
          <div className={styles.leftSide}>
            <div className={styles.brandBadge}>
              <FiShield aria-hidden="true" />
              Loja Oficial
            </div>

            <h1>{config.titulo || "Bem-vindo"}</h1>

            <p>
              {config.mensagem_personalizada ||
                "Entre na sua conta para acompanhar pedidos, ofertas e novidades da loja."}
            </p>

            <div className={styles.features}>
              <div className={styles.feature}>
                <FiCheckCircle aria-hidden="true" />
                <span>Compra segura</span>
              </div>

              <div className={styles.feature}>
                <FiCheckCircle aria-hidden="true" />
                <span>Produtos exclusivos</span>
              </div>

              <div className={styles.feature}>
                <FiCheckCircle aria-hidden="true" />
                <span>Atendimento premium</span>
              </div>
            </div>
          </div>

          <div className={styles.rightSide}>
            <div className={styles.card}>
              {logo ? (
                <div className={styles.logoBox}>
                  <Image
                    src={logo}
                    alt={config.titulo || "Logo da loja"}
                    width={72}
                    height={72}
                    priority
                    className={styles.logo}
                  />
                </div>
              ) : (
                <div className={styles.logoBox} aria-hidden="true">
                  <FiShield className={styles.logoIcon} />
                </div>
              )}

              <span className={styles.cardBadge}>Área do cliente</span>

              <h2>Bem-vindo</h2>

              <p className={styles.subtitle}>
                Acesse sua conta ou crie um cadastro para continuar.
              </p>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.btnLogin}
                  onClick={() => router.push("/login/entra")}
                >
                  <FiLock size={18} aria-hidden="true" />
                  Entrar
                  <FiArrowRight size={18} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  className={styles.btnRegister}
                  onClick={() => router.push("/login/cadastro")}
                >
                  <FiUserPlus size={18} aria-hidden="true" />
                  Criar conta
                </button>
              </div>

              <div className={styles.bottomText}>
                Faça login para acompanhar pedidos, endereços e ofertas.
              </div>
            </div>
          </div>
        </section>
      </main>

      <ToastContainer position="top-right" autoClose={2500} />
    </>
  );
}
