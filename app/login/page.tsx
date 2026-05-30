"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiArrowRight, FiLock, FiUserPlus, FiShield } from "react-icons/fi";
import { toast } from "react-toastify";
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

export default function login() {
  const [config, setConfig] = useState<ConfigLogin | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    let ativo = true;

    async function carregarConfig() {
      try {
        const response = await api.get("/config-login");
        const dados = normalizarDados<ConfigLogin>(response?.data);

        if (!ativo) return;

        setConfig(dados);
      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar página");
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregarConfig();

    return () => {
      ativo = false;
    };
  }, []);

  if (loading) {
    return (
      <main className={styles.loadingPage}>
        <div className={styles.loadingCard}>
          <div className={`${styles.skeletonLogo} ${styles.shimmer}`} />
          <div className={`${styles.skeletonTitle} ${styles.shimmer}`} />
          <div className={`${styles.skeletonText} ${styles.shimmer}`} />
          <div className={`${styles.skeletonTextSmall} ${styles.shimmer}`} />
          <div className={`${styles.skeletonButton} ${styles.shimmer}`} />
          <div className={`${styles.skeletonButton} ${styles.secondary} ${styles.shimmer}`} />
        </div>
      </main>
    );
  }

  if (!config) {
    return (
      <main className={styles.errorPage}>
        <div className={styles.errorCard}>
          <h2>Erro ao carregar</h2>
          <p>Não foi possível carregar a página.</p>
          <button onClick={() => window.location.reload()}>
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  const fundo = imagemFundo(config.fundo);
  const logo = imagemFundo(config.logo);

  return (
    <main
      className={styles.loginPage}
      style={
        fundo
          ? {
              backgroundImage: `linear-gradient(
                rgba(109, 76, 82, 0.75),
                rgba(109, 76, 82, 0.82)
              ), url(${fundo})`,
            }
          : undefined
      }
    >
      <div className={styles.overlay} />

      <section className={styles.container}>
        <div className={styles.leftSide}>
          <div className={styles.brandBadge}>
            <FiShield />
            Loja Oficial
          </div>

          <h1>{config.titulo}</h1>
          <p>{config.mensagem_personalizada}</p>

          <div className={styles.features}>
            <div className={styles.feature}>✔ Compra segura</div>
            <div className={styles.feature}>✔ Produtos exclusivos</div>
            <div className={styles.feature}>✔ Atendimento premium</div>
          </div>
        </div>

        <div className={styles.rightSide}>
          <div className={styles.card}>
            {logo && (
              <div className={styles.logoBox}>
                <Image
                  src={logo}
                  alt={config.titulo}
                  width={64}
                  height={64}
                  priority
                  className={styles.logo}
                />
              </div>
            )}

            <h2>Bem-vindo</h2>
            <span className={styles.subtitle}>Entre ou crie sua conta</span>

            <div className={styles.actions}>
              <button
                className={styles.btnLogin}
                onClick={() => router.push("/Login/entra")}
              >
                <FiLock size={18} />
                Entrar
                <FiArrowRight size={18} />
              </button>

              <button
                className={styles.btnRegister}
                onClick={() => router.push("/Login/cadastro")}
              >
                <FiUserPlus size={18} />
                Criar conta
              </button>
            </div>

            <div className={styles.bottomText}>
              Faça login para acompanhar pedidos e ofertas.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}