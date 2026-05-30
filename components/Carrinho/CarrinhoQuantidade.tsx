"use client";

import { useEffect, useState } from "react";
import { FiShoppingCart } from "react-icons/fi";
import api from "@/Api/conectar";

type Props = {
  size?: number;
  className?: string;
};

type ItemCarrinho = {
  id_carrinho_item?: number | string;
  quantidade?: number;
};

export default function CarrinhoQuantidade({
  size = 18,
  className = "",
}: Props) {
  const [quantidade, setQuantidade] = useState(0);

  useEffect(() => {
    let ativo = true;

    async function carregarCarrinho() {
      try {
        const response = await api.get("/carrinho/itens", {
          withCredentials: true,
        });

        const itens: ItemCarrinho[] =
          response?.data?.dados && Array.isArray(response.data.dados)
            ? response.data.dados
            : [];

        const total = itens.reduce((acc, item) => {
          return acc + Number(item?.quantidade || 0);
        }, 0);

        if (!ativo) return;
        setQuantidade(total);
      } catch (error) {
        if (!ativo) return;
        setQuantidade(0);
        console.error("Erro ao carregar quantidade do carrinho:", error);
      }
    }

    carregarCarrinho();

    return () => {
      ativo = false;
    };
  }, []);

  return (
    <span className={`cart-badge-wrap ${className}`}>
      <FiShoppingCart size={size} />
      {quantidade > 0 && <span className="cart-badge">{quantidade}</span>}

      <style jsx>{`
        .cart-badge-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .cart-badge {
          position: absolute;
          top: -8px;
          right: -10px;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #b85d73;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          line-height: 1;
          box-shadow: 0 4px 10px rgba(184, 93, 115, 0.25);
        }
      `}</style>
    </span>
  );
}