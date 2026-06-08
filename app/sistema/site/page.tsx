"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";

import {
  Settings,
  Globe,
  Type,
  BadgeInfo,
  ImageIcon,
} from "lucide-react";

import styles from "./Site.module.css";

interface SiteConfig {
  id_site_config: number;
  nome_site: string;
  titulo: string;
  subtitulo: string;
  logo: string | null;
  favicon: string | null;
}

export default function VisualizarSitePage() {
  const [site, setSite] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarSite();
  }, []);

  async function carregarSite() {
    try {
      setLoading(true);

      const response = await api.get("/painel/site/visualizar");

      const dados =
        response.data?.dados?.dados?.sites?.[0] ||
        response.data?.dados?.sites?.[0] ||
        response.data?.dados?.[0] ||
        null;

      setSite(dados);
    } catch {
      setSite(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        Carregando configurações...
      </div>
    );
  }

  if (!site) {
    return (
      <div className={styles.empty}>
        Nenhuma configuração encontrada.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.banner}>
        <div className={styles.bannerIcon}>
          <Settings size={34} />
        </div>

        <div>
          <h1>{site.nome_site}</h1>

          <p>Configurações gerais do site</p>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardIcon}>
            <Globe size={22} />
          </div>

          <div>
            <span>Nome do Site</span>
            <strong>{site.nome_site}</strong>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon}>
            <Type size={22} />
          </div>

          <div>
            <span>Título</span>
            <strong>{site.titulo}</strong>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon}>
            <BadgeInfo size={22} />
          </div>

          <div>
            <span>Subtítulo</span>
            <strong>{site.subtitulo}</strong>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon}>
            <ImageIcon size={22} />
          </div>

          <div>
            <span>Logo</span>
            <strong>{site.logo ? "Configurada" : "Não enviada"}</strong>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon}>
            <ImageIcon size={22} />
          </div>

          <div>
            <span>Favicon</span>
            <strong>{site.favicon ? "Configurado" : "Não enviado"}</strong>
          </div>
        </div>
      </div>

      <section className={styles.details}>
        <h2>Resumo</h2>

        <p>
          Este site está configurado como <strong>{site.nome_site}</strong>,
          exibindo o título <strong>{site.titulo}</strong> e subtítulo{" "}
          <strong>{site.subtitulo}</strong>.
        </p>
      </section>
    </div>
  );
}