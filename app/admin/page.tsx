"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import Link from "next/link";
import {
  FiBox,
  FiTag,
  FiImage,
  FiUsers,
  FiShoppingCart,
  FiCreditCard,
  FiArrowRight,
  FiTrendingUp,
  FiLayers,
  FiActivity,
  FiRefreshCw,
} from "react-icons/fi";

type Card = {
  titulo: string;
  quantidade: number;
};

function getIconComponent(titulo: string) {
  const t = titulo.toLowerCase();

  if (t.includes("galer") || (t.includes("imagen") && t.includes("galer"))) {
    return FiImage;
  }
  if (t.includes("prod")) return FiBox;
  if (t.includes("categ")) return FiTag;
  if (t.includes("banner")) return FiImage;
  if (t.includes("usu")) return FiUsers;
  if (t.includes("carr")) return FiShoppingCart;
  if (t.includes("cupom")) return FiCreditCard;
  if (t.includes("camp")) return FiTrendingUp;

  return FiLayers;
}

function getLink(titulo: string) {
  const t = titulo.toLowerCase();

  if (t.includes("galer") || (t.includes("imagen") && t.includes("galer"))) {
    return "/painel/galeria";
  }
  if (t.includes("prod")) return "/painel/produtos";
  if (t.includes("categ")) return "/painel/categorias";
  if (t.includes("banner")) return "/painel/banners";
  if (t.includes("usu")) return "/painel/usuarios";
  if (t.includes("carr")) return "/painel/carrinhos";
  if (t.includes("cupom")) return "/painel/cupons";
  if (t.includes("camp")) return "/painel/campanhas";

  return "/painel";
}

function getAccentClass(titulo: string) {
  const t = titulo.toLowerCase();

  if (t.includes("prod")) return "purple";
  if (t.includes("categ")) return "pink";
  if (t.includes("banner")) return "blue";
  if (t.includes("usu")) return "cyan";
  if (t.includes("carr")) return "orange";
  if (t.includes("cupom")) return "green";
  if (t.includes("camp")) return "indigo";

  return "default";
}

export default function PainelPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregarCards() {
    try {
      setLoading(true);

      const res = await api.get("/admin/cards", {
        withCredentials: true,
      });

      const data = res?.data?.dados?.dados ?? res?.data?.dados ?? [];

      if (Array.isArray(data)) {
        setCards(data);
      } else {
        setCards([]);
      }
    } catch (err) {
      console.error("Erro ao carregar cards:", err);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarCards();
  }, []);

  const totalGeral = useMemo(() => {
    return cards.reduce((acc, item) => acc + Number(item.quantidade || 0), 0);
  }, [cards]);

  const topCard = useMemo(() => {
    if (!cards.length) return null;
    return [...cards].sort(
      (a, b) => Number(b.quantidade || 0) - Number(a.quantidade || 0)
    )[0];
  }, [cards]);

  return (
    <>
      <div className="dashboardPage">
        <section className="hero">
          <div className="heroLeft">
            <div className="heroBadge">
              <FiActivity size={15} />
              Painel em tempo real
            </div>

            <h2 className="heroTitle">Visão geral da administração</h2>

            <p className="heroText">
              Acompanhe os módulos principais da loja e acesse rapidamente cada
              área do sistema.
            </p>
          </div>

          <div className="heroRight">
            <div className="summaryCard primary">
              <span className="summaryLabel">Total geral</span>
              <strong className="summaryValue">{totalGeral}</strong>
              <small className="summaryMeta">Soma dos registros exibidos</small>
            </div>

            <div className="summaryCard">
              <span className="summaryLabel">Maior volume</span>
              <strong className="summaryValue">
                {topCard ? topCard.quantidade : 0}
              </strong>
              <small className="summaryMeta">
                {topCard ? topCard.titulo : "Sem dados"}
              </small>
            </div>
          </div>
        </section>

        <section className="dashboardHeader">
          <div>
            <h1 className="pageTitle">Dashboard</h1>
            <p className="pageSubtitle">
              Resumo visual dos módulos cadastrados no sistema
            </p>
          </div>

          <button type="button" className="refreshBtn" onClick={carregarCards}>
            <FiRefreshCw size={16} />
            Atualizar
          </button>
        </section>

        {loading ? (
          <div className="loadingState">
            <div className="loadingSpinner" />
            <p>Carregando indicadores...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="emptyState">
            <div className="emptyIcon">
              <FiLayers size={30} />
            </div>
            <h3>Nenhum dado encontrado</h3>
            <p>Não foi possível carregar os cards do painel.</p>
          </div>
        ) : (
          <section className="cardsGrid">
            {cards.map((card, i) => {
              const Icon = getIconComponent(card.titulo);
              const accent = getAccentClass(card.titulo);

              return (
                <article key={i} className={`card ${accent}`}>
                  <div className="cardGlow" />

                  <div className="cardTop">
                    <div className={`cardIcon ${accent}`}>
                      <Icon size={22} />
                    </div>

                    <div className="cardNumberWrap">
                      <span className="cardLabel">Quantidade</span>
                      <strong className="cardNumber">{card.quantidade}</strong>
                    </div>
                  </div>

                  <div className="cardBody">
                    <h3 className="cardTitle">{card.titulo}</h3>
                    <p className="cardDescription">
                      Acesse este módulo para gerenciar os registros disponíveis.
                    </p>
                  </div>

                  <Link href={getLink(card.titulo)} className="cardButton">
                    Abrir módulo
                    <FiArrowRight size={16} />
                  </Link>
                </article>
              );
            })}
          </section>
        )}
      </div>

      
    </>
  );
}