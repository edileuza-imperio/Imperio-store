"use client";

import api from "@/Api/conectar";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  FiEye,
  FiGrid,
  FiPlus,
  FiRefreshCw,
  FiEdit,
  FiLayers,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";

import styles from "./Vitrines.module.css";

type Vitrine = {
  id_vitrine: number;
  nome: string;
  slug: string;
  titulo?: string | null;
  subtitulo?: string | null;
  tipo?: string | null;
  status_id: number;
  nivel_id?: number;
  ordem?: number;
  criado_em?: string | null;
  atualizado_em?: string | null;
};

export default function VitrinesPage() {
  const [vitrines, setVitrines] = useState<Vitrine[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregarVitrines() {
    try {
      setLoading(true);

      const response = await api.get("/vitrines");
      const data = response.data;

      const lista = Array.isArray(data?.dados?.vitrines)
        ? data.dados.vitrines
        : Array.isArray(data?.vitrines)
          ? data.vitrines
          : Array.isArray(data?.dados)
            ? data.dados
            : Array.isArray(data)
              ? data
              : [];

      setVitrines(lista);
    } catch (error) {
      console.error("Erro ao carregar vitrines:", error);
      setVitrines([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarVitrines();
  }, []);

  const totalAtivas = useMemo(() => {
    return vitrines.filter((vitrine) => Number(vitrine.status_id) === 1).length;
  }, [vitrines]);

  function formatarData(data?: string | null) {
    if (!data) return "—";

    const dataConvertida = new Date(data.replace(" ", "T"));

    if (Number.isNaN(dataConvertida.getTime())) {
      return data;
    }

    return dataConvertida.toLocaleString("pt-BR");
  }

  function statusTexto(statusId: number) {
    return Number(statusId) === 1 ? "Ativa" : "Inativa";
  }

  function statusClasse(statusId: number) {
    return Number(statusId) === 1 ? styles.statusAtivo : styles.statusInativo;
  }

  function statusIcone(statusId: number) {
    return Number(statusId) === 1 ? <FiCheckCircle /> : <FiXCircle />;
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <FiGrid />
            Vitrines
          </h1>

          <p className={styles.subtitle}>
            Visualize e gerencie as vitrines exibidas no site.
          </p>
        </div>

        <button
          type="button"
          onClick={carregarVitrines}
          className={styles.refreshButton}
        >
          <FiRefreshCw />
          Atualizar
        </button>
      </header>

      <section className={styles.summary}>
        <div>
          <span>Total de vitrines</span>
          <strong>{vitrines.length}</strong>
        </div>

        <div>
          <span>Vitrines ativas</span>
          <strong>{totalAtivas}</strong>
        </div>
      </section>

      {loading ? (
        <p className={styles.info}>Carregando vitrines...</p>
      ) : vitrines.length === 0 ? (
        <div className={styles.empty}>
          <FiLayers />
          <strong>Nenhuma vitrine encontrada</strong>
          <span>Cadastre sua primeira vitrine para exibir produtos no site.</span>

          <Link href="/sistema/vitrines/cadastrar" className={styles.emptyButton}>
            <FiPlus />
            Cadastrar vitrine
          </Link>
        </div>
      ) : (
        <section className={styles.grid}>
          {vitrines.map((vitrine) => (
            <article key={vitrine.id_vitrine} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.iconBox}>
                  <FiGrid />
                </div>

                <span className={`${styles.badge} ${statusClasse(vitrine.status_id)}`}>
                  {statusIcone(vitrine.status_id)}
                  {statusTexto(vitrine.status_id)}
                </span>
              </div>

              <div className={styles.cardBody}>
                <strong className={styles.nome}>{vitrine.nome}</strong>

                <span className={styles.slug}>/{vitrine.slug}</span>

                <h2>{vitrine.titulo || "Sem título"}</h2>

                <p>{vitrine.subtitulo || "Sem subtítulo cadastrado."}</p>
              </div>

              <div className={styles.meta}>
                <div>
                  <span>Tipo</span>
                  <strong>{vitrine.tipo || "—"}</strong>
                </div>

                <div>
                  <span>Ordem</span>
                  <strong>{vitrine.ordem ?? "—"}</strong>
                </div>

                <div>
                  <span>Criado em</span>
                  <strong>{formatarData(vitrine.criado_em)}</strong>
                </div>
              </div>

              <div className={styles.actions}>
                <Link
                  href={`/sistema/vitrines/${vitrine.id_vitrine}`}
                  className={styles.viewButton}
                >
                  <FiEye />
                  Ver
                </Link>

                <Link
                  href={`/sistema/vitrines/${vitrine.id_vitrine}/editar`}
                  className={styles.editButton}
                >
                  <FiEdit />
                  Editar
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}

      <Link href="/sistema/vitrines/cadastrar" className={styles.floatButton}>
        <FiPlus />
        <span>Cadastrar</span>
      </Link>
    </main>
  );
}