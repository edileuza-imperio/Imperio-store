"use client";

import { FaTag, FaCreditCard, FaTruck, FaBox } from "react-icons/fa";

interface Props {
  produto: any;
}

export default function ProdutoInfo({ produto }: Props) {
  const parcelas = produto.parcelas || 1;
  const precoParcela = produto.preco / parcelas;

  return (
    <div className="product-info p-3 rounded shadow-sm bg-white">
      <h1 className="fw-bold text-gold-dark mb-3">{produto.nome}</h1>

      {/* Badges categoria e estoque */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {produto.categoria_nome && (
          <span className="badge bg-rosa-queimado d-flex align-items-center gap-1">
            <FaTag /> {produto.categoria_nome}
          </span>
        )}

        <span
          className={`badge d-flex align-items-center gap-1 ${
            produto.ilimitado ? "bg-success text-white" : "bg-warning text-dark"
          }`}
        >
          {produto.ilimitado ? "Estoque Ilimitado" : `${produto.estoque} disponíveis`}
        </span>
      </div>

      {/* Preço */}
      <div className="mb-3">
        <h2 className="text-gold-dark mb-1">R$ {produto.preco.toFixed(2).replace(".", ",")}</h2>
        <div className="text-muted">
          {parcelas}x de R$ {precoParcela.toFixed(2).replace(".", ",")} sem juros
        </div>
      </div>

      {/* Frete */}
      <div className="d-flex align-items-center gap-2 text-rosa mb-2">
        <FaTruck /> Frete grátis para todo o Brasil
      </div>
    </div>
  );
}
