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
  Plus,
  Eye,
  Activity,
  LucideIcon,
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

const actionIcons: Record<string, LucideIcon> = {
  plus: Plus,
  eye: Eye,
};

export default function DashboardPage() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarCards();
  }, []);

  async function carregarCards() {
    try {
      console.log("Buscando cards...");

      const response = await api.get(
        "/painel/dados/cards"
      );

      console.log(
        "Resposta completa:",
        response.data
      );

      const cardsAPI =
        response.data?.dados?.dados?.cards || [];

      console.log(
        "Cards encontrados:",
        cardsAPI
      );

      setCards(cardsAPI);
    } catch (error) {
      console.error(
        "Erro ao carregar cards:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        Carregando dashboard...
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.grid}>
        {cards.map((card, index) => {
          const Icon =
            icones[card.icone || ""] ||
            Activity;

          return (
            <div
              key={index}
              className={styles.card}
            >
              <div className={styles.cardTop}>
                <div
                  className={styles.iconWrap}
                >
                  <Icon size={24} />
                </div>

                <div
                  className={styles.cardInfo}
                >
                  <span
                    className={styles.label}
                  >
                    {card.titulo}
                  </span>

                  <h3
                    className={styles.value}
                  >
                    {card.valor}
                  </h3>
                </div>
              </div>

              <div
                className={styles.actions}
              >
                {card.acoes?.map(
                  (acao, actionIndex) => {
                    const ActionIcon =
                      actionIcons[
                        acao.icone || ""
                      ] || Eye;

                    return (
                      <Link
                        key={actionIndex}
                        href={acao.url}
                        className={`${styles.actionButton}
                        ${
                          acao.tipo ===
                          "cadastrar"
                            ? styles.actionPrimary
                            : styles.actionSecondary
                        }`}
                      >
                        <ActionIcon
                          size={16}
                        />

                        <span>
                          {acao.tipo ===
                          "cadastrar"
                            ? "Cadastrar"
                            : "Visualizar"}
                        </span>
                      </Link>
                    );
                  }
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}