"use client";

import api from "@/Api/conectar";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Settings,
  Box,
  Star,
  Grid3X3,
  Image,
  ShoppingCart,
  Upload,
  Activity,
  LucideIcon,
  ArrowUpRight,
} from "lucide-react";

import styles from "./Dashboard.module.css";

interface CardAction {
  tipo: string;
  icone?: string;
  url: string;
}

interface CardItem {
  titulo: string;
  valor: string | number;
  icone?: string;
  rotaMobile?: string;
  acoes?: CardAction[];
}

const icones: Record<string, LucideIcon> = {
  settings: Settings,
  box: Box,
  star: Star,
  grid: Grid3X3,
  image: Image,
  "shopping-cart": ShoppingCart,
  upload: Upload,
};

export default function DashboardPage() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarCards();
  }, []);

  async function carregarCards() {
    try {
      const response = await api.get("/painel/dados/cards");
      const cardsAPI = response.data?.dados?.dados?.cards || [];
      setCards(cardsAPI);
    } catch (error) {
      console.error("Erro ao carregar cards:", error);
    } finally {
      setLoading(false);
    }
  }

  function pegarUrl(card: CardItem) {
    if (card.rotaMobile) return card.rotaMobile;

    const visualizar = card.acoes?.find(
      (acao) => acao.tipo !== "cadastrar"
    );

    const cadastrar = card.acoes?.find(
      (acao) => acao.tipo === "cadastrar"
    );

    return visualizar?.url || cadastrar?.url || "#";
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <span />
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <section className={styles.dashboard}>
      <div className={styles.grid}>
        {cards.map((card, index) => {
          const Icon = icones[card.icone || ""] || Activity;
          const url = pegarUrl(card);

          return (
            <Link key={index} href={url} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.iconWrap}>
                  <Icon size={19} />
                </div>

                <div className={styles.openIcon}>
                  <ArrowUpRight size={15} />
                </div>
              </div>

              <div className={styles.cardInfo}>
                <span className={styles.label}>{card.titulo}</span>
                <h3 className={styles.value}>{card.valor}</h3>
              </div>

              <div className={styles.cardFooter}>
                Acessar módulo
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}